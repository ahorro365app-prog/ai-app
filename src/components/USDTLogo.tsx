import React, { useState } from 'react';
import Image from 'next/image';

interface USDTLogoProps {
  size?: number;
  className?: string;
}

export default function USDTLogo({ size = 24, className = '' }: USDTLogoProps) {
  const [imageError, setImageError] = useState(false);

  // Si hay error cargando la imagen, usar SVG fallback
  if (imageError) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Círculo verde azulado (teal) - Color oficial de USDT */}
        <circle cx="50" cy="50" r="50" fill="#26A17B" />
        
        {/* Anillo orbital superior */}
        <ellipse
          cx="50"
          cy="35"
          rx="35"
          ry="12"
          fill="none"
          stroke="white"
          strokeWidth="2"
          opacity="0.9"
          transform="rotate(-15 50 50)"
        />
        
        {/* Letra T blanca - Barra vertical */}
        <rect x="42" y="25" width="16" height="50" rx="2" fill="white" />
        
        {/* Letra T blanca - Barra horizontal */}
        <rect x="25" y="25" width="50" height="12" rx="2" fill="white" />
        
        {/* Anillo orbital inferior */}
        <ellipse
          cx="50"
          cy="65"
          rx="35"
          ry="12"
          fill="none"
          stroke="white"
          strokeWidth="2"
          opacity="0.9"
          transform="rotate(15 50 50)"
        />
      </svg>
    );
  }

  return (
    <Image
      src="/images/usdt-logo.png"
      alt="USDT Logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
      onError={() => setImageError(true)}
    />
  );
}

