# 🔒 PLAN DE SEGURIDAD MAESTRO - CONSOLIDADO

**Versión**: 2.1 (CORREGIDA)  
**Fecha**: 2025  
**Estado**: IMPLEMENTACIÓN INMEDIATA  
**Presupuesto**: $0 inicial → Escalado según usuarios

**⚠️ CORRECCIONES APLICADAS**:
- Rate limiting: Cambiado de Map a Upstash Redis (Map no funciona en serverless)
- Tiempos ajustados: Fase 1 (6h), Fase 2 (4h), Fase 3 (8h)
- Contraseñas: 30 min (bcryptjs ya instalado)
- Total MVP: 10 horas (Fase 1 + Fase 2)

---

## 📊 METODOLOGÍA DE PRIORIZACIÓN

1. **Urgencia**: Crítico → Alto → Medio → Bajo
2. **Costo**: $0 → Gratis con límites → Pago escalado
3. **Escala**: Cantidad de usuarios para activar pago

---

## 🚨 FASE 1: CRÍTICO - IMPLEMENTAR HOY (Sin Costo)

### 1.1 Validación Backend (Reemplaza RLS)
- **Urgencia**: CRÍTICA
- **Costo**: $0
- **Tiempo**: 30 minutos
- **Acción**: Deshabilitar RLS explícitamente (ya tiene políticas permisivas), validar en backend con authHelpers.ts
- **Impacto**: Previene acceso no autorizado a datos
- **Estado**: Ya implementado parcialmente (authHelpers.ts existe), solo falta deshabilitar RLS explícitamente

### 1.2 Contraseñas Admin con Bcrypt
- **Urgencia**: CRÍTICA
- **Costo**: $0
- **Tiempo**: 30 minutos (bcryptjs ya instalado)
- **Acción**: Migrar admin-dashboard de texto plano a bcrypt
- **Impacto**: Previene acceso no autorizado al panel admin
- **Estado**: Pendiente (actualmente en texto plano)
- **Nota**: bcryptjs ya está instalado en admin-dashboard, solo cambiar validación

### 1.3 Rate Limiting con Upstash Redis
- **Urgencia**: CRÍTICA
- **Costo**: $0 (gratis hasta 10k requests/día)
- **Tiempo**: 1 hora
- **Acción**: Implementar con Upstash Redis (NO Map en memoria - no funciona en Vercel serverless)
- **Impacto**: Previene ataques de fuerza bruta y DDoS básico
- **Requisito**: Crear cuenta gratis en upstash.com (5 minutos)
- **Nota**: Map en memoria NO funciona en serverless, usar Redis desde inicio

### 1.4 Error Handling Seguro
- **Urgencia**: CRÍTICA
- **Costo**: $0
- **Tiempo**: 1 hora
- **Acción**: Wrapper que no expone detalles internos en producción
- **Impacto**: Previene fuga de información técnica
- **Estado**: Pendiente

### 1.5 Validación de Inputs con Zod
- **Urgencia**: CRÍTICA
- **Costo**: $0
- **Tiempo**: 2 horas
- **Acción**: Schemas de validación para todos los endpoints
- **Impacto**: Previene SQL injection, XSS, inyección de datos
- **Estado**: Pendiente

---

## ⚡ FASE 2: ALTO - ESTA SEMANA (Sin Costo)

### 2.1 CSRF Protection
- **Urgencia**: ALTA
- **Costo**: $0
- **Tiempo**: 1 hora
- **Acción**: Tokens CSRF en formularios y validación en backend
- **Impacto**: Previene ataques cross-site request forgery
- **Estado**: ✅ COMPLETADO

### 2.2 Security Headers
- **Urgencia**: ALTA
- **Costo**: $0
- **Tiempo**: 1 hora
- **Acción**: CSP, X-Frame-Options, X-Content-Type-Options
- **Impacto**: Previene XSS, clickjacking, MIME sniffing
- **Estado**: ✅ COMPLETADO

### 2.3 Environment Variables Validation
- **Urgencia**: ALTA
- **Costo**: $0
- **Tiempo**: 30 minutos
- **Acción**: Verificar .gitignore, validar secrets en Vercel
- **Impacto**: Previene fuga de secrets en repositorio
- **Estado**: ✅ COMPLETADO
- **Nota**: Documentar siempre la URL del core (`NEXT_PUBLIC_CORE_API_URL`) para que el panel admin apunte al dominio correcto (ej. `http://localhost:3000` en desarrollo, dominio de Vercel en producción).

