import type { NextConfig } from "next";
import path from 'path';

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
  webpack: (config) => {
    const srcPath = path.join(process.cwd(), 'src');
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': srcPath,
      '@/': srcPath,
    };
    return config;
  },
};

export default nextConfig;
