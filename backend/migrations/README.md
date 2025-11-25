# Migración de Normalización de Planificación

## Descripción

Esta migración normaliza la estructura de la base de datos de planificación de rutas, separando los datos en múltiples tablas relacionales para soportar rutas que se ejecutan en múltiples días.

## Problema Resuelto

La estructura anterior (`planificacion_rutas`) tenía estos problemas:

1. **Duplicados por día**: Si una ruta se ejecutaba Lunes y Miércoles, había 2 registros con el mismo código de ruta
2. **Violación de constraints**: Al insertar masivamente, los duplicados causaban errores `ER_DUP_ENTRY`
3. **Redundancia de datos**: Zona y vendedor se repetían para cada día de la misma ruta

## Nueva Estructura

La migración crea las siguientes tablas:

### 1. `zonas`
- Almacena las zonas únicas (SC DTS 1, SC DTS 2, etc.)
- Campos: `id`, `codigo`, `nombre`

### 2. `vendedores`
- Almacena los vendedores únicos
- Campos: `id`, `nombre_completo`, `activo`

### 3. `dias`
- Almacena los días de la semana (1-LU, 2-MA, etc.)
- Campos: `id`, `codigo`, `nombre`, `orden`
- **Pre-poblada** con los 6 días laborales

### 4. `rutas`
- Almacena las rutas únicas
- Campos: `id`, `codigo`, `zona_id`, `vendedor_id`
- Relaciones: `zona_id` → `zonas.id`, `vendedor_id` → `vendedores.id`

### 5. `rutas_dias` (tabla de relación)
- Relación muchos-a-muchos entre rutas y días
- Campos: `id`, `ruta_id`, `dia_id`
- Permite que una ruta tenga múltiples días

### 6. Vista `planificacion_rutas` (compatibilidad)
- Vista SQL que simula la estructura antigua
- Permite que el código existente siga funcionando
- JOIN de todas las tablas para presentar datos desnormalizados

## Ventajas de la Nueva Estructura

1. ✅ **Sin duplicados**: Cada ruta existe una sola vez
2. ✅ **Múltiples días**: Una ruta puede tener 1, 2, 3... días
3. ✅ **Integridad referencial**: Claves foráneas garantizan consistencia
4. ✅ **Menos redundancia**: Zona y vendedor se almacenan una vez por ruta
5. ✅ **Mejor rendimiento**: Índices optimizados para búsquedas
6. ✅ **Escalabilidad**: Fácil agregar nuevos días o modificar rutas

## Ejemplo de Datos

### Antes (tabla `planificacion_rutas`):
```
| ruta               | zona      | dia   | vendedor        |
|--------------------|-----------|-------|-----------------|
| SC-MERC LA RAMADA  | SC DTS 1  | 1-LU  | JUAN PEREZ      |
| SC-MERC LA RAMADA  | SC DTS 1  | 3-MI  | JUAN PEREZ      |  ← DUPLICADO!
```

### Después (tablas normalizadas):

**Tabla `rutas`:**
```
| id | codigo             | zona_id | vendedor_id |
|----|--------------------|---------|-------------|
| 1  | SC-MERC LA RAMADA  | 1       | 5           |
```

**Tabla `rutas_dias`:**
```
| id | ruta_id | dia_id |
|----|---------|--------|
| 1  | 1       | 1      |  ← Lunes
| 2  | 1       | 3      |  ← Miércoles
```

**Vista `planificacion_rutas` (resultado):**
```
| ruta               | zona      | dia   | vendedor   |
|--------------------|-----------|-------|------------|
| SC-MERC LA RAMADA  | SC DTS 1  | 1-LU  | JUAN PEREZ |
| SC-MERC LA RAMADA  | SC DTS 1  | 3-MI  | JUAN PEREZ |
```

## Cómo Ejecutar la Migración

### Opción 1: Script automático (Recomendado)

```bash
cd backend
node scripts/runMigration.js
```

### Opción 2: Manual con MySQL

```bash
mysql -u root -p cruzimex_bajas < backend/migrations/normalize_planificacion.sql
```

## Pasos Posteriores a la Migración

1. **Reiniciar el servidor backend**
   ```bash
   cd backend
   npm start
   ```

2. **Limpiar cache del navegador** (Ctrl + F5)

3. **Ejecutar sincronización inicial**
   - Ir a la interfaz web de administrador
   - Acceder a "Sincronizar Google Sheets"
   - Click en botón rojo "Limpiar y Recargar"
   - O click en botón ámbar "Migración Inicial"

4. **Verificar datos**
   - Revisar que se cargaron todas las rutas
   - Verificar que no hay duplicados
   - Comprobar estadísticas

## Rollback (Volver Atrás)

Si algo sale mal, puedes restaurar la tabla antigua:

```sql
-- Eliminar nuevas tablas
DROP VIEW IF EXISTS planificacion_rutas;
DROP TABLE IF EXISTS rutas_dias;
DROP TABLE IF EXISTS rutas;
DROP TABLE IF EXISTS vendedores;
DROP TABLE IF EXISTS zonas;
DROP TABLE IF EXISTS dias;

-- Restaurar tabla antigua
RENAME TABLE planificacion_rutas_backup_old TO planificacion_rutas;
```

## Cambios en el Código

### Modelos nuevos creados:
- `backend/models/Zona.js`
- `backend/models/Vendedor.js`
- `backend/models/Dia.js`
- `backend/models/Ruta.js`

### Servicios actualizados:
- `backend/services/planificacionSyncService.js`
  - Ahora agrupa registros por ruta
  - Elimina duplicados automáticamente
  - Maneja relaciones rutas-días

### Rutas API actualizadas:
- `backend/routes/planificacion.js`
  - Usa nuevos modelos
  - Nuevos endpoints: `/zonas`, `/vendedores`, `/dias`

## Compatibilidad

La vista `planificacion_rutas` garantiza compatibilidad con:
- Código frontend existente
- Queries antiguos
- Reportes

Sin embargo, recomendamos actualizar el código para usar las nuevas APIs:
- `/api/planificacion/rutas` - Lista rutas con días agrupados
- `/api/planificacion/zonas` - Lista todas las zonas
- `/api/planificacion/vendedores` - Lista todos los vendedores

## Notas Importantes

⚠️ **Backup de seguridad**: La migración renombra la tabla antigua a `planificacion_rutas_backup_old` en lugar de eliminarla.

⚠️ **Datos existentes**: Si ya tenías datos en `planificacion_rutas`, se migrarán automáticamente.

⚠️ **Constraint violations**: Los duplicados ahora se manejan correctamente mediante la función `agruparPorRuta()`.

## Soporte

Si encuentras problemas durante la migración, revisa:
1. Logs del servidor backend
2. Logs de MySQL
3. Errores en la consola del navegador

Para más ayuda, contacta al equipo de desarrollo.
