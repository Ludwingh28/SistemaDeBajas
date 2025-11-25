import { query } from '../config/mysql.js';

/**
 * Modelo para gestionar rutas
 */
class Ruta {
  /**
   * Obtener todas las rutas con información relacionada
   */
  static async getAll() {
    try {
      const rutas = await query(`
        SELECT
          r.id,
          r.codigo,
          r.zona_id,
          z.codigo as zona_codigo,
          z.nombre as zona_nombre,
          r.vendedor_id,
          v.nombre_completo as vendedor_nombre,
          GROUP_CONCAT(d.codigo ORDER BY d.orden SEPARATOR ', ') as dias_codigos,
          GROUP_CONCAT(d.nombre ORDER BY d.orden SEPARATOR ', ') as dias_nombres,
          r.fecha_creacion,
          r.fecha_actualizacion
        FROM rutas r
        INNER JOIN zonas z ON r.zona_id = z.id
        LEFT JOIN vendedores v ON r.vendedor_id = v.id
        LEFT JOIN rutas_dias rd ON r.id = rd.ruta_id
        LEFT JOIN dias d ON rd.dia_id = d.id
        GROUP BY r.id, r.codigo, r.zona_id, z.codigo, z.nombre, r.vendedor_id, v.nombre_completo, r.fecha_creacion, r.fecha_actualizacion
        ORDER BY z.codigo, r.codigo
      `);
      return rutas;
    } catch (error) {
      console.error('Error obteniendo rutas:', error);
      throw error;
    }
  }

  /**
   * Obtener ruta por ID
   */
  static async getById(id) {
    try {
      const [ruta] = await query(`
        SELECT
          r.id,
          r.codigo,
          r.zona_id,
          z.codigo as zona_codigo,
          z.nombre as zona_nombre,
          r.vendedor_id,
          v.nombre_completo as vendedor_nombre,
          GROUP_CONCAT(d.codigo ORDER BY d.orden SEPARATOR ', ') as dias_codigos,
          GROUP_CONCAT(d.nombre ORDER BY d.orden SEPARATOR ', ') as dias_nombres,
          r.fecha_creacion,
          r.fecha_actualizacion
        FROM rutas r
        INNER JOIN zonas z ON r.zona_id = z.id
        LEFT JOIN vendedores v ON r.vendedor_id = v.id
        LEFT JOIN rutas_dias rd ON r.id = rd.ruta_id
        LEFT JOIN dias d ON rd.dia_id = d.id
        WHERE r.id = ?
        GROUP BY r.id, r.codigo, r.zona_id, z.codigo, z.nombre, r.vendedor_id, v.nombre_completo, r.fecha_creacion, r.fecha_actualizacion
      `, [id]);
      return ruta;
    } catch (error) {
      console.error('Error obteniendo ruta por ID:', error);
      throw error;
    }
  }

  /**
   * Obtener ruta por código
   */
  static async getByCodigo(codigo) {
    try {
      const [ruta] = await query(`
        SELECT
          r.id,
          r.codigo,
          r.zona_id,
          z.codigo as zona_codigo,
          z.nombre as zona_nombre,
          r.vendedor_id,
          v.nombre_completo as vendedor_nombre,
          GROUP_CONCAT(d.codigo ORDER BY d.orden SEPARATOR ', ') as dias_codigos,
          GROUP_CONCAT(d.nombre ORDER BY d.orden SEPARATOR ', ') as dias_nombres,
          r.fecha_creacion,
          r.fecha_actualizacion
        FROM rutas r
        INNER JOIN zonas z ON r.zona_id = z.id
        LEFT JOIN vendedores v ON r.vendedor_id = v.id
        LEFT JOIN rutas_dias rd ON r.id = rd.ruta_id
        LEFT JOIN dias d ON rd.dia_id = d.id
        WHERE r.codigo = ?
        GROUP BY r.id, r.codigo, r.zona_id, z.codigo, z.nombre, r.vendedor_id, v.nombre_completo, r.fecha_creacion, r.fecha_actualizacion
      `, [codigo]);
      return ruta;
    } catch (error) {
      console.error('Error obteniendo ruta por código:', error);
      throw error;
    }
  }

  /**
   * Obtener rutas por zona
   */
  static async getByZona(zonaId) {
    try {
      const rutas = await query(`
        SELECT
          r.id,
          r.codigo,
          r.zona_id,
          z.codigo as zona_codigo,
          z.nombre as zona_nombre,
          r.vendedor_id,
          v.nombre_completo as vendedor_nombre,
          GROUP_CONCAT(d.codigo ORDER BY d.orden SEPARATOR ', ') as dias_codigos,
          GROUP_CONCAT(d.nombre ORDER BY d.orden SEPARATOR ', ') as dias_nombres,
          r.fecha_creacion,
          r.fecha_actualizacion
        FROM rutas r
        INNER JOIN zonas z ON r.zona_id = z.id
        LEFT JOIN vendedores v ON r.vendedor_id = v.id
        LEFT JOIN rutas_dias rd ON r.id = rd.ruta_id
        LEFT JOIN dias d ON rd.dia_id = d.id
        WHERE r.zona_id = ?
        GROUP BY r.id, r.codigo, r.zona_id, z.codigo, z.nombre, r.vendedor_id, v.nombre_completo, r.fecha_creacion, r.fecha_actualizacion
        ORDER BY r.codigo
      `, [zonaId]);
      return rutas;
    } catch (error) {
      console.error('Error obteniendo rutas por zona:', error);
      throw error;
    }
  }