### 2.4 Logging Seguro
- **Urgencia**: ALTA
- **Costo**: $0
- **Tiempo**: 1 hora
- **Acción**: Sistema de logging condicional (ya implementado)
- **Impacto**: Reduce logs en producción, mantiene solo errores críticos
- **Estado**: ✅ COMPLETADO Y MEJORADO

### 2.5 Monitoreo Básico (Sentry Free)
- **Urgencia**: ALTA
- **Costo**: $0 (hasta 5,000 eventos/mes)
- **Tiempo**: 1 hora
- **Acción**: Configurar Sentry con filtrado de datos sensibles
- **Impacto**: Detecta errores en producción
- **Límite**: 5,000 eventos/mes gratis
- **Escalamiento**: Migrar a Pro cuando supere límite
- **Estado**: ✅ COMPLETADO

#### 2.5.1 Alertas Críticas Configuradas

Se han configurado **5 alertas críticas** en Sentry para monitoreo proactivo de errores:

**1. Error de servidor (500+)**
- **Condiciones**:
  - WHEN: A new issue is created
  - IF: 
    - The issue's category is equal to `error`
    - The event's `http.status_code` value is in (comma separated): `500,501,502,503,504,505,506,507,508,510,511`
  - THEN: Send a notification (for all legacy integrations)
- **Intervalo**: 5 minutes
- **Propósito**: Detectar errores críticos del servidor que requieren atención inmediata

**2. Error de autenticación (401/403)**
- **Condiciones**:
  - WHEN: A new issue is created
  - IF:
    - The issue's category is equal to `error`
    - The event's `http.status_code` value is in (comma separated): `401,403`
  - THEN: Send a notification (for all legacy integrations)
- **Intervalo**: 5 minutes
- **Propósito**: Detectar problemas de autenticación y autorización

**3. Error de base de datos**
- **Condiciones**:
  - WHEN: A new issue is created
  - IF:
    - The issue's category is equal to `error`
    - The event's tags match `database` is set
    - The event's `exception.type` value contains `database`
  - THEN: Send a notification (for all legacy integrations)
- **Intervalo**: 5 minutes
- **Propósito**: Detectar errores relacionados con la base de datos (Supabase, PostgreSQL, etc.)

**4. Error de pago**
- **Condiciones**:
  - WHEN: A new issue is created
  - IF:
    - The issue's category is equal to `error`
    - The event's tags match `payment` is set
    - The event's `http.url` value contains `/api/payment`
  - THEN: Send a notification (for all legacy integrations)
- **Intervalo**: 5 minutes
- **Propósito**: Detectar errores en procesos de pago (crítico para el negocio)

**5. Error de WhatsApp/Webhooks**
- **Condiciones**:
  - WHEN: A new issue is created
  - IF:
    - The issue's category is equal to `error`
    - The event's tags match `whatsapp` is set
    - The event's `http.url` value contains `/api/webhooks/whatsapp`
  - THEN: Send a notification (for all legacy integrations)
- **Intervalo**: 5 minutes
- **Propósito**: Detectar errores en webhooks de WhatsApp (crítico para funcionalidad principal)

#### 2.5.2 Gestión de Alertas

**Probar Alertas**:
- Cada alerta tiene un botón "Send Test Notification" en la configuración
- Usar para verificar que los emails de notificación funcionan correctamente

**Ver Alertas Activas**:
- Ir a "Alerts" en el dashboard de Sentry
- Ver todas las alertas configuradas y su estado

**Integraciones Adicionales** (Opcional):
- Conectar Slack o Discord desde el botón "Connect to messaging" en cada alerta
- Permite recibir notificaciones en canales de equipo además de email

**Monitoreo**:
- Revisar regularmente el dashboard de Sentry para tendencias
- Las alertas se activarán automáticamente cuando ocurran errores que cumplan las condiciones
- Cada alerta notificará máximo cada 5 minutos por issue (evita spam)

---

## 🛡️ FASE 3: ANTES DE LANZAR (Sin Costo)

### 3.1 2FA para Admin Panel
- **Urgencia**: ALTA
- **Costo**: $0
- **Tiempo**: 3 horas
- **Acción**: TOTP con speakeasy, QR codes, backup codes
- **Impacto**: Doble capa de seguridad para admin
- **Estado**: ✅ COMPLETADO (requiere ejecutar script SQL)

### 3.2 Audit Logs para Admin
- **Urgencia**: MEDIA
- **Costo**: $0
- **Tiempo**: 3 horas
- **Acción**: Tabla de auditoría, logging de acciones admin
- **Impacto**: Permite rastrear acciones administrativas
- **Estado**: ✅ COMPLETADO (requiere ejecutar script SQL)

