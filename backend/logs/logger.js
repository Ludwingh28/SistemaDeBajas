import fs from "fs/promises";
import { paths } from "../config/database.js";

/**
 * Estructura de log de solicitud
 */
const crearLogSolicitud = (solicitud, ipAddress) => {
  return {
    timestamp: new Date().toISOString(),
    ip: ipAddress,
    codigoCliente: solicitud.codigoCliente,
    nombreCliente: solicitud.nombreCliente,
    motivo: solicitud.motivo,
    vendedor: solicitud.vendedor,
    zona: solicitud.zona,
    ruta: solicitud.ruta,
    resultado: solicitud.resultado,
    razon: solicitud.razon,
  };
};

/**
 * Leer logs existentes
 */
const leerLogs = async () => {
  try {
    const content = await fs.readFile(paths.solicitudesLog, "utf-8");
    return JSON.parse(content);
  } catch {
    return []; // Si no existe, retornar array vacío
  }
};

/**
 * Guardar log de solicitud
 */
export const logSolicitud = async (solicitud, ipAddress) => {
  try {
    const logs = await leerLogs();
    const nuevoLog = crearLogSolicitud(solicitud, ipAddress);

    logs.push(nuevoLog);

    // Guardar logs actualizados
    await fs.writeFile(paths.solicitudesLog, JSON.stringify(logs, null, 2), "utf-8");

    console.log(`📝 Log guardado: ${solicitud.codigoCliente}`);
  } catch (error) {
    console.error("❌ Error guardando log:", error);
    // No lanzar error - el log no debe detener el proceso
  }
};

/**
 * Obtener estadísticas de logs
 */
export const getEstadisticasLogs = async () => {
  try {
    const logs = await leerLogs();

    const hoy = new Date().toISOString().split("T")[0];
    const logsHoy = logs.filter((log) => log.timestamp.startsWith(hoy));

    const aprobadas = logsHoy.filter((l) => l.resultado === "SI").length;
    const rechazadas = logsHoy.filter((l) => l.resultado === "NO").length;
    const derivadas = logsHoy.filter((l) => l.resultado.includes("DERIVADO")).length;

    return {
      totalHistorico: logs.length,
      totalHoy: logsHoy.length,
      hoy: {
        aprobadas,
        rechazadas,
        derivadas,
      },
    };
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas de logs:", error);
    return null;
  }
};

/**
 * Limpiar logs antiguos (más de 90 días)
 */
export const limpiarLogsAntiguos = async () => {
  try {
    const logs = await leerLogs();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 90);

    const logsActualizados = logs.filter((log) => {
      const fechaLog = new Date(log.timestamp);
      return fechaLog >= fechaLimite;
    });

    await fs.writeFile(paths.solicitudesLog, JSON.stringify(logsActualizados, null, 2), "utf-8");

    const eliminados = logs.length - logsActualizados.length;

    if (eliminados > 0) {
      console.log(`🗑️  ${eliminados} log(s) antiguo(s) eliminado(s)`);
    }
  } catch (error) {
    console.error("❌ Error limpiando logs antiguos:", error);
  }
};
