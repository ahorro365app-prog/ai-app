"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gift, Sparkles, Crown, CheckCircle, Zap } from "lucide-react";
import { useSupabase } from "@/contexts/SupabaseContext";
import { getPlanLimits } from "@/lib/planLimits";

export default function BillingPage() {
  const router = useRouter();
  const { user } = useSupabase();
  const currentPlan = user?.suscripcion || 'free';

  const freeLimits = getPlanLimits('free');
  const smartLimits = getPlanLimits('smart');
  const proLimits = getPlanLimits('pro');

  const handleUpgrade = (plan: 'smart' | 'pro') => {
    if (plan === 'pro') {
      router.push('/billing/payment-methods');
    } else {
      // TODO: Agregar página de pago para Smart cuando esté disponible
      router.push('/billing/payment-methods?plan=smart');
    }
  };

  return (
    <div className="min-h-screen px-4 pt-4 pb-8">
      {/* Header */}
      <div className="text-center mb-6 animate-fade-in">
        <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <span className="bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] bg-clip-text text-transparent">
            Planes y Precios
          </span>
        </h1>
        <p className="text-xl text-[#94A3B8]">
          Elige tu plan perfecto
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="space-y-4 max-w-md mx-auto mb-6">
        {/* Plan Free */}
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-5 border border-[#94A3B8]/20 shadow-xl animate-fade-in">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#94A3B8] to-[#94A3B8]/50 flex items-center justify-center flex-shrink-0">
              <Gift size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#E9EDF2]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Free
              </h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold text-[#E9EDF2]" style={{ fontFamily: 'Space Mono, monospace' }}>
                  $0
                </span>
                <span className="text-xl text-[#94A3B8]">/mes</span>
              </div>
            </div>
          </div>

          <ul className="space-y-2 mb-4">
            {[
              `${freeLimits.maxDailyTransactions} transacciones/día`,
              `${freeLimits.maxActiveDebts} deuda activa`,
              `${freeLimits.maxActiveGoals} meta activa`,
              "Exportar datos",
              "Historial completo"
            ].map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xl">
                <CheckCircle size={14} className="text-[#00FF85] mt-0.5 flex-shrink-0" />
                <span className="text-[#94A3B8]">{feature}</span>
              </li>
            ))}
          </ul>

          <button 
            className={`w-full py-2.5 rounded-xl border text-xl font-semibold transition-all ${
              currentPlan === 'free' 
                ? 'bg-white/5 border-[#94A3B8]/30 text-[#94A3B8] cursor-default' 
                : 'bg-white/5 border-[#94A3B8]/30 text-[#94A3B8] hover:bg-white/10'
            }`}
            disabled={currentPlan === 'free'}
          >
            {currentPlan === 'free' ? 'Plan Actual' : 'Seleccionar'}
          </button>
        </div>

        {/* Plan Smart */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-[#00B2FF]/10 to-[#5A00FF]/10 rounded-2xl p-5 border-2 border-[#00B2FF] shadow-2xl animate-fade-in glow-primary relative" style={{ animationDelay: '0.1s' }}>
          {/* Badge Recomendado */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] text-white text-[10px] font-semibold flex items-center gap-1">
            <Zap size={12} />
            <span>Recomendado</span>
          </div>

          <div className="flex items-start gap-3 mb-4 mt-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00B2FF] to-[#5A00FF] flex items-center justify-center flex-shrink-0 glow-primary">
              <Sparkles size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#E9EDF2]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Smart
              </h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] bg-clip-text text-transparent" style={{ fontFamily: 'Space Mono, monospace' }}>
                  Próximamente
                </span>
              </div>
            </div>
          </div>

          <ul className="space-y-2 mb-4">
            {[
              `${smartLimits.maxDailyTransactions} transacciones/día`,
              `${smartLimits.maxActiveDebts} deuda activa`,
              `${smartLimits.maxActiveGoals} meta activa`,
              "Exportar datos",
              "Historial completo"
            ].map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xl">
                <CheckCircle size={14} className="text-[#00FF85] mt-0.5 flex-shrink-0" />
                <span className="text-[#E9EDF2]">{feature}</span>
              </li>
            ))}
          </ul>

          <button 
            onClick={() => handleUpgrade('smart')}
            className={`w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] text-white text-xl font-semibold hover:opacity-90 transition-all shadow-lg glow-primary ${
              currentPlan === 'smart' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={currentPlan === 'smart'}
          >
            {currentPlan === 'smart' ? 'Plan Actual' : 'Actualizar ahora'}
          </button>
        </div>

        {/* Plan Pro - Destacado */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-[#5A00FF]/10 to-[#00B2FF]/10 rounded-2xl p-5 border-2 border-[#5A00FF] shadow-2xl animate-fade-in glow-secondary relative" style={{ animationDelay: '0.2s' }}>
          {/* Badge Premium */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#5A00FF] to-[#00B2FF] text-white text-[10px] font-semibold flex items-center gap-1">
            <Crown size={12} />
            <span>Premium</span>
          </div>

          <div className="flex items-start gap-3 mb-4 mt-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5A00FF] to-[#00B2FF] flex items-center justify-center flex-shrink-0 glow-secondary">
              <Crown size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#E9EDF2]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Pro
              </h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold bg-gradient-to-r from-[#5A00FF] to-[#00B2FF] bg-clip-text text-transparent" style={{ fontFamily: 'Space Mono, monospace' }}>
                  $3.00 USD
                </span>
                <span className="text-xl text-[#94A3B8]">/mes</span>
              </div>
            </div>
          </div>

          <ul className="space-y-2 mb-4">
            {[
              `${proLimits.maxDailyTransactions} transacciones/día`,
              `${proLimits.maxActiveDebts} deudas activas`,
              `${proLimits.maxActiveGoals} metas activas`,
              "Categorías personalizadas",
              "Backup automático",
              "Historial completo",
              "Exportar datos"
            ].map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xl">
                <CheckCircle size={14} className="text-[#00FF85] mt-0.5 flex-shrink-0" />
                <span className="text-[#E9EDF2]">{feature}</span>
              </li>
            ))}
          </ul>

          <button 
            onClick={() => handleUpgrade('pro')}
            className={`w-full py-2.5 rounded-xl bg-gradient-to-r from-[#5A00FF] to-[#00B2FF] text-white text-xl font-semibold hover:opacity-90 transition-all shadow-lg glow-secondary ${
              currentPlan === 'pro' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={currentPlan === 'pro'}
          >
            {currentPlan === 'pro' ? 'Plan Actual' : 'Actualizar ahora'}
          </button>
        </div>
      </div>

      {/* Tabla Comparativa */}
      <div className="max-w-4xl mx-auto mb-8">
        <h2 className="text-xl font-bold text-center mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <span className="bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] bg-clip-text text-transparent">
            Comparación de Planes
          </span>
        </h2>
        
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-[#00B2FF]/20 shadow-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#00B2FF]/20">
                <th className="text-left py-3 px-4 text-[#E9EDF2] font-semibold">Característica</th>
                <th className="text-center py-3 px-4 text-[#94A3B8] font-semibold">Free</th>
                <th className="text-center py-3 px-4 text-[#00B2FF] font-semibold">Smart</th>
                <th className="text-center py-3 px-4 text-[#5A00FF] font-semibold">Pro</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#00B2FF]/10">
                <td className="py-3 px-4 text-[#E9EDF2]">Precio</td>
                <td className="py-3 px-4 text-center text-[#94A3B8]">$0/mes</td>
                <td className="py-3 px-4 text-center text-[#00B2FF]">Próximamente</td>
                <td className="py-3 px-4 text-center text-[#5A00FF] font-semibold">$3.00 USD/mes</td>
              </tr>
              <tr className="border-b border-[#00B2FF]/10">
                <td className="py-3 px-4 text-[#E9EDF2]">Transacciones diarias</td>
                <td className="py-3 px-4 text-center text-[#94A3B8]">{freeLimits.maxDailyTransactions}</td>
                <td className="py-3 px-4 text-center text-[#00B2FF]">{smartLimits.maxDailyTransactions}</td>
                <td className="py-3 px-4 text-center text-[#5A00FF] font-semibold">{proLimits.maxDailyTransactions}</td>
              </tr>
              <tr className="border-b border-[#00B2FF]/10">
                <td className="py-3 px-4 text-[#E9EDF2]">Deudas activas</td>
                <td className="py-3 px-4 text-center text-[#94A3B8]">{freeLimits.maxActiveDebts}</td>
                <td className="py-3 px-4 text-center text-[#00B2FF]">{smartLimits.maxActiveDebts}</td>
                <td className="py-3 px-4 text-center text-[#5A00FF] font-semibold">{proLimits.maxActiveDebts}</td>
              </tr>
              <tr className="border-b border-[#00B2FF]/10">
                <td className="py-3 px-4 text-[#E9EDF2]">Metas activas</td>
                <td className="py-3 px-4 text-center text-[#94A3B8]">{freeLimits.maxActiveGoals}</td>
                <td className="py-3 px-4 text-center text-[#00B2FF]">{smartLimits.maxActiveGoals}</td>
                <td className="py-3 px-4 text-center text-[#5A00FF] font-semibold">{proLimits.maxActiveGoals}</td>
              </tr>
              <tr className="border-b border-[#00B2FF]/10">
                <td className="py-3 px-4 text-[#E9EDF2]">Exportar datos</td>
                <td className="py-3 px-4 text-center">
                  {freeLimits.canExport ? <span className="text-[#00FF85]">✅</span> : <span className="text-[#94A3B8]">❌</span>}
                </td>
                <td className="py-3 px-4 text-center">
                  {smartLimits.canExport ? <span className="text-[#00FF85]">✅</span> : <span className="text-[#94A3B8]">❌</span>}
                </td>
                <td className="py-3 px-4 text-center">
                  {proLimits.canExport ? <span className="text-[#00FF85]">✅</span> : <span className="text-[#94A3B8]">❌</span>}
                </td>
              </tr>
              <tr className="border-b border-[#00B2FF]/10">
                <td className="py-3 px-4 text-[#E9EDF2]">Categorías personalizadas</td>
                <td className="py-3 px-4 text-center">
                  {freeLimits.canCreateCustomCategories ? <span className="text-[#00FF85]">✅</span> : <span className="text-[#94A3B8]">❌</span>}
                </td>
                <td className="py-3 px-4 text-center">
                  {smartLimits.canCreateCustomCategories ? <span className="text-[#00FF85]">✅</span> : <span className="text-[#94A3B8]">❌</span>}
                </td>
                <td className="py-3 px-4 text-center">
                  {proLimits.canCreateCustomCategories ? <span className="text-[#00FF85]">✅</span> : <span className="text-[#94A3B8]">❌</span>}
                </td>
              </tr>
              <tr className="border-b border-[#00B2FF]/10">
                <td className="py-3 px-4 text-[#E9EDF2]">Backup automático</td>
                <td className="py-3 px-4 text-center">
                  {freeLimits.hasAutoBackup ? <span className="text-[#00FF85]">✅</span> : <span className="text-[#94A3B8]">❌</span>}
                </td>
                <td className="py-3 px-4 text-center">
                  {smartLimits.hasAutoBackup ? <span className="text-[#00FF85]">✅</span> : <span className="text-[#94A3B8]">❌</span>}
                </td>
                <td className="py-3 px-4 text-center">
                  {proLimits.hasAutoBackup ? <span className="text-[#00FF85]">✅</span> : <span className="text-[#94A3B8]">❌</span>}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-[#E9EDF2]">Historial completo</td>
                <td className="py-3 px-4 text-center">
                  {freeLimits.historicalDataLimit === 'all' ? <span className="text-[#00FF85]">✅</span> : <span className="text-[#94A3B8]">❌</span>}
                </td>
                <td className="py-3 px-4 text-center">
                  {smartLimits.historicalDataLimit === 'all' ? <span className="text-[#00FF85]">✅</span> : <span className="text-[#94A3B8]">❌</span>}
                </td>
                <td className="py-3 px-4 text-center">
                  {proLimits.historicalDataLimit === 'all' ? <span className="text-[#00FF85]">✅</span> : <span className="text-[#94A3B8]">❌</span>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-md mx-auto">
        <h2 className="text-xl font-bold text-center mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <span className="bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] bg-clip-text text-transparent">
            Preguntas Frecuentes
          </span>
        </h2>

        <div className="space-y-3">
          {[
            { q: "¿Puedo cambiar de plan en cualquier momento?", a: "Sí, puedes actualizar o cambiar tu plan cuando lo desees." },
            { q: "¿Qué métodos de pago aceptan?", a: "Aceptamos pagos con USDT (BEP-20 BSC)." },
            { q: "¿Cómo funciona la renovación?", a: "Los planes se renuevan automáticamente según la duración de tu suscripción." }
          ].map((faq, idx) => (
            <div key={idx} className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-[#00B2FF]/20 animate-fade-in" style={{ animationDelay: `${0.3 + idx * 0.1}s` }}>
              <h3 className="text-xl font-semibold text-[#E9EDF2] mb-1">
                {faq.q}
              </h3>
              <p className="text-xl text-[#94A3B8]">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
