"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, X, CheckCircle2, Clock, User, Share2, Copy, ArrowRight } from "lucide-react";
import { useSupabase } from "@/contexts/SupabaseContext";
import { useRouter } from "next/navigation";
import { logger } from '@/lib/logger';

interface ReferralsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  
  // Extraer código de país y número
  let countryCode = "";
  let number = "";
  
  if (phone.startsWith("+")) {
    // Formato: +59177886644
    const match = phone.match(/^(\+\d{1,3})(\d+)$/);
    if (match) {
      countryCode = match[1]; // +591
      number = match[2]; // 77886644
    } else {
      return phone; // Si no coincide, retornar original
    }
  } else {
    // Si no tiene +, asumir formato local
    countryCode = COUNTRY_FALLBACK;
    number = phone;
  }
  
  // Mostrar primeros 4 dígitos + asteriscos para los restantes
  const first4Digits = number.substring(0, 4);
  const remainingDigits = number.length - 4;
  const asterisks = remainingDigits > 0 ? '*'.repeat(remainingDigits) : '';
  
  return `${countryCode} ${first4Digits}${asterisks}`;
};

// Función para extraer primer nombre
const getFirstName = (fullName?: string | null) => {
  if (!fullName) return "Usuario invitado";
  return fullName.split(' ')[0];
};

export default function ReferralsDashboard({
  isOpen,
  onClose,
}: ReferralsDashboardProps) {
  const { getReferidos, user } = useSupabase();
  const router = useRouter();
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;

    const fetchReferrals = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getReferidos?.();
        if (isMounted && data) {
          setReferrals(data);
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
  }, [getReferidos, isOpen]);

  const verifiedCount = useMemo(
    () => referrals.filter((item) => item.verificado).length,
    [referrals]
  );

  const referralCode = user?.codigo_referido || "0d42db19";

  const shareText = `*¡Hola!* 😊
Estoy usando *Ahorro365* para organizar mis gastos y de verdad me está ayudando un montón 🙌
¿Te gustaría probarlo también?
Si te registras con mi código *${referralCode}* tienes 14 días gratis 🎉
Solo dime *“quiero la app”* y te la paso 💜📱`;

  const handleShare = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank", "noopener,noreferrer");
  };

  const [copyStatus, setCopyStatus] = useState<"idle" | "success">("idle");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopyStatus("success");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (error) {
      logger.error("Error copiando mensaje:", error);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md h-[90vh] flex flex-col rounded-[28px] bg-white shadow-2xl animate-scale-in overflow-hidden">
        {copyStatus === "success" && (
          <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-opacity">
            Mensaje copiado ✅
          </div>
        )}
        {/* Header fijo */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">Mis Referidos</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-100 p-2 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
            aria-label="Cerrar dashboard de referidos"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-3 px-4 pb-4 pt-3">
            <div className="rounded-[16px] border border-emerald-100 bg-emerald-50/80 p-3 text-xs text-emerald-700">
              <p className="font-semibold text-emerald-700 text-xs">¿Cómo funciona?</p>
              <p className="mt-1.5 text-[11px] text-emerald-700/90 leading-relaxed">
                Comparte el mensaje sugerido con tus amigos. Cuando se registren y verifiquen su WhatsApp usando tu código, se sumarán a tus referidos. Al llegar a 5, desbloqueas 14 días extra del plan Smart.
              </p>
            </div>

            {/* Barra de progreso hacia Smart */}
            <div className="rounded-[16px] border border-green-200 bg-green-50/80 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-green-900">Progreso hacia Smart</p>
                <p className="text-xs font-bold text-green-600">
                  {verifiedCount}/5
                </p>
              </div>
              <div className="w-full bg-green-200 rounded-full h-1.5 mb-1.5">
                <div 
                  className="bg-green-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min((verifiedCount / 5) * 100, 100)}%` }}
                />
              </div>
              {verifiedCount < 5 ? (
                <p className="text-[11px] text-green-700">
                  {5 - verifiedCount} más para ganar 14 días Smart
                </p>
              ) : (
                <p className="text-[11px] text-green-700 font-semibold">
                  ¡Ya ganaste 14 días Smart! 🎉
                </p>
              )}
            </div>

            <div className="rounded-[16px] border border-blue-200 bg-blue-50/80 p-3 text-xs text-gray-700 shadow-sm">
              <p className="whitespace-pre-line leading-relaxed text-gray-700 text-[11px]">{shareText}</p>
            </div>

            <div className="flex w-full items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[16px] bg-emerald-500 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600"
              >
                <Copy size={16} />
                Copia → Comparte → Gana 🚀
              </button>
              <button
                onClick={handleShare}
                className="flex h-[42px] w-[42px] items-center justify-center rounded-[14px] bg-emerald-500 text-white shadow-sm transition hover:bg-emerald-600"
                title="Compartir por WhatsApp"
              >
                <Share2 size={18} />
              </button>
            </div>

            <section>
              {isLoading ? (
                <div className="flex items-center justify-center rounded-[24px] border border-gray-100 bg-gray-50 py-12 text-sm text-gray-500">
                  Cargando información...
                </div>
              ) : error ? (
                <div className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                  {error}
                </div>
              ) : referrals.length === 0 ? (
                <div className="flex flex-col items-center rounded-[24px] border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
                  <User size={40} className="mb-3 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-600">Aún no tienes referidos</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Comparte tu código con tus amigos para ganar 14 días Smart
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {/* Mostrar solo los últimos 3 referidos */}
                    {referrals.slice(0, 3).map((referral) => (
                      <article
                        key={referral.id}
                        className="rounded-[16px] border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">
                                  {getFirstName(referral.nombre_referido)}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{formatPhone(referral.telefono_referido)}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {formatDate(referral.fecha_referido)}
                                </p>
                              </div>
                              
                              {/* Estado al costado */}
                              {referral.verificado ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700 whitespace-nowrap flex-shrink-0">
                                  <CheckCircle2 size={12} />
                                  Verificado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700 whitespace-nowrap flex-shrink-0">
                                  <Clock size={12} />
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                  
                  {/* Botón para ver todos los referidos si hay más de 3 */}
                  {referrals.length > 3 && (
                    <button
                      onClick={() => {
                        onClose();
                        router.push('/referrals');
                      }}
                      className="w-full mt-3 flex items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:from-purple-600 hover:to-pink-600"
                    >
                      <span>Ver todos ({referrals.length})</span>
                      <ArrowRight size={16} />
                    </button>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

