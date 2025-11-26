"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, User, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { useSupabase } from "@/contexts/SupabaseContext";
import { logger } from "@/lib/logger";

interface ReferralItem {
  id: string;
  referido_id: string;
  codigo_usado: string;
  fecha_referido: string;
  fecha_verificacion: string | null;
  verificado: boolean;
  nombre_referido?: string;
  telefono_referido?: string;
}

const COUNTRY_FALLBACK = "+591";
const ITEMS_PER_PAGE = 3;

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

const formatPhone = (phone?: string | null) => {
  if (!phone) return "—";
  
  let countryCode = "";
  let number = "";
  
  if (phone.startsWith("+")) {
    const match = phone.match(/^(\+\d{1,3})(\d+)$/);
    if (match) {
      countryCode = match[1];
      number = match[2];
    } else {
      return phone;
    }
  } else {
    countryCode = COUNTRY_FALLBACK;
    number = phone;
  }
  
  const first4Digits = number.substring(0, 4);
  const remainingDigits = number.length - 4;
  const asterisks = remainingDigits > 0 ? '*'.repeat(remainingDigits) : '';
  
  return `${countryCode} ${first4Digits}${asterisks}`;
};

const getFirstName = (fullName?: string | null) => {
  if (!fullName) return "Usuario invitado";
  return fullName.split(' ')[0];
};

