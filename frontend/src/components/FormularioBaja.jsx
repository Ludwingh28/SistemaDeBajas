const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validarFormulario()) return;

  setIsLoading(true);
  const loadingSwal = showLoadingAlert();

  try {
    const formDataToSend = new FormData();
    formDataToSend.append("codigoCliente", formData.codigoCliente.trim());
    formDataToSend.append("motivo", formData.motivo);

    formData.fotos.forEach((foto) => {
      formDataToSend.append("fotos", foto);
    });

    const response = await solicitudBajaAPI.enviar(formDataToSend);

    loadingSwal.close();

    // MANEJO DE 3 ESTADOS DIFERENTES

    // ESTADO 1: Cliente SÍ puede ser inhabilitado
    if (response.puedeInhabilitar === true) {
      await showSuccessAlert(response.codigo, response.nombreCliente, response.motivo, response.razon);
      resetForm();
    }
    // ESTADO 2: Derivado a revisión manual
    else if (response.requiereRevisionManual === true) {
      await showManualReviewAlert(response.codigo, response.nombreCliente, response.motivo, response.razon, response.instrucciones);
      resetForm();
    }
    // ESTADO 3: Cliente NO puede ser inhabilitado
    else {
      await showErrorAlert(response.codigo, response.nombreCliente, response.motivo, response.razon);
    }
  } catch (error) {
    loadingSwal.close();

    if (error.response?.data?.error) {
      showGeneralError(error.response.data.error);
    } else {
      showGeneralError("Error al procesar la solicitud. Verifica tu conexión e intenta de nuevo.");
    }
  } finally {
    setIsLoading(false);
  }
};

/*

## 🎨 **Estilos visuales de cada estado:**

### ✅ **Estado 1: APROBADO (Verde)**
- Fondo verde claro
- Icono: ✅ Success
- Mensaje positivo

### ❌ **Estado 2: RECHAZADO (Rojo)**
- Fondo rojo claro
- Icono: ❌ Error
- Explicación del rechazo

### ⚠️ **Estado 3: DERIVADO A REVISIÓN (Amarillo/Naranja)**
- Fondo amarillo/naranja
- Icono: ⚠️ Warning
- Lista de pasos a seguir
- Información de contacto

---

## 🧪 **Prueba los 3 casos:**

### **Caso 1: Cliente sin ventas o con ventas > 90 días**
```
Resultado: ✅ APROBADO
Alert: Verde - "Cliente puede ser inhabilitado"
```

### **Caso 2: Cliente con ventas <= 90 días (motivo normal)**
```
Resultado: ❌ RECHAZADO
Alert: Rojo - "Cliente NO puede ser inhabilitado"
```

### **Caso 3: Cliente DUPLICADO con ventas <= 90 días**
```
Resultado: ⚠️ DERIVADO
Alert: Amarillo - "Derivado a Revisión Manual"*/