### 3.3 WAF Cloudflare Free
- **Urgencia**: MEDIA
- **Costo**: $0
- **Tiempo**: 1 hora (setup) + 24-48h propagación DNS
- **Acción**: Configurar Cloudflare, activar WAF básico
- **Impacto**: Protección DDoS y reglas básicas anti-XSS/SQL injection
- **Requisito**: Dominio propio (no funciona con vercel.app)
- **Límite**: Funciona gratis indefinidamente
- **Escalamiento**: Migrar a Pro cuando veas ataques frecuentes
- **Estado**: ✅ GUÍA COMPLETA CREADA (requiere dominio propio para implementar)

### 3.4 Testing de Seguridad Básico
- **Urgencia**: MEDIA
- **Costo**: $0
- **Tiempo**: 2 horas
- **Acción**: Probar rate limiting, validación, RLS deshabilitado
- **Impacto**: Verifica que todo funciona correctamente
- **Estado**: ✅ GUÍA COMPLETA CREADA (38 tests manuales + script automatizado)

---

## 📈 FASE 4: POST-LANZAMIENTO - MES 1 (Sin Costo o Bajo Costo)

### 4.1 Backups Automáticos
- **Urgencia**: MEDIA
- **Costo**: $0-5/mes
- **Tiempo**: 2 horas
- **Acción**: Cron jobs para backups a AWS S3/Backblaze
- **Impacto**: Recuperación ante pérdida de datos
- **Gratis**: Supabase incluye backups automáticos
- **Extra**: Backups manuales adicionales (opcional)

### 4.2 Alertas por Email
- **Urgencia**: MEDIA
- **Costo**: $0-10/mes
- **Tiempo**: 2 horas
- **Acción**: Configurar alertas de errores críticos
- **Impacto**: Notificación inmediata de problemas
- **Gratis**: Resend (hasta 3,000 emails/mes)
- **Pago**: Si supera 3,000 emails/mes

### 4.3 Documentación de Seguridad
- **Urgencia**: BAJA
- **Costo**: $0
- **Tiempo**: 2 horas
- **Acción**: Documentar políticas, procedimientos, contactos
- **Impacto**: Facilita respuesta a incidentes
- **Estado**: Ya creada parcialmente

---

## 💳 FASE 5: ESCALADO POR CANTIDAD DE USUARIOS

### 5.1 0-100 Usuarios (MVP)
**Costo Total**: $0/mes
**Implementar**:
- Todas las Fases 1-3 completas
- Rate limiting en memoria (Map)
- Sentry Free
- Cloudflare Free WAF
- Backups automáticos de Supabase

**Implementar**:
- Fases 1-2 completas (10 horas)
- Rate limiting con Upstash Redis (desde inicio)
- Sentry Free
- Backups automáticos de Supabase
- Fase 3 opcional (2FA y Audit logs pueden esperar)

**Estado**: Lanzable con seguridad robusta después de Fase 2

---

### 5.2 100-500 Usuarios (Crecimiento)
**Costo Total**: $20/mes (Cloudflare Pro)
**Cuándo Activar**: Cuando veas:
- Más de 10,000 requests/día
- Ataques DDoS menores frecuentes
- Necesitas reglas WAF avanzadas

**Implementar**:
- Cloudflare Pro ($20/mes)
  - WAF avanzado
  - Rate limiting global mejorado
  - Analytics avanzado
  - Protección DDoS mejorada

**Mantener Gratis**:
- Sentry Free (suficiente para este rango)
- Rate limiting puede seguir en memoria (o migrar a Redis si es necesario)

---

### 5.3 500-2,000 Usuarios (Escala)
**Costo Total**: $49/mes ($20 Cloudflare Pro + $29 Sentry Pro)
**Cuándo Activar**: Cuando:
- Sentry Free supere 5,000 eventos/mes
- Necesites más tracking de errores
- Requieras alertas avanzadas

**Implementar**:
- Sentry Pro ($29/mes)
  - 50,000 eventos/mes
  - Alertas avanzadas
  - Performance monitoring
  - Release tracking

**Migrar Ahora**:
- Rate limiting a Upstash Redis (gratis hasta 10k req/día, luego $0.20/millón)
- Si superas 10k req/día: ~$2-10/mes adicionales

**Mantener**:
- Cloudflare Pro ($20/mes)

---

### 5.4 2,000-10,000 Usuarios (Crecimiento Acelerado)
**Costo Total**: $100-150/mes
**Cuándo Activar**: Cuando:
- Necesites análisis profundo de vulnerabilidades
- Tengas múltiples ambientes (dev/staging/prod)
- Requieras compliance avanzado

