# 📚 ÍNDICE DE DOCUMENTOS MAESTROS

**Última actualización**: 2025-01-17 17:45:00 UTC  
**Versión**: 1.0

> ⚠️ **IMPORTANTE**: Este es el índice oficial de todos los documentos maestros. Consulta este documento para saber dónde buscar información específica.

---

## 🎯 DOCUMENTOS MAESTROS PRINCIPALES

### 1. 🔒 SEGURIDAD
**Archivo**: `SEGURIDAD_ESTADO_ACTUAL.md`  
**Ubicación**: Raíz del proyecto  
**Contenido**:
- Estado de seguridad por componente (App, Admin, Core API)
- Medidas implementadas (Rate Limiting, CSRF, 2FA, etc.)
- Checklist pre-lanzamiento
- Prioridades y próximos pasos

**Cuándo consultar**: 
- Antes de hacer cambios de seguridad
- Para verificar estado de implementación
- Para checklist pre-lanzamiento

---

### 2. 🔧 PROBLEMAS Y SOLUCIONES
**Archivo**: `PROBLEMAS_SOLUCIONES_ESTADO_ACTUAL.md`  
**Ubicación**: Raíz del proyecto  
**Contenido**:
- Problemas críticos, importantes y mejoras
- Estado de cada problema (Pendiente/Resuelto)
- Soluciones implementadas
- Historial de cambios

**Cuándo consultar**:
- Cuando encuentres un problema nuevo
- Para ver si un problema ya fue resuelto
- Para documentar una solución

---

### 3. 🔧 GUÍAS Y CONFIGURACIÓN
**Archivo**: `GUÍAS_CONFIGURACION_ESTADO_ACTUAL.md`  
**Ubicación**: Raíz del proyecto  
**Contenido**:
- Sentry (monitoreo y errores)
- Android/APK (compilación)
- Debugging (depuración)
- Iconos y Logo (assets)
- Variables de entorno (configuración)

**Cuándo consultar**:
- Para configurar Sentry
- Para compilar APK
- Para debugging
- Para cambiar iconos
- Para configurar variables de entorno

---

### 4. 🚀 DEPLOYMENT
**Archivo**: `DEPLOYMENT_ESTADO_ACTUAL.md`  
**Ubicación**: Raíz del proyecto  
**Contenido**:
- Vercel (deployment principal)
- Railway (alternativa)
- Verificaciones post-deployment

**Cuándo consultar**:
- Para hacer deploy a Vercel
- Para configurar Railway
- Para verificar que el deployment funcionó

---

### 5. ✅ CHECKLISTS
**Archivo**: `CHECKLISTS_ESTADO_ACTUAL.md`  
**Ubicación**: Raíz del proyecto  
**Contenido**:
- Checklist pre-lanzamiento
- Checklist post-incidente
- Referencias a seguridad

**Cuándo consultar**:
- Antes de lanzar la app
- Después de un incidente
- Para verificación completa

---

## 📁 DOCUMENTOS MAESTROS EN `docs/`

### 6. 📧 NOTIFICACIONES PUSH
**Archivo**: `docs/NOTIFICACIONES_ESTADO_ACTUAL.md`  
**Ubicación**: `docs/`  
**Contenido**:
- Configuración de Firebase/FCM
- Fases de implementación (1-4)
- Configuración paso a paso
- Solución de problemas

**Cuándo consultar**:
- Para configurar notificaciones push
- Para entender el sistema de notificaciones
- Para resolver problemas de notificaciones

---

### 7. 👥 REFERIDOS Y TRIGGERS
**Archivo**: `docs/REFERIDOS_TRIGGERS_ESTADO_ACTUAL.md`  
**Ubicación**: `docs/`  
**Contenido**:
- Estructura de tablas
- Funciones y triggers de Supabase
- Funcionalidades implementadas
- Verificación y testing

**Cuándo consultar**:
- Para entender el sistema de referidos
- Para modificar triggers
- Para verificar funcionamiento

---

### 8. 🛠️ FUNCIONALIDADES ESPECÍFICAS
**Archivo**: `docs/FUNCIONALIDADES_ESPECIFICAS_ESTADO_ACTUAL.md`  
**Ubicación**: `docs/`  
**Contenido**:
- WhatsApp/QR Recovery
- Groq/Whisper Integration
- UI/UX (Swipe, Touch Events)
- Sistema de Monedas
- Verificaciones y Análisis

**Cuándo consultar**:
- Para recuperar conexión de WhatsApp
- Para entender procesamiento de audio
- Para modificar UI/UX
- Para entender sistema de monedas

---

## 📊 MAPA DE NAVEGACIÓN

### Por Tarea

#### "Necesito configurar..."
- **Sentry** → `GUÍAS_CONFIGURACION_ESTADO_ACTUAL.md` - Sección Sentry
- **Firebase/Notificaciones** → `docs/NOTIFICACIONES_ESTADO_ACTUAL.md`
- **Variables de entorno** → `GUÍAS_CONFIGURACION_ESTADO_ACTUAL.md` - Sección Variables
- **Android/APK** → `GUÍAS_CONFIGURACION_ESTADO_ACTUAL.md` - Sección Android

