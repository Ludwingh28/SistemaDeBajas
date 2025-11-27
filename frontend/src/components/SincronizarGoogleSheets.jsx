import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, Cloud, CheckCircle, XCircle, Clock } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

const SincronizarGoogleSheets = ({ onBack }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoadingLogs(true);
      const [statsRes, logsRes] = await Promise.all([
        axios.get("/api/planificacion/stats"),
        axios.get("/api/planificacion/sync-logs?limit=10")
      ]);

      setStats(statsRes.data.stats);
      setSyncLogs(logsRes.data.logs || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const ejecutarLimpiezaYMigracion = async () => {
    const result = await Swal.fire({
      title: "⚠️ ¿Limpiar y Recargar TODO?",
      html: `
        <p><strong>Esta acción ELIMINARÁ todos los datos actuales</strong> de planificación de rutas y los reemplazará con los datos del CSV/Google Sheets.</p>
        <p class="text-sm text-red-600 mt-2"><strong>⚠️ ADVERTENCIA:</strong> Esta operación NO se puede deshacer.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, limpiar y recargar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    setIsSyncing(true);

    const loadingSwal = Swal.fire({
      title: "Limpiando y recargando...",
      html: "Eliminando datos antiguos y cargando nuevos registros...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const supervisorCode = sessionStorage.getItem("supervisorCode");

      // Primero limpiar la tabla
      await axios.delete("/api/planificacion/limpiar", {
        data: { codigoSupervisor: supervisorCode }
      });

      // Esperar 1 segundo para asegurar que la limpieza se complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Luego ejecutar migración
      const response = await axios.post("/api/planificacion/migrar", {
        codigoSupervisor: supervisorCode
      });

      loadingSwal.close();

      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "¡Recarga Exitosa!",
          html: `
            <div class="text-left space-y-2">
              <p><strong>✅ Registros insertados:</strong> ${response.data.insertados || 0}</p>
            </div>
          `,
          confirmButtonText: "Entendido",
        });

        cargarDatos();
      }
    } catch (error) {
      loadingSwal.close();

      Swal.fire({
        icon: "error",
        title: "Error en Recarga",
        text: error.response?.data?.error || error.message || "No se pudo completar la operación",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const ejecutarMigracion = async () => {
    const result = await Swal.fire({
      title: "¿Ejecutar Migración Inicial?",
      html: `
        <p>Esta opción <strong>cargará todos los datos</strong> desde el archivo CSV/Google Sheets a la base de datos.</p>
        <p class="text-sm text-yellow-600 mt-2"><strong>⚠️ Nota:</strong> Solo usar cuando la tabla está vacía o es la primera vez.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, migrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f59e0b",
    });

    if (!result.isConfirmed) return;

    setIsSyncing(true);

    const loadingSwal = Swal.fire({
      title: "Migrando datos...",
      html: "Cargando todos los registros a la base de datos...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const supervisorCode = sessionStorage.getItem("supervisorCode");
      const response = await axios.post("/api/planificacion/migrar", {
        codigoSupervisor: supervisorCode
      });

      loadingSwal.close();

      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "¡Migración Exitosa!",
          html: `
            <div class="text-left space-y-2">
              <p><strong>✅ Registros insertados:</strong> ${response.data.insertados || 0}</p>
            </div>
          `,
          confirmButtonText: "Entendido",
        });

        cargarDatos();
      }
    } catch (error) {
      loadingSwal.close();

      Swal.fire({
        icon: "error",
        title: "Error en Migración",
        text: error.response?.data?.error || error.message || "No se pudo completar la migración",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const ejecutarSincronizacion = async () => {
    const result = await Swal.fire({
      title: "¿Sincronizar ahora?",
      html: `
        <p>Se sincronizarán los datos de <strong>Planificación de Rutas</strong> desde CSV/Google Sheets.</p>
        <p class="text-sm text-gray-600 mt-2">Esto actualizará registros existentes e insertará nuevos.</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, sincronizar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#3b82f6",
    });

    if (!result.isConfirmed) return;

    setIsSyncing(true);

    const loadingSwal = Swal.fire({
      title: "Sincronizando...",
      html: "Actualizando datos...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const supervisorCode = sessionStorage.getItem("supervisorCode");
      const response = await axios.post("/api/planificacion/sincronizar", {
        codigoSupervisor: supervisorCode
      });

      loadingSwal.close();

      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "¡Sincronización Exitosa!",
          html: `
            <div class="text-left space-y-2">
              <p><strong>✅ Insertados:</strong> ${response.data.insertados || 0} nuevos registros</p>
              <p><strong>🔄 Actualizados:</strong> ${response.data.actualizados || 0} registros</p>
              <p><strong>⏭️ Sin cambios:</strong> ${response.data.sinCambios || 0} registros</p>
            </div>
          `,
          confirmButtonText: "Entendido",
        });

        cargarDatos();
      }
    } catch (error) {
      loadingSwal.close();

      Swal.fire({
        icon: "error",
        title: "Error en Sincronización",
        text: error.response?.data?.error || error.message || "No se pudo completar la sincronización",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
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
        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Cloud className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Sincronizar Google Sheets</h2>
            <p className="text-gray-600 text-sm">Actualiza los datos de planificación de rutas manualmente</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <p className="text-sm text-blue-900">
            <strong>¿Qué se sincroniza?</strong> Datos de planificación de rutas (zonas, rutas, vendedores) desde la hoja de Google Sheets configurada.
          </p>
          <p className="text-xs text-blue-800 mt-2">
            <strong>Nota:</strong> El sistema también sincroniza automáticamente a las <strong>6:00 AM</strong> y <strong>7:00 PM</strong> todos los días.
          </p>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalRutas || 0}</div>
              <div className="text-xs text-gray-600">Total Rutas</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalZonas || 0}</div>
              <div className="text-xs text-gray-600">Zonas</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalVendedores || 0}</div>
              <div className="text-xs text-gray-600">Vendedores</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-orange-600">
                {stats.ultimaSincronizacion ? formatearFecha(stats.ultimaSincronizacion).split(",")[0] : "-"}
              </div>
              <div className="text-xs text-gray-600">Última Sync</div>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Botón Limpiar y Recargar TODO */}
          <button
            onClick={ejecutarLimpiezaYMigracion}
            disabled={isSyncing}
            className={`py-4 rounded-xl font-semibold text-white text-lg flex items-center justify-center gap-3 transition-all
              ${isSyncing ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 active:scale-95 shadow-lg hover:shadow-xl"}`}
          >
            <RefreshCw className={`w-6 h-6 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Procesando..." : "Limpiar y Recargar"}
          </button>

          {/* Botón Migración Inicial */}
          <button
            onClick={ejecutarMigracion}
            disabled={isSyncing}
            className={`py-4 rounded-xl font-semibold text-white text-lg flex items-center justify-center gap-3 transition-all
              ${isSyncing ? "bg-gray-400 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700 active:scale-95 shadow-lg hover:shadow-xl"}`}
          >
            <Cloud className={`w-6 h-6 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Procesando..." : "Migración Inicial"}
          </button>

          {/* Botón Sincronizar */}
          <button
            onClick={ejecutarSincronizacion}
            disabled={isSyncing}
            className={`py-4 rounded-xl font-semibold text-white text-lg flex items-center justify-center gap-3 transition-all
              ${isSyncing ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-lg hover:shadow-xl"}`}
          >
            <RefreshCw className={`w-6 h-6 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Sincronizando..." : "Sincronizar Ahora"}
          </button>
        </div>

        {/* Info de los botones */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm space-y-2">
          <p className="text-gray-700"><strong className="text-red-600">Limpiar y Recargar:</strong> ELIMINA todos los datos actuales y carga nuevos. Usa esto cuando tengas problemas de duplicados.</p>
          <p className="text-gray-700"><strong className="text-amber-600">Migración Inicial:</strong> Carga datos solo cuando la tabla está vacía (primera vez).</p>
          <p className="text-gray-700"><strong className="text-blue-600">Sincronizar Ahora:</strong> Actualiza registros existentes e inserta nuevos. Ideal para actualizaciones regulares.</p>
        </div>

        {/* Logs de Sincronización */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Historial de Sincronizaciones
          </h3>

          {isLoadingLogs ? (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p>Cargando historial...</p>
            </div>
          ) : syncLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Cloud className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No hay sincronizaciones registradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {syncLogs.map((log) => {
                const exitoso = log.estado === 'SUCCESS';
                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      exitoso ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {exitoso ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${exitoso ? "text-green-800" : "text-red-800"}`}>
                            {exitoso ? "Sincronización exitosa" : "Sincronización fallida"}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatearFecha(log.fecha_sync)}
                          </p>
                          {log.tipo_sync && (
                            <p className="text-xs text-gray-500 mt-1">
                              Tipo: {log.tipo_sync} • Insertados: {log.registros_insertados || 0} • Actualizados: {log.registros_actualizados || 0}
                            </p>
                          )}
                          {log.mensaje && (
                            <p className="text-xs text-gray-700 mt-2 bg-white bg-opacity-50 p-2 rounded">
                              {log.mensaje}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SincronizarGoogleSheets;
