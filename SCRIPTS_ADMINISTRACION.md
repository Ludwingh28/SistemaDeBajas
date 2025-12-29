# Scripts de Administración del Sistema

Scripts para gestionar el Sistema de Bajas de Cruzimex Ltda. en Windows Server.

## 📋 Scripts Disponibles

### 1. `deploy-produccion.bat` 🚀 (PARA ACTUALIZAR CÓDIGO)

**Uso:** Copia los archivos del entorno de desarrollo a producción

**Cuándo usarlo:**
- Cuando actualizaste el código en tu carpeta de desarrollo
- Antes de hacer un deploy de una nueva versión
- Para sincronizar cambios del frontend o backend a producción

**Qué hace:**
1. ✅ Construye el frontend (npm run build)
2. ✅ Copia todos los archivos del backend a `C:\inetpub\cruzimex\SistemaDeBajas\backend`
3. ✅ Copia el frontend compilado (dist) a `C:\inetpub\cruzimex\SistemaDeBajas\frontend\dist`
4. ✅ Verifica/instala dependencias de Node.js en producción

**Cómo ejecutar:**
```batch
deploy-produccion.bat
```

**Resultado esperado:**
```
[1/4] Construyendo frontend...
   [OK] Frontend construido

[2/4] Copiando archivos del backend...
   [OK] Backend copiado

[3/4] Copiando frontend...
   [OK] Frontend copiado

[4/4] Verificando dependencias de produccion...
   [OK] Dependencias instaladas

DEPLOY COMPLETADO

Siguiente paso:
 - Ejecuta reiniciar-sistema.bat para aplicar cambios
```

**IMPORTANTE:** Después de ejecutar este script, debes ejecutar `reiniciar-sistema.bat` para aplicar los cambios.

---

### 2. `reiniciar-sistema.bat` ⚡ (MÁS USADO)

**Uso:** Reinicia completamente el sistema, matando todos los procesos huérfanos

**Cuándo usarlo:**
- Después de reiniciar el servidor
- Cuando hay procesos huérfanos (múltiples instancias de NGINX o Node.js)
- Cuando el sistema no responde correctamente
- Cuando actualizaste el código y necesitas aplicar cambios

**Qué hace:**
1. ✅ Mata TODAS las instancias de NGINX (incluidas huérfanas)
2. ✅ Mata TODAS las instancias de PM2 y Node.js (incluidas huérfanas)
3. ✅ Inicia NGINX limpio
4. ✅ Inicia PM2 con el backend
5. ✅ Abre 2 ventanas de consola con logs en tiempo real:
   - **Ventana AZUL:** Logs de NGINX
   - **Ventana AMARILLA:** Logs de PM2 Backend

**Cómo ejecutar:**
```batch
# Doble click en el archivo, o desde cmd/PowerShell:
reiniciar-sistema.bat
```

**Resultado esperado:**
```
========================================
  Sistema de Bajas - Cruzimex Ltda.
  Reinicio Completo del Sistema
========================================

[1/4] Deteniendo todas las instancias de NGINX...
   [OK] NGINX detenido correctamente

[2/4] Deteniendo todas las instancias de PM2 y Node.js...
   [OK] PM2 detenido correctamente
   [OK] Procesos huerfanos de Node.js eliminados

[3/4] Iniciando NGINX...
   [OK] NGINX iniciado correctamente

[4/4] Iniciando PM2 Backend...
   [OK] PM2 Backend iniciado correctamente

========================================
  SISTEMA REINICIADO EXITOSAMENTE
========================================

Estado de servicios:

[OK] NGINX: Corriendo
[OK] PM2: Corriendo

Se han abierto 2 ventanas de consola:
 - Ventana AZUL: Logs de NGINX
 - Ventana AMARILLA: Logs de PM2 Backend
```

---

### 2. `estado-sistema.bat` 🔍

**Uso:** Verifica el estado actual del sistema sin reiniciar nada

**Cuándo usarlo:**
- Para verificar que todo está funcionando
- Para detectar procesos huérfanos
- Para ver si los puertos están escuchando
- Diagnóstico rápido

**Qué muestra:**
- ✅ Estado de NGINX (corriendo/detenido)
- ✅ Estado de PM2 Backend (corriendo/detenido)
- ✅ Procesos huérfanos detectados
- ✅ Conectividad de puertos (80 y 3001)
- ✅ URLs de acceso al sistema

**Cómo ejecutar:**
```batch
estado-sistema.bat
```

