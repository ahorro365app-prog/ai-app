"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Por ahora, cualquier credencial permite entrar
    // En producción, aquí irías a tu backend
    if (email && password) {
      router.push('/dashboard');
    } else {
      alert('Por favor completa todos los campos');
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4 overflow-auto">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-2xl">
            <LogIn size={40} className="text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Ahorro365</h1>
          <p className="text-blue-100">Gestiona tus finanzas con IA</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Iniciar Sesión</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus-within:border-blue-500 transition-colors">
                <Mail size={20} className="text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="flex-1 bg-transparent text-gray-900 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus-within:border-blue-500 transition-colors">
                <Lock size={20} className="text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-gray-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
            >
              Ingresar
            </button>
          </form>

          {/* Link a registro */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => router.push('/sign-up')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Regístrate
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-100 text-sm mt-6">
          Modo Demo - Cualquier credencial funciona
        </p>
      </div>
    </div>
  );
}