**Implementar**:
- Snyk ($50/mes base)
  - Análisis de dependencias
  - Detección de vulnerabilidades
  - Escaneo de código
  - Reportes de compliance

**Optimizar**:
- Upstash Redis: $5-20/mes (según tráfico)
- Cloudflare Pro: $20/mes
- Sentry Pro: $29/mes
- Snyk: $50/mes

**Total**: ~$104-119/mes

---

### 5.5 10,000+ Usuarios (Empresa)
**Costo Total**: $200-500/mes
**Cuándo Activar**: Cuando:
- Tengas múltiples productos
- Necesites compliance enterprise (GDPR, SOC2)
- Requieras soporte 24/7

**Implementar**:
- Snyk Enterprise: $100-200/mes
- Cloudflare Business: $200/mes (si necesitas más)
- Sentry Business: $80/mes (si necesitas más)
- Vercel Pro: $20/mes (mejor rate limiting)
- AWS/GCP para backups: $10-50/mes

**Total**: ~$410-570/mes

---

## 📋 CHECKLIST POR FASE

### FASE 1: CRÍTICO (HOY) - 6 horas
- [x] ✅ Validación backend (deshabilitar RLS explícitamente) - COMPLETADO
- [x] ✅ Contraseñas admin con bcrypt (30 min - bcryptjs ya instalado) - COMPLETADO
- [x] ✅ Rate limiting con Upstash Redis (1h - NO Map, no funciona en serverless) - COMPLETADO
- [x] ✅ Error handling seguro (1h) - COMPLETADO
- [x] ✅ Validación inputs con Zod (2h) - COMPLETADO
- [ ] Testing básico (1h)

**Estado después de Fase 1**: Lanzable con riesgo controlado

---

### FASE 2: ALTO (ESTA SEMANA) - 4 horas
- [x] ✅ CSRF protection (1.5h) - COMPLETADO
- [x] ✅ Security headers (CSP, etc.) (30 min) - COMPLETADO
- [x] ✅ Environment variables validation (30 min) - COMPLETADO
- [x] ✅ Logging seguro (ya implementado, verificar) (30 min) - COMPLETADO
- [x] ✅ Sentry Free configurado (1h) - COMPLETADO
- [x] ✅ Alertas críticas configuradas (5 alertas) - COMPLETADO

**Estado después de Fase 2**: Listo para lanzar con seguridad robusta

---

### FASE 3: ANTES LANZAR - 8 horas (opcional para MVP)
- [ ] 2FA admin panel (4h - más complejo de lo estimado)
- [ ] Audit logs admin (3h - requiere tabla y modificar endpoints)
- [ ] Cloudflare Free WAF (1h - SALTAR si no tienes dominio)
- [ ] Testing de seguridad básico (1h)

**Estado después de Fase 3**: Excelente nivel de seguridad

---

### FASE 4: MES 1 POST-LANZAMIENTO - 6 horas
- [ ] Backups automáticos adicionales (opcional)
- [ ] Alertas por email configuradas
- [ ] Documentación completa

**Estado después de Fase 4**: Seguridad robusta y documentada

---

## 💰 RESUMEN DE COSTOS POR ESCALA

| Usuarios | Costo Mensual | Servicios Incluidos |
|----------|---------------|-------------------|
| 0-100 | $0 | Todo gratis |
| 100-500 | $20 | Cloudflare Pro |
| 500-2,000 | $49 | Cloudflare Pro + Sentry Pro |
| 2,000-10,000 | $104-119 | Cloudflare + Sentry + Snyk + Redis |
| 10,000+ | $410-570 | Enterprise tier de todos |

---

## 🎯 DECISIONES POR ESCALA

### 0-100 Usuarios
**No pagar nada**. Todo funciona con versiones gratuitas.

### 100-500 Usuarios
**Pagar Cloudflare Pro ($20/mes)** cuando veas ataques o necesites mejor protección.

### 500-2,000 Usuarios
**Pagar Cloudflare Pro + Sentry Pro ($49/mes)** cuando Sentry Free se agote.

**Migrar a Redis** si superas 10k requests/día (gratis hasta 10k/día).

### 2,000-10,000 Usuarios
**Pagar todo el stack ($104-119/mes)** cuando:
- Necesites análisis profundo
- Tengas múltiples ambientes
- Requieras compliance

### 10,000+ Usuarios
**Enterprise tier** cuando:
- Múltiples productos
- Compliance enterprise
- Soporte 24/7

---

## ⏱️ TIMELINE REALISTA

### Semana 1: Fase 1 (6 horas)
- Día 1: Validación backend (30 min), Contraseñas bcrypt (30 min), Rate limiting Redis (1h)
- Día 2: Error handling (1h), Validación Zod (2h)
- Día 3: Testing básico (1h)

