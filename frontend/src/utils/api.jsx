import axios from "axios";

// URL del backend - cambiar según tu configuración
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 segundos timeout
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // El servidor respondió con un código de error
      console.error("Error de respuesta:", error.response.data);
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      console.error("Sin respuesta del servidor");
    } else {
      // Algo pasó al configurar la petición
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

// Endpoints
export const solicitudBajaAPI = {
  // Enviar solicitud de baja
  enviar: async (formData) => {
    const response = await api.post("/bajas/solicitar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Obtener motivos disponibles
  getMotivos: async () => {
    const response = await api.get("/motivos");
    return response.data;
  },
};

export const reportesAPI = {
  // Descargar reporte de supervisor
  descargar: async (codigoSupervisor) => {
    const response = await api.post("/reportes/descargar", { codigoSupervisor }, { responseType: "blob" });
    return response.data;
  },
};

export default api;