#### "Necesito hacer deploy..."
- **A Vercel** → `DEPLOYMENT_ESTADO_ACTUAL.md` - Sección Vercel
- **A Railway** → `DEPLOYMENT_ESTADO_ACTUAL.md` - Sección Railway
- **Verificar deployment** → `DEPLOYMENT_ESTADO_ACTUAL.md` - Sección Verificaciones

#### "Encontré un problema..."
- **Documentar problema** → `PROBLEMAS_SOLUCIONES_ESTADO_ACTUAL.md`
- **Ver si ya existe** → `PROBLEMAS_SOLUCIONES_ESTADO_ACTUAL.md`
- **Buscar solución** → `PROBLEMAS_SOLUCIONES_ESTADO_ACTUAL.md`

#### "Necesito verificar seguridad..."
- **Estado general** → `SEGURIDAD_ESTADO_ACTUAL.md`
- **Checklist** → `CHECKLISTS_ESTADO_ACTUAL.md` - Sección Seguridad
- **Implementar medida** → `SEGURIDAD_ESTADO_ACTUAL.md` - Sección correspondiente

#### "Necesito entender..."
- **Sistema de referidos** → `docs/REFERIDOS_TRIGGERS_ESTADO_ACTUAL.md`
- **Sistema de notificaciones** → `docs/NOTIFICACIONES_ESTADO_ACTUAL.md`
- **Procesamiento de audio** → `docs/FUNCIONALIDADES_ESPECIFICAS_ESTADO_ACTUAL.md` - Sección Groq/Whisper
- **Sistema de monedas** → `docs/FUNCIONALIDADES_ESPECIFICAS_ESTADO_ACTUAL.md` - Sección Monedas

---

## 🔄 ACTUALIZACIÓN DE DOCUMENTOS

### Reglas Comunes a Todos los Documentos

1. **SIEMPRE actualizar fecha y hora** (formato: `YYYY-MM-DD HH:MM:SS UTC`)
2. **SIEMPRE actualizar historial de cambios**
3. **SIEMPRE ejecutar tests** después de cambios
4. **SIEMPRE verificar** que la información es correcta

### Proceso de Actualización

1. Abrir el documento maestro correspondiente
2. Hacer el cambio necesario
3. Actualizar fecha/hora en línea 3
4. Agregar entrada en historial de cambios
5. Verificar que el cambio funciona
6. Documentar resultados en historial

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
📁 Raíz del proyecto
├── 📄 SEGURIDAD_ESTADO_ACTUAL.md
├── 📄 PROBLEMAS_SOLUCIONES_ESTADO_ACTUAL.md
├── 📄 GUÍAS_CONFIGURACION_ESTADO_ACTUAL.md
├── 📄 DEPLOYMENT_ESTADO_ACTUAL.md
├── 📄 CHECKLISTS_ESTADO_ACTUAL.md
├── 📄 DOCUMENTOS_MAESTROS_INDICE.md (este archivo)
└── 📁 docs/
    ├── 📄 NOTIFICACIONES_ESTADO_ACTUAL.md
    ├── 📄 REFERIDOS_TRIGGERS_ESTADO_ACTUAL.md
    ├── 📄 FUNCIONALIDADES_ESPECIFICAS_ESTADO_ACTUAL.md
    └── 📁 archivo/
        └── 📦 150+ documentos obsoletos archivados
```

---

## 🎯 QUICK REFERENCE

### Documentos por Prioridad de Consulta

1. **Más consultados**:
   - `PROBLEMAS_SOLUCIONES_ESTADO_ACTUAL.md` - Cuando hay problemas
   - `GUÍAS_CONFIGURACION_ESTADO_ACTUAL.md` - Para configurar cosas
   - `SEGURIDAD_ESTADO_ACTUAL.md` - Para verificar seguridad

2. **Consultados regularmente**:
   - `DEPLOYMENT_ESTADO_ACTUAL.md` - Para deployments
   - `CHECKLISTS_ESTADO_ACTUAL.md` - Para verificaciones

3. **Consultados ocasionalmente**:
   - `docs/NOTIFICACIONES_ESTADO_ACTUAL.md` - Para notificaciones
   - `docs/REFERIDOS_TRIGGERS_ESTADO_ACTUAL.md` - Para referidos
   - `docs/FUNCIONALIDADES_ESPECIFICAS_ESTADO_ACTUAL.md` - Para funcionalidades específicas

---

## 📝 NOTAS IMPORTANTES

1. **Estos son los únicos documentos oficiales** - Los demás están archivados
2. **Siempre consultar este índice** para saber dónde buscar
3. **Actualizar este índice** si se crean nuevos documentos maestros
4. **No crear nuevos documentos** sin consolidarlos primero

---

## 🔄 HISTORIAL DE CAMBIOS

### 2025-01-17 17:45:00 UTC - Versión 1.0
**Autor**: Sistema de consolidación  
**Cambios**:
- ✅ Creación del índice de documentos maestros
- ✅ Listado de los 8 documentos maestros
- ✅ Mapa de navegación por tarea
- ✅ Quick reference
- ✅ Estructura de archivos documentada

**Componentes afectados**: Todos (documentación)

---

**Última actualización**: 2025-01-17 17:45:00 UTC  
**Próxima revisión programada**: 2025-02-17

