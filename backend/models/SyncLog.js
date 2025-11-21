import { query } from '../config/mysql.js';

/**
 * Modelo para gestionar logs de sincronización
 */
class SyncLog {
  /**
   * Registrar una sincronización
   */
  static async create(tipoSync, registrosInsertados, registrosActualizados, registrosSinCambios, estado, mensaje) {
    try {
      const result = await query(
        `INSERT INTO sync_log
        (tipo_sync, registros_insertados, registros_actualizados, registros_sin_cambios, estado, mensaje)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [tipoSync, registrosInsertados, registrosActualizados, registrosSinCambios, estado, mensaje || null]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error registrando log de sincronización:', error);
      throw error;
    }
  }

  /**
   * Obtener últimos logs
   */
  static async getRecent(limit = 20) {
    try {
      const logs = await query(
        'SELECT * FROM sync_log ORDER BY fecha_sync DESC LIMIT ?',
        [limit]
      );
      return logs;
    } catch (error) {
      console.error('Error obteniendo logs recientes:', error);
      throw error;
    }
  }

  /**
   * Obtener último log exitoso
   */
  static async getLastSuccess() {
    try {
      const [log] = await query(
        "SELECT * FROM sync_log WHERE estado = 'SUCCESS' ORDER BY fecha_sync DESC LIMIT 1"
      );
      return log;
    } catch (error) {
      console.error('Error obteniendo último log exitoso:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de sincronizaciones
   */
  static async getStats() {
    try {
      const [total] = await query('SELECT COUNT(*) as total FROM sync_log');
      const [exitosas] = await query("SELECT COUNT(*) as total FROM sync_log WHERE estado = 'SUCCESS'");
      const [fallidas] = await query("SELECT COUNT(*) as total FROM sync_log WHERE estado = 'ERROR'");
      const ultimo = await this.getLastSuccess();

      return {
        totalSincronizaciones: total.total,
        exitosas: exitosas.total,
        fallidas: fallidas.total,
        ultimaSincronizacion: ultimo ? ultimo.fecha_sync : null
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de sync:', error);
      throw error;
    }
  }
}

export default SyncLog;
