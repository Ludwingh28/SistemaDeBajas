# 🚀 Guía del Sistema React - Panel Administrativo

## ✅ Lo que se implementó

Migré **TODO** el sistema administrativo a React con autenticación de supervisor:

---

## 🌐 Rutas del Sistema

### **Para Vendedores (Público):**
```
http://localhost:5173/
```
- ✅ Acceso sin código
- ✅ Formulario de solicitud de baja
- ✅ Subir fotos
- ✅ Seleccionar motivo

### **Para Supervisores (Protegido):**
```
http://localhost:5173/api/index
```
- 🔒 Requiere código de supervisor
- ✅ Dashboard con 3 módulos
- ✅ Navegación sin cambiar URLs

---

## 🔐 Flujo de Autenticación

### **Al entrar a `/api/index`:**

1. **Pantalla de autenticación**
   - Pide código de supervisor
   - Valida contra el backend
   - Si es correcto → Acceso al dashboard
   - Si es incorrecto → Error y vuelve a pedir

2. **Sesión guardada**
   - Se guarda en `sessionStorage`
   - No pide código nuevamente mientras esté abierto el navegador
   - Al cerrar pestaña/navegador → Se pierde la sesión

3. **Botón "Cerrar Sesión"**
   - En el header del dashboard
   - Limpia la sesión
   - Vuelve a pedir código

---

## 📊 Dashboard (`/api/index`)

Una vez autenticado, ves 3 tarjetas grandes:

### **1. 🏷️ Gestión de Motivos**

**Click aquí y podrás:**
- ✅ Ver todos los motivos actuales (con contador)
- ✅ Agregar nuevos motivos
- ✅ Campo de texto + botón "Agregar"
- ✅ Presionar Enter para agregar rápido
- ✅ Botón "Volver al Menú" arriba

**Ejemplo de uso:**
```
1. Click en "Gestión de Motivos"
2. Escribir: "Cliente sin actividad"
3. Presionar Enter o click "Agregar"
4. ¡Motivo agregado en MySQL!
5. Click "Volver al Menú" para ver otras opciones
```

---

### **2. 🗄️ Actualizar Ventas**

**Click aquí y podrás:**
- ✅ Ver estadísticas actuales (total, fechas, días)
- ✅ Arrastrar archivo Excel o hacer click
- ✅ Marcar checkbox si quieres REEMPLAZAR todo
- ✅ Progress bar durante carga
- ✅ Confirmación antes de reemplazar

**Ejemplo de uso:**
```
1. Click en "Actualizar Ventas"
2. Arrastra tu Excel actualizado (o click para seleccionar)
3. NO marcar checkbox (solo agregar datos nuevos)
4. Click "Procesar Archivo"
5. Espera el progress bar
6. ¡Listo! Verás cuántos registros se agregaron
7. Las estadísticas se actualizan automáticamente
```

**⚠️ Modo Reemplazar:**
```
1. Marcar checkbox "Reemplazar todos los datos"
2. Te pide confirmación (advertencia en amarillo)
3. Si confirmas, BORRA todo y sube solo los nuevos
4. Útil para "limpiar" y empezar de nuevo
```

---

### **3. 📥 Descargar Reportes**

**Click aquí y podrás:**

#### **Opción Rápida: Reporte de Hoy**
- ✅ Botón grande azul
- ✅ Un solo click
- ✅ Descarga Excel del día actual
- ✅ Nombre: `reporte_2025-11-21.xlsx`

#### **Opción Avanzada: Rango de Fechas**
- ✅ Selector de "Fecha Inicio" y "Fecha Fin"
- ✅ Por defecto: Hoy en ambas
- ✅ Puedes cambiar a cualquier rango
- ✅ Botón "Exportar a Excel"
- ✅ Descarga histórico completo

**Ejemplo de uso:**
```
CASO 1: Reporte de hoy
1. Click en "Descargar Reportes"
2. Click en botón azul "Descargar Reporte de Hoy"
3. Excel se descarga automáticamente
4. Abrir y ver solicitudes del día

CASO 2: Reporte del mes
1. Click en "Descargar Reportes"
2. Fecha Inicio: 2025-11-01
3. Fecha Fin: 2025-11-21
4. Click "Exportar a Excel"
5. Excel con TODO el mes se descarga
6. Nombre: reporte_historico_2025-11-01_a_2025-11-21.xlsx
```

---

## 🎯 Casos de Uso Reales

### **Caso 1: Inicio del Día**

```bash
1. Abrir http://localhost:5173/api/index
2. Ingresar código supervisor
3. Click "Actualizar Ventas"
4. Arrastrar Excel del día
5. NO marcar "Reemplazar"
6. Click "Procesar"
7. ¡Listo! Ventas actualizadas
```

### **Caso 2: Agregar Motivo Nuevo**

```bash
1. En /api/index (ya autenticado)
2. Click "Gestión de Motivos"
3. Escribir: "Dirección incorrecta"
4. Enter
5. Ya está disponible para todos
6. Los vendedores lo verán en su formulario
```

