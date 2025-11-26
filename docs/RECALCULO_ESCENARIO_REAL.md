# 📊 Recálculo: Escenario Real (Pocos Usuarios)

> **Fecha:** 2025-01-22  
> **Corrección:** Los cálculos anteriores eran para 1 millón de usuarios, pero actualmente tienen pocos usuarios.

---

## 🔍 Escenario Actual

### Usuarios Reales
- **Usuarios activos:** ~10-100
- **Transacciones/día:** ~50-500
- **Timeouts/día:** ~20-200 (40% no confirman)
- **Timeouts/minuto:** ~0.01-0.14 transacciones

### Con Cron de 1 Minuto y 5 Transacciones/Ejec

#### Tiempo Real por Ejecución
- **Transacciones disponibles/ejec:** 5 (máximo)
- **Transacciones reales/ejec:** ~0.01-0.14 (mucho menos que 5)
- **Tiempo real/ejecución:** ~0.01-0.14 segundos (casi nada)
- **Minutos/ejecución:** ~0.0002-0.002 minutos

#### Cálculo Mensual
- **Ejecuciones/día:** 1,440 (cada minuto)
- **Minutos/día:** 1,440 × 0.002 = **~3 minutos/día**
- **Minutos/mes:** 3 × 30 = **~90 minutos/mes**

✅ **MUY DENTRO DEL LÍMITE** (90 << 2,000)

---

## 📈 Crecimiento Gradual

### Proyección de Tiempo/Mes

| Usuarios | Transacciones/Día | Timeouts/Día | Timeouts/Min | Min/Mes | Estado |
|----------|------------------|--------------|--------------|---------|--------|
| **10** | ~50 | ~20 | ~0.01 | ~90 | ✅ |
| **100** | ~500 | ~200 | ~0.14 | ~180 | ✅ |
| **1,000** | ~5,000 | ~2,000 | ~1.4 | ~1,800 | ✅ |
| **10,000** | ~50,000 | ~20,000 | ~14 | ~18,000 | ❌ |

### Plan de Migración

#### Fase 1: Ahora (10-100 usuarios)
- ✅ **Cron:** 1 minuto
- ✅ **Transacciones/ejec:** 5 (máximo)
- ✅ **Tiempo/mes:** ~90-180 minutos
- ✅ **Plataforma:** GitHub Actions (gratis)

#### Fase 2: 1,000 usuarios
- ✅ **Cron:** 1 minuto
- ✅ **Transacciones/ejec:** 5 (máximo)
- ✅ **Tiempo/mes:** ~1,800 minutos
- ⚠️ **Plataforma:** Migrar a Vercel Pro

#### Fase 3: 10,000+ usuarios
- ✅ **Cron:** 1 minuto
- ✅ **Transacciones/ejec:** Sin límite (Vercel Pro)
- ✅ **Tiempo/mes:** Ilimitado
- ✅ **Plataforma:** Vercel Pro ($20/mes)

---

## 💡 Conclusión

### Para Ahora
✅ **Puedes usar 1 minuto con 5 transacciones/ejec sin problemas**

**Razones:**
1. Tienes pocos usuarios ahora (~10-100)
2. Pocas transacciones expiradas por minuto (~0.01-0.14)
3. Tiempo real muy bajo (~90-180 min/mes)
4. Muy dentro del límite de GitHub (2,000 min/mes)

### Para el Futuro
✅ **Cuando llegues a 1,000 usuarios, pasas a Vercel Pro**

**Razones:**
1. A los 1,000 usuarios, el tiempo será ~1,800 min/mes (cerca del límite)
2. Vercel Pro tiene invocaciones ilimitadas
3. No tendrás que preocuparte por límites
4. Costo razonable ($20/mes)

---

## 🎯 Configuración Recomendada

### Ahora (GitHub Actions)
```yaml
# .github/workflows/confirm-expired-cron.yml
schedule:
  - cron: '* * * * *'  # Cada 1 minuto
```

```typescript
// packages/core-api/src/app/api/cron/confirm-expired/route.ts
.limit(5); // Procesar máximo 5 por ejecución
```

### Cuando Tengas Vercel Pro
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/confirm-expired",
      "schedule": "* * * * *"  // Cada 1 minuto
    }
  ]
}
```

```typescript
// packages/core-api/src/app/api/cron/confirm-expired/route.ts
// Sin límite, procesar todas las que haya
// .limit(5); // ← REMOVER este límite
```

---

**Documento creado:** 2025-01-22  
**Última actualización:** 2025-01-22

