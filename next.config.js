const path = require('path')
const { withSentryConfig } = require('@sentry/nextjs')

const isProduction = process.env.NODE_ENV === 'production'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cambiamos el directorio de build en desarrollo para evitar conflictos con .next bloqueado
  distDir: isProduction ? '.next' : '.next-dev',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  assetPrefix: isProduction ? '' : '',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    const srcPath = path.join(process.cwd(), 'src')
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': srcPath,
      '@/': srcPath,
    }
    return config
  },
}

// Configuración de Sentry
// SOLO usar Sentry si las variables de entorno están configuradas
// Esto previene errores de build en Vercel que causan bucles de deployment
const useSentry = process.env.SENTRY_ORG && process.env.SENTRY_PROJECT && process.env.SENTRY_DSN;

const sentryWebpackPluginOptions = {
  // Silenciar logs durante el build (opcional)
  silent: true,
  // Organización y proyecto de Sentry (se obtienen del DSN)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Upload source maps (solo en producción)
  widenClientFileUpload: true,
  // Ocultar source maps del bundle final
  hideSourceMaps: true,
  // Deshabilitar source maps en desarrollo
  disableServerWebpackPlugin: !isProduction,
  disableClientWebpackPlugin: !isProduction,
  // Configuración de source maps
  sourcemaps: {
    assets: './.next/**',
    ignore: ['node_modules'],
    deleteSourceMapsAfterUpload: true,
  },
}

// Exportar con o sin Sentry según configuración
// Si las variables de Sentry no están configuradas, usar nextConfig sin Sentry
// Esto previene bucles de deployment causados por builds fallidos
module.exports = useSentry 
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig






