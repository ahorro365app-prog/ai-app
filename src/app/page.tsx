"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay una sesión activa guardada
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedUser) {
      // Si hay sesión activa, redirigir al dashboard
      router.push('/dashboard');
    } else {
      // Si no hay sesión, redirigir al login
      router.push('/sign-in');
    }
  }, [router]);

  // Mostrar loading mientras se verifica la sesión
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-lg font-semibold">Cargando...</p>
      </div>
    </div>
  );
}
