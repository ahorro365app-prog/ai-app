"use client";

import { Plus, DollarSign, Palmtree, TrendingUp, MoreVertical } from "lucide-react";

export default function ProjectsPage() {
  const projects = [
    { id: 1, title: "Presupuesto Mensual Octubre", date: "10 Oct 2025", category: "Finanzas", Icon: DollarSign },
    { id: 2, title: "Plan de Ahorro Vacaciones", date: "8 Oct 2025", category: "Metas", Icon: Palmtree },
    { id: 3, title: "Gastos Semanales", date: "5 Oct 2025", category: "Registro", Icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <span className="bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] bg-clip-text text-transparent">
              Proyectos
            </span>
          </h1>
          <p className="text-xl text-[#94A3B8]">
            Gestiona tus proyectos
          </p>
        </div>
        <button className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] text-white hover:opacity-90 transition-all glow-primary flex items-center justify-center">
          <Plus size={20} />
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-3">
        {projects.map((project, idx) => {
          const Icon = project.Icon;
          return (
            <div
              key={project.id}
              className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-[#00B2FF]/20 shadow-xl hover:bg-white/10 transition-all cursor-pointer group animate-fade-in"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#00B2FF] to-[#5A00FF] flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <Icon size={20} className="text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-[#E9EDF2] mb-1 group-hover:text-[#00B2FF] transition-colors truncate">
                    {project.title}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xl text-[#94A3B8]">{project.date}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#00B2FF]/20 text-[#00B2FF] text-[10px] font-medium">
                      {project.category}
                    </span>
                  </div>
                </div>

                <button className="text-[#94A3B8] hover:text-[#E9EDF2] transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>

            </div>
          );
        })}

        {/* Create new card */}
        <div 
          className="backdrop-blur-xl bg-white/5 rounded-xl p-6 border-2 border-dashed border-[#00B2FF]/30 shadow-xl hover:bg-white/10 transition-all cursor-pointer group animate-fade-in flex items-center justify-center min-h-[120px]" 
          style={{ animationDelay: '0.3s' }}
        >
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-[#00B2FF]/20 to-[#5A00FF]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={24} className="text-[#00B2FF]" />
            </div>
            <p className="text-xl text-[#94A3B8] group-hover:text-[#E9EDF2] transition-colors">
              Crear nuevo proyecto
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
