import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Cambiamos el directorio de build en desarrollo para evitar conflictos con .next bloqueado
  distDir: isProduction ? '.next' : '.next-dev',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: isProduction ? '' : '',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
