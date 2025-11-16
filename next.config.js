const path = require('path')

const isProduction = process.env.NODE_ENV === 'production'

// Intentar cargar Sentry solo si está instalado y tiene variables configuradas
let withSentryConfig = null
let useSentry = false

try {
  // Solo intentar usar Sentry si:
  // 1. El paquete está instalado
  // 2. Las variables de entorno están configuradas
  if (process.env.SENTRY_ORG && process.env.SENTRY_PROJECT && process.env.SENTRY_DSN) {
    const sentryModule = require('@sentry/nextjs')
    withSentryConfig = sentryModule.withSentryConfig
    useSentry = true
  }
} catch (error) {
  // @sentry/nextjs no está instalado o no está disponible
  // Continuar sin Sentry
  useSentry = false
}

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

// Exportar con o sin Sentry según configuración
// Si las variables de Sentry no están configuradas o el módulo no está disponible,
// usar nextConfig sin Sentry
// Esto previene errores de build y bucles de deployment
if (useSentry && withSentryConfig) {
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
  
  module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions)
} else {
  // Sin Sentry - configuración simple
  module.exports = nextConfig
}






