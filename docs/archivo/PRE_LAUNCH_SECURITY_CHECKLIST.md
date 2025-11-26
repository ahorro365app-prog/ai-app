# ✅ PRE-LAUNCH SECURITY CHECKLIST

## 🎯 DECISIÓN GO/NO-GO PARA LANZAMIENTO

Usa este checklist para validar que la aplicación está lista para producción desde el punto de vista de seguridad.

---

## SECCIÓN 1: AUTENTICACIÓN Y AUTORIZACIÓN

### Autenticación
- [ ] ✅ JWT tokens implementados y firmados correctamente
- [ ] ✅ Headers `x-user-id` NO se usan sin validación
- [ ] ✅ Session timeout configurado (máx 30 min inactividad)
- [ ] ✅ Refresh tokens implementados
- [ ] ✅ Logout funciona correctamente
- [ ] ✅ Contraseñas hashadas (bcrypt o similar)
- [ ] ✅ Validación de contraseñas fuertes implementada
- [ ] ✅ Rate limiting en login (máx 5 intentos/15 min)

### Autorización
- [ ] ✅ RLS policies correctas en todas las tablas
- [ ] ✅ Usuarios solo ven sus propios datos
- [ ] ✅ Admin tiene permisos adecuados
- [ ] ✅ Validación de roles en backend
- [ ] ✅ No hay bypass de permisos

### 2FA/MFA
- [ ] ✅ 2FA implementado para admin
- [ ] ✅ Backup codes generados y guardados
- [ ] ✅ 2FA obligatorio para admin en producción
- [ ] ⚠️ 2FA opcional para usuarios (recomendado)

---

## SECCIÓN 2: VALIDACIÓN Y SANITIZACIÓN

### Validación de Inputs
- [ ] ✅ Zod schemas en TODOS los endpoints
- [ ] ✅ Validación de tipos de datos
- [ ] ✅ Validación de longitud (max/min)
- [ ] ✅ Validación de formatos (email, URL, wallet address)
- [ ] ✅ Sanitización de strings HTML
- [ ] ✅ Validación de archivos (tipo, tamaño)

### Protección SQL Injection
- [ ] ✅ Solo usar Supabase client (prepared statements)
- [ ] ✅ No hay queries raw SQL
- [ ] ✅ Todas las queries usan parámetros

### Protección XSS
- [ ] ✅ React escapa automáticamente
- [ ] ✅ No hay `dangerouslySetInnerHTML` sin sanitizar
- [ ] ✅ CSP headers configurados
- [ ] ✅ Validación en frontend Y backend

---

## SECCIÓN 3: RATE LIMITING Y DDoS

### Rate Limiting
- [ ] ✅ Implementado en TODOS los endpoints
- [ ] ✅ Configuraciones apropiadas por endpoint:
  - [ ] Login: 5 req/15 min
  - [ ] Payments: 20 req/min
  - [ ] Webhooks: 10 req/min
  - [ ] API general: 60 req/min
- [ ] ✅ Headers de rate limit en respuestas
- [ ] ✅ Mensajes de error apropiados

### DDoS Protection
- [ ] ✅ Cloudflare o similar configurado
- [ ] ✅ Rate limiting global
- [ ] ✅ WAF configurado
- [ ] ✅ Plan de mitigación documentado

---

## SECCIÓN 4: BASE DE DATOS

### RLS Policies
- [ ] ✅ RLS habilitado en TODAS las tablas
- [ ] ✅ Políticas restrictivas (no "permitir todo")
- [ ] ✅ Cada usuario solo accede a sus datos
- [ ] ✅ Admin tiene políticas especiales documentadas
- [ ] ✅ Testing: Usuario A no puede ver datos de Usuario B

### Acceso a BD
- [ ] ✅ Service role key solo en backend
- [ ] ✅ Anon key en frontend (con RLS)
- [ ] ✅ No hay keys expuestas en código
- [ ] ✅ Connection pooling configurado

### Backups
- [ ] ✅ Backups automáticos configurados
- [ ] ✅ Frecuencia de backups documentada
- [ ] ✅ Proceso de restauración testado
- [ ] ✅ Backups en ubicación separada

---

## SECCIÓN 5: ERROR HANDLING

### Manejo de Errores
- [ ] ✅ Wrapper de error handling implementado
- [ ] ✅ Mensajes genéricos en producción
- [ ] ✅ No se exponen stack traces
- [ ] ✅ No se exponen detalles internos
- [ ] ✅ Logging seguro (sin datos sensibles)

