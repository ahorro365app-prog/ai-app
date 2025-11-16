const path = require('path')

const isProduction = process.env.NODE_ENV === 'production'

// Intentar cargar Sentry solo si está instalado y tiene variables configuradas
let withSentryConfig = null
let useSentry = false

try {
  if (process.env.SENTRY_ORG && process.env.SENTRY_PROJECT && process.env.SENTRY_DSN) {
    const sentryModule = require('@sentry/nextjs')
    withSentryConfig = sentryModule.withSentryConfig
    useSentry = true
  }
} catch (error) {
  useSentry = false
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: isProduction ? '.next' : '.next-dev',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
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

module.exports = useSentry && withSentryConfig
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableServerWebpackPlugin: !isProduction,
      disableClientWebpackPlugin: !isProduction,
      sourcemaps: {
        assets: './.next/**',
        ignore: ['node_modules'],
        deleteSourceMapsAfterUpload: true,
      },
    })
  : nextConfig

