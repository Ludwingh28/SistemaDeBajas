import { useState } from "react";
import { ArrowLeft, UserX, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

const InhabilitarClientes = ({ onBack }) => {
  const [isInhabilitando, setIsInhabilitando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleInhabilitacion = async () => {
    // Confirmación
    const confirmacion = await Swal.fire({
      title: "¿Confirmar inhabilitación?",
      html: `
        <p>Se inhabilitarán TODOS los clientes con solicitudes aprobadas cambiándolos a <strong>rutas genéricas</strong> en Dualpoint.</p>
        <br/>
        <p class="text-sm text-gray-600">Este proceso puede tardar varios minutos dependiendo de la cantidad de clientes.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, inhabilitar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!confirmacion.isConfirmed) return;

    setIsInhabilitando(true);
    setResultado(null);

    try {
      Swal.fire({
        title: "Inhabilitando clientes...",
        html: `
          <div class="flex flex-col items-center gap-4">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500"></div>
            <p>Accediendo a Dualpoint y cambiando rutas...</p>
            <p class="text-sm text-gray-500">Este proceso puede tardar varios minutos</p>
          </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
      });

      const response = await axios.post("/api/inhabilitar-clientes", {
        supervisorNombre: sessionStorage.getItem("supervisorNombre") || "MANUAL"
      }, {
        headers: {
          "x-supervisor-code": sessionStorage.getItem("supervisorCode"),
        },
        timeout: 20 * 60 * 1000, // 20 minutos timeout
      });

      Swal.close();

      if (response.data.success) {
        setResultado(response.data);

        Swal.fire({
          icon: "success",
          title: "Inhabilitación completada",
          html: `
            <div class="text-left">
              <p class="font-semibold mb-2">${response.data.message}</p>
              <ul class="text-sm text-gray-700 mt-2 space-y-1">
                <li>Total encontrados: <strong>${response.data.totalClientes}</strong></li>
                <li>Procesados: <strong>${response.data.procesados}</strong></li>
                <li class="text-green-600">Exitosos: <strong>${response.data.exitosos}</strong></li>
                ${response.data.fallidos > 0 ? `<li class="text-red-600">Fallidos: <strong>${response.data.fallidos}</strong></li>` : ""}
                ${response.data.omitidos > 0 ? `<li class="text-orange-600">Omitidos: <strong>${response.data.omitidos}</strong></li>` : ""}
                <li>Tiempo total: <strong>${response.data.tiempoTotal}s</strong></li>
              </ul>
              ${response.data.fallidos > 0 || response.data.omitidos > 0 ? '<p class="text-xs text-gray-500 mt-2">Ver detalles abajo para más información</p>' : ''}
            </div>
          `,
        });
      }
    } catch (error) {
      Swal.close();

      console.error("Error inhabilitando clientes:", error);

      Swal.fire({
        icon: "error",
        title: "Error en inhabilitación",
        text: error.response?.data?.message || error.message || "Error desconocido",
      });

      setResultado({
        success: false,
        error: error.response?.data?.message || error.message,
      });
    } finally {
      setIsInhabilitando(false);
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
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-100 p-3 rounded-xl">
            <UserX className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Inhabilitar Clientes</h2>
            <p className="text-gray-600 text-sm">Mover clientes aprobados a rutas genéricas en Dualpoint</p>
          </div>
        </div>

        {/* Información */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-2">¿Qué hace esta opción?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Busca todas las solicitudes con estado <strong>APROBADO</strong></li>
                <li>Accede a Dualpoint de cada zona (Santa Cruz, Cochabamba, La Paz)</li>
                <li>Cambia la ruta de cada cliente a su <strong>ruta genérica</strong> correspondiente</li>
                <li>Las rutas genéricas dependen del tipo de cliente (DTS, WHS, HORECA)</li>
                <li className="text-red-700"><strong>NOTA:</strong> Clientes de tipo LICORES son excluidos automáticamente</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botón */}
        <button
          onClick={handleInhabilitacion}
          disabled={isInhabilitando}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2
            ${isInhabilitando ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 active:scale-95"}`}
        >
          {isInhabilitando ? (
            <><Clock className="w-5 h-5 animate-spin" /> Inhabilitando...</>
          ) : (
            <><UserX className="w-5 h-5" /> Inhabilitar Clientes Aprobados</>
          )}
        </button>

        {/* Nota cron */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mt-6">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Esta operación también se ejecuta automáticamente todos los <strong>sábados a las 9:00 AM</strong>.
          </p>
        </div>

        {/* Resultados */}
        {resultado && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resultados de la última ejecución:</h3>

            {resultado.success ? (
              <div className="space-y-4">
                {/* Resumen */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">{resultado.totalClientes}</div>
                    <div className="text-xs text-gray-600">Total Encontrados</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-700">{resultado.exitosos}</div>
                    <div className="text-xs text-gray-600">Exitosos</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-700">{resultado.fallidos || 0}</div>
                    <div className="text-xs text-gray-600">Fallidos</div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-orange-700">{resultado.omitidos || 0}</div>
                    <div className="text-xs text-gray-600">Omitidos</div>
                  </div>
                </div>

                {/* Detalles por zona */}
                {resultado.zonas && resultado.zonas.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Detalles por zona:</h4>
                    <div className="space-y-2">
                      {resultado.zonas.map((zona, index) => (
                        <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg border">
                          <span className="font-medium text-gray-700">{zona.zona}</span>
                          <div className="flex gap-4 text-sm">
                            <span className="text-gray-600">Procesados: <strong>{zona.procesados}</strong></span>
                            <span className="text-green-600">Exitosos: <strong>{zona.exitosos}</strong></span>
                            {zona.fallidos > 0 && <span className="text-red-600">Fallidos: <strong>{zona.fallidos}</strong></span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tabla detallada */}
                {resultado.detalles && resultado.detalles.length > 0 && (
                  <div className="bg-white border rounded-xl overflow-hidden">
                    <h4 className="font-semibold text-gray-800 bg-gray-50 p-3 border-b">Detalle de todos los clientes:</h4>
                    <div className="overflow-x-auto max-h-96">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Código</th>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Cliente</th>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Zona</th>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Estado</th>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Observación</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {resultado.detalles.map((detalle, index) => (
                            <tr key={index} className={
                              detalle.estado === 'EXITOSO' ? 'bg-green-50' :
                              detalle.estado === 'FALLIDO' ? 'bg-red-50' : 'bg-orange-50'
                            }>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">{detalle.codigoCliente}</td>
                              <td className="px-4 py-2 text-sm text-gray-700">{detalle.nombreCliente}</td>
                              <td className="px-4 py-2 text-sm text-gray-700">{detalle.zona}</td>
                              <td className="px-4 py-2 text-sm">
                                {detalle.estado === 'EXITOSO' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                    <CheckCircle className="w-3 h-3" /> EXITOSO
                                  </span>
                                )}
                                {detalle.estado === 'FALLIDO' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                                    <XCircle className="w-3 h-3" /> FALLIDO
                                  </span>
                                )}
                                {detalle.estado === 'OMITIDO' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">
                                    <AlertCircle className="w-3 h-3" /> OMITIDO
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {detalle.estado === 'EXITOSO' && `Movido a ${detalle.rutaGenerica}`}
                                {detalle.estado === 'FALLIDO' && <span className="text-red-600">{detalle.error}</span>}
                                {detalle.estado === 'OMITIDO' && <span className="text-orange-600">{detalle.error}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-500 text-center">Tiempo total: {resultado.tiempoTotal}s</p>
              </div>
            ) : (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800 font-semibold">Error en la inhabilitación</p>
                </div>
                <p className="text-sm text-red-700 mt-2">{resultado.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InhabilitarClientes;
