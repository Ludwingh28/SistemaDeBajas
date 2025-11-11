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

// ESTADO 1: Cliente SÍ puede ser inhabilitado
export const showSuccessAlert = (codigoCliente, nombreCliente, motivo, razon) => {
  return Swal.fire({
    icon: "success",
    title: "✅ Cliente puede ser inhabilitado",
    html: `
      <div class="text-left space-y-3 p-4">
        <div class="bg-green-50 p-3 rounded-lg border border-green-200">
          <p class="text-gray-700"><strong>Código:</strong> ${codigoCliente}</p>
          <p class="text-gray-700"><strong>Cliente:</strong> ${nombreCliente}</p>
          <p class="text-gray-700"><strong>Motivo:</strong> ${motivo}</p>
        </div>
        <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p class="text-sm text-gray-600"><strong>Razón:</strong></p>
          <p class="text-gray-700">${razon}</p>
        </div>
        <p class="text-green-600 font-medium text-center mt-4">
          ✓ La solicitud ha sido registrada correctamente
        </p>
      </div>
    `,
    confirmButtonText: "Entendido",
    width: "600px",
    ...baseConfig,
  });
};

// ESTADO 2: Cliente NO puede ser inhabilitado
export const showErrorAlert = (codigoCliente, nombreCliente, motivo, razon) => {
  return Swal.fire({
    icon: "error",
    title: "❌ Cliente NO puede ser inhabilitado",
    html: `
      <div class="text-left space-y-3 p-4">
        <div class="bg-red-50 p-3 rounded-lg border border-red-200">
          <p class="text-gray-700"><strong>Código:</strong> ${codigoCliente}</p>
          <p class="text-gray-700"><strong>Cliente:</strong> ${nombreCliente}</p>
          <p class="text-gray-700"><strong>Motivo solicitado:</strong> ${motivo}</p>
        </div>
        <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <p class="text-sm text-gray-600"><strong>Razón del rechazo:</strong></p>
          <p class="text-gray-700 font-medium">${razon}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <p class="text-sm text-gray-600"><strong>¿Qué significa esto?</strong></p>
          <p class="text-gray-700 text-sm">El cliente tiene actividad comercial reciente. No es posible procesar la inhabilitación en este momento.</p>
        </div>
      </div>
    `,
    confirmButtonText: "Entendido",
    width: "600px",
    ...baseConfig,
  });
};

// ESTADO 3: Derivado a revisión manual (caso DUPLICADO con ventas recientes)
export const showManualReviewAlert = (codigoCliente, nombreCliente, motivo, razon, instrucciones) => {
  const instruccionesList = instrucciones?.map((inst) => `<li class="mb-2">${inst}</li>`).join("") || "";

  return Swal.fire({
    icon: "warning",
    title: "⚠️ Derivado a Revisión Manual",
    html: `
      <div class="text-left space-y-3 p-4">
        <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <p class="text-gray-700"><strong>Código:</strong> ${codigoCliente}</p>
          <p class="text-gray-700"><strong>Cliente:</strong> ${nombreCliente}</p>
          <p class="text-gray-700"><strong>Motivo:</strong> ${motivo}</p>
        </div>
        
        <div class="bg-orange-50 p-3 rounded-lg border border-orange-200">
          <p class="text-sm text-gray-600"><strong>Estado:</strong></p>
          <p class="text-orange-700 font-medium">Derivado a revisión manual con Inteligencia Comercial</p>
        </div>

        <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p class="text-sm text-gray-600 mb-2"><strong>Información:</strong></p>
          <p class="text-gray-700 text-sm">${razon}</p>
        </div>

        <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <p class="text-sm font-semibold text-gray-700 mb-2">📋 Próximos pasos:</p>
          <ol class="text-sm text-gray-600 list-decimal list-inside space-y-1">
            ${instruccionesList}
          </ol>
        </div>

        <div class="text-center mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <p class="text-sm text-indigo-700 font-medium">
            💡 Tu solicitud ha sido registrada y será revisada por el equipo especializado
          </p>
        </div>
      </div>
    `,
    confirmButtonText: "Entendido",
    confirmButtonColor: "#f59e0b",
    width: "650px",
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

// Confirmación de código supervisor
export const showSupervisorPrompt = async () => {
  const { value: codigo } = await Swal.fire({
    title: "Código de Supervisor",
    input: "password",
    inputLabel: "Ingresa tu código de supervisor",
    inputPlaceholder: "Código",
    showCancelButton: true,
    confirmButtonText: "Verificar",
    cancelButtonText: "Cancelar",
    position: "center",
    heightAuto: false,
    scrollbarPadding: false,
    inputValidator: (value) => {
      if (!value) {
        return "Debes ingresar un código";
      }
    },
    customClass: {
      ...baseConfig.customClass,
      container: "swal2-mobile-container",
      popup: "swal2-mobile-popup rounded-2xl",
    },
    didOpen: () => {
      const input = Swal.getInput();
      if (input) {
        input.style.fontSize = "16px";
        setTimeout(() => {
          input.focus();
        }, 300);
      }
    },
  });

  return codigo;
};