  /**
   * Obtener rutas por vendedor
   */
  static async getByVendedor(vendedorId) {
    try {
      const rutas = await query(`
        SELECT
          r.id,
          r.codigo,
          r.zona_id,
          z.codigo as zona_codigo,
          z.nombre as zona_nombre,
          r.vendedor_id,
          v.nombre_completo as vendedor_nombre,
          GROUP_CONCAT(d.codigo ORDER BY d.orden SEPARATOR ', ') as dias_codigos,
          GROUP_CONCAT(d.nombre ORDER BY d.orden SEPARATOR ', ') as dias_nombres,
          r.fecha_creacion,
          r.fecha_actualizacion
        FROM rutas r
        INNER JOIN zonas z ON r.zona_id = z.id
        LEFT JOIN vendedores v ON r.vendedor_id = v.id
        LEFT JOIN rutas_dias rd ON r.id = rd.ruta_id
        LEFT JOIN dias d ON rd.dia_id = d.id
        WHERE r.vendedor_id = ?
        GROUP BY r.id, r.codigo, r.zona_id, z.codigo, z.nombre, r.vendedor_id, v.nombre_completo, r.fecha_creacion, r.fecha_actualizacion
        ORDER BY z.codigo, r.codigo
      `, [vendedorId]);
      return rutas;
    } catch (error) {
      console.error('Error obteniendo rutas por vendedor:', error);
      throw error;
    }
  }

  /**
   * Crear nueva ruta
   */
  static async create(codigo, zonaId, vendedorId = null) {
    try {
      const result = await query(
        'INSERT INTO rutas (codigo, zona_id, vendedor_id) VALUES (?, ?, ?)',
        [codigo, zonaId, vendedorId]
      );
      return { id: result.insertId, codigo, zona_id: zonaId, vendedor_id: vendedorId };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('La ruta ya existe');
      }
      console.error('Error creando ruta:', error);
      throw error;
    }
  }

  /**
   * Actualizar ruta
   */
  static async update(id, zonaId, vendedorId) {
    try {
      const result = await query(
        'UPDATE rutas SET zona_id = ?, vendedor_id = ? WHERE id = ?',
        [zonaId, vendedorId, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error actualizando ruta:', error);
      throw error;
    }
  }

  /**
   * Agregar día a una ruta
   */
  static async addDia(rutaId, diaId) {
    try {
      await query(
        'INSERT IGNORE INTO rutas_dias (ruta_id, dia_id) VALUES (?, ?)',
        [rutaId, diaId]
      );
      return true;
    } catch (error) {
      console.error('Error agregando día a ruta:', error);
      throw error;
    }
  }

  /**
   * Eliminar día de una ruta
   */
  static async removeDia(rutaId, diaId) {
    try {
      await query(
        'DELETE FROM rutas_dias WHERE ruta_id = ? AND dia_id = ?',
        [rutaId, diaId]
      );
      return true;
    } catch (error) {
      console.error('Error eliminando día de ruta:', error);
      throw error;
    }
  }

  /**
   * Reemplazar todos los días de una ruta
   */
  static async setDias(rutaId, diasIds) {
    try {
      // Eliminar días actuales
      await query('DELETE FROM rutas_dias WHERE ruta_id = ?', [rutaId]);

      // Insertar nuevos días
      if (diasIds && diasIds.length > 0) {
        const values = diasIds.map(diaId => [rutaId, diaId]);
        const placeholders = values.map(() => '(?, ?)').join(', ');
        const flatValues = values.flat();

        await query(
          `INSERT INTO rutas_dias (ruta_id, dia_id) VALUES ${placeholders}`,
          flatValues
        );
      }

      return true;
    } catch (error) {
      console.error('Error reemplazando días de ruta:', error);
      throw error;
    }
  }

  /**
   * Limpiar todas las rutas
   */
  static async truncate() {
    try {
      // Las relaciones rutas_dias se eliminarán automáticamente por CASCADE
      await query('DELETE FROM rutas');
      await query('ALTER TABLE rutas AUTO_INCREMENT = 1');
      return true;
    } catch (error) {
      console.error('Error limpiando rutas:', error);
      throw error;
    }
  }

  /**
   * Contar rutas
   */
  static async count() {
    try {
      const [result] = await query('SELECT COUNT(*) as total FROM rutas');
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
      const [totalRutas] = await query('SELECT COUNT(*) as total FROM rutas');
      const [totalZonas] = await query('SELECT COUNT(DISTINCT zona_id) as total FROM rutas');
      const [totalVendedores] = await query('SELECT COUNT(DISTINCT vendedor_id) as total FROM rutas WHERE vendedor_id IS NOT NULL');
      const [totalRelaciones] = await query('SELECT COUNT(*) as total FROM rutas_dias');

      return {
        totalRutas: totalRutas.total,
        totalZonas: totalZonas.total,
        totalVendedores: totalVendedores.total,
        totalRelacionesDias: totalRelaciones.total
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}

export default Ruta;
