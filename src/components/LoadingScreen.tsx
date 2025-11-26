"use client";

import Image from 'next/image';
import { useState } from 'react';

interface LoadingScreenProps {
  text?: string;
}

export default function LoadingScreen({ text }: LoadingScreenProps) {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        {/* Contenedor del logo con spinner alrededor */}
        <div className="relative w-32 h-32 mb-4">
          {/* Spinner circular alrededor del logo - múltiples círculos para efecto más elegante */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Círculo exterior */}
            <div className="absolute w-40 h-40 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" style={{ animationDuration: '1s' }}></div>
            {/* Círculo medio */}
            <div className="absolute w-36 h-36 border-2 border-blue-100 border-r-blue-500 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
            {/* Círculo interior */}
            <div className="absolute w-32 h-32 border-2 border-purple-200 border-b-purple-400 rounded-full animate-spin" style={{ animationDuration: '0.8s' }}></div>
          </div>
          
          {/* Logo en el centro */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-28 h-28 flex items-center justify-center bg-white rounded-full shadow-lg">
              {!logoError ? (
                <Image
                  src="/logo.png"
                  alt="Ahorro365 Logo"
                  width={112}
                  height={112}
                  className="object-contain"
                  priority
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">A</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Texto opcional */}
        {text && (
          <p className="text-gray-500 text-sm font-medium animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