export default function ReferralsPage() {
  const router = useRouter();
  const { getReferidos, user, fetchUserData } = useSupabase();
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Cargar referidos cuando el usuario esté disponible
  useEffect(() => {
    let isMounted = true;

    const fetchReferrals = async () => {
      // Esperar a que el usuario esté disponible
      if (!user || !getReferidos) {
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        logger.debug('📋 Cargando referidos...');
        const data = await getReferidos();
        
        if (isMounted && data) {
          // Ordenar por fecha más reciente primero
          const sorted = [...data].sort((a, b) => 
            new Date(b.fecha_referido).getTime() - new Date(a.fecha_referido).getTime()
          );
          setReferrals(sorted);
          logger.debug(`✅ ${sorted.length} referidos cargados`);
        }
      } catch (err) {
        logger.error("Error cargando referidos:", err);
        if (isMounted) {
          setError("No se pudieron cargar tus referidos. Intenta nuevamente.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchReferrals();

    return () => {
      isMounted = false;
    };
  }, [user?.id, getReferidos]); // Solo dependemos del ID del usuario, no del objeto completo

  // Recargar datos del usuario una vez cuando el usuario esté disponible (para obtener referidos_verificados actualizado)
  const hasRefreshedUserRef = useRef(false);
  useEffect(() => {
    if (user?.id && fetchUserData && !hasRefreshedUserRef.current) {
      logger.debug('🔄 Recargando datos del usuario una vez...');
      hasRefreshedUserRef.current = true;
      fetchUserData().catch(err => {
        logger.error('Error recargando datos del usuario:', err);
        hasRefreshedUserRef.current = false; // Permitir reintento si falla
      });
    }
  }, [user?.id]); // Solo dependemos del ID del usuario

  const verifiedCount = useMemo(
    () => referrals.filter((item) => item.verificado).length,
    [referrals]
  );

  // Usar referidos_verificados del usuario (más preciso que contar de la lista)
  const userVerifiedCount = user ? ((user as any)?.referidos_verificados ?? 0) : 0;
  const haGanadoSmart = user ? ((user as any)?.ha_ganado_smart ?? false) : false;
  const smartFechaInicioProgramada = user ? ((user as any)?.smart_fecha_inicio_programada ?? null) : null;
  const canActivateSmart = userVerifiedCount >= 5 && !haGanadoSmart;
  
  // Verificar si Smart está programado (pero no activado aún)
  const smartProgramado = haGanadoSmart && smartFechaInicioProgramada && new Date(smartFechaInicioProgramada) > new Date();

  // Debug: Log para verificar valores
  useEffect(() => {
    if (user) {
      logger.debug('🔍 Debug Referrals Page:', {
        userVerifiedCount,
        haGanadoSmart,
        canActivateSmart,
        userExists: !!user,
        userId: user.id,
        referidos_verificados: (user as any)?.referidos_verificados,
        ha_ganado_smart: (user as any)?.ha_ganado_smart,
        userObject: user,
      });
    } else {
      logger.debug('⚠️ Debug Referrals Page: Usuario no disponible aún');
    }
  }, [userVerifiedCount, haGanadoSmart, canActivateSmart, user]);

  const referralCode = user?.codigo_referido || "";

  const shareText = `*¡Hola!* 😊
Estoy usando *Ahorro365* para organizar mis gastos y de verdad me está ayudando un montón 🙌
¿Te gustaría probarlo también?
Si te registras con mi código *${referralCode}* tienes 14 días gratis 🎉
Solo dime *"quiero la app"* y te la paso 💜📱`;

  const [copyStatus, setCopyStatus] = useState<"idle" | "success">("idle");
  const [activatingSmart, setActivatingSmart] = useState(false);
  const [smartActivationStatus, setSmartActivationStatus] = useState<"idle" | "success" | "error">("idle");
  const [smartFechaProgramadaResponse, setSmartFechaProgramadaResponse] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopyStatus("success");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (error) {
      logger.error("Error copiando mensaje:", error);
    }
  };

  const handleActivateSmart = async () => {
    if (!canActivateSmart || activatingSmart || !user) return;

    setActivatingSmart(true);
    setSmartActivationStatus("idle");

    try {
      const response = await fetch('/api/referrals/activate-smart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (data.success) {
        setSmartActivationStatus("success");
        
        // Guardar fecha programada de la respuesta para mostrar en el mensaje
        if (data.details?.smart_fecha_inicio_programada) {
          setSmartFechaProgramadaResponse(data.details.smart_fecha_inicio_programada);
          // No recargar inmediatamente, el usuario verá el mensaje de programado
          setTimeout(() => {
            window.location.reload();
          }, 3000); // Dar tiempo para leer el mensaje
        } else {
          setSmartFechaProgramadaResponse(null);
          // Si se activó inmediatamente, recargar más rápido
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        setSmartActivationStatus("error");
        logger.error("Error activando Smart:", data.message);
      }
    } catch (error) {
      logger.error("Error activando Smart:", error);
      setSmartActivationStatus("error");
    } finally {
      setActivatingSmart(false);
    }
  };

  // Paginación
  const totalPages = Math.ceil(referrals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentReferrals = referrals.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-4">
      {/* Espacio blanco superior */}
      <div className="h-[40px] bg-white"></div>
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="rounded-full bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
              aria-label="Volver"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Mis Referidos</h1>
              <p className="text-xs text-gray-500">
                {referrals.length} {referrals.length === 1 ? 'referido' : 'referidos'} total
                {verifiedCount > 0 && ` • ${verifiedCount} verificados`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 space-y-4">
        {/* Barra de progreso */}
        <div className="rounded-[20px] border border-green-200 bg-green-50/80 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-green-900">Progreso hacia Smart</p>
            <p className="text-sm font-bold text-green-600">
              {userVerifiedCount}/5
            </p>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2 mb-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min((userVerifiedCount / 5) * 100, 100)}%` }}
            />
          </div>
          {userVerifiedCount < 5 ? (
            <p className="text-xs text-green-700">
              {5 - userVerifiedCount} más para ganar 14 días Smart
            </p>
          ) : smartProgramado ? (
            <div className="space-y-1">
              <p className="text-xs text-green-700 font-semibold">
                ✅ Smart programado 🎉
              </p>
              <p className="text-xs text-green-600">
                Se activará el {new Date(smartFechaInicioProgramada).toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          ) : haGanadoSmart ? (
            <p className="text-xs text-green-700 font-semibold">
              ¡Ya activaste tus 14 días Smart! 🎉
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-green-700 font-semibold">
                ¡Ya ganaste 14 días Smart! 🎉
              </p>
              <button
                onClick={handleActivateSmart}
                disabled={activatingSmart}
                className="w-full rounded-[16px] bg-gradient-to-r from-green-500 to-emerald-600 py-3 px-4 text-sm font-semibold text-white shadow-sm transition hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activatingSmart ? (
                  "Activando..."
                ) : (
                  "Activar mis 14 días Smart 🚀"
                )}
              </button>
              {smartActivationStatus === "success" && (
                <div className="space-y-1">
                  <p className="text-xs text-green-700 font-semibold text-center">
                    ✅ {smartFechaProgramadaResponse ? 'Smart programado exitosamente' : 'Smart activado exitosamente'}
                  </p>
                  {smartFechaProgramadaResponse && (
                    <p className="text-xs text-green-600 text-center">
                      Se activará el {new Date(smartFechaProgramadaResponse).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                  )}
                </div>
              )}
              {smartActivationStatus === "error" && (
                <p className="text-xs text-red-600 text-center">
                  ❌ Error al activar Smart. Intenta nuevamente.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Mensaje para compartir */}
        <div className="rounded-[24px] border border-blue-200 bg-blue-50/80 p-4 text-sm text-gray-700 shadow-sm">
          <p className="whitespace-pre-line leading-relaxed text-gray-700 mb-4">{shareText}</p>
          <div className="flex w-full items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex flex-1 items-center justify-center gap-2 rounded-[20px] bg-emerald-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
            >
              <Copy size={18} />
              Copia → Comparte → Gana 🚀
            </button>
          </div>
        </div>

        {/* Toast flotante para mensaje copiado */}
        {copyStatus === "success" && (
          <div className="fixed top-[60px] left-1/2 -translate-x-1/2 z-50 animate-fade-in">
            <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-sm">
              <CheckCircle2 size={20} />
              <span>Mensaje copiado ✅</span>
            </div>
          </div>
        )}

        {/* Lista de referidos */}
        <section>
          {isLoading ? (
            <div className="flex items-center justify-center rounded-[24px] border border-gray-100 bg-white py-12 text-sm text-gray-500">
              Cargando información...
            </div>
          ) : error ? (
            <div className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {error}
            </div>
          ) : referrals.length === 0 ? (
            <div className="flex flex-col items-center rounded-[24px] border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
              <User size={40} className="mb-3 text-gray-300" />
              <p className="text-sm font-semibold text-gray-600">Aún no tienes referidos</p>
              <p className="mt-1 text-xs text-gray-500">
                Comparte tu código con tus amigos para ganar 14 días Smart
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {currentReferrals.map((referral) => (
                  <article
                    key={referral.id}
                    className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {getFirstName(referral.nombre_referido)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{formatPhone(referral.telefono_referido)}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Registrado el {formatDate(referral.fecha_referido)}
                            </p>
                          </div>
                          
                          {/* Estado al costado */}
                          {referral.verificado ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
                              <CheckCircle2 size={14} />
                              Verificado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
                              <Clock size={14} />
                              Pendiente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Paginación simplificada */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between gap-4">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 rounded-[16px] bg-white border-2 border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={18} />
                    <span>Anterior</span>
                  </button>
                  
                  {/* Indicador de página */}
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100">
                    <span className="text-sm font-semibold text-gray-700">
                      {currentPage} / {totalPages}
                    </span>
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 rounded-[16px] bg-white border-2 border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200"
                    aria-label="Página siguiente"
                  >
                    <span>Siguiente</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