### Logging
- [ ] ✅ Sistema de logging implementado
- [ ] ✅ Logs solo en desarrollo (debug/info)
- [ ] ✅ Errores siempre logueados
- [ ] ✅ Logs no contienen datos sensibles
- [ ] ✅ Rotación de logs configurada

---

## SECCIÓN 6: SECRETS Y CONFIGURACIÓN

### Environment Variables
- [ ] ✅ Todos los secrets en `.env.local` (no versionado)
- [ ] ✅ Secrets configurados en Vercel
- [ ] ✅ `.env.local` en `.gitignore`
- [ ] ✅ No hay secrets en código
- [ ] ✅ No hay secrets en logs

### API Keys
- [ ] ✅ Keys rotadas antes de producción
- [ ] ✅ Keys con permisos mínimos
- [ ] ✅ `NEXT_PUBLIC_*` solo lo necesario
- [ ] ✅ Service keys solo en backend

---

## SECCIÓN 7: HTTPS Y HEADERS

### HTTPS
- [ ] ✅ HTTPS obligatorio en producción
- [ ] ✅ Redirect HTTP → HTTPS
- [ ] ✅ HSTS headers configurados
- [ ] ✅ Certificado válido
- [ ] ✅ No hay contenido mixto (HTTP/HTTPS)

### Security Headers
- [ ] ✅ Content-Security-Policy configurado
- [ ] ✅ X-Frame-Options: DENY
- [ ] ✅ X-Content-Type-Options: nosniff
- [ ] ✅ Referrer-Policy configurado
- [ ] ✅ Permissions-Policy configurado

---

## SECCIÓN 8: CSRF Y CORS

### CSRF Protection
- [ ] ✅ CSRF tokens en forms
- [ ] ✅ Validación en backend
- [ ] ✅ SameSite cookies: strict
- [ ] ✅ Testing de protección

### CORS
- [ ] ✅ CORS configurado correctamente
- [ ] ✅ Solo dominios permitidos
- [ ] ✅ No `Access-Control-Allow-Origin: *`
- [ ] ✅ Métodos HTTP restringidos

---

## SECCIÓN 9: MONITOREO Y ALERTAS

### Monitoreo
- [ ] ✅ Sentry configurado
- [ ] ✅ Alertas de errores configuradas
- [ ] ✅ Dashboard de métricas
- [ ] ✅ Monitoreo de performance

### Alertas
- [ ] ✅ Alertas por email configuradas
- [ ] ✅ Alertas por Slack (si aplica)
- [ ] ✅ Alertas de seguridad críticas
- [ ] ✅ 24/7 monitoring activo

---

## SECCIÓN 10: ADMIN PANEL

### Seguridad Admin
- [ ] ✅ 2FA obligatorio
- [ ] ✅ Audit logs implementados
- [ ] ✅ Rate limiting en login admin
- [ ] ✅ IP whitelisting (opcional pero recomendado)
- [ ] ✅ Session timeout configurado
- [ ] ✅ Password policy fuerte

### Permisos Admin
- [ ] ✅ Roles definidos
- [ ] ✅ Permisos granulares
- [ ] ✅ Principio de mínimo privilegio
- [ ] ✅ Auditoría de acciones admin

---

## SECCIÓN 11: COMPLIANCE

### Documentación Legal
- [ ] ✅ Términos de servicio creados
- [ ] ✅ Política de privacidad creada
- [ ] ✅ Consentimiento de usuarios implementado
- [ ] ✅ Guardado de consentimiento

### GDPR (si aplica)
- [ ] ✅ Derecho a olvidar implementado
- [ ] ✅ Data portability implementado
- [ ] ✅ Política de retención documentada
- [ ] ✅ Data Protection Officer asignado

---

## SECCIÓN 12: TESTING

### Pruebas de Seguridad
- [ ] ✅ Pruebas de rate limiting
- [ ] ✅ Pruebas de validación de inputs
- [ ] ✅ Pruebas de RLS policies
- [ ] ✅ Pruebas de autenticación
- [ ] ✅ Pruebas de autorización
- [ ] ✅ Pruebas de CSRF protection
- [ ] ✅ Pruebas de XSS protection

### Análisis de Código
- [ ] ✅ `npm audit` ejecutado (0 vulnerabilidades críticas)
- [ ] ✅ ESLint sin errores críticos
- [ ] ✅ Análisis estático completado
- [ ] ✅ Dependencias actualizadas

