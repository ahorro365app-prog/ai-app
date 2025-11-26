# 🚨 PLAN DE RESPUESTA A INCIDENTES

## DEFINICIÓN DE INCIDENTE

Un **incidente de seguridad** es cualquier evento que:
- Compromete la confidencialidad, integridad o disponibilidad de datos
- Interrumpe el servicio normal de la aplicación
- Expone vulnerabilidades o datos sensibles
- Puede resultar en pérdida financiera o daño reputacional

### Tipos de Incidentes

1. **CRÍTICO**: Acceso no autorizado, fuga de datos, pérdida de datos
2. **ALTO**: Ataque DDoS, servicio caído, vulnerabilidad explotada
3. **MEDIO**: Intentos de acceso fallidos masivos, actividad sospechosa
4. **BAJO**: Errores de configuración menores, alertas de seguridad no críticas

---

## DETECCIÓN

### Métodos de Detección

1. **Monitoreo Automático**
   - Sentry: Errores inusuales
   - Rate limiting: Intentos masivos
   - Logs de auditoría: Acciones sospechosas
   - Alertas de Supabase: Cambios en BD

2. **Detección Manual**
   - Usuarios reportan problemas
   - Revisión de logs
   - Análisis de métricas

3. **Indicadores de Compromiso**
   - Múltiples intentos de login fallidos
   - Accesos desde IPs desconocidas
   - Cambios en datos sin autorización
   - Tráfico inusual
   - Errores 500 masivos

### Alertas Configuradas

```typescript
// src/lib/securityAlerts.ts
export const ALERT_THRESHOLDS = {
  failedLogins: 10, // En 15 minutos
  suspiciousIPs: 5, // IPs diferentes en 1 hora
  errorRate: 100, // Errores por hora
  unusualActivity: true // Cualquier actividad anómala
};
```

---

## RESPUESTA INMEDIATA

### Paso 1: Contención (0-15 minutos)

#### Si es Acceso No Autorizado:
1. **Bloquear IPs sospechosas**
```typescript
// Agregar a bloqueo temporal
await supabase.from('blocked_ips').insert({
  ip_address: suspiciousIP,
  reason: 'Suspicious activity',
  blocked_until: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
});
```

2. **Revocar sesiones activas**
```typescript
// Revocar tokens JWT
await invalidateAllUserSessions(userId);
```

3. **Cambiar credenciales comprometidas**
```typescript
// Forzar reset de contraseña
await supabase
  .from('usuarios')
  .update({ 
    contrasena: null, // Requiere reset
    password_reset_required: true 
  })
  .eq('id', userId);
```

#### Si es DDoS:
1. **Activar rate limiting estricto**
2. **Contactar Cloudflare/Vercel** para mitigación
3. **Escalar a plan superior** si es necesario

#### Si es Fuga de Datos:
1. **Detener el servicio afectado** inmediatamente
2. **Identificar qué datos se expusieron**
3. **Documentar el alcance**

### Paso 2: Evaluación (15-30 minutos)

```typescript
// src/lib/incidentAssessment.ts
export interface IncidentAssessment {
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedUsers: number;
  affectedData: string[];
  timeline: {
    detected: Date;
    started: Date;
    contained: Date | null;
  };
  impact: {
    financial: number;
    reputational: 'high' | 'medium' | 'low';
    legal: boolean;
  };
  rootCause: string;
  status: 'contained' | 'investigating' | 'resolved';
}
```

### Paso 3: Comunicación (30-60 minutos)

#### Interna (Equipo)
```
Subject: [INCIDENT] Security Alert - Action Required

Severity: CRITICAL
Type: [Tipo de incidente]
Time: [Fecha/Hora]
Status: UNDER INVESTIGATION

Actions Required:
- [ ] Verificar logs
- [ ] Contactar proveedores
- [ ] Preparar comunicación externa

Next Update: [Tiempo]
```

#### Externa (Usuarios, si aplica)
```
Subject: Importante: Actualización de Seguridad

Estimado usuario,

Hemos detectado [tipo de incidente] en nuestro sistema.
Hemos tomado medidas inmediatas para proteger tu información.

Acciones que hemos tomado:
- [Medidas tomadas]

Acciones que debes tomar:
- [Instrucciones para usuarios]

Para más información: [contacto]

Gracias por tu paciencia.
```

---

## INVESTIGACIÓN

### Checklist de Investigación

- [ ] ¿Qué datos fueron afectados?
- [ ] ¿Cuántos usuarios afectados?
- [ ] ¿Cuándo comenzó el incidente?
- [ ] ¿Cómo se detectó?
- [ ] ¿Hay evidencia de explotación?
- [ ] ¿Qué sistemas fueron afectados?
- [ ] ¿Hay logs relevantes?
- [ ] ¿Necesitamos evidencia forense?

### Herramientas de Investigación

```typescript
// src/lib/incidentInvestigation.ts
export async function investigateIncident(incidentId: string) {
  // 1. Obtener logs relevantes
  const logs = await getLogsForTimeRange(
    incidentStartTime,
    incidentEndTime
  );

  // 2. Analizar acceso
  const accessLogs = await getAccessLogs(incidentId);

  // 3. Analizar cambios en BD
  const dbChanges = await getDatabaseChanges(incidentId);

  // 4. Identificar patrones
  const patterns = analyzePatterns(logs, accessLogs, dbChanges);

  return {
    logs,
    accessLogs,
    dbChanges,
    patterns,
    recommendations: generateRecommendations(patterns)
  };
}
```