### **Caso 3: Descargar Reporte Semanal**

```bash
1. En /api/index
2. Click "Descargar Reportes"
3. Fecha Inicio: 15/11/2025
4. Fecha Fin: 21/11/2025
5. Click "Exportar"
6. Abrir Excel descargado
7. Ver todas las solicitudes de la semana
```

### **Caso 4: Resetear Ventas Completas**

```bash
1. Tienes un Excel maestro con TODO
2. Click "Actualizar Ventas"
3. Arrastrar Excel
4. MARCAR "Reemplazar todos los datos"
5. Leer advertencia
6. Confirmar
7. Sistema limpia todo y sube el Excel nuevo
```

---

## 🔒 Seguridad

### **¿Quién ve qué?**

| Ruta | Acceso | Requiere Código |
|------|--------|-----------------|
| `/` | Vendedores | ❌ No |
| `/api/index` | Supervisores | ✅ Sí |

### **¿Cómo saben la URL?**

- ✅ Solo tú compartes `/api/index`
- ✅ No hay links visibles en el sistema
- ✅ Vendedores solo ven su formulario
- ✅ Si alguien adivina la URL, necesita código

### **¿Cuánto dura la sesión?**

- ✅ Mientras el navegador esté abierto
- ❌ Si cierra pestaña → Pierde sesión
- ❌ Si cierra navegador → Pierde sesión
- ✅ Puede cerrar sesión manualmente (botón)

---

## 📱 Responsive Design

### **Desktop (Recomendado):**
- ✅ 3 tarjetas en horizontal
- ✅ Formularios amplios
- ✅ Fácil arrastrar archivos

### **Tablet:**
- ✅ 2 tarjetas por fila
- ✅ Todo funcional

### **Móvil:**
- ✅ 1 tarjeta por fila
- ✅ Botones táctiles grandes
- ✅ Upload por click (sin drag & drop)

---

## 🚀 Cómo Iniciar

### **1. Pull de los cambios:**

```bash
git pull origin claude/add-validation-mysql-01LR2guWMVQoctsAw3g2ak9g
```

### **2. Instalar dependencias nuevas (React Router):**

```bash
cd frontend
npm install
```

### **3. Iniciar frontend:**

```bash
npm run dev
```

Debería abrir en: `http://localhost:5173`

### **4. Iniciar backend (otra terminal):**

```bash
cd backend
npm run dev
```

Debería estar en: `http://localhost:3001`

### **5. Probar el sistema:**

#### **Como vendedor:**
```
http://localhost:5173/
→ Ver formulario de solicitud
→ Probar envío
```

#### **Como supervisor:**
```
http://localhost:5173/api/index
→ Pide código
→ Ingresar código supervisor (el que tienes en .env)
→ Acceder al dashboard
→ Probar los 3 módulos
```

---

## 🎨 Características de UI

### **Animaciones:**
- ✅ Hover en tarjetas (escalan)
- ✅ Progress bar animada
- ✅ Transiciones suaves
- ✅ Loading spinners

### **Colores por Módulo:**
- 🟣 **Motivos:** Morado
- 🟢 **Ventas:** Verde
- 🔵 **Reportes:** Azul

### **Feedback Visual:**
- ✅ SweetAlert2 para mensajes
- ✅ Estados de carga claros
- ✅ Confirmaciones para acciones peligrosas
- ✅ Estadísticas en tiempo real

---

## 📋 Checklist de Verificación

Después de hacer `npm install` y iniciar ambos servidores:

- [ ] Frontend corre en `http://localhost:5173`
- [ ] Backend corre en `http://localhost:3001`
- [ ] MySQL está corriendo
- [ ] Tablas creadas (`npm run init-db` si no)
- [ ] `/` muestra formulario de vendedor
- [ ] `/api/index` pide código
- [ ] Código supervisor funciona
- [ ] Dashboard se ve con 3 tarjetas
- [ ] Gestión de motivos funciona
- [ ] Upload de ventas funciona
- [ ] Descarga de reportes funciona

---

## 🐛 Troubleshooting

### **Error: React Router no funciona**
```bash
cd frontend
npm install react-router-dom@7.1.3
```

### **Error: Al autenticar dice "Código incorrecto"**
```bash
# Verificar que tengas código de supervisor en .env
# Generar uno nuevo:
cd backend
npm run generate-hash
# Copiar el hash al .env en SUPERVISOR_CODES
```

### **Error: No carga motivos**
```bash
# Verificar MySQL
cd backend
npm run init-db
```

### **Error: No se sube Excel**
```bash
# Verificar que la carpeta existe
mkdir -p backend/uploads/temp
```

---

## 🎉 ¡Sistema Listo!

Ahora tienes:
- ✅ Sistema administrativo completo en React
- ✅ Autenticación con código supervisor
- ✅ Dashboard unificado en una sola URL
- ✅ 3 módulos completos y funcionales
- ✅ UI moderna y responsiva
- ✅ Navegación intuitiva

**Todo desde:** `http://localhost:5173/api/index` 🚀
