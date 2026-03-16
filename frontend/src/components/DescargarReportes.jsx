import { useState, useEffect } from "react";
import { ArrowLeft, Download, Calendar, BarChart } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

const DescargarReportes = ({ onBack }) => {
  const hoy = new Date().toISOString().split("T")[0];

  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [isDownloading, setIsDownloading] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [zonas, setZonas] = useState([]);
  const [zonaSeleccionadaHoy, setZonaSeleccionadaHoy] = useState("TODOS");
  const [zonaSeleccionadaRango, setZonaSeleccionadaRango] = useState("TODOS");

  useEffect(() => {
    cargarEstadisticas();
    cargarZonas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoadingStats(true);
      const response = await axios.get("/api/bajas/estadisticas");
      setEstadisticas(response.data);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const cargarZonas = async () => {
    try {
      const response = await axios.get("/api/reportes/zonas/lista");
      if (response.data.success) {
        setZonas(response.data.zonas);
      }
    } catch (error) {
      console.error("Error cargando zonas:", error);
    }
  };

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
        "/api/reportes/descargar-historico",
        {
          codigoSupervisor: supervisorCode,
          fechaInicio,
          fechaFin,
          zona: zonaSeleccionadaRango !== "TODOS" ? zonaSeleccionadaRango : undefined
        },
        {
          responseType: "blob",
        }
      );

      // Crear link de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const zonaStr = zonaSeleccionadaRango !== "TODOS" ? `_zona_${zonaSeleccionadaRango}` : '';
      link.setAttribute("download", `reporte_historico_${fechaInicio}_a_${fechaFin}${zonaStr}.xlsx`);
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
        "/api/reportes/descargar",
        {
          codigoSupervisor: supervisorCode,
          zona: zonaSeleccionadaHoy !== "TODOS" ? zonaSeleccionadaHoy : undefined
        },
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const zonaStr = zonaSeleccionadaHoy !== "TODOS" ? `_zona_${zonaSeleccionadaHoy}` : '';
      link.setAttribute("download", `reporte_${hoy}${zonaStr}.xlsx`);
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

        {/* Estadísticas del Día */}
        {estadisticas && !loadingStats && (
          <div className="bg-linear-to-r from-purple-50 to-purple-100 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BarChart className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-800">Estadísticas del Día</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{estadisticas.total || 0}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{estadisticas.aprobados || 0}</p>
                <p className="text-sm text-gray-600">Aprobadas</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{estadisticas.rechazados || 0}</p>
                <p className="text-sm text-gray-600">Rechazadas</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{estadisticas.manuales || 0}</p>
                <p className="text-sm text-gray-600">Derivadas</p>
              </div>
            </div>
          </div>
        )}

        {/* Reporte de Hoy */}
        <div className="bg-linear-to-r from-blue-50 to-blue-100 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-3">📅 Reporte de Hoy</h3>
          <p className="text-sm text-gray-600 mb-4">Descarga el reporte de solicitudes del día {hoy}</p>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Zona</label>
            <select
              value={zonaSeleccionadaHoy}
              onChange={(e) => setZonaSeleccionadaHoy(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              disabled={isDownloading}
            >
              <option value="TODOS">Todas las Zonas</option>
              {zonas.map((zona) => (
                <option key={zona.id} value={zona.codigo}>
                  {zona.nombre}
                </option>
              ))}
            </select>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

            {/* Zona */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Zona</label>
              <select
                value={zonaSeleccionadaRango}
                onChange={(e) => setZonaSeleccionadaRango(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                         focus:border-blue-500 focus:outline-none transition-colors"
                disabled={isDownloading}
              >
                <option value="TODOS">Todas las Zonas</option>
                {zonas.map((zona) => (
                  <option key={zona.id} value={zona.codigo}>
                    {zona.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Info */}
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-6">
            <p className="text-sm text-green-900">
              <strong>Rango seleccionado:</strong> Del {fechaInicio} al {fechaFin}
              {zonaSeleccionadaRango !== "TODOS" && ` - Zona: ${zonas.find(z => z.codigo === zonaSeleccionadaRango)?.nombre || zonaSeleccionadaRango}`}
            </p>
          </div>

          {/* Botón Descargar */}
          <button
            onClick={descargarReporte}
            disabled={isDownloading}
            className={`w-full py-4 rounded-lg font-semibold text-white flex items-center justify-center gap-2
              ${isDownloading ? "bg-gray-400 cursor-not-allowed" : "bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-95"} transition-all shadow-lg`}
          >
            <Download className="w-5 h-5" />
            {isDownloading ? "Descargando..." : "Exportar a Excel"}
          </button>
        </div>

        {/* Nota */}
        <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> El reporte incluirá todas las solicitudes de inhabilitación registradas en el rango de fechas seleccionado, incluyendo: código, nombre, motivo, zona, ruta, vendedor,
            resultado, razón, y también información de inhabilitación en Dualpoint (fecha, tipo de ejecución manual/automática, y ejecutado por).
          </p>
        </div>
      </div>
    </div>
  );
};

export default DescargarReportes;
