import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, XCircle, Eye, MessageSquare, Image as ImageIcon, Calendar } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

const AprobarSolicitudes = ({ onBack }) => {
  const hoy = new Date().toISOString().split("T")[0];

  const [solicitudes, setSolicitudes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [comentarios, setComentarios] = useState({}); // Almacenar comentarios por ID de solicitud
  const [procesando, setProcesando] = useState(null); // ID de solicitud siendo procesada
  const [fotosVisualizando, setFotosVisualizando] = useState(null); // Fotos a visualizar
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);

  useEffect(() => {
    cargarSolicitudesPendientes();
  }, [fechaInicio, fechaFin]);

  const cargarSolicitudesPendientes = async () => {
    try {
      setIsLoading(true);

      // Obtener código del supervisor desde sessionStorage
      const codigoSupervisor = sessionStorage.getItem('supervisorCode');

      const response = await axios.get("/api/reportes/pendientes-aprobacion", {
        headers: {
          'x-supervisor-code': codigoSupervisor
        },
        params: {
          fechaInicio,
          fechaFin
        }
      });

      if (response.data.success) {
        setSolicitudes(response.data.solicitudes);
      }
    } catch (error) {
      console.error("Error cargando solicitudes:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las solicitudes pendientes",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verFotos = (solicitud) => {
    setFotosVisualizando(solicitud);
  };

  const cerrarFotos = () => {
    setFotosVisualizando(null);
    setFotoAmpliada(null);
  };

  // Cerrar modales con tecla ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        if (fotoAmpliada) {
          setFotoAmpliada(null);
        } else if (fotosVisualizando) {
          cerrarFotos();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [fotoAmpliada, fotosVisualizando]);

  const aprobarORechazar = async (solicitud, decision) => {
    try {
      setProcesando(solicitud.id);

      // Obtener código del supervisor
      const codigoSupervisor = sessionStorage.getItem('supervisorCode');
      const comentario = comentarios[solicitud.id] || "";

      const response = await axios.post(
        `/api/reportes/aprobar/${solicitud.id}`,
        {
          decision,
          comentario: comentario.trim() || null,
        },
        {
          headers: {
            'x-supervisor-code': codigoSupervisor
          }
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: `Solicitud ${decision === "APROBADO" ? "Aprobada" : "Rechazada"}`,
          html: `
            <p><strong>Cliente:</strong> ${solicitud.nombreCliente}</p>
            <p><strong>Código:</strong> ${solicitud.codigoCliente}</p>
            <p><strong>Motivo:</strong> ${solicitud.motivo}</p>
            <p><strong>Resultado:</strong> ${decision === "APROBADO" ? "SI (Puede inhabilitarse)" : "NO (No puede inhabilitarse)"}</p>
          `,
        });

        // Limpiar comentario
        const nuevosComentarios = { ...comentarios };
        delete nuevosComentarios[solicitud.id];
        setComentarios(nuevosComentarios);

        // Actualizar lista
        await cargarSolicitudesPendientes();
      }
    } catch (error) {
      console.error("Error procesando solicitud:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Error procesando la solicitud",
      });
    } finally {
      setProcesando(null);
    }
  };

  const actualizarComentario = (solicitudId, valor) => {
    setComentarios({
      ...comentarios,
      [solicitudId]: valor
    });
  };

  return (
    <div>
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold">
        <ArrowLeft className="w-5 h-5" />
        Volver al Menú
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-yellow-100 p-3 rounded-xl">
            <MessageSquare className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Aprobar Solicitudes</h2>
            <p className="text-gray-600 text-sm">Solicitudes MANUAL pendientes de revisión</p>
          </div>
        </div>

        {/* Filtro de Fechas */}
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-5 mb-6">
          <h3 className="text-md font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-yellow-600" />
            Filtrar por Rango de Fechas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Contador */}
        <div className="bg-yellow-50 rounded-xl p-4 mb-6 text-center">
          <div className="text-3xl font-bold text-yellow-600">{solicitudes.length}</div>
          <div className="text-sm text-gray-600">Solicitudes Pendientes</div>
        </div>

        {/* Lista de Solicitudes */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando solicitudes...</p>
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-700">No hay solicitudes pendientes</p>
            <p className="text-gray-500">Todas las solicitudes han sido revisadas</p>
          </div>
        ) : (
          <div className="space-y-6">
            {solicitudes.map((sol) => (
              <div key={sol.id} className="border-2 border-gray-200 rounded-xl p-6 bg-white shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800">{sol.nombreCliente}</h3>
                    <p className="text-sm text-gray-600">Código: {sol.codigoCliente}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Solicitado: {new Date(sol.fechaSolicitud).toLocaleString('es-BO', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">MANUAL</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <span className="text-sm text-gray-600">Motivo:</span>
                    <p className="font-semibold">{sol.motivo}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Zona:</span>
                    <p className="font-semibold">{sol.zona || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Ruta:</span>
                    <p className="font-semibold">{sol.ruta || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Vendedor:</span>
                    <p className="font-semibold">{sol.vendedor || "N/A"}</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-3 mb-4">
                  <span className="text-sm font-semibold text-yellow-800">Razón del Sistema:</span>
                  <p className="text-sm mt-1 text-yellow-900">{sol.razon}</p>
                </div>

                {/* Botón para ver fotos */}
                {sol.fotosRutas && sol.fotosRutas.length > 0 && (
                  <button
                    onClick={() => verFotos(sol)}
                    className="w-full bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 mb-4 font-semibold"
                  >
                    <ImageIcon className="w-5 h-5" />
                    Ver {sol.fotosRutas.length} Foto{sol.fotosRutas.length > 1 ? 's' : ''} de Evidencia
                  </button>
                )}

                {/* Comentario opcional */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Comentario (Opcional)</label>
                  <textarea
                    value={comentarios[sol.id] || ""}
                    onChange={(e) => actualizarComentario(sol.id, e.target.value)}
                    placeholder="Agrega un comentario sobre tu decisión..."
                    className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
                    rows="2"
                    disabled={procesando === sol.id}
                  />
                </div>

                {/* Botones de Acción */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => aprobarORechazar(sol, "APROBADO")}
                    disabled={procesando === sol.id}
                    className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-base"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {procesando === sol.id ? "Procesando..." : "Aprobar (SI)"}
                  </button>
                  <button
                    onClick={() => aprobarORechazar(sol, "RECHAZADO")}
                    disabled={procesando === sol.id}
                    className="bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-base"
                  >
                    <XCircle className="w-5 h-5" />
                    {procesando === sol.id ? "Procesando..." : "Rechazar (NO)"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Visualización de Fotos */}
      {fotosVisualizando && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={cerrarFotos}>
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* Header del Modal */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Fotos de Evidencia</h2>
                  <p className="text-gray-600">{fotosVisualizando.nombreCliente} - {fotosVisualizando.codigoCliente}</p>
                </div>
                <button onClick={cerrarFotos} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <XCircle className="w-8 h-8" />
                </button>
              </div>

              {/* Grid de Fotos */}
              {fotosVisualizando.fotosRutas && fotosVisualizando.fotosRutas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fotosVisualizando.fotosRutas.map((foto, index) => {
                    const nombreArchivo = foto.split(/[/\\]/).pop();
                    const fotoUrl = `/uploads/${nombreArchivo}`;

                    return (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border-2 border-gray-300 hover:border-blue-500 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFotoAmpliada(fotoUrl);
                        }}
                      >
                        <img
                          src={fotoUrl}
                          alt={`Evidencia ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          style={{ opacity: 0, transition: 'opacity 0.3s', backgroundColor: '#f3f4f6' }}
                          onLoad={(e) => {
                            console.log('✅ Foto cargada:', fotoUrl);
                            e.target.style.opacity = '1';
                          }}
                          onError={(e) => {
                            console.error('❌ Error cargando foto:', fotoUrl);
                            e.target.style.display = 'none';
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'w-full h-full flex items-center justify-center bg-red-50 border-2 border-red-200';
                            errorDiv.innerHTML = '<p class="text-red-600 text-sm text-center px-4">Error cargando imagen</p>';
                            e.target.parentElement.appendChild(errorDiv);
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <Eye className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                          <p className="text-white text-sm font-semibold">Evidencia {index + 1}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay fotos adjuntas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Imagen Ampliada */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-60 p-4"
          onClick={() => setFotoAmpliada(null)}
        >
          <div className="relative max-w-7xl max-h-[95vh]">
            <button
              onClick={() => setFotoAmpliada(null)}
              className="absolute -top-14 right-0 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={fotoAmpliada}
              alt="Evidencia ampliada"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AprobarSolicitudes;
