import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// Tutorial principal del sistema
export const iniciarTutorial = () => {
  const driverObj = driver({
    showProgress: true,
    showButtons: ["next", "previous", "close"],
    steps: [
      {
        popover: {
          title: "👋 Bienvenido al Sistema de Bajas",
          description: 'Te guiaremos paso a paso en cómo solicitar la inhabilitación de un cliente. Haz clic en "Siguiente" para comenzar.',
          popoverClass: "driver-popover-centered", // Clase especial solo para centrados
        },
      },
      {
        element: "#codigoCliente",
        popover: {
          title: "1️⃣ Código del Cliente",
          description: "Ingresa aquí el código único del cliente que deseas inhabilitar. Ejemplo: 420568",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#motivo",
        popover: {
          title: "2️⃣ Motivo de Baja",
          description: "Selecciona el motivo por el cual solicitas la inhabilitación del cliente. Este campo es obligatorio y debe reflejar la razón real.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: 'label[for="fotos"]',
        popover: {
          title: "3️⃣ Fotos de la Tienda",
          description: "Sube entre 1 y 5 fotos del estado actual de la tienda. Las fotos deben ser claras y mostrar evidencia del motivo de baja. Formatos aceptados: JPG, PNG, GIF.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: 'button[type="submit"]',
        popover: {
          title: "4️⃣ Enviar Solicitud",
          description: "Una vez completados todos los campos, haz clic aquí para enviar tu solicitud. El sistema verificará automáticamente si el cliente puede ser inhabilitado.",
          side: "top",
          align: "center",
        },
      },
      {
        popover: {
          title: "📊 Resultados Posibles",
          description: `
            <div class="text-left space-y-3">
              <p class="font-semibold mb-3">El sistema puede devolver 2 resultados:</p>
              <div class="flex items-start space-x-2 mb-2">
                <span class="text-green-600 font-bold text-xl">✅</span>
                <div>
                  <p class="font-medium text-green-700">Cliente SÍ puede ser inhabilitado</p>
                  <p class="text-sm text-gray-600">No tiene ventas o su última venta fue hace más de 90 días</p>
                </div>
              </div>
              <div class="flex items-start space-x-2">
                <span class="text-yellow-600 font-bold text-xl">⚠️</span>
                <div>
                  <p class="font-medium text-yellow-700">Derivado a revisión manual</p>
                  <p class="text-sm text-gray-600">Caso especial que requiere análisis del equipo de Inteligencia Comercial</p>
                </div>
              </div>
            </div>
          `,
          popoverClass: "driver-popover-centered", // Clase especial solo para centrados
        },
      },
      {
        popover: {
          title: "✅ ¡Listo para Empezar!",
          description: "Ya conoces todas las funciones del sistema. Si necesitas ver este tutorial nuevamente, haz clic en el botón de ayuda. ¡Buena suerte!",
          popoverClass: "driver-popover-centered", // Clase especial solo para centrados
        },
      },
    ],
    nextBtnText: "Siguiente →",
    prevBtnText: "← Anterior",
    doneBtnText: "¡Entendido!",
    progressText: "{{current}} de {{total}}",
    onDestroyStarted: () => {
      driverObj.destroy();
    },
  });

  driverObj.drive();
};
