import { query } from '../config/mysql.js';

/**
 * Modelo para gestionar vendedores
 */
class Vendedor {
  /**
   * Obtener todos los vendedores
   */
  static async getAll() {
    try {
      const vendedores = await query('SELECT * FROM vendedores ORDER BY nombre_completo ASC');
      return vendedores;
    } catch (error) {
      console.error('Error obteniendo vendedores:', error);
      throw error;
    }
  }

  /**
   * Obtener vendedores activos
   */
  static async getActivos() {
    try {
      const vendedores = await query(
        'SELECT * FROM vendedores WHERE activo = TRUE ORDER BY nombre_completo ASC'
      );
      return vendedores;
    } catch (error) {
      console.error('Error obteniendo vendedores activos:', error);
      throw error;
    }
  }

  /**
   * Obtener vendedor por ID
   */
  static async getById(id) {
    try {
      const [vendedor] = await query('SELECT * FROM vendedores WHERE id = ?', [id]);
      return vendedor;
    } catch (error) {
      console.error('Error obteniendo vendedor por ID:', error);
      throw error;
    }
  }

  /**
   * Obtener vendedor por nombre completo
   */
  static async getByNombre(nombreCompleto) {
    try {
      const [vendedor] = await query(
        'SELECT * FROM vendedores WHERE nombre_completo = ?',
        [nombreCompleto]
      );
      return vendedor;
    } catch (error) {
      console.error('Error obteniendo vendedor por nombre:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo vendedor
   */
  static async create(nombreCompleto, activo = true) {
    try {
      const result = await query(
        'INSERT INTO vendedores (nombre_completo, activo) VALUES (?, ?)',
        [nombreCompleto, activo]
      );
      return { id: result.insertId, nombre_completo: nombreCompleto, activo };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('El vendedor ya existe');
      }
      console.error('Error creando vendedor:', error);
      throw error;
    }
  }

  /**
   * Actualizar vendedor
   */
  static async update(id, nombreCompleto, activo) {
    try {
      const result = await query(
        'UPDATE vendedores SET nombre_completo = ?, activo = ? WHERE id = ?',
        [nombreCompleto, activo, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error actualizando vendedor:', error);
      throw error;
    }
  }

  /**
   * Obtener o crear vendedor (upsert)
   */
  static async getOrCreate(nombreCompleto) {
    try {
      if (!nombreCompleto || nombreCompleto.trim() === '') {
        return null;
      }

      let vendedor = await this.getByNombre(nombreCompleto);
      if (!vendedor) {
        const result = await this.create(nombreCompleto);
        vendedor = { id: result.id, nombre_completo: nombreCompleto, activo: true };
      }
      return vendedor;
    } catch (error) {
      console.error('Error en getOrCreate de vendedor:', error);
      throw error;
    }
  }

  /**
   * Contar vendedores
   */
  static async count() {
    try {
      const [result] = await query('SELECT COUNT(*) as total FROM vendedores');
      return result.total;
    } catch (error) {
      console.error('Error contando vendedores:', error);
      throw error;
    }
  }
}

export default Vendedor;
