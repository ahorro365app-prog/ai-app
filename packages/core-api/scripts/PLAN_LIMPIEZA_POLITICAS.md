# 🧹 Plan de Limpieza de Políticas Permisivas - Por Fases

**Fecha**: 2025-01-17  
**Estado**: ⏳ Pendiente de ejecución  
**Riesgo**: 🟢 **BAJO** (RLS deshabilitado, políticas no afectan seguridad)

---

## ⚠️ IMPORTANTE: Análisis de Riesgo

### ¿Por qué es seguro?
1. **RLS está DESHABILITADO** en todas las tablas afectadas
2. Cuando RLS está deshabilitado, **las políticas se ignoran completamente**
3. La seguridad se maneja en el backend con `service_role` key
4. **No hay impacto funcional** - solo limpieza de código muerto

### ¿Qué puede pasar?
- **Nada funcional** - Las políticas no se usan
- **Posible error SQL** si el nombre de la política no existe (se maneja con `IF EXISTS`)
- **Mejora de consistencia** - Base de datos más limpia

### Conclusión
✅ **Es seguro proceder** - Riesgo mínimo, beneficio de consistencia

---

## 📋 Plan por Fases

### FASE 1: Tablas Principales (Usuarios y Transacciones)
**Objetivo**: Limpiar políticas de las tablas más críticas

**Tablas afectadas**:
- `usuarios`
- `transacciones`

**Políticas a eliminar**:
- `Permitir todas las operaciones para usuarios`
- `Enable all operations for users`
- `Permitir todas las operaciones para transacciones`
- `Enable all operations for transactions`

**Tiempo estimado**: 2 minutos  
**Riesgo**: 🟢 Muy bajo

---

### FASE 2: Tabla de Pagos
**Objetivo**: Limpiar políticas de pagos

**Tablas afectadas**:
- `pagos`

**Políticas a eliminar**:
- `Users can view their own payments`
- `Users can create their own payments`
- `Enable all operations for payments`

**Tiempo estimado**: 1 minuto  
**Riesgo**: 🟢 Muy bajo

---

### FASE 3: Tablas Secundarias (Deudas, Metas, Logs)
**Objetivo**: Limpiar políticas de tablas secundarias

**Tablas afectadas**:
- `deudas`
- `metas`
- `logs_whatsapp`

**Políticas a eliminar**:
- `Permitir todas las operaciones para deudas`
- `Enable all operations for debts`
- `Permitir todas las operaciones para metas`
- `Enable all operations for goals`
- `Permitir todas las operaciones para logs_whatsapp`
- `Enable all operations for whatsapp_logs`

**Tiempo estimado**: 2 minutos  
**Riesgo**: 🟢 Muy bajo

---

## 🧪 Plan de Testing

### Después de cada fase:

1. **Verificar que las políticas fueron eliminadas**:
   ```sql
   -- Ejecutar query de verificación (incluido en script)
   SELECT tablename, policyname, cmd, qual
   FROM pg_policies
   WHERE schemaname = 'public'
       AND tablename IN ('usuarios', 'transacciones', 'pagos', 'deudas', 'metas', 'logs_whatsapp')
       AND (qual = 'true' OR qual LIKE '%true%');
   ```
   **Resultado esperado**: 0 filas (o menos filas que antes)

2. **Verificar que RLS sigue deshabilitado**:
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
       AND tablename IN ('usuarios', 'transacciones', 'pagos', 'deudas', 'metas', 'logs_whatsapp');
   ```
   **Resultado esperado**: `rowsecurity = false` en todas

3. **Test funcional básico** (opcional pero recomendado):
   - Verificar que la app sigue funcionando normalmente
   - No debería haber cambios funcionales

---

## 📝 Scripts por Fase

### Fase 1: `cleanup-phase-1-principales.sql`
### Fase 2: `cleanup-phase-2-pagos.sql`
### Fase 3: `cleanup-phase-3-secundarias.sql`

Cada script incluye:
- ✅ Comandos DROP POLICY con `IF EXISTS` (seguro)
- ✅ Query de verificación post-ejecución
- ✅ Instrucciones claras

---

## ✅ Checklist de Ejecución

### Antes de empezar:
- [ ] Backup de base de datos (recomendado)
- [ ] Servidor de desarrollo disponible para testing
- [ ] Documentación lista para actualizar

### Fase 1:
- [ ] Ejecutar `cleanup-phase-1-principales.sql`
- [ ] Verificar resultados (query de verificación)
- [ ] Test funcional básico (opcional)
- [ ] Documentar resultados
- [ ] Esperar 5 minutos antes de siguiente fase

### Fase 2:
- [ ] Ejecutar `cleanup-phase-2-pagos.sql`
- [ ] Verificar resultados (query de verificación)
- [ ] Test funcional básico (opcional)
- [ ] Documentar resultados
- [ ] Esperar 5 minutos antes de siguiente fase

### Fase 3:
- [ ] Ejecutar `cleanup-phase-3-secundarias.sql`
- [ ] Verificar resultados (query de verificación)
- [ ] Test funcional básico (opcional)
- [ ] Documentar resultados
- [ ] Verificación final completa

---

## 📊 Documentación Requerida

Después de cada fase, documentar en `RLS_VERIFICATION_RESULTS.md`:
- ✅ Fecha y hora de ejecución
- ✅ Políticas eliminadas
- ✅ Resultados de verificación
- ✅ Tests realizados
- ✅ Estado final

---

## 🚨 Rollback (Si es necesario)

Si algo sale mal (muy improbable):
1. Las políticas no afectan funcionalidad (RLS deshabilitado)
2. No se requiere rollback inmediato
3. Si se necesita recrear políticas, usar:
   ```sql
   CREATE POLICY "nombre" ON tabla FOR ALL USING (true);
   ```

---

## ⏱️ Tiempo Total Estimado

- **Fase 1**: 2 minutos + 5 minutos de espera = 7 minutos
- **Fase 2**: 1 minuto + 5 minutos de espera = 6 minutos
- **Fase 3**: 2 minutos + verificación final = 5 minutos
- **Total**: ~20 minutos (con esperas y documentación)

---

**Última actualización**: 2025-01-17