### Semana 2: Fase 2 (4 horas)
- Día 1: CSRF (1.5h), Security headers (30 min)
- Día 2: Env validation (30 min), Sentry (1h), Logging seguro (30 min)
- Día 3: Testing

### Semana 3: Fase 3 (8 horas - opcional para MVP)
- Día 1-2: 2FA admin (4h)
- Día 3: Audit logs (3h)
- Día 4: Cloudflare (1h - SALTAR si no tienes dominio) o Testing (1h)
- Día 5: Testing completo (1h)

### Semana 4: Fase 4 (6 horas)
- Día 1-2: Backups, alertas
- Día 3: Documentación
- Día 4-5: Buffer y ajustes finales

**Total**: 18 horas para MVP (Fase 1 + Fase 2)
**Total completo**: 26 horas si incluyes Fase 3 (opcional)

---

## 🚦 GO/NO-GO POR FASE

### Después de Fase 1
- ✅ **GO CON RIESGO**: Lanzable pero con precauciones
- ⚠️ Monitoreo activo requerido
- ⚠️ Listo para respuesta rápida a incidentes

### Después de Fase 2
- ✅ **GO**: Listo para lanzar con seguridad robusta
- ✅ Todas las medidas críticas implementadas
- ✅ Monitoreo básico activo

### Después de Fase 3
- ✅ **GO CON CONFIANZA**: Excelente nivel de seguridad
- ✅ Todas las medidas importantes implementadas
- ✅ Documentación completa

### Después de Fase 4
- ✅ **EXCELENTE**: Seguridad robusta y documentada
- ✅ Listo para escalar
- ✅ Plan de respuesta a incidentes activo

---

## 📊 PRIORIZACIÓN FINAL

### DEBE HACERSE (Bloquea lanzamiento)
1. Validación backend (reemplazo RLS)
2. Contraseñas admin bcrypt
3. Rate limiting básico
4. Error handling seguro
5. Validación inputs Zod

### DEBERÍA HACERSE (Primera semana)
1. CSRF protection ✅ COMPLETADO
2. Security headers ✅ COMPLETADO
3. Sentry Free ✅ COMPLETADO (con 5 alertas críticas configuradas)
4. Logging seguro ✅ COMPLETADO

### SERÍA BUENO (Antes de lanzar)
1. 2FA admin
2. Audit logs
3. Cloudflare Free WAF
4. Testing completo

### SERÍA IDEAL (Mes 1)
1. Backups adicionales
2. Alertas configuradas
3. Documentación completa

---

## 🎯 CONCLUSIÓN

**Para MVP (0-100 usuarios)**:
- Implementar Fases 1-2 (MÍNIMO)
- Fase 3 opcional (2FA y Audit logs pueden esperar)
- Costo: $0
- Tiempo: 10 horas (Fase 1 + Fase 2)
- Seguridad: Excelente para startup

**Para Escalar (100-2,000 usuarios)**:
- Mantener Fases 1-3
- Agregar Cloudflare Pro ($20) a los 100 usuarios
- Agregar Sentry Pro ($29) a los 500 usuarios
- Costo gradual: $0 → $20 → $49
- Seguridad: Robusta para crecimiento

**Para Empresa (2,000+ usuarios)**:
- Stack completo
- Costo: $100-200/mes
- Seguridad: Enterprise-grade

---

## 📝 NOTAS IMPORTANTES

1. **RLS no funciona** con tu sistema de autenticación actual
   - Solución: Deshabilitar RLS, validar en backend
   - Ya tienes `authHelpers.ts` para esto

2. **Rate limiting con Upstash Redis** desde Fase 1
   - Map en memoria NO funciona en Vercel serverless
   - Upstash Redis: gratis hasta 10k req/día
   - Crear cuenta gratis en upstash.com (5 minutos)

3. **Cloudflare requiere dominio propio**
   - No funciona con vercel.app
   - Si no tienes dominio, saltar este paso

4. **Contraseñas admin críticas**
   - Deben estar en Fase 1, no después
   - Actualmente en texto plano (CRÍTICO)

5. **CSRF es crítico para pagos**
   - Mover a Fase 2 (no Fase 3)
   - Es fácil de implementar (1 hora)

---

## ✅ SIGUIENTE PASO

1. Revisar este plan consolidado
2. Decidir timeline (4 semanas recomendado)
3. Implementar Fase 1 (HOY)
4. Validar con Pre-Launch Security Checklist
5. Proceder con lanzamiento después de Fase 2