**Resultado esperado:**
```
========================================
  Sistema de Bajas - Cruzimex Ltda.
  Estado de Servicios
========================================

[NGINX]
Estado: [OK] Corriendo
Procesos activos:
nginx.exe    4532 Services    0   2,148 K
nginx.exe    5644 Services    0   2,204 K

[PM2 Backend]
Estado: [OK] Corriendo

┌────┬────────────────────┬─────────────┬─────────┬─────────┐
│ id │ name               │ status      │ restart │ uptime  │
├────┼────────────────────┼─────────────┼─────────┼─────────┤
│ 0  │ backend-cruzimex   │ online      │ 0       │ 2m      │
└────┴────────────────────┴─────────────┴─────────┴─────────┘

[Procesos Huerfanos]

[OK] No hay procesos huerfanos

[Prueba de Conectividad]

Probando NGINX (puerto 80)...
[OK] Puerto 80 escuchando

Probando Backend (puerto 3001)...
[OK] Puerto 3001 escuchando

========================================
  Accesos al Sistema:
========================================

Frontend (Vendedores): http://localhost/
Dashboard Admin: http://localhost/admin
```

---

### 3. `detener-sistema.bat` 🛑

**Uso:** Detiene el sistema completamente de forma limpia

**Cuándo usarlo:**
- Antes de hacer mantenimiento al servidor
- Antes de actualizar NGINX o Node.js
- Para apagar el sistema temporalmente

**Qué hace:**
1. ✅ Detiene PM2 (guarda configuración)
2. ✅ Detiene NGINX gracefully
3. ✅ Limpia procesos huérfanos
4. ✅ Verifica que todo se detuvo correctamente

**Cómo ejecutar:**
```batch
detener-sistema.bat
```

---

## 🚀 Flujo de Trabajo Común

### Después de reiniciar el servidor:

```batch
# 1. Ejecutar reinicio completo
reiniciar-sistema.bat

# 2. Verificar que todo funcionó
estado-sistema.bat

# 3. Probar acceso desde navegador
# http://IP-SERVIDOR/
# http://IP-SERVIDOR/admin
```

### Cuando el sistema no responde:

```batch
# 1. Verificar estado
estado-sistema.bat

# 2. Si hay procesos huérfanos o está detenido, reiniciar
reiniciar-sistema.bat

# 3. Verificar nuevamente
estado-sistema.bat
```

### Para aplicar cambios al código:

```batch
# En el servidor de producción:

# 1. Detener el sistema
detener-sistema.bat

# 2. Actualizar código (git pull, copiar archivos nuevos, etc.)
# Si actualizaste el frontend:
cd C:\inetpub\cruzimex\SistemaDeBajas\frontend
npm run build
# (Los archivos ya están en la ubicación correcta)

# Si actualizaste el backend:
# Solo copiar archivos a C:\inetpub\cruzimex\SistemaDeBajas\backend

# 3. Reiniciar el sistema
reiniciar-sistema.bat
```

---

## ⚠️ Solución a Problemas Comunes

### Problema: "El sistema no responde después de reiniciar el servidor"

**Solución:**
```batch
reiniciar-sistema.bat
```
Este script mata todos los procesos huérfanos y reinicia limpio.

### Problema: "Veo múltiples procesos de nginx.exe en el Task Manager"

**Causa:** Procesos huérfanos de reinicios anteriores

**Solución:**
```batch
reiniciar-sistema.bat
```

### Problema: "PM2 muestra 'errored' o 'stopped'"

**Solución:**
```batch
reiniciar-sistema.bat
```

### Problema: "El puerto 80 está en uso"

**Verificar:**
```batch
netstat -ano | findstr :80
```

**Solución:**
```batch
reiniciar-sistema.bat
```

### Problema: "Las ventanas de logs se cerraron"

**Solución:** Ejecuta `reiniciar-sistema.bat` de nuevo, abrirá nuevas ventanas con logs.

---

## 📝 Notas Importantes

1. **Las ventanas de logs NO se deben cerrar** si quieres monitorear el sistema en tiempo real
2. **Los scripts deben ejecutarse como Administrador** si tienes problemas de permisos
3. **reiniciar-sistema.bat** es el más importante - úsalo cuando haya problemas
4. **estado-sistema.bat** es para diagnóstico rápido
5. **detener-sistema.bat** guarda la configuración de PM2 antes de detener

---

## 🔧 Rutas Configuradas

Las rutas están configuradas para el servidor de producción:

- **Ruta de NGINX:** `C:\nginx`
- **Ruta del Backend:** `C:\inetpub\cruzimex\SistemaDeBajas\backend`
- **Nombre del proceso PM2:** `backend-cruzimex`

Si necesitas cambiar estas rutas, edita los archivos .bat en las líneas correspondientes.

---

## 📞 Soporte

Si algún script no funciona:

1. Verifica que las rutas en el script sean correctas
2. Ejecuta como Administrador
3. Revisa los logs en las ventanas de consola
4. Usa `estado-sistema.bat` para diagnóstico
