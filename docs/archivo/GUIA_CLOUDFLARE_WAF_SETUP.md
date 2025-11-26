# 🛡️ GUÍA: CONFIGURACIÓN DE WAF CON CLOUDFLARE FREE

**Fecha**: 2025  
**Tiempo estimado**: 1 hora (setup) + 24-48h propagación DNS  
**Costo**: $0 (gratis indefinidamente)  
**Estado**: Guía de implementación

---

## 📋 RESUMEN

Esta guía te ayudará a configurar Cloudflare como proxy DNS y activar el WAF (Web Application Firewall) gratuito para proteger tu aplicación contra ataques DDoS, XSS, SQL injection y otros vectores de ataque comunes.

---

## ⚠️ REQUISITOS PREVIOS

1. **Dominio propio**: Necesitas un dominio (ej: `tudominio.com`)
   - ❌ NO funciona con `vercel.app` o subdominios gratuitos
   - ✅ Funciona con dominios propios (GoDaddy, Namecheap, etc.)

2. **Cuenta de Cloudflare**: Gratis en [cloudflare.com](https://www.cloudflare.com)

3. **Acceso a DNS**: Necesitas poder modificar los registros DNS de tu dominio

---

## 🚀 PASOS DE CONFIGURACIÓN

### Paso 1: Agregar Dominio a Cloudflare

1. **Inicia sesión en Cloudflare**
   - Ve a [dash.cloudflare.com](https://dash.cloudflare.com)
   - Inicia sesión o crea una cuenta gratuita

2. **Agregar sitio**
   - Haz clic en "Add a Site"
   - Ingresa tu dominio (ej: `tudominio.com`)
   - Selecciona el plan **Free**

3. **Verificar registros DNS**
   - Cloudflare escaneará tus registros DNS actuales
   - Revisa que todos los registros estén correctos:
     - `A` records para tu aplicación
     - `CNAME` records para subdominios
     - `MX` records para email (si aplica)

### Paso 2: Cambiar Nameservers

1. **Obtener nameservers de Cloudflare**
   - Cloudflare te dará 2 nameservers (ej: `ns1.cloudflare.com`, `ns2.cloudflare.com`)

2. **Actualizar en tu registrador de dominio**
   - Ve a tu registrador (GoDaddy, Namecheap, etc.)
   - Busca la sección de "Nameservers" o "DNS"
   - Reemplaza los nameservers actuales con los de Cloudflare
   - Guarda los cambios

3. **Esperar propagación DNS**
   - ⏱️ Tiempo: 24-48 horas (normalmente menos)
   - Puedes verificar el estado en Cloudflare Dashboard
   - Cloudflare te notificará cuando esté activo

### Paso 3: Configurar DNS en Cloudflare

1. **Configurar registros A/CNAME**
   - Si tu app está en Vercel:
     - Crea un registro `CNAME`:
       - **Name**: `@` o `www` (según necesites)
       - **Target**: `cname.vercel-dns.com` (o el dominio que Vercel te proporcione)
       - **Proxy status**: 🟠 **Proxied** (importante para WAF)

2. **Verificar Proxy Status**
   - Asegúrate de que el ícono de nube esté **naranja** (🟠 Proxied)
   - Si está gris (⚪ DNS only), el WAF no funcionará
   - Haz clic en el ícono para cambiar a "Proxied"

### Paso 4: Activar WAF Básico (Free)

1. **Ir a Security → WAF**
   - En el dashboard de Cloudflare, ve a "Security" → "WAF"

2. **Activar reglas básicas**
   - En el plan Free, tienes acceso a:
     - **Managed Rules**: Reglas predefinidas de Cloudflare
     - **Rate Limiting**: Limitación básica de requests

3. **Configurar Managed Rules**
   - Ve a "Managed Rules"
   - Activa las siguientes reglas (gratuitas):
     - ✅ **Cloudflare Managed Ruleset**: Protección general
     - ✅ **Cloudflare OWASP Core Ruleset**: Protección OWASP
     - ✅ **Cloudflare Exposed Credentials Check**: Detección de credenciales expuestas

### Paso 5: Configurar Rate Limiting (Opcional)

1. **Ir a Security → Rate Limiting**
   - En el plan Free, tienes 10 reglas de rate limiting

2. **Crear regla básica**
   - **Rule name**: "Login Protection"
   - **Match**: `(http.request.uri.path eq "/api/auth/simple-login")`
   - **Rate**: `5 requests per 15 minutes`
   - **Action**: Block

3. **Crear regla para API**
   - **Rule name**: "API Protection"
   - **Match**: `(http.request.uri.path contains "/api/")`
   - **Rate**: `100 requests per 15 minutes`
   - **Action**: Challenge (CAPTCHA)

### Paso 6: Configurar Security Headers (Recomendado)

1. **Ir a Rules → Transform Rules → Modify Response Header**
   - Crea reglas para agregar security headers:
   - Ya los tienes en tu aplicación, pero Cloudflare puede reforzarlos

2. **O usar Page Rules** (si está disponible en tu plan)
   - Configurar headers de seguridad adicionales

### Paso 7: Activar SSL/TLS

1. **Ir a SSL/TLS**
   - Configuración: **Full (strict)**
   - Esto asegura conexión encriptada end-to-end

2. **Activar Always Use HTTPS**
   - En SSL/TLS → Edge Certificates
   - Activa "Always Use HTTPS"

---

## 🔒 REGLAS DE SEGURIDAD RECOMENDADAS

### 1. Protección DDoS
- ✅ **Automática** en Cloudflare Free
- Protege contra ataques DDoS de capa 3, 4 y 7

### 2. Protección XSS
- ✅ **Incluida** en Cloudflare Managed Ruleset
- Detecta y bloquea intentos de XSS

### 3. Protección SQL Injection
- ✅ **Incluida** en Cloudflare Managed Ruleset
- Detecta patrones de SQL injection

### 4. Rate Limiting
- ✅ **10 reglas gratuitas**
- Configurar para:
  - Login endpoints
  - API endpoints críticos
  - Webhooks

### 5. Bot Protection
- ✅ **Básico** en plan Free
- Detecta bots maliciosos
- Puedes configurar Challenge para bots sospechosos

---

## 📊 MONITOREO Y LOGS

### Ver Logs de WAF

1. **Ir a Security → Events**
   - Ver eventos bloqueados por WAF
   - Filtrar por tipo de ataque
   - Exportar logs si es necesario

2. **Analytics**
   - Ver estadísticas de tráfico
   - Identificar patrones de ataque
   - Monitorear falsos positivos

---

## ⚙️ CONFIGURACIÓN EN VERCEL

Si tu app está en Vercel:

1. **Agregar dominio en Vercel**
   - Ve a tu proyecto en Vercel
   - Settings → Domains
   - Agrega tu dominio personalizado

2. **Configurar DNS en Cloudflare**
   - Crea registro CNAME apuntando a Vercel
   - Asegúrate de que esté "Proxied" (naranja)

3. **Verificar SSL**
   - Vercel generará certificado SSL automáticamente
   - Cloudflare usará "Full (strict)" para validar

---

## 🎯 CHECKLIST DE VERIFICACIÓN

- [ ] Dominio agregado a Cloudflare
- [ ] Nameservers actualizados en registrador
- [ ] DNS propagado (verificado en Cloudflare)
- [ ] Registros DNS configurados correctamente
- [ ] Proxy status activado (🟠 Proxied)
- [ ] WAF activado con Managed Rules
- [ ] Rate Limiting configurado (opcional)
- [ ] SSL/TLS configurado como "Full (strict)"
- [ ] Always Use HTTPS activado
- [ ] App funcionando correctamente
- [ ] Logs de WAF verificados

---

## ⚠️ LIMITACIONES DEL PLAN FREE

1. **Rate Limiting**
   - Solo 10 reglas
   - Límite básico de requests

2. **WAF Rules**
   - Solo reglas predefinidas
   - No puedes crear reglas personalizadas avanzadas

3. **Analytics**
   - Datos limitados (últimas 24 horas)
   - Sin análisis avanzado

4. **Page Rules**
   - Solo 3 reglas gratuitas
   - Limitado para configuraciones complejas

---

## 📈 CUANDO ESCALAR A CLOUDFLARE PRO

Considera migrar a Cloudflare Pro ($20/mes) cuando:

1. **Ataques frecuentes**
   - Si ves múltiples intentos de ataque diarios
   - Necesitas más reglas de WAF personalizadas

2. **Más Rate Limiting**
   - Necesitas más de 10 reglas
   - Límites más estrictos

3. **Analytics avanzados**
   - Necesitas análisis detallados
   - Logs de más de 24 horas

4. **Page Rules**
   - Necesitas más de 3 reglas
   - Configuraciones complejas

---

## 🔧 TROUBLESHOOTING

### Problema: La app no carga después de configurar Cloudflare

**Solución**:
1. Verifica que los registros DNS estén correctos
2. Asegúrate de que el proxy esté activado (🟠)
3. Verifica SSL/TLS (debe ser "Full" o "Full (strict)")
4. Revisa los logs en Cloudflare Dashboard

### Problema: WAF bloquea requests legítimos

**Solución**:
1. Ve a Security → Events
2. Identifica el evento bloqueado
3. Crea una regla de "Bypass" para esa IP o patrón
4. O ajusta la sensibilidad de las reglas

### Problema: Rate Limiting muy estricto

**Solución**:
1. Ve a Security → Rate Limiting
2. Ajusta los límites de tus reglas
3. O desactiva reglas que causen problemas

---

## 📚 RECURSOS ADICIONALES

- [Cloudflare WAF Documentation](https://developers.cloudflare.com/waf/)
- [Cloudflare Free Plan Features](https://www.cloudflare.com/plans/free/)
- [Cloudflare Rate Limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/)
- [Cloudflare SSL/TLS](https://developers.cloudflare.com/ssl/)

---

## ✅ VERIFICACIÓN FINAL

Después de configurar, verifica:

1. **App funcionando**
   - Accede a tu dominio
   - Verifica que la app carga correctamente

2. **WAF activo**
   - Intenta un request malicioso (ej: `?id=1' OR '1'='1`)
   - Debería ser bloqueado por WAF

3. **SSL funcionando**
   - Verifica que HTTPS esté activo
   - Certificado válido

4. **Rate Limiting**
   - Prueba hacer múltiples requests rápidos
   - Debería activarse el rate limit

---

**Estado**: ✅ Guía completa creada - Lista para implementar

