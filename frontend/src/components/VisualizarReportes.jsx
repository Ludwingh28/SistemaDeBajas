import { useState, useEffect } from "react";
import { ArrowLeft, Search, Eye, Calendar, FileText, User, CheckCircle, XCircle, Clock, Image as ImageIcon } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

const VisualizarReportes = ({ onBack }) => {
  const hoy = new Date().toISOString().split("T")[0];

  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [reportes, setReportes] = useState([]);
  const [loadingReportes, setLoadingReportes] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  // Cerrar modales con tecla ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        if (imagenAmpliada) {
          setImagenAmpliada(null);
        } else if (showModal) {
          setShowModal(false);
          setSelectedReporte(null);
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [imagenAmpliada, showModal]);

  const cargarReportes = async () => {
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

    setLoadingReportes(true);

    try {
      const supervisorCode = sessionStorage.getItem("supervisorCode");

      const response = await axios.get("/api/reportes/ver-historico", {
        headers: {
          'x-supervisor-code': supervisorCode
        },
        params: {
          fechaInicio,
          fechaFin,
        }
      });

      if (response.data.success) {
        setReportes(response.data.reportes);

        if (response.data.reportes.length === 0) {
          Swal.fire({
            icon: "info",
            title: "Sin datos",
            text: "No hay reportes en el rango de fechas seleccionado",
          });
        }
      }
    } catch (error) {
      console.error("Error cargando reportes:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Error al cargar los reportes",
      });
    } finally {
      setLoadingReportes(false);
    }
  };

  const reportesFiltrados = reportes.filter(r => {
    if (!filtroTexto) return true;
    const textoLower = filtroTexto.toLowerCase();
    return (
      r.codigoCliente?.toLowerCase().includes(textoLower) ||
      r.nombreCliente?.toLowerCase().includes(textoLower) ||
      r.motivo?.toLowerCase().includes(textoLower) ||
      r.vendedor?.toLowerCase().includes(textoLower) ||
      r.zona?.toLowerCase().includes(textoLower) ||
      r.ruta?.toLowerCase().includes(textoLower)
    );
  });

  const getResultadoBadge = (resultado) => {
    if (resultado === "SI") {
      return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
        <CheckCircle className="w-3 h-3" /> APROBADO
      </span>;
    } else if (resultado === "NO") {
      return <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
        <XCircle className="w-3 h-3" /> RECHAZADO
      </span>;
    } else if (resultado === "MANUAL") {
      return <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
        <Clock className="w-3 h-3" /> DERIVADO
      </span>;
    }
    return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">{resultado}</span>;
  };

  const verDetalle = (reporte) => {
    setSelectedReporte(reporte);
    setShowModal(true);
  };

  const verImagen = (fotoUrl) => {
    setImagenAmpliada(fotoUrl);
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
          <div className="bg-purple-100 p-3 rounded-xl">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Visualizar Reportes</h2>
            <p className="text-gray-600 text-sm">Consulta el historial de solicitudes de inhabilitación</p>
          </div>
        </div>

        {/* Filtros de Fecha */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Seleccionar Rango de Fechas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fecha Inicio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                disabled={loadingReportes}
              />
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                disabled={loadingReportes}
              />
            </div>

            {/* Botón Buscar */}
            <div className="flex items-end">
              <button
                onClick={cargarReportes}
                disabled={loadingReportes}
                className={`w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2
                  ${loadingReportes ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 active:scale-95"} transition-all`}
              >
                <Search className="w-5 h-5" />
                {loadingReportes ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        {reportes.length > 0 && (
          <>
            {/* Buscador */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por código, nombre, motivo, vendedor, zona o ruta..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Estadísticas */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {reportesFiltrados.filter(r => r.resultado === 'SI').length}
                  </p>
                  <p className="text-sm text-gray-600">Aprobados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {reportesFiltrados.filter(r => r.resultado === 'NO').length}
                  </p>
                  <p className="text-sm text-gray-600">Rechazados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {reportesFiltrados.filter(r => r.resultado === 'MANUAL').length}
                  </p>
                  <p className="text-sm text-gray-600">Derivados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-700">
                    {reportesFiltrados.length}
                  </p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Motivo</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Resultado</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        No se encontraron reportes que coincidan con tu búsqueda
                      </td>
                    </tr>
                  ) : (
                    reportesFiltrados.map((reporte) => (
                      <tr key={reporte.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(reporte.fechaSolicitud).toLocaleDateString('es-BO', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {reporte.codigoCliente}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {reporte.nombreCliente}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reporte.motivo}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {getResultadoBadge(reporte.resultado)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => verDetalle(reporte)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Mensaje inicial */}
        {reportes.length === 0 && !loadingReportes && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Selecciona un rango de fechas y haz clic en "Buscar" para ver los reportes</p>
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      {showModal && selectedReporte && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Detalle de Solicitud</h3>
                  <p className="text-purple-100 text-sm mt-1">ID: {selectedReporte.id}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-purple-500 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              {/* Información del Cliente */}
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Información del Cliente
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-semibold">Código Cliente</p>
                    <p className="text-lg font-bold text-gray-900">{selectedReporte.codigoCliente}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-semibold">Nombre</p>
                    <p className="text-lg font-bold text-gray-900">{selectedReporte.nombreCliente}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-semibold">Zona</p>
                    <p className="text-lg text-gray-900">{selectedReporte.zona}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-semibold">Ruta</p>
                    <p className="text-lg text-gray-900">{selectedReporte.ruta}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-semibold">Vendedor</p>
                    <p className="text-lg text-gray-900">{selectedReporte.vendedor}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-semibold">Fecha Solicitud</p>
                    <p className="text-lg text-gray-900">
                      {new Date(selectedReporte.fechaSolicitud).toLocaleString('es-BO')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de la Solicitud */}
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3">Detalles de la Solicitud</h4>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-semibold mb-1">Motivo</p>
                    <p className="text-gray-900">{selectedReporte.motivo}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-semibold mb-1">Resultado</p>
                    <div className="mt-2">{getResultadoBadge(selectedReporte.resultado)}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-semibold mb-1">Razón</p>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedReporte.razon || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Información de Aprobación (si existe) */}
              {selectedReporte.supervisorAprobador && (
                <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Información de Aprobación</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Aprobado/Rechazado por</p>
                      <p className="text-gray-900 font-bold">{selectedReporte.supervisorAprobador}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Fecha de Decisión</p>
                      <p className="text-gray-900">
                        {new Date(selectedReporte.fechaAprobacion).toLocaleString('es-BO')}
                      </p>
                    </div>
                    {selectedReporte.comentarioAprobacion && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600 font-semibold mb-1">Comentario</p>
                        <p className="text-gray-900">{selectedReporte.comentarioAprobacion}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Evidencias Fotográficas */}
              {selectedReporte.fotosRutas && selectedReporte.fotosRutas.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-purple-600" />
                    Evidencias Fotográficas ({selectedReporte.fotosRutas.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedReporte.fotosRutas.map((foto, index) => {
                      // Extraer solo el nombre del archivo de la ruta completa
                      const nombreArchivo = foto.split(/[/\\]/).pop();
                      const fotoUrl = `/uploads/${nombreArchivo}`;

                      return (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border-2 border-gray-200 group"
                          onClick={(e) => {
                            e.stopPropagation();
                            verImagen(fotoUrl);
                          }}
                        >
                          <img
                            src={fotoUrl}
                            alt={`Evidencia ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            style={{ opacity: 0, transition: 'opacity 0.3s', backgroundColor: '#f3f4f6' }}
                            onLoad={(e) => {
                              console.log('✅ Thumbnail cargado:', fotoUrl);
                              e.target.style.opacity = '1';
                            }}
                            onError={(e) => {
                              console.error('❌ Error cargando thumbnail:', fotoUrl);
                              e.target.style.display = 'none';
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'w-full h-full flex items-center justify-center bg-red-50 border-2 border-red-200';
                              errorDiv.innerHTML = '<p class="text-red-600 text-xs text-center px-2">Error cargando imagen</p>';
                              e.target.parentElement.appendChild(errorDiv);
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                            <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="bg-gray-50 p-4 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Imagen Ampliada */}
      {imagenAmpliada && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-60 p-4"
          onClick={() => setImagenAmpliada(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh]">
            <button
              onClick={() => setImagenAmpliada(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={imagenAmpliada}
              alt="Evidencia ampliada"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualizarReportes;
