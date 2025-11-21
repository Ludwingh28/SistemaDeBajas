import { query } from '../config/mysql.js';

class Motivo {
  // Obtener todos los motivos (activos e inactivos)
  static async getAll() {
    try {
      const motivos = await query(
        'SELECT id, nombre, activo FROM motivos ORDER BY activo DESC, nombre ASC'
      );
      return motivos;
    } catch (error) {
      console.error('Error obteniendo motivos:', error);
      throw error;
    }
  }

  // Obtener motivo por ID
  static async getById(id) {
    try {
      const [motivo] = await query(
        'SELECT id, nombre, activo FROM motivos WHERE id = ?',
        [id]
      );
      return motivo;
    } catch (error) {
      console.error('Error obteniendo motivo por ID:', error);
      throw error;
    }
  }

  // Crear nuevo motivo
  static async create(nombre) {
    try {
      const result = await query(
        'INSERT INTO motivos (nombre) VALUES (?)',
        [nombre]
      );
      return { id: result.insertId, nombre };
    } catch (error) {
      // Si es error de duplicado
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('El motivo ya existe');
      }
      console.error('Error creando motivo:', error);
      throw error;
    }
  }

  // Actualizar motivo
  static async update(id, nombre) {
    try {
      await query(
        'UPDATE motivos SET nombre = ? WHERE id = ?',
        [nombre, id]
      );
      return { id, nombre };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('El motivo ya existe');
      }
      console.error('Error actualizando motivo:', error);
      throw error;
    }
  }

  // Desactivar motivo (soft delete)
  static async deactivate(id) {
    try {
      await query(
        'UPDATE motivos SET activo = FALSE WHERE id = ?',
        [id]
      );
      return true;
    } catch (error) {
      console.error('Error desactivando motivo:', error);
      throw error;
    }
  }

  // Activar motivo
  static async activate(id) {
    try {
      await query(
        'UPDATE motivos SET activo = TRUE WHERE id = ?',
        [id]
      );
      return true;
    } catch (error) {
      console.error('Error activando motivo:', error);
      throw error;
    }
  }

  // Verificar si existe un motivo por nombre
  static async existsByName(nombre) {
    try {
      const [motivo] = await query(
        'SELECT id FROM motivos WHERE nombre = ?',
        [nombre]
      );
      return !!motivo;
    } catch (error) {
      console.error('Error verificando existencia de motivo:', error);
      throw error;
    }
  }
}

export default Motivo;
