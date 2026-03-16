import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, CheckCircle } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

const SincronizarClientes = ({ onBack }) => {
  const [reemplazar, setReemplazar] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statsClientes, setStatsClientes] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    total_zonas: 0,
    total_rutas: 0
  });

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const response = await axios.get("/api/clientes/estadisticas");
      setStatsClientes(response.data);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  const iniciarSincronizacion = async () => {
    if (reemplazar) {
      const result = await Swal.fire({
        icon: "warning",
        title: "¿Estás seguro?",
        text: "Esta acción REEMPLAZARÁ todos los clientes existentes con los datos de Dualpoint. No se puede deshacer.",
        showCancelButton: true,
        confirmButtonText: "Sí, reemplazar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc2626",
      });

      if (!result.isConfirmed) return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      setProgress(30);

      const response = await axios.post(
        "/api/sincronizar-clientes",
        { reemplazar: reemplazar },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      setProgress(90);

      if (response.data.success) {
        setProgress(100);

        // Mostrar resultados detallados por zona
        let detalleHTML = `
          <div style="text-align: left; padding: 10px;">
            <p style="font-size: 16px; margin-bottom: 15px;">
              <strong>Resultado de sincronización:</strong>
            </p>
            <ul style="list-style: none; padding: 0;">
        `;

        response.data.zonas.forEach(zona => {
          const icono = zona.success ? "✅" : "❌";
          const registros = zona.success ? `${zona.registros} registros` : zona.error;
          detalleHTML += `
            <li style="margin-bottom: 10px;">
              ${icono} <strong>${zona.zona}</strong>: ${registros}
            </li>
          `;
        });

        detalleHTML += `
            </ul>
            <hr style="margin: 15px 0;">
            <p style="font-size: 14px; margin-top: 10px;">
              <strong>Total:</strong> ${response.data.totalRegistros} registros importados<br>
              <strong>Zonas exitosas:</strong> ${response.data.zonasExitosas}/${response.data.zonas.length}
            </p>
          </div>
        `;

        await Swal.fire({
          icon: "success",
          title: "Sincronización completada",
          html: detalleHTML,
          confirmButtonText: "Aceptar",
        });

        // Recargar estadísticas
        await cargarEstadisticas();
      } else {
        throw new Error(response.data.message || "Error en sincronización");
      }
    } catch (error) {
      console.error("Error en sincronización:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || error.message || "Error al sincronizar clientes",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
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
          <div className="bg-blue-100 p-3 rounded-xl">
            <RefreshCw className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Sincronizar Clientes desde Dualpoint</h2>
            <p className="text-gray-600 text-sm">Actualización automática desde los 3 sistemas regionales</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{statsClientes.total.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Total Clientes</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statsClientes.activos.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Activos</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{statsClientes.inactivos.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Inactivos</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{statsClientes.total_zonas}</div>
            <div className="text-xs text-gray-600">Zonas</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{statsClientes.total_rutas}</div>
            <div className="text-xs text-gray-600">Rutas</div>
          </div>
        </div>

        {/* Sistemas a sincronizar */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <p className="text-sm font-semibold text-blue-900 mb-2">Sistemas a sincronizar:</p>
          <ul className="space-y-1 text-sm text-blue-800">
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-600" /> Santa Cruz (dPointCruzimex-CEN)</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-600" /> Cochabamba (dPointCruzimex-CB)</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-600" /> La Paz (dPointCruzimex-LP)</li>
          </ul>
        </div>

        {/* Modo reemplazar */}
        <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors mb-6">
          <input
            type="checkbox"
            checked={reemplazar}
            onChange={(e) => setReemplazar(e.target.checked)}
            disabled={isProcessing}
            className="w-5 h-5 cursor-pointer"
          />
          <div>
            <span className="font-medium text-gray-700">Modo Reemplazar</span>
            <p className="text-xs text-gray-500">Eliminará todos los clientes actuales y los reemplazará con los datos de Dualpoint</p>
          </div>
        </label>

        {/* Botón */}
        <button
          onClick={iniciarSincronizacion}
          disabled={isProcessing}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2
            ${isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"}`}
        >
          {isProcessing ? (
            <><RefreshCw className="w-5 h-5 animate-spin" /> Sincronizando... {progress}%</>
          ) : (
            <><RefreshCw className="w-5 h-5" /> Iniciar Sincronización Automática</>
          )}
        </button>

        {/* Barra de progreso */}
        {isProcessing && (
          <div className="mt-4">
            <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold transition-all duration-300"
                style={{ width: `${progress}%` }}
              >
                {progress}%
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              {progress < 30 && "Iniciando sincronización..."}
              {progress >= 30 && progress < 90 && "Descargando e importando datos..."}
              {progress >= 90 && "Finalizando..."}
            </p>
          </div>
        )}

        {/* Nota */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mt-6">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> Este proceso puede tardar varios minutos. También se ejecuta automáticamente todos los <strong>sábados a las 12:00 PM</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SincronizarClientes;