---

## SECCIÓN 13: INFRAESTRUCTURA

### Deployment
- [ ] ✅ Staging environment configurado
- [ ] ✅ Production environment separado
- [ ] ✅ Secrets diferentes por ambiente
- [ ] ✅ Proceso de deployment documentado
- [ ] ✅ Rollback plan documentado

### Disaster Recovery
- [ ] ✅ Plan de disaster recovery documentado
- [ ] ✅ RTO definido
- [ ] ✅ RPO definido
- [ ] ✅ Proceso de restauración testado

---

## SECCIÓN 14: ESPECÍFICO DE LA APP

### WhatsApp
- [ ] ✅ Validación de números de teléfono
- [ ] ✅ Rate limiting en webhooks
- [ ] ✅ Verificación de origen
- [ ] ✅ Códigos de verificación expiran

### Pagos USDT
- [ ] ✅ Validación de direcciones wallet
- [ ] ✅ Validación de montos
- [ ] ✅ Prevención de duplicados
- [ ] ✅ Auditoría de pagos

### Transacciones
- [ ] ✅ Validación de límites por plan
- [ ] ✅ Validación de montos
- [ ] ✅ Historial permanente
- [ ] ✅ Auditoría de cambios

---

## SECCIÓN 15: DOCUMENTACIÓN

### Documentación Técnica
- [ ] ✅ Documentación de seguridad creada
- [ ] ✅ Runbook de incidentes creado
- [ ] ✅ Documentación de API
- [ ] ✅ Documentación de deployment

### Documentación de Procesos
- [ ] ✅ Plan de respuesta a incidentes
- [ ] ✅ Contactos de emergencia
- [ ] ✅ Proceso de escalamiento
- [ ] ✅ Post-mortem template

---

## CRITERIOS DE GO/NO-GO

### ✅ GO (Lanzar)
- ✅ Todas las secciones críticas (1-6) completadas
- ✅ Al menos 80% de las secciones completadas
- ✅ 0 vulnerabilidades críticas
- ✅ Testing básico completado
- ✅ Monitoreo configurado

### ⚠️ GO CON RIESGO (Lanzar con precauciones)
- ⚠️ Secciones críticas completadas
- ⚠️ Algunas secciones de medio/bajo riesgo pendientes
- ⚠️ Plan de mitigación para riesgos pendientes
- ⚠️ Timeline para completar pendientes

### ❌ NO-GO (No lanzar)
- ❌ Secciones críticas incompletas
- ❌ Vulnerabilidades críticas sin parchar
- ❌ Sin rate limiting
- ❌ RLS policies permisivas
- ❌ Sin validación de inputs
- ❌ Sin monitoreo

---

## ACCIONES POST-CHECKLIST

### Si es GO:
1. ✅ Documentar fecha de lanzamiento
2. ✅ Configurar alertas adicionales
3. ✅ Preparar comunicación
4. ✅ Monitorear activamente primera semana

### Si es NO-GO:
1. ❌ Listar items bloqueantes
2. ❌ Priorizar por impacto
3. ❌ Asignar responsables
4. ❌ Estimar timeline
5. ❌ Re-evaluar después de fixes

---

## MÉTRICAS DE VALIDACIÓN

### Testing Automatizado
```bash
# Ejecutar antes de lanzar
npm run test:security
npm audit
npm run lint
npm run build
```

### Testing Manual
- [ ] Intentar acceso no autorizado → Debe fallar
- [ ] Intentar ver datos de otro usuario → Debe fallar
- [ ] Intentar múltiples logins → Debe rate limit
- [ ] Intentar inyectar SQL → Debe fallar
- [ ] Intentar XSS → Debe ser escapado

---

## CONTACTO PARA VALIDACIÓN

- **Security Lead**: [Tu nombre/email]
- **DevOps**: [Contacto]
- **Management**: [Contacto]

---

## ÚLTIMA REVISIÓN

- **Fecha**: _______________
- **Revisado por**: _______________
- **Decisión**: [ ] GO [ ] NO-GO [ ] GO CON RIESGO
- **Comentarios**: _______________

---

## PRÓXIMOS PASOS

1. ✅ Completar checklist
2. ✅ Revisar con equipo
3. ✅ Decidir GO/NO-GO
4. ✅ Si GO: Proceder con lanzamiento
5. ✅ Si NO-GO: Completar items pendientes

