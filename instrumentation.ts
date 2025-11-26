/**
 * Next.js Instrumentation Hook
 * 
 * Este archivo se ejecuta una vez cuando el servidor inicia.
 * Aquí configuramos Sentry para server y edge runtime.
 * 
 * Documentación: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
	// Validar variables de entorno críticas al inicio (solo en producción o si se fuerza)
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		// Solo validar en producción o si se fuerza la validación
		const shouldValidate = process.env.NODE_ENV === 'production' || process.env.FORCE_ENV_VALIDATION === 'true';
		
		if (shouldValidate) {
			try {
				const { enforceEnvironmentValidation } = await import('./src/lib/envValidation');
				// Validar variables críticas al inicio
				enforceEnvironmentValidation();
			} catch (error) {
				// Si falla la validación, el error ya fue logueado en enforceEnvironmentValidation
				// En producción, esto debería detener el servidor
				if (process.env.NODE_ENV === 'production') {
					throw error;
				}
			}
		}
	}

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



