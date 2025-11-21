import { query } from '../config/mysql.js';

/**
 * Modelo para gestionar clientes
 */
class Cliente {
  /**
   * Obtener cliente por código
   */
  static async getByCodigo(codigo) {
    try {
      const [cliente] = await query(
        'SELECT * FROM clientes WHERE codigo = ?',
        [codigo]
      );
      return cliente;
    } catch (error) {
      console.error('Error obteniendo cliente por código:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los clientes
   */
  static async getAll() {
    try {
      const clientes = await query(
        'SELECT * FROM clientes ORDER BY codigo'
      );
      return clientes;
    } catch (error) {
      console.error('Error obteniendo clientes:', error);
      throw error;
    }
  }

  /**
   * Obtener clientes activos
   */
  static async getActivos() {
    try {
      const clientes = await query(
        'SELECT * FROM clientes WHERE activo = TRUE ORDER BY codigo'
      );
      return clientes;
    } catch (error) {
      console.error('Error obteniendo clientes activos:', error);
      throw error;
    }
  }

  /**
   * Buscar clientes por ruta
   */
  static async getByRuta(ruta) {
    try {
      const clientes = await query(
        'SELECT * FROM clientes WHERE ruta = ? ORDER BY codigo',
        [ruta]
      );
      return clientes;
    } catch (error) {
      console.error('Error buscando clientes por ruta:', error);
      throw error;
    }
  }

  /**
   * Buscar clientes por zona
   */
  static async getByZona(zona) {
    try {
      const clientes = await query(
        'SELECT * FROM clientes WHERE zona = ? ORDER BY codigo',
        [zona]
      );
      return clientes;
    } catch (error) {
      console.error('Error buscando clientes por zona:', error);
      throw error;
    }
  }

  /**
   * Crear o actualizar cliente
   */
  static async upsert(codigo, nombre, ruta, zona, activo = true) {
    try {
      await query(
        `INSERT INTO clientes (codigo, nombre, ruta, zona, activo)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         nombre = VALUES(nombre),
         ruta = VALUES(ruta),
         zona = VALUES(zona),
         activo = VALUES(activo)`,
        [codigo, nombre, ruta, zona, activo]
      );
      return true;
    } catch (error) {
      console.error('Error en upsert de cliente:', error);
      throw error;
    }
  }

  /**
   * Insertar clientes en lote (para migración)
   */
  static async insertBatch(clientes) {
    if (!clientes || clientes.length === 0) return 0;

    try {
      const values = clientes.map(c => [
        c.codigo || c.CODIGO,
        c.nombre || c.NOMBRE || '',
        c.ruta || c.RUTA || '',
        c.zona || c.ZONA || '',
        c.activo !== undefined ? c.activo : (c.ACTIVO !== undefined ? c.ACTIVO : true)
      ]);

      const placeholders = clientes.map(() => '(?, ?, ?, ?, ?)').join(',');
      const flatValues = values.flat();

      await query(
        `INSERT INTO clientes (codigo, nombre, ruta, zona, activo) VALUES ${placeholders}
         ON DUPLICATE KEY UPDATE
         nombre = VALUES(nombre),
         ruta = VALUES(ruta),
         zona = VALUES(zona),
         activo = VALUES(activo)`,
        flatValues
      );

      return clientes.length;
    } catch (error) {
      console.error('Error insertando clientes en batch:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de cliente
   */
  static async setActivo(codigo, activo) {
    try {
      const result = await query(
        'UPDATE clientes SET activo = ? WHERE codigo = ?',
        [activo, codigo]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error actualizando estado de cliente:', error);
      throw error;
    }
  }

  /**
   * Contar total de clientes
   */
  static async count() {
    try {
      const [result] = await query('SELECT COUNT(*) as total FROM clientes');
      return parseInt(result?.total) || 0;
    } catch (error) {
      console.error('Error contando clientes:', error);
      throw error;
    }
  }

  /**
   * Contar clientes activos
   */
  static async countActivos() {
    try {
      const [result] = await query('SELECT COUNT(*) as total FROM clientes WHERE activo = TRUE');
      return parseInt(result?.total) || 0;
    } catch (error) {
      console.error('Error contando clientes activos:', error);
      throw error;
    }
  }

  /**
   * Truncar tabla (para reemplazar todos los datos)
   */
  static async truncate() {
    try {
      await query('TRUNCATE TABLE clientes');
      return true;
    } catch (error) {
      console.error('Error truncando tabla clientes:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de clientes
   */
  static async getEstadisticas() {
    try {
      const [stats] = await query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN activo = TRUE THEN 1 ELSE 0 END) as activos,
          SUM(CASE WHEN activo = FALSE THEN 1 ELSE 0 END) as inactivos,
          COUNT(DISTINCT zona) as total_zonas,
          COUNT(DISTINCT ruta) as total_rutas
        FROM clientes
      `);
      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas de clientes:', error);
      throw error;
    }
  }
}

export default Cliente;
