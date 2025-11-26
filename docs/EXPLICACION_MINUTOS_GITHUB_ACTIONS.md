# ⏱️ Explicación: Minutos por Mes en GitHub Actions

> **Fecha:** 2025-01-22  
> **Propósito:** Explicar cómo funciona el sistema de "minutos" en GitHub Actions

---

## 📊 ¿Qué son los "Minutos"?

GitHub Actions **NO cobra por cantidad de ejecuciones**, sino por **tiempo de ejecución**.

### Ejemplo Simple
```
Workflow ejecuta: 1 vez
Tiempo de ejecución: 30 segundos
Minutos consumidos: 30 segundos = 0.5 minutos
```

---

## 🧮 Cálculo para Nuestro Cron

### Escenario
- **Frecuencia:** Cada 1 minuto
- **Ejecuciones/día:** 1,440 (60 min × 24 horas)
- **Ejecuciones/mes:** 43,200 (1,440 × 30 días)

### Tiempo por Ejecución
Cada ejecución del workflow:
1. Inicia el runner (Ubuntu)
2. Ejecuta `curl` para llamar al endpoint
3. Espera respuesta (~0.5 segundos)
4. Procesa respuesta
5. Termina

**Tiempo total estimado:** ~0.5-1 segundo por ejecución

### Cálculo de Minutos

#### Por Ejecución
```
Tiempo: 0.5 segundos
Minutos: 0.5 / 60 = 0.0083 minutos
```

#### Por Día
```
Ejecuciones: 1,440
Minutos: 1,440 × 0.0083 = ~12 minutos/día
```

#### Por Mes
```
Minutos/día: 12
Días: 30
Total: 12 × 30 = ~360 minutos/mes
```

---

## 📊 Límites de GitHub Actions

### Plan Gratuito (Hobby)
- **Límite:** 2,000 minutos/mes
- **Nuestro uso:** ~360 minutos/mes
- **Disponible:** 1,640 minutos/mes restantes
- **Margen:** ✅ **Suficiente** (360 < 2,000)

### Plan Pro
- **Límite:** 3,000 minutos/mes (gratis)
- **Adicional:** $0.008 por minuto extra
- **Nuestro uso:** ~360 minutos/mes
- **Costo:** $0 (dentro del límite)

---

## 🔍 Factores que Afectan el Tiempo

### 1. Tiempo de Inicio del Runner
- **Ubuntu runner:** ~10-20 segundos para iniciar
- **Pero:** GitHub solo cobra el tiempo REAL de ejecución del script

### 2. Tiempo de la Llamada HTTP
- **Endpoint rápido:** ~0.1-0.5 segundos
- **Endpoint lento:** ~1-5 segundos
- **Nuestro caso:** ~0.5 segundos (endpoint optimizado)

### 3. Procesamiento de la Respuesta
- **Parsing JSON:** ~0.01 segundos
- **Logs:** ~0.01 segundos
- **Total:** ~0.02 segundos

### Tiempo Total Estimado
```
Inicio runner: ~0 segundos (no se cobra)
Llamada HTTP: ~0.5 segundos
Procesamiento: ~0.02 segundos
Total: ~0.52 segundos = 0.0087 minutos
```

---

## 📈 Proyección Realista

### Escenario Conservador (1 segundo por ejecución)
```
Ejecuciones/día: 1,440
Tiempo/ejecución: 1 segundo = 0.0167 minutos
Minutos/día: 1,440 × 0.0167 = ~24 minutos/día
Minutos/mes: 24 × 30 = ~720 minutos/mes
```

### Escenario Optimista (0.5 segundos por ejecución)
```
Ejecuciones/día: 1,440
Tiempo/ejecución: 0.5 segundos = 0.0083 minutos
Minutos/día: 1,440 × 0.0083 = ~12 minutos/día
Minutos/mes: 12 × 30 = ~360 minutos/mes
```

### Escenario Pesimista (2 segundos por ejecución)
```
Ejecuciones/día: 1,440
Tiempo/ejecución: 2 segundos = 0.033 minutos
Minutos/día: 1,440 × 0.033 = ~48 minutos/día
Minutos/mes: 48 × 30 = ~1,440 minutos/mes
```

**Conclusión:** Incluso en el peor caso (1,440 min/mes), estamos dentro del límite (2,000 min/mes).

---

## 💰 Comparación de Costos

### GitHub Actions (Plan Gratuito)
- **Límite:** 2,000 minutos/mes
- **Nuestro uso:** 360-720 minutos/mes
- **Costo:** $0
- **Margen:** ✅ Suficiente

### Vercel Pro (Alternativa)
- **Cron cada minuto:** Incluido
- **Costo:** $20/mes
- **Ventaja:** Integrado, sin configuración adicional

---

## 🎯 Conclusión

### ¿Qué significa "minutos por mes"?
- **Tiempo total** que tus workflows ejecutan en un mes
- **NO es** cantidad de ejecuciones
- **SÍ es** suma de todos los tiempos de ejecución

### Nuestro Caso
- **Ejecuciones:** 43,200/mes (cada minuto)
- **Tiempo total:** ~360-720 minutos/mes
- **Límite:** 2,000 minutos/mes
- **Resultado:** ✅ **Dentro del límite, completamente gratis**

---

**Documento creado:** 2025-01-22  
**Última actualización:** 2025-01-22

