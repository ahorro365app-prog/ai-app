/**
 * Next.js Instrumentation Hook
 * 
 * Este archivo se ejecuta una vez cuando el servidor inicia.
 * Aquí configuramos Sentry para server y edge runtime.
 * 
 * Documentación: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
	// Cargar Sentry en runtime Node.js solo si está disponible
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		try {
			await import('./sentry.server.config');
		} catch {
			// Sentry no configurado/instalado: continuar sin error
		}
	}

	// Evitar errores en Edge si Sentry no está correctamente configurado
	if (process.env.NEXT_RUNTIME === 'edge') {
		const hasSentryEnv =
			!!process.env.NEXT_PUBLIC_SENTRY_DSN &&
			!!process.env.SENTRY_ORG &&
			!!process.env.SENTRY_PROJECT;
		if (hasSentryEnv) {
			try {
				await import('./sentry.edge.config');
			} catch {
				// Sentry no disponible en edge: continuar sin error
			}
		}
	}
}



