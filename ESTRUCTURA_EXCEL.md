# Guía de Estructura del Excel "ventas nuevito.xlsx"

## 📋 Estructura Requerida

El archivo Excel debe contener **2 hojas** con la siguiente estructura:

---

### 1. Hoja: **VentasPOD**

**Ubicación de headers:** Fila 4

| Columna | Nombre Exacto | Tipo | Descripción | Ejemplo |
|---------|---------------|------|-------------|---------|
| A | Fecha | Fecha | Fecha de la venta | 15/01/2024 |
| B | Cliente | Texto/Número | Código del cliente | 123456 |
| C | Nombre Cliente | Texto | Nombre completo del cliente | COMERCIAL LOS ANDES SRL |

**Ejemplo visual:**
```
Fila 1: [puede estar vacía]
Fila 2: [puede estar vacía]
Fila 3: [puede estar vacía]
Fila 4: | Fecha | Cliente | Nombre Cliente |
Fila 5: | 15/01/2024 | 123456 | COMERCIAL LOS ANDES SRL |
Fila 6: | 16/01/2024 | 789012 | DISTRIBUIDORA EL SOL |
...
```

**Notas importantes:**
- Puede tener más columnas (ej: No.Venta, Monto, etc.) pero el sistema solo usará estas 3
- Las columnas pueden estar en cualquier orden, pero deben tener esos nombres exactos
- Las fechas deben estar en formato fecha de Excel

---

### 2. Hoja: **clientes**

**Ubicación de headers:** Fila 5

| Columna | Nombre Exacto | Tipo | Descripción | Ejemplo |
|---------|---------------|------|-------------|---------|
| A | CODIGO | Texto/Número | Código único del cliente | 123456 |
| B | NOMBRE | Texto | Nombre del cliente | COMERCIAL LOS ANDES SRL |
| C | RUTA | Texto | Código de ruta | SC-RUTA 11 |
| D | ZONA | Texto | Zona de distribución | SC DTS 1 |
| E | ACTIVO | Booleano | Estado del cliente | TRUE / FALSE / 1 / 0 |

**Ejemplo visual:**
```
Fila 1: [puede estar vacía]
Fila 2: [puede estar vacía]
Fila 3: [puede estar vacía]
Fila 4: [puede estar vacía]
Fila 5: | CODIGO | NOMBRE | RUTA | ZONA | ACTIVO |
Fila 6: | 123456 | COMERCIAL LOS ANDES SRL | SC-RUTA 11 | SC DTS 1 | TRUE |
Fila 7: | 789012 | DISTRIBUIDORA EL SOL | SC-RUTA 143 | SC DTS 1 | TRUE |
...
```

**Notas importantes:**
- Puede tener más columnas, pero el sistema solo usará estas 5
- ACTIVO puede ser: TRUE, FALSE, 1, 0, "true", "false"
- Si ACTIVO está vacío, se asume TRUE

---

## 🚀 Manejo de Archivos Grandes

### Problema con Archivos Grandes

Si tu archivo Excel tiene:
- ✅ Menos de 10 MB → Sin problemas
- ⚠️ Entre 10-50 MB → Puede ser lento
- ❌ Más de 50 MB → Problema de memoria

### ✅ Solución Implementada

El sistema ahora **NO carga el Excel en memoria** al inicio. En su lugar:

1. **Al iniciar el servidor:**
   - Si MySQL está disponible → Skip carga a memoria
   - Consultas van directo a MySQL
   - ✅ Ahorro de RAM

2. **Al actualizar datos:**
   - El Excel se procesa en **streaming** (por chunks)
   - Los datos van directo a MySQL
   - El archivo temporal se elimina inmediatamente
   - ✅ No importa el tamaño del Excel

---

## 📊 Flujo de Procesamiento Optimizado

### Antes (Problema):
```
Excel (100 MB) → RAM Cache → MySQL
       ↓
  Crash si es muy grande
```

### Ahora (Optimizado):
```
Excel (cualquier tamaño) → Streaming → MySQL
                                          ↓
                                    Consultas directas
```

---

## 🔧 Configuración Recomendada

### Si tu Excel es MUY grande (> 50 MB):

**Opción 1: Dividir en lotes mensuales**
- `ventas_enero_2024.xlsx`
- `ventas_febrero_2024.xlsx`
- Subir uno por uno desde la interfaz

**Opción 2: Usar streaming directo (ya implementado)**
- El sistema procesa en batches de 1000 registros
- No hay límite de tamaño
- Solo necesitas suficiente espacio en disco para MySQL

---

## 📝 Checklist de Validación

Antes de subir el Excel, verifica:

- [ ] Archivo se llama "ventas nuevito.xlsx"
- [ ] Hoja "VentasPOD" existe con headers en fila 4
- [ ] Hoja "clientes" existe con headers en fila 5
- [ ] Columnas tienen nombres EXACTOS (case-sensitive)
- [ ] No hay filas completamente vacías entre headers y datos
- [ ] Fechas en formato fecha (no texto)

---

## 🐛 Troubleshooting

### Error: "Archivo demasiado grande"

**Causa:** Límite de upload de Multer (50 MB)

**Solución 1:** Aumentar límite en `backend/routes/admin.js`:
```javascript
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB en lugar de 50MB
  }
});
```

**Solución 2:** Dividir el Excel en varios archivos más pequeños

### Error: "Hoja 'VentasPOD' no encontrada"

- Verifica que la hoja se llame exactamente "VentasPOD" (case-sensitive)
- No debe tener espacios adicionales

### Error: "Headers no encontrados"

- Verifica que los headers estén en la fila correcta (fila 4 para VentasPOD, fila 5 para clientes)
- Los nombres deben ser exactos

---

## 💡 Tips de Optimización

1. **Elimina columnas innecesarias** antes de subir
2. **Filtra datos antiguos** (ej: solo últimos 6 meses de ventas)
3. **Comprime el Excel** (Guardar Como → formato .xlsx con compresión)
4. **Usa archivos separados** por año si tienes varios años de data

---

## 📌 Ejemplo Completo

Descarga la plantilla de ejemplo:
- [plantilla_ventas_nuevito.xlsx](ejemplo/plantilla_ventas_nuevito.xlsx)

---

**Última actualización:** 2025-11-21
**Versión:** 2.0 (Optimizado para archivos grandes)
