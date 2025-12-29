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
      console.log(`📊 Buscando reportes desde ${fechaInicio} hasta ${fechaFin}`);

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

      console.log(`   ✓ ${reportes.length} reportes encontrados`);

      // Parse JSON de fotos_rutas con manejo de errores
      return reportes.map(r => {
        let fotosRutas = [];

        try {
          if (r.fotosRutas) {
            if (typeof r.fotosRutas === 'string') {
              fotosRutas = JSON.parse(r.fotosRutas);
            } else if (Array.isArray(r.fotosRutas)) {
              fotosRutas = r.fotosRutas;
            }
          }
        } catch (parseError) {
          console.error(`⚠️  Error parseando JSON de fotos para reporte ${r.id}:`, parseError.message);
          fotosRutas = [];
        }

        return {
          ...r,
          fotosRutas
        };
      });
    } catch (error) {
      console.error('❌ Error obteniendo reportes por fecha:', error);
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

      return reportes.map(r => {
        let fotosRutas = [];
        try {
          if (r.fotosRutas) {
            if (typeof r.fotosRutas === 'string') {
              fotosRutas = JSON.parse(r.fotosRutas);
            } else if (Array.isArray(r.fotosRutas)) {
              fotosRutas = r.fotosRutas;
            }
          }
        } catch (parseError) {
          console.error(`⚠️  Error parseando JSON de fotos para reporte ${r.id}:`, parseError.message);
          fotosRutas = [];
        }
        return { ...r, fotosRutas };
      });
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

      return reportes.map(r => {
        let fotosRutas = [];
        try {
          if (r.fotosRutas) {
            if (typeof r.fotosRutas === 'string') {
              fotosRutas = JSON.parse(r.fotosRutas);
            } else if (Array.isArray(r.fotosRutas)) {
              fotosRutas = r.fotosRutas;
            }
          }
        } catch (parseError) {
          console.error(`⚠️  Error parseando JSON de fotos para reporte ${r.id}:`, parseError.message);
          fotosRutas = [];
        }
        return { ...r, fotosRutas };
      });
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

  // Obtener solicitudes MANUAL pendientes de aprobación
  static async getPendingManualApprovals() {
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
          fecha_creacion as fechaCreacion,
          estado_aprobacion as estadoAprobacion,
          supervisor_aprobador as supervisorAprobador,
          fecha_aprobacion as fechaAprobacion,
          comentario_aprobacion as comentarioAprobacion
        FROM reportes
        WHERE resultado = 'MANUAL' AND (estado_aprobacion = 'PENDIENTE' OR estado_aprobacion IS NULL)
        ORDER BY fecha_solicitud DESC`
      );

      return reportes.map(r => {
        let fotosRutas = [];
        try {
          if (r.fotosRutas) {
            if (typeof r.fotosRutas === 'string') {
              fotosRutas = JSON.parse(r.fotosRutas);
            } else if (Array.isArray(r.fotosRutas)) {
              fotosRutas = r.fotosRutas;
            }
          }
        } catch (parseError) {
          console.error(`⚠️  Error parseando JSON de fotos para reporte ${r.id}:`, parseError.message);
          fotosRutas = [];
        }
        return { ...r, fotosRutas };
      });
    } catch (error) {
      console.error('Error obteniendo solicitudes pendientes:', error);
      throw error;
    }
  }

  // Obtener solicitudes MANUAL pendientes de aprobación por rango de fechas
  static async getPendingManualApprovalsByDateRange(fechaInicio, fechaFin) {
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
          fecha_creacion as fechaCreacion,
          estado_aprobacion as estadoAprobacion,
          supervisor_aprobador as supervisorAprobador,
          fecha_aprobacion as fechaAprobacion,
          comentario_aprobacion as comentarioAprobacion
        FROM reportes
        WHERE resultado = 'MANUAL'
          AND (estado_aprobacion = 'PENDIENTE' OR estado_aprobacion IS NULL)
          AND DATE(fecha_solicitud) BETWEEN ? AND ?
        ORDER BY fecha_solicitud DESC`,
        [fechaInicio, fechaFin]
      );

      return reportes.map(r => {
        let fotosRutas = [];
        try {
          if (r.fotosRutas) {
            if (typeof r.fotosRutas === 'string') {
              fotosRutas = JSON.parse(r.fotosRutas);
            } else if (Array.isArray(r.fotosRutas)) {
              fotosRutas = r.fotosRutas;
            }
          }
        } catch (parseError) {
          console.error(`⚠️  Error parseando JSON de fotos para reporte ${r.id}:`, parseError.message);
          fotosRutas = [];
        }
        return { ...r, fotosRutas };
      });
    } catch (error) {
      console.error('Error obteniendo solicitudes pendientes por fecha:', error);
      throw error;
    }
  }

  // Aprobar o rechazar solicitud MANUAL
  static async approveOrReject(id, decision, supervisorNombre, comentario = null) {
    try {
      const resultado = decision === 'APROBADO' ? 'SI' : 'NO';

      // Obtener el reporte antes de actualizar
      const [reporteAntes] = await query('SELECT * FROM reportes WHERE id = ?', [id]);

      if (!reporteAntes || reporteAntes.resultado !== 'MANUAL') {
        throw new Error('No se encontró el reporte o no es una solicitud MANUAL');
      }

      // Actualizar en la BD
      await query(
        `UPDATE reportes SET
          resultado = ?,
          estado_aprobacion = ?,
          supervisor_aprobador = ?,
          fecha_aprobacion = NOW(),
          comentario_aprobacion = ?
        WHERE id = ? AND resultado = 'MANUAL'`,
        [resultado, decision, supervisorNombre, comentario, id]
      );

      // Obtener el reporte actualizado
      const [updated] = await query('SELECT * FROM reportes WHERE id = ?', [id]);

      // Agregar al archivo Excel con el resultado final
      const { agregarSolicitudAlReporte } = await import('../services/reportGenerator.js');
      await agregarSolicitudAlReporte({
        codigoCliente: updated.codigo_cliente,
        nombreCliente: updated.nombre_cliente,
        motivo: updated.motivo,
        zona: updated.zona,
        ruta: updated.ruta,
        vendedor: updated.vendedor,
        resultado: resultado, // SI o NO
        razon: comentario ?
          `${updated.razon} | Decisión: ${decision} por ${supervisorNombre} | Comentario: ${comentario}` :
          `${updated.razon} | Decisión: ${decision} por ${supervisorNombre}`
      });

      console.log(`✅ Solicitud ${id} aprobada/rechazada y agregada al Excel`);

      return {
        success: true,
        reporte: updated
      };
    } catch (error) {
      console.error('Error aprobando/rechazando solicitud:', error);
      throw error;
    }
  }

  // Obtener solicitud por ID (incluyendo campos de aprobación)
  static async getById(id) {
    try {
      const [reporte] = await query(
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
          fecha_creacion as fechaCreacion,
          estado_aprobacion as estadoAprobacion,
          supervisor_aprobador as supervisorAprobador,
          fecha_aprobacion as fechaAprobacion,
          comentario_aprobacion as comentarioAprobacion
        FROM reportes
        WHERE id = ?`,
        [id]
      );

      if (!reporte) {
        return null;
      }

      let fotosRutas = [];
      try {
        if (reporte.fotosRutas) {
          if (typeof reporte.fotosRutas === 'string') {
            fotosRutas = JSON.parse(reporte.fotosRutas);
          } else if (Array.isArray(reporte.fotosRutas)) {
            fotosRutas = reporte.fotosRutas;
          }
        }
      } catch (parseError) {
        console.error(`⚠️  Error parseando JSON de fotos para reporte ${reporte.id}:`, parseError.message);
        fotosRutas = [];
      }

      return { ...reporte, fotosRutas };
    } catch (error) {
      console.error('Error obteniendo reporte por ID:', error);
      throw error;
    }
  }
}

export default Reporte;
