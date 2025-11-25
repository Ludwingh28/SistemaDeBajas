import { query } from '../config/mysql.js';

/**
 * Modelo para gestionar días de la semana
 */
class Dia {
  /**
   * Obtener todos los días
   */
  static async getAll() {
    try {
      const dias = await query('SELECT * FROM dias ORDER BY orden ASC');
      return dias;
    } catch (error) {
      console.error('Error obteniendo días:', error);
      throw error;
    }
  }

  /**
   * Obtener día por ID
   */
  static async getById(id) {
    try {
      const [dia] = await query('SELECT * FROM dias WHERE id = ?', [id]);
      return dia;
    } catch (error) {
      console.error('Error obteniendo día por ID:', error);
      throw error;
    }
  }

  /**
   * Obtener día por código
   */
  static async getByCodigo(codigo) {
    try {
      const [dia] = await query('SELECT * FROM dias WHERE codigo = ?', [codigo]);
      return dia;
    } catch (error) {
      console.error('Error obteniendo día por código:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo día
   */
  static async create(codigo, nombre, orden) {
    try {
      const result = await query(
        'INSERT INTO dias (codigo, nombre, orden) VALUES (?, ?, ?)',
        [codigo, nombre, orden]
      );
      return { id: result.insertId, codigo, nombre, orden };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('El día ya existe');
      }
      console.error('Error creando día:', error);
      throw error;
    }
  }

  /**
   * Contar días
   */
  static async count() {
    try {
      const [result] = await query('SELECT COUNT(*) as total FROM dias');
      return result.total;
    } catch (error) {
      console.error('Error contando días:', error);
      throw error;
    }
  }
}

export default Dia;
