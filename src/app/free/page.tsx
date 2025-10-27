"use client";

import Link from "next/link";
import { Gift, MessageSquare, BarChart3, Mic, TrendingUp, Sparkles, Crown, CheckCircle, XCircle } from "lucide-react";

export default function FreeTrialsPage() {
  const freeCredits = 3;
  const maxCredits = 5;
  const percentage = (freeCredits / maxCredits) * 100;

  return (
    <div className="min-h-screen px-4 pt-4 pb-8">
      {/* Header */}
      <div className="text-center mb-6 animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#00B2FF] to-[#5A00FF] flex items-center justify-center glow-primary">
          <Gift size={28} className="text-white" />
        </div>
        <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <span className="bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] bg-clip-text text-transparent">
            Zona Gratuita
          </span>
        </h1>
        <p className="text-xl text-[#94A3B8]">
          Prueba IA sin costo
        </p>
      </div>

      {/* Contador de créditos */}
      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-[#00B2FF]/20 shadow-xl mb-4 animate-fade-in glow-primary">
        <div className="text-center mb-4">
          <h2 className="text-xl font-medium text-[#94A3B8] mb-2">
            Consultas restantes hoy
          </h2>
          <div className="text-xl font-bold mb-3" style={{ fontFamily: 'Space Mono, monospace' }}>
            <span className="bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] bg-clip-text text-transparent">
              {freeCredits} / {maxCredits}
            </span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-4">
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

        <p className="text-center text-xl text-[#94A3B8] mb-4">
          {freeCredits > 0 
            ? `Tienes ${freeCredits} consultas. Se renuevan en 24h.`
            : "Límite alcanzado. Actualiza a Premium."
          }
        </p>

        <div className="flex flex-col gap-2">
          <Link
            href="/chat"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] text-white font-semibold hover:opacity-90 transition-all glow-primary flex items-center justify-center gap-2"
          >
            <MessageSquare size={18} />
            <span>Probar ahora</span>
          </Link>
          <Link
            href="/billing"
            className="w-full py-3 rounded-xl bg-white/5 border border-[#5A00FF]/30 text-[#E9EDF2] font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <Crown size={18} />
            <span>Ver Premium</span>
          </Link>
        </div>
      </div>

      {/* Features disponibles */}
      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-5 border border-[#5A00FF]/20 shadow-xl mb-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-xl font-bold text-[#E9EDF2] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
          ¿Qué puedes probar?
        </h2>

        <div className="space-y-3">
          {[
            { Icon: MessageSquare, title: "Chat con IA", desc: "Pregunta sobre finanzas", available: true },
            { Icon: BarChart3, title: "Análisis básico", desc: "Vista simple de gastos", available: true },
            { Icon: Mic, title: "Registro por voz", desc: "Dicta tus gastos", available: false },
            { Icon: TrendingUp, title: "Gráficos avanzados", desc: "Visualizaciones detalladas", available: false }
          ].map((feature, idx) => {
            const Icon = feature.Icon;
            const StatusIcon = feature.available ? CheckCircle : XCircle;
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center gap-3 ${
                  feature.available
                    ? "bg-white/5 border-[#00FF85]/30"
                    : "bg-white/5 border-[#94A3B8]/20 opacity-60"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00B2FF] to-[#5A00FF] flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-xl font-semibold text-[#E9EDF2]">{feature.title}</h3>
                    <StatusIcon 
                      size={14} 
                      className={feature.available ? "text-[#00FF85]" : "text-[#94A3B8]"} 
                    />
                  </div>
                  <p className="text-xl text-[#94A3B8]">{feature.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Premium */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-[#00B2FF]/10 to-[#5A00FF]/10 rounded-2xl p-6 border border-[#00B2FF]/30 shadow-xl text-center animate-fade-in glow-primary" style={{ animationDelay: '0.2s' }}>
        <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#00B2FF] to-[#5A00FF] flex items-center justify-center glow-primary">
          <Crown size={24} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-[#E9EDF2] mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          ¿Listo para más?
        </h2>
        <p className="text-xl text-[#94A3B8] mb-4">
          Consultas ilimitadas, modelos avanzados y más por solo B$ 12/mes
        </p>
        <Link
          href="/billing"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] text-white font-bold hover:opacity-90 transition-all shadow-2xl glow-primary w-full justify-center"
        >
          <span>Actualizar a Premium</span>
          <Sparkles size={18} />
        </Link>
      </div>
    </div>
  );
}