---

## RECUPERACIÓN

### Paso 1: Eliminar Amenaza

- **Bloquear vectores de ataque**
- **Parchear vulnerabilidades**
- **Actualizar credenciales**
- **Limpiar código malicioso**

### Paso 2: Restaurar Servicios

```bash
# 1. Verificar backups
supabase backup list

# 2. Restaurar desde backup si es necesario
supabase backup restore [backup-id]

# 3. Verificar integridad
npm run test:security

# 4. Desplegar fix
git push origin main
```

### Paso 3: Validar Funcionalidad

- [ ] Todos los endpoints funcionando
- [ ] Base de datos íntegra
- [ ] Usuarios pueden acceder
- [ ] No hay datos corruptos
- [ ] Performance normal

---

## POST-MORTEM

### Template de Post-Mortem

```markdown
# Post-Mortem: [Título del Incidente]

## Resumen
- **Fecha**: [Fecha]
- **Duración**: [Tiempo]
- **Severidad**: [Critical/High/Medium/Low]
- **Usuarios afectados**: [Número]

## Timeline
- **00:00** - Incidente detectado
- **00:15** - Contención iniciada
- **00:30** - Comunicación enviada
- **01:00** - Investigación completa
- **02:00** - Resolución

## Causa Raíz
[Descripción detallada]

## Impacto
- **Usuarios**: [Número]
- **Datos**: [Qué datos]
- **Tiempo de inactividad**: [Tiempo]
- **Pérdida financiera**: [Si aplica]

## Acciones Correctivas
- [ ] Acción 1
- [ ] Acción 2
- [ ] Acción 3

## Prevención
- [ ] Medida 1
- [ ] Medida 2
- [ ] Medida 3

## Lecciones Aprendidas
[Notas]
```

---

## COMUNICACIÓN

### Stakeholders

1. **Equipo Técnico**: Inmediato
2. **Management**: Dentro de 1 hora
3. **Usuarios afectados**: Dentro de 24 horas (si aplica)
4. **Autoridades**: Si hay datos personales comprometidos

### Templates de Comunicación

#### Para Usuarios
```
Estimado [Nombre],

Hemos detectado actividad inusual en tu cuenta el [fecha] a las [hora].

Para proteger tu información, hemos tomado las siguientes medidas:
- [Medidas tomadas]

Recomendamos que:
1. Cambies tu contraseña
2. Revises tu actividad reciente
3. Actives 2FA si aún no lo has hecho

Si tienes preguntas: [contacto]

Gracias,
Equipo de Ahorro365
```

---

## ESCALAMIENTO

### Niveles de Escalamiento

1. **Nivel 1**: Equipo técnico (0-1 hora)
2. **Nivel 2**: Management + Técnico (1-4 horas)
3. **Nivel 3**: Legal + Compliance (4-24 horas)
4. **Nivel 4**: Autoridades (si es requerido por ley)

### Cuándo Escalar

- **Nivel 2**: Si no se resuelve en 1 hora
- **Nivel 3**: Si hay datos personales comprometidos
- **Nivel 4**: Si es requerido por regulaciones (GDPR, etc.)

---

## CONTACTOS DE EMERGENCIA

### Equipo Técnico
- **Lead Dev**: [Email] [Teléfono]
- **DevOps**: [Email] [Teléfono]
- **Security**: [Email] [Teléfono]

### Proveedores
- **Vercel Support**: support@vercel.com
- **Supabase Support**: support@supabase.io
- **Cloudflare**: [Contacto]

### Legal/Compliance
- **Legal**: [Contacto]
- **Data Protection Officer**: [Contacto]

---

## CHECKLIST DE RESPUESTA

### Fase 1: Detección (0-15 min)
- [ ] Incidente identificado
- [ ] Severidad evaluada
- [ ] Equipo notificado
- [ ] Logs preservados

### Fase 2: Contención (15-30 min)
- [ ] Amenaza contenida
- [ ] Servicios afectados identificados
- [ ] Acceso bloqueado si es necesario
- [ ] Backups verificados

### Fase 3: Investigación (30 min - 2 horas)
- [ ] Causa raíz identificada
- [ ] Alcance determinado
- [ ] Usuarios afectados identificados
- [ ] Evidencia recopilada

### Fase 4: Recuperación (2-4 horas)
- [ ] Vulnerabilidad parcheada
- [ ] Servicios restaurados
- [ ] Funcionalidad validada
- [ ] Monitoreo reforzado

### Fase 5: Post-Mortem (Día siguiente)
- [ ] Reunión de post-mortem
- [ ] Documento creado
- [ ] Acciones correctivas asignadas
- [ ] Prevención implementada

---

## HERRAMIENTAS

### Monitoreo
- Sentry (errores)
- Vercel Analytics (performance)
- Supabase Dashboard (BD)
- Custom logs (auditoría)

### Comunicación
- Email (alertas)
- Slack (equipo)
- SMS (crítico)

### Documentación
- Notion/Confluence (post-mortems)
- Git (cambios)
- Logs (evidencia)

---

## PRÓXIMOS PASOS

1. **Revisa este plan** con tu equipo
2. **Asigna responsables** para cada fase
3. **Configura alertas** automáticas
4. **Realiza drill** de respuesta
5. **Actualiza** según necesites


