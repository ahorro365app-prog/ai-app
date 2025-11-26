"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Wallet, CheckCircle, ArrowRight } from "lucide-react";
import { useSupabase } from "@/contexts/SupabaseContext";
import USDTLogo from "@/components/USDTLogo";

const PAYMENT_METHODS = [
  {
    id: 'usdt',
    name: 'USDT (Binance)',
    description: 'Pago con criptomoneda USDT usando Binance Smart Chain (BEP-20)',
    icon: 'usdt', // Usar string para identificar el logo personalizado
    available: true,
    processingTime: '5-60 minutos',
    fee: 'Comisiones bajas',
    color: 'bg-[#26A17B]', // Color oficial de USDT
  },
  // Futuros métodos de pago pueden agregarse aquí
  // {
  //   id: 'stripe',
  //   name: 'Tarjeta de Crédito/Débito',
  //   description: 'Pago seguro con tarjeta mediante Stripe',
  //   icon: CreditCard,
  //   available: false,
  //   processingTime: 'Inmediato',
  //   fee: 'Sin comisiones adicionales',
  //   color: 'from-blue-500 to-indigo-500',
  // },
];

export default function PaymentMethodsPage() {
  const router = useRouter();
  const { user } = useSupabase();

  const handleSelectMethod = (methodId: string) => {
    if (methodId === 'usdt') {
      router.push('/billing/pay?plan=pro');
    }
    // Agregar otros métodos aquí cuando estén disponibles
  };

  return (
    <div className="pt-[40px] px-4 pb-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Volver</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Métodos de Pago</h1>
        <p className="text-gray-600">Elige tu método de pago preferido</p>
      </div>

      {/* Resumen del Plan */}
      <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Plan Pro</h3>
            <p className="text-sm text-gray-600">Suscripción mensual</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">$3.00 USD/mes</p>
          </div>
        </div>
      </div>

      {/* Métodos de Pago */}
      <div className="space-y-4 mb-6">
        {PAYMENT_METHODS.map((method) => {
          return (
            <button
              key={method.id}
              onClick={() => method.available && handleSelectMethod(method.id)}
              disabled={!method.available}
              className={`w-full bg-white rounded-3xl p-6 shadow-sm border-2 transition-all text-left ${
                method.available
                  ? 'border-gray-200 hover:border-purple-500 hover:shadow-md cursor-pointer'
                  : 'border-gray-100 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icono */}
                <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
                  {method.icon === 'usdt' ? (
                    <USDTLogo size={56} className="drop-shadow-sm" />
                  ) : (
                    <div className={`w-14 h-14 rounded-xl ${method.color} flex items-center justify-center`}>
                      <CreditCard size={24} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{method.name}</h3>
                    {method.available ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        Disponible
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                        Próximamente
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                  
                  {/* Detalles */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <CheckCircle size={14} className="text-green-600" />
                      <span>Tiempo: {method.processingTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wallet size={14} className="text-blue-600" />
                      <span>{method.fee}</span>
                    </div>
                  </div>
                </div>

                {/* Flecha */}
                {method.available && (
                  <ArrowRight size={20} className="text-gray-400 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Información Adicional */}
      <div className="bg-blue-50 rounded-3xl p-6 border border-blue-200">
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Wallet size={20} />
          <span>Información Importante</span>
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Los pagos se verifican manualmente en un plazo de 5 a 60 minutos en horarios laborales.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Recibirás una notificación cuando tu plan Pro sea activado.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Si tienes problemas con el pago, contáctanos por WhatsApp.</span>
          </li>
        </ul>
      </div>

      {/* Contacto WhatsApp */}
      <div className="mt-4 bg-green-50 rounded-3xl p-6 border border-green-200 text-center">
        <p className="text-sm text-gray-700 mb-3">
          ¿Necesitas ayuda con el método de pago?
        </p>
        <button
          onClick={() => {
            const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || '+59161600190';
            window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Hola, tengo dudas sobre los métodos de pago`, '_blank');
          }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <span>Contactar Soporte por WhatsApp</span>
        </button>
      </div>
    </div>
  );
}

