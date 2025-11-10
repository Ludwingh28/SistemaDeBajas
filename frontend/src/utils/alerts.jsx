import Swal from "sweetalert2";

// Configuración base de SweetAlert2
const baseConfig = {
  customClass: {
    popup: "rounded-2xl",
    confirmButton: "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors",
    cancelButton: "bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors ml-2",
  },
  buttonsStyling: false,
};

// Loading mientras verifica
export const showLoadingAlert = () => {
  return Swal.fire({
    title: "Verificando cliente...",
    html: "Por favor espera mientras procesamos la información",
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
    ...baseConfig,
  });
};

// Success - Cliente puede ser inhabilitado
export const showSuccessAlert = (codigoCliente, motivo) => {
  return Swal.fire({
    icon: "success",
    title: "✅ Cliente puede ser inhabilitado",
    html: `
      <div class="text-left space-y-2">
        <p class="text-gray-700"><strong>Código:</strong> ${codigoCliente}</p>
        <p class="text-gray-700"><strong>Motivo:</strong> ${motivo}</p>
        <p class="text-green-600 mt-4">La solicitud ha sido registrada correctamente.</p>
      </div>
    `,
    confirmButtonText: "Entendido",
    ...baseConfig,
  });
};

// Error - Cliente NO puede ser inhabilitado
export const showErrorAlert = (codigoCliente, razon) => {
  return Swal.fire({
    icon: "error",
    title: "❌ Cliente NO puede ser inhabilitado",
    html: `
      <div class="text-left space-y-2">
        <p class="text-gray-700"><strong>Código:</strong> ${codigoCliente}</p>
        <p class="text-red-600 mt-4"><strong>Razón:</strong></p>
        <p class="text-gray-600">${razon}</p>
      </div>
    `,
    confirmButtonText: "Entendido",
    ...baseConfig,
  });
};

// Error general
export const showGeneralError = (mensaje = "Ocurrió un error inesperado") => {
  return Swal.fire({
    icon: "error",
    title: "Error",
    text: mensaje,
    confirmButtonText: "Entendido",
    ...baseConfig,
  });
};

// Validación de campos vacíos
export const showValidationError = (mensaje) => {
  return Swal.fire({
    icon: "warning",
    title: "Campos incompletos",
    text: mensaje,
    confirmButtonText: "Entendido",
    ...baseConfig,
  });
};

// Confirmación de código supervisor - CORREGIDO PARA MÓVILES
export const showSupervisorPrompt = async () => {
  const { value: codigo } = await Swal.fire({
    title: "Código de Supervisor",
    input: "password",
    inputLabel: "Ingresa tu código de supervisor",
    inputPlaceholder: "Código",
    showCancelButton: true,
    confirmButtonText: "Verificar",
    cancelButtonText: "Cancelar",
    // FIX: Configuración para móviles
    position: "center",
    heightAuto: false, // CRÍTICO: Previene que el modal se mueva con el teclado
    scrollbarPadding: false, // Previene padding extra
    // Validación
    inputValidator: (value) => {
      if (!value) {
        return "Debes ingresar un código";
      }
    },
    // Estilos personalizados para mejor visualización móvil
    customClass: {
      ...baseConfig.customClass,
      container: "swal2-mobile-container",
      popup: "swal2-mobile-popup rounded-2xl",
    },
    didOpen: () => {
      // Asegurar que el input esté visible en móviles
      const input = Swal.getInput();
      if (input) {
        input.style.fontSize = "16px"; // Previene zoom en iOS
        // Opcional: Auto-focus con delay para móviles
        setTimeout(() => {
          input.focus();
        }, 300);
      }
    },
  });

  return codigo;
};
