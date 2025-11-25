import { query } from '../config/mysql.js';

/**
 * Modelo para gestionar zonas
 */
class Zona {
  /**
   * Obtener todas las zonas
   */
  static async getAll() {
    try {
      const zonas = await query('SELECT * FROM zonas ORDER BY codigo ASC');
      return zonas;
    } catch (error) {
      console.error('Error obteniendo zonas:', error);
      throw error;
    }
  }

  /**
   * Obtener zona por ID
   */
  static async getById(id) {
    try {
      const [zona] = await query('SELECT * FROM zonas WHERE id = ?', [id]);
      return zona;
    } catch (error) {
      console.error('Error obteniendo zona por ID:', error);
      throw error;
    }
  }

  /**
   * Obtener zona por código
   */
  static async getByCodigo(codigo) {
    try {
      const [zona] = await query('SELECT * FROM zonas WHERE codigo = ?', [codigo]);
      return zona;
    } catch (error) {
      console.error('Error obteniendo zona por código:', error);
      throw error;
    }
  }

  /**
   * Crear nueva zona
   */
  static async create(codigo, nombre) {
    try {
      const result = await query(
        'INSERT INTO zonas (codigo, nombre) VALUES (?, ?)',
        [codigo, nombre || codigo]
      );
      return { id: result.insertId, codigo, nombre: nombre || codigo };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('La zona ya existe');
      }
      console.error('Error creando zona:', error);
      throw error;
    }
  }

  /**
   * Actualizar zona
   */
  static async update(id, codigo, nombre) {
    try {
      const result = await query(
        'UPDATE zonas SET codigo = ?, nombre = ? WHERE id = ?',
        [codigo, nombre, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error actualizando zona:', error);
      throw error;
    }
  }

  /**
   * Obtener o crear zona (upsert)
   */
  static async getOrCreate(codigo, nombre) {
    try {
      let zona = await this.getByCodigo(codigo);
      if (!zona) {
        const result = await this.create(codigo, nombre || codigo);
        zona = { id: result.id, codigo, nombre: nombre || codigo };
      }
      return zona;
    } catch (error) {
      console.error('Error en getOrCreate de zona:', error);
      throw error;
    }
  }

  /**
   * Contar zonas
   */
  static async count() {
    try {
      const [result] = await query('SELECT COUNT(*) as total FROM zonas');
      return result.total;
    } catch (error) {
      console.error('Error contando zonas:', error);
      throw error;
    }
  }
}

export default Zona;
