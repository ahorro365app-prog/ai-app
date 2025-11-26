# 🚀 DEPLOYMENT - DOCUMENTO MAESTRO

**Última actualización**: 2025-01-17 16:15:00 UTC  
**Versión**: 1.0  
**Este es el documento oficial y único de referencia para deployment**

> ⚠️ **IMPORTANTE**: Este es el único documento de deployment que debes consultar. Los demás documentos están obsoletos o son históricos.

---

## 📋 REGLAS DE USO Y ACTUALIZACIÓN

### 🔴 REGLAS OBLIGATORIAS

1. **SIEMPRE actualizar fecha y hora** al documentar cambios de deployment
2. **SIEMPRE actualizar el historial de cambios** al modificar procesos
3. **SIEMPRE verificar** que el deployment funciona después de cambios
4. **NO modificar este documento** sin seguir estas reglas

---

## 📊 ÍNDICE

### 1. 🟢 Vercel (Producción Principal)
### 2. 🚂 Railway (Alternativa)
### 3. ✅ Verificaciones Post-Deployment

---

## 1. 🟢 VERCEL - DEPLOYMENT PRINCIPAL

### 1.1 Deployment Automático

#### Configuración
- **Trigger**: Push a `main` branch
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (o `out` si usa `output: 'export'`)
- **Install Command**: `npm install`

#### Proceso Automático
1. Push a `main` → Vercel detecta cambios
2. Inicia build automáticamente
3. Ejecuta `npm install`
4. Ejecuta `npm run build`
5. Despliega archivos generados
6. URL disponible: `https://tu-proyecto.vercel.app`

### 1.2 Deployment Manual

#### Opción A: Redeploy del Último
1. Vercel Dashboard → Tu Proyecto → Deployments
2. Clic en los 3 puntos (`...`) del último deployment
3. Seleccionar: `Redeploy`
4. Confirmar

#### Opción B: Deploy desde Git
1. Vercel Dashboard → Tu Proyecto
2. Clic en botón `Deploy` (esquina superior derecha)
3. Seleccionar branch: `main` (o el que quieras)
4. Clic en `Deploy`

### 1.3 Configurar Variables de Entorno

#### Paso 1: Ir a Settings
1. Vercel Dashboard → Tu Proyecto → Settings → Environment Variables

#### Paso 2: Agregar Variables
1. Clic en "Add New"
2. Ingresa nombre y valor
3. Selecciona ambientes: Production, Preview, Development
4. Guardar

#### Paso 3: Redeploy
- Las variables estarán disponibles en el próximo deploy
- Si necesitas aplicarlas ahora, hacer redeploy manual

### 1.4 Verificar Deployment

#### Paso 1: Verificar Estado
1. Vercel Dashboard → Deployments
2. Estado debe ser: `Ready` (verde)
3. Si está `Building`, esperar a que termine
4. Si está `Error`, revisar logs

#### Paso 2: Probar URL
1. Clic en el deployment
2. Abrir URL en navegador
3. Verificar que la app carga correctamente

#### Paso 3: Verificar APIs
1. Probar endpoints: `https://tu-proyecto.vercel.app/api/ping`
2. Debe responder correctamente

### 1.5 Solución de Problemas

#### Error: Build Failed
- **Causa común**: Variables de entorno faltantes
- **Solución**: Verificar que todas las variables están configuradas

#### Error: Deployment Stuck (En Cola)
- **Causa**: Vercel tiene muchos deployments en cola
- **Solución**: 
  1. Esperar (puede tardar 10-30 minutos)
  2. O cancelar y redeploy manualmente

#### Error: Module Not Found
- **Causa**: Dependencias no instaladas o import incorrecto
- **Solución**: 
  1. Verificar `package.json`
  2. Verificar imports en código
  3. Revisar logs de build

### 1.6 Archivos Relacionados
- `vercel.json` - Configuración de Vercel (si existe)
- `.vercelignore` - Archivos a ignorar en deploy

---

## 2. 🚂 RAILWAY - DEPLOYMENT ALTERNATIVO

### 2.1 Configuración Inicial

#### Paso 1: Crear Proyecto
1. Railway Dashboard → New Project
2. Seleccionar: "Deploy from GitHub repo"
3. Seleccionar repositorio
4. Seleccionar branch: `main`

#### Paso 2: Configurar Build
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Root Directory**: `.` (raíz del proyecto)

### 2.2 Configurar Variables de Entorno

#### Paso 1: Ir a Variables
1. Railway Dashboard → Tu Proyecto → Variables

#### Paso 2: Agregar Variables
1. Clic en "New Variable"
2. Ingresa nombre y valor
3. Guardar

### 2.3 Verificar Deployment

#### Paso 1: Ver Logs
1. Railway Dashboard → Tu Proyecto → Deployments
2. Clic en el deployment
3. Ver logs en tiempo real

#### Paso 2: Probar URL
1. Railway Dashboard → Settings → Domains
2. Copiar URL generada
3. Probar en navegador

### 2.4 Archivos Relacionados
- `railway.toml` - Configuración de Railway (si existe)

---

## 3. ✅ VERIFICACIONES POST-DEPLOYMENT

### 3.1 Checklist Básico

#### Funcionalidad
- [ ] La app carga correctamente
- [ ] No hay errores en consola del navegador
- [ ] Las páginas principales funcionan
- [ ] Login/Signup funcionan

#### APIs
- [ ] Endpoints responden correctamente
- [ ] Rate limiting funciona
- [ ] CSRF protection funciona
- [ ] Autenticación funciona

#### Performance
- [ ] Tiempo de carga razonable (< 3 segundos)
- [ ] No hay errores 500
- [ ] No hay errores 404 en recursos estáticos

### 3.2 Verificación de Variables de Entorno

#### Test Rápido
```bash
# Probar endpoint que use variables
curl https://tu-proyecto.vercel.app/api/ping

# Debe responder, no error 500
```

### 3.3 Verificación de Logs

#### Vercel
1. Dashboard → Tu Proyecto → Deployments
2. Clic en deployment → View Function Logs
3. Verificar que no hay errores críticos

#### Railway
1. Dashboard → Tu Proyecto → Deployments
2. Ver logs en tiempo real
3. Verificar que no hay errores críticos

### 3.4 Monitoreo Post-Deployment

#### Primera Hora
- [ ] Revisar logs cada 15 minutos
- [ ] Verificar que no hay errores nuevos
- [ ] Probar funcionalidades críticas

#### Primera Semana
- [ ] Revisar logs diariamente
- [ ] Verificar métricas de Sentry (si está configurado)
- [ ] Ajustar si es necesario

---

## 🔄 HISTORIAL DE CAMBIOS

### 2025-01-17 16:15:00 UTC - Versión 1.0
**Autor**: Sistema de consolidación  
**Cambios**:
- ✅ Consolidación completa de documentos de deployment
- ✅ Agregadas reglas de uso y actualización
- ✅ Organizadas por plataforma (Vercel, Railway)
- ✅ Checklist de verificaciones post-deployment
- ✅ Historial de cambios implementado

**Componentes afectados**: Todos (documentación)

---

## 📝 NOTAS IMPORTANTES

1. **Este es el único documento oficial** de deployment
2. **Los demás documentos** están obsoletos o son históricos
3. **Siempre verificar** deployment después de cambios
4. **Siempre actualizar fecha/hora** al documentar cambios
5. **Documentar problemas** en `PROBLEMAS_SOLUCIONES_ESTADO_ACTUAL.md`

---

**Última actualización**: 2025-01-17 16:15:00 UTC  
**Próxima revisión programada**: 2025-02-17

