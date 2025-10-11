"use client";

import Link from "next/link";
import { Gift, Crown, Building2, CheckCircle, MessageSquare } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="min-h-screen px-4 pt-4 pb-8">
      {/* Header */}
      <div className="text-center mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <span className="bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] bg-clip-text text-transparent">
            Planes y Precios
          </span>
        </h1>
        <p className="text-sm text-[#94A3B8]">
          Elige tu plan perfecto
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="space-y-4 max-w-md mx-auto mb-6">
        {/* Plan Gratuito */}
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-5 border border-[#94A3B8]/20 shadow-xl animate-fade-in">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#94A3B8] to-[#94A3B8]/50 flex items-center justify-center flex-shrink-0">
              <Gift size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#E9EDF2]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Gratuito
              </h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-[#E9EDF2]" style={{ fontFamily: 'Space Mono, monospace' }}>
                  B$ 0
                </span>
                <span className="text-xs text-[#94A3B8]">/mes</span>
              </div>
            </div>
          </div>

          <ul className="space-y-2 mb-4">
            {[
              "3-5 consultas IA por día",
              "Registro básico de gastos",
              "Dashboard simple",
              "Soporte por email"
            ].map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs">
                <CheckCircle size={14} className="text-[#00FF85] mt-0.5 flex-shrink-0" />
                <span className="text-[#94A3B8]">{feature}</span>
              </li>
            ))}
          </ul>

          <button className="w-full py-2.5 rounded-xl bg-white/5 border border-[#94A3B8]/30 text-[#94A3B8] text-sm font-semibold hover:bg-white/10 transition-all">
            Plan Actual
          </button>
        </div>

        {/* Plan Premium - Destacado */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-[#00B2FF]/10 to-[#5A00FF]/10 rounded-2xl p-5 border-2 border-[#00B2FF] shadow-2xl animate-fade-in glow-primary transform scale-105 relative" style={{ animationDelay: '0.1s' }}>
          {/* Badge Recomendado */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] text-white text-[10px] font-semibold flex items-center gap-1">
            <Crown size={12} />
            <span>Recomendado</span>
          </div>

          <div className="flex items-start gap-3 mb-4 mt-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00B2FF] to-[#5A00FF] flex items-center justify-center flex-shrink-0 glow-primary">
              <Crown size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#E9EDF2]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Premium
              </h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] bg-clip-text text-transparent" style={{ fontFamily: 'Space Mono, monospace' }}>
                  B$ 12
                </span>
                <span className="text-xs text-[#94A3B8]">/mes</span>
              </div>
            </div>
          </div>

          <ul className="space-y-2 mb-4">
            {[
              "Consultas IA ilimitadas",
              "Modelos avanzados (GPT-5, Claude)",
              "Dashboard completo",
              "Registro por voz",
              "WhatsApp integración",
              "Soporte prioritario 24/7"
            ].map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs">
                <CheckCircle size={14} className="text-[#00FF85] mt-0.5 flex-shrink-0" />
                <span className="text-[#E9EDF2]">{feature}</span>
              </li>
            ))}
          </ul>

          <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg glow-primary">
            Actualizar ahora
          </button>
        </div>

        {/* Plan Empresarial */}
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-5 border border-[#5A00FF]/20 shadow-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5A00FF] to-[#00B2FF] flex items-center justify-center flex-shrink-0 glow-secondary">
              <Building2 size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#E9EDF2]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Empresarial
              </h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-[#E9EDF2]" style={{ fontFamily: 'Space Mono, monospace' }}>
                  B$ 50+
                </span>
                <span className="text-xs text-[#94A3B8]">/mes</span>
              </div>
            </div>
          </div>

          <ul className="space-y-2 mb-4">
            {[
              "Todo lo de Premium",
              "Multiusuario (hasta 10)",
              "API personalizada",
              "Reportes avanzados",
              "Consultoría financiera"
            ].map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs">
                <CheckCircle size={14} className="text-[#00FF85] mt-0.5 flex-shrink-0" />
                <span className="text-[#94A3B8]">{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/chat"
            className="w-full py-2.5 rounded-xl bg-white/5 border border-[#5A00FF]/30 text-[#E9EDF2] text-sm font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare size={16} />
            <span>Contactar</span>
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-md mx-auto">
        <h2 className="text-lg font-bold text-center mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <span className="bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] bg-clip-text text-transparent">
            Preguntas Frecuentes
          </span>
        </h2>

        <div className="space-y-3">
          {[
            { q: "¿Puedo cancelar en cualquier momento?", a: "Sí, sin cargos adicionales." },
            { q: "¿Qué métodos de pago aceptan?", a: "Tarjetas y transferencias." },
            { q: "¿Hay descuentos por pago anual?", a: "Sí, 2 meses gratis." }
          ].map((faq, idx) => (
            <div key={idx} className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-[#00B2FF]/20 animate-fade-in" style={{ animationDelay: `${0.3 + idx * 0.1}s` }}>
              <h3 className="text-sm font-semibold text-[#E9EDF2] mb-1">
                {faq.q}
              </h3>
              <p className="text-xs text-[#94A3B8]">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
