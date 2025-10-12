"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, History, Mic, CreditCard, Target, Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface NavbarProps {
  onOpenTransaction: () => void;
}

export default function Navbar({ onOpenTransaction }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDebtsEnabled, setIsDebtsEnabled] = useState(true);
  const [isGoalsEnabled, setIsGoalsEnabled] = useState(true);

  // Cargar configuración de menús habilitados
  useEffect(() => {
    const savedDebtsEnabled = localStorage.getItem('isDebtsEnabled');
    setIsDebtsEnabled(savedDebtsEnabled === null ? true : savedDebtsEnabled === 'true');

    const savedGoalsEnabled = localStorage.getItem('isGoalsEnabled');
    setIsGoalsEnabled(savedGoalsEnabled === null ? true : savedGoalsEnabled === 'true');
  }, []);

  // Construir navItems dinámicamente basado en la configuración
  const navItems = [
    { href: "/dashboard", label: "Panel", Icon: Home },
    { href: "/history", label: "Historial", Icon: History },
    { href: "#", label: "Voz", Icon: Mic, isVoice: true },
    ...(isDebtsEnabled ? [{ href: "/deudas", label: "Deudas", Icon: CreditCard }] : []),
    ...(isGoalsEnabled ? [{ href: "/metas", label: "Metas", Icon: Target }] : []),
    { href: "/profile", label: "Ajustes", Icon: Settings },
  ];

  // Prefetch de todas las páginas al montar el componente
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.href !== "#") {
        router.prefetch(item.href);
      }
    });
  }, [router]);

  // Ajustar tamaño según cantidad de elementos
  const totalItems = navItems.length;
  const iconSize = totalItems <= 5 ? 22 : 20;
  const textSize = totalItems <= 5 ? "text-xs" : "text-[10px]";
  const spacing = totalItems <= 5 ? "mr-6 ml-6" : "mr-3 ml-3";

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white z-50 safe-bottom shadow-lg pt-0 pb-1">
      <ul className="flex items-center justify-around px-6 py-2 relative">
        {navItems.map((item, index) => {
          const active = pathname === item.href;
          const Icon = item.Icon;
          
          // Botón de voz central (más grande y destacado)
          if (item.isVoice) {
            return (
              <li key={item.label} className={`relative ${spacing}`}>
                <button
                  onClick={onOpenTransaction}
                  className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
                  aria-label="Registrar con voz"
                >
                  <Mic size={28} className="text-white" />
                </button>
              </li>
            );
          }

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`
                  flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all
                  ${active 
                    ? "text-blue-600" 
                    : "text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                <Icon size={iconSize} />
                <span className={`${textSize} font-medium`}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
