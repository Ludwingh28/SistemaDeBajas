import { query } from '../config/mysql.js';

/**
 * Modelo para gestionar planificación de rutas y vendedores
 */
class PlanificacionRuta {
  /**
   * Obtener todas las rutas
   */
  static async getAll() {
    try {
      const rutas = await query(
        'SELECT * FROM planificacion_rutas ORDER BY zona, dia, ruta ASC'
      );
      return rutas;
    } catch (error) {
      console.error('Error obteniendo rutas:', error);
      throw error;
    }
  }

  /**
   * Obtener ruta por código
   */
  static async getByRuta(codigoRuta) {
    try {
      const [ruta] = await query(
        'SELECT * FROM planificacion_rutas WHERE ruta = ?',
        [codigoRuta]
      );
      return ruta;
    } catch (error) {
      console.error('Error obteniendo ruta por código:', error);
      throw error;
    }
  }

  /**
   * Buscar rutas por vendedor
   */
  static async getByVendedor(vendedor) {
    try {
      const rutas = await query(
        'SELECT * FROM planificacion_rutas WHERE vendedor LIKE ? ORDER BY dia',
        [`%${vendedor}%`]
      );
      return rutas;
    } catch (error) {
      console.error('Error buscando rutas por vendedor:', error);
      throw error;
    }
  }

  /**
   * Buscar rutas por zona
   */
  static async getByZona(zona) {
    try {
      const rutas = await query(
        'SELECT * FROM planificacion_rutas WHERE zona = ? ORDER BY dia',
        [zona]
      );
      return rutas;
    } catch (error) {
      console.error('Error buscando rutas por zona:', error);
      throw error;
    }
  }

  /**
   * Crear nueva ruta
   */
  static async create(ruta, zona, dia, vendedor) {
    try {
      const result = await query(
        'INSERT INTO planificacion_rutas (ruta, zona, dia, vendedor) VALUES (?, ?, ?, ?)',
        [ruta, zona, dia, vendedor || '']
      );
      return { id: result.insertId, ruta, zona, dia, vendedor };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('La ruta ya existe');
      }
      console.error('Error creando ruta:', error);
      throw error;
    }
  }

  /**
   * Actualizar ruta existente
   */
  static async update(ruta, zona, dia, vendedor) {
    try {
      const result = await query(
        'UPDATE planificacion_rutas SET zona = ?, dia = ?, vendedor = ?, fecha_sincronizacion = NOW() WHERE ruta = ?',
        [zona, dia, vendedor || '', ruta]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error actualizando ruta:', error);
      throw error;
    }
  }

  /**
   * Insertar rutas en lote (para migración inicial)
   */
  static async insertBatch(rutas) {
    if (!rutas || rutas.length === 0) {
      return 0;
    }

    try {
      const values = rutas.map(r => [
        r.RUTA || r.ruta,
        r.ZONA || r.zona,
        r.DIA || r.dia,
        r.VENDEDOR || r.vendedor || ''
      ]);

      const placeholders = values.map(() => '(?, ?, ?, ?)').join(', ');
      const flatValues = values.flat();

      await query(
        `INSERT INTO planificacion_rutas (ruta, zona, dia, vendedor) VALUES ${placeholders}`,
        flatValues
      );

      return values.length;
    } catch (error) {
      console.error('Error insertando rutas en lote:', error);
      throw error;
    }
  }

  /**
   * Limpiar todas las rutas (usar con precaución)
   */
  static async truncate() {
    try {
      await query('TRUNCATE TABLE planificacion_rutas');
      return true;
    } catch (error) {
      console.error('Error limpiando tabla de rutas:', error);
      throw error;
    }
  }

  /**
   * Contar total de rutas
   */
  static async count() {
    try {
      const [result] = await query('SELECT COUNT(*) as total FROM planificacion_rutas');
      return result.total;
    } catch (error) {
      console.error('Error contando rutas:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas
   */
  static async getStats() {
    try {
      const [totalRutas] = await query('SELECT COUNT(*) as total FROM planificacion_rutas');
      const zonas = await query('SELECT DISTINCT zona FROM planificacion_rutas ORDER BY zona');
      const [totalVendedores] = await query('SELECT COUNT(DISTINCT vendedor) as total FROM planificacion_rutas WHERE vendedor != ""');

      return {
        totalRutas: totalRutas.total,
        totalZonas: zonas.length,
        totalVendedores: totalVendedores.total,
        zonas: zonas.map(z => z.zona)
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}

export default PlanificacionRuta;
