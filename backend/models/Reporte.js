import { query } from '../config/mysql.js';

class Reporte {
  // Crear nuevo reporte
  static async create(data) {
    try {
      const {
        codigoCliente,
        nombreCliente,
        motivo,
        zona,
        ruta,
        vendedor,
        resultado,
        razon,
        fotosRutas = []
      } = data;

      const result = await query(
        `INSERT INTO reportes
        (codigo_cliente, nombre_cliente, motivo, zona, ruta, vendedor, resultado, razon, fotos_rutas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          codigoCliente,
          nombreCliente,
          motivo,
          zona,
          ruta,
          vendedor,
          resultado,
          razon,
          JSON.stringify(fotosRutas)
        ]
      );

      return { id: result.insertId, ...data };
    } catch (error) {
      console.error('Error creando reporte:', error);
      throw error;
    }
  }

  // Obtener reportes por rango de fechas
  static async getByDateRange(fechaInicio, fechaFin) {
    try {
      const reportes = await query(
        `SELECT
          id,
          codigo_cliente as codigoCliente,
          nombre_cliente as nombreCliente,
          motivo,
          zona,
          ruta,
          vendedor,
          resultado,
          razon,
          fotos_rutas as fotosRutas,
          fecha_solicitud as fechaSolicitud,
          fecha_creacion as fechaCreacion
        FROM reportes
        WHERE DATE(fecha_solicitud) BETWEEN ? AND ?
        ORDER BY fecha_solicitud DESC`,
        [fechaInicio, fechaFin]
      );

      // Parse JSON de fotos_rutas
      return reportes.map(r => ({
        ...r,
        fotosRutas: r.fotosRutas ? JSON.parse(r.fotosRutas) : []
      }));
    } catch (error) {
      console.error('Error obteniendo reportes por fecha:', error);
      throw error;
    }
  }

  // Obtener reportes del día actual
  static async getToday() {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      return await this.getByDateRange(hoy, hoy);
    } catch (error) {
      console.error('Error obteniendo reportes de hoy:', error);
      throw error;
    }
  }

  // Obtener reportes por código de cliente
  static async getByCliente(codigoCliente) {
    try {
      const reportes = await query(
        `SELECT
          id,
          codigo_cliente as codigoCliente,
          nombre_cliente as nombreCliente,
          motivo,
          zona,
          ruta,
          vendedor,
          resultado,
          razon,
          fotos_rutas as fotosRutas,
          fecha_solicitud as fechaSolicitud,
          fecha_creacion as fechaCreacion
        FROM reportes
        WHERE codigo_cliente = ?
        ORDER BY fecha_solicitud DESC`,
        [codigoCliente]
      );

      return reportes.map(r => ({
        ...r,
        fotosRutas: r.fotosRutas ? JSON.parse(r.fotosRutas) : []
      }));
    } catch (error) {
      console.error('Error obteniendo reportes por cliente:', error);
      throw error;
    }
  }

  // Obtener estadísticas por rango de fechas
  static async getEstadisticas(fechaInicio, fechaFin) {
    try {
      const [stats] = await query(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN resultado = 'SI' THEN 1 ELSE 0 END) as aprobados,
          SUM(CASE WHEN resultado = 'NO' THEN 1 ELSE 0 END) as rechazados,
          SUM(CASE WHEN resultado = 'MANUAL' THEN 1 ELSE 0 END) as manuales
        FROM reportes
        WHERE DATE(fecha_solicitud) BETWEEN ? AND ?`,
        [fechaInicio, fechaFin]
      );

      return {
        total: parseInt(stats?.total) || 0,
        aprobados: parseInt(stats?.aprobados) || 0,
        rechazados: parseInt(stats?.rechazados) || 0,
        manuales: parseInt(stats?.manuales) || 0
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // Obtener estadísticas de hoy
  static async getEstadisticasHoy() {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      return await this.getEstadisticas(hoy, hoy);
    } catch (error) {
      console.error('Error obteniendo estadísticas de hoy:', error);
      throw error;
    }
  }

  // Obtener todos los reportes (con límite)
  static async getAll(limit = 100, offset = 0) {
    try {
      const reportes = await query(
        `SELECT
          id,
          codigo_cliente as codigoCliente,
          nombre_cliente as nombreCliente,
          motivo,
          zona,
          ruta,
          vendedor,
          resultado,
          razon,
          fotos_rutas as fotosRutas,
          fecha_solicitud as fechaSolicitud,
          fecha_creacion as fechaCreacion
        FROM reportes
        ORDER BY fecha_solicitud DESC
        LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      return reportes.map(r => ({
        ...r,
        fotosRutas: r.fotosRutas ? JSON.parse(r.fotosRutas) : []
      }));
    } catch (error) {
      console.error('Error obteniendo todos los reportes:', error);
      throw error;
    }
  }

  // Contar total de reportes
  static async count() {
    try {
      const [result] = await query('SELECT COUNT(*) as total FROM reportes');
      return parseInt(result?.total) || 0;
    } catch (error) {
      console.error('Error contando reportes:', error);
      throw error;
    }
  }
}

export default Reporte;
