import { useState } from "react";
import { ArrowLeft, Download, Calendar } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

const DescargarReportes = ({ onBack }) => {
  const hoy = new Date().toISOString().split("T")[0];

  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [isDownloading, setIsDownloading] = useState(false);

  const descargarReporte = async () => {
    if (!fechaInicio || !fechaFin) {
      Swal.fire({
        icon: "warning",
        title: "Fechas incompletas",
        text: "Por favor selecciona ambas fechas",
      });
      return;
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
      Swal.fire({
        icon: "error",
        title: "Fechas inválidas",
        text: "La fecha de inicio no puede ser mayor a la fecha fin",
      });
      return;
    }

    setIsDownloading(true);

    try {
      const supervisorCode = sessionStorage.getItem("supervisorCode");

      const response = await axios.post(
        "http://localhost:3001/api/reportes/descargar-historico",
        {
          codigoSupervisor: supervisorCode,
          fechaInicio,
          fechaFin,
        },
        {
          responseType: "blob",
        }
      );

      // Crear link de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `reporte_historico_${fechaInicio}_a_${fechaFin}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      Swal.fire({
        icon: "success",
        title: "¡Descarga Exitosa!",
        text: "El reporte se ha descargado correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error descargando reporte:", error);

      if (error.response?.status === 404) {
        Swal.fire({
          icon: "info",
          title: "Sin datos",
          text: "No hay reportes en el rango de fechas seleccionado",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "Error al descargar el reporte",
        });
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const descargarReporteHoy = async () => {
    setIsDownloading(true);

    try {
      const supervisorCode = sessionStorage.getItem("supervisorCode");

      const response = await axios.post(
        "http://localhost:3001/api/reportes/descargar",
        {
          codigoSupervisor: supervisorCode,
        },
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `reporte_${hoy}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      Swal.fire({
        icon: "success",
        title: "¡Descarga Exitosa!",
        text: "El reporte de hoy se ha descargado correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Error al descargar el reporte de hoy",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold">
        <ArrowLeft className="w-5 h-5" />
        Volver al Menú
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Descargar Reportes</h2>
            <p className="text-gray-600 text-sm">Exporta reportes históricos de inhabilitaciones</p>
          </div>
        </div>

        {/* Reporte de Hoy */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-3">📅 Reporte de Hoy</h3>
          <p className="text-sm text-gray-600 mb-4">Descarga el reporte de solicitudes del día {hoy}</p>
          <button
            onClick={descargarReporteHoy}
            disabled={isDownloading}
            className={`w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2
              ${isDownloading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"} transition-all`}
          >
            <Download className="w-5 h-5" />
            {isDownloading ? "Descargando..." : "Descargar Reporte de Hoy"}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-8">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500 font-semibold">O</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Reporte por Rango de Fechas */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Reporte por Rango de Fechas
          </h3>

          <p className="text-sm text-gray-600 mb-6">Selecciona un rango de fechas para descargar el reporte histórico de inhabilitaciones</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Fecha Inicio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                         focus:border-blue-500 focus:outline-none transition-colors"
                disabled={isDownloading}
              />
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                         focus:border-blue-500 focus:outline-none transition-colors"
                disabled={isDownloading}
              />
            </div>
          </div>

          {/* Info */}
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-6">
            <p className="text-sm text-green-900">
              <strong>Rango seleccionado:</strong> Del {fechaInicio} al {fechaFin}
            </p>
          </div>

          {/* Botón Descargar */}
          <button
            onClick={descargarReporte}
            disabled={isDownloading}
            className={`w-full py-4 rounded-lg font-semibold text-white flex items-center justify-center gap-2
              ${isDownloading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-95"} transition-all shadow-lg`}
          >
            <Download className="w-5 h-5" />
            {isDownloading ? "Descargando..." : "Exportar a Excel"}
          </button>
        </div>

        {/* Nota */}
        <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> El reporte incluirá todas las solicitudes de inhabilitación registradas en el rango de fechas seleccionado, incluyendo: código, nombre, motivo, zona, ruta, vendedor, resultado y razón.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DescargarReportes;
