const path = require('path')

// Forzar producción para builds de Capacitor
const isProduction = process.env.NODE_ENV === 'production' || process.env.FORCE_PRODUCTION === 'true'

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
  // Habilitar export estático SOLO en producción/build (NO en desarrollo)
  // Las rutas API están en packages/core-api/ separado, así que es seguro
  // En desarrollo (npm run dev), Next.js NO debe usar esta opción para que funcione localhost
  ...(isProduction ? { output: 'export' } : {}),
  // Usar .next estándar para evitar problemas de permisos en Windows
  distDir: '.next',
  // Silenciar advertencia de múltiples lockfiles
  outputFileTracingRoot: path.join(__dirname),
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
  // Configuración de límites de tamaño de request (protección contra DoS)
  // Nota: En Next.js 13+ App Router, esto se maneja en runtime
  // Los límites se validan en los endpoints individuales
  // Límite recomendado: 1MB para JSON, 5MB para file uploads
  // Deshabilitar lazy loading para páginas específicas en producción
  // Esto previene problemas con React.lazy en output: 'export'
  experimental: {
    ...(isProduction ? {
      // Forzar carga eager de componentes de página
      optimizePackageImports: ['@/app/dashboard'],
    } : {}),
  },
  webpack: (config, { isServer, webpack }) => {
    const srcPath = path.join(process.cwd(), 'src')
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': srcPath,
      '@/': srcPath,
    }
    
    // Excluir rutas API del proceso de build cuando usamos output: 'export'
    // Esto previene que Next.js intente procesar las rutas API durante el export
    if (!isServer) {
      // Excluir rutas API del bundle del cliente
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^\.\/api\/.*$/,
          contextRegExp: /src\/app$/,
        })
      )
      
          // En producción con output: 'export', forzar carga eager del dashboard
          // para evitar problemas de lazy loading en Capacitor
          if (isProduction) {
            config.optimization = config.optimization || {}
            config.optimization.splitChunks = config.optimization.splitChunks || {}
            config.optimization.splitChunks.cacheGroups = config.optimization.splitChunks.cacheGroups || {}
            
            // Crear un cache group para el dashboard que lo incluya en el bundle principal
            // Esto fuerza que el componente se cargue de forma eager (no lazy)
            config.optimization.splitChunks.cacheGroups.dashboard = {
              test: /[\\/]app[\\/]dashboard[\\/]page/,
              name: 'dashboard-page',
              priority: 30,
              reuseExistingChunk: true,
              chunks: 'all',
              enforce: true, // Forzar que siempre se incluya en el bundle
            }
          }
    }
    
    return config
  },
  
  // Excluir rutas API del proceso de export usando pageExtensions
  // Solo reconocer archivos que terminan en page.tsx o page.ts como páginas
  // Esto hace que Next.js ignore los archivos route.ts en la carpeta api/
  pageExtensions: ['page.tsx', 'page.ts', 'tsx', 'ts'].filter(ext => {
    // En producción con output: 'export', excluir route.ts
    if (isProduction && process.env.NODE_ENV === 'production') {
      return ext !== 'ts' || ext === 'page.ts'
    }
    return true
  }),
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






