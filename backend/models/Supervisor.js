import { query } from '../config/mysql.js';
import bcrypt from 'bcryptjs';

class Supervisor {
  // Obtener todos los supervisores
  static async getAll() {
    try {
      const supervisores = await query(
        `SELECT id, nombre, activo, creado_por, fecha_creacion,
                fecha_actualizacion, ultimo_acceso
         FROM supervisores
         ORDER BY activo DESC, nombre ASC`
      );
      return supervisores;
    } catch (error) {
      console.error('Error obteniendo supervisores:', error);
      throw error;
    }
  }

  // Obtener supervisor por ID
  static async getById(id) {
    try {
      const [supervisor] = await query(
        `SELECT id, nombre, activo, creado_por, fecha_creacion,
                fecha_actualizacion, ultimo_acceso
         FROM supervisores
         WHERE id = ?`,
        [id]
      );
      return supervisor;
    } catch (error) {
      console.error('Error obteniendo supervisor por ID:', error);
      throw error;
    }
  }

  // Obtener supervisor por nombre (para autenticación)
  static async getByNombre(nombre) {
    try {
      const [supervisor] = await query(
        `SELECT id, nombre, codigo_hash, activo, ultimo_acceso
         FROM supervisores
         WHERE nombre = ?`,
        [nombre]
      );
      return supervisor;
    } catch (error) {
      console.error('Error obteniendo supervisor por nombre:', error);
      throw error;
    }
  }

  // Crear nuevo supervisor
  static async create(nombre, codigoPlainText, creadoPor = 'SISTEMA') {
    try {
      // Generar hash del código
      const salt = await bcrypt.genSalt(10);
      const codigoHash = await bcrypt.hash(codigoPlainText, salt);

      const result = await query(
        'INSERT INTO supervisores (nombre, codigo_hash, creado_por) VALUES (?, ?, ?)',
        [nombre, codigoHash, creadoPor]
      );

      return {
        id: result.insertId,
        nombre,
        creado_por: creadoPor
      };
    } catch (error) {
      // Si es error de duplicado
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('El nombre de supervisor ya existe');
      }
      console.error('Error creando supervisor:', error);
      throw error;
    }
  }

  // Actualizar hash del supervisor
  static async updateHash(id, nuevoCodigoPlainText, actualizadoPor = 'SISTEMA') {
    try {
      // Generar nuevo hash
      const salt = await bcrypt.genSalt(10);
      const nuevoHash = await bcrypt.hash(nuevoCodigoPlainText, salt);

      await query(
        'UPDATE supervisores SET codigo_hash = ?, creado_por = ? WHERE id = ?',
        [nuevoHash, actualizadoPor, id]
      );

      return true;
    } catch (error) {
      console.error('Error actualizando hash de supervisor:', error);
      throw error;
    }
  }

  // Verificar código del supervisor (con nombre)
  static async verificarCodigo(nombre, codigoPlainText) {
    try {
      const supervisor = await this.getByNombre(nombre);

      if (!supervisor) {
        return { valido: false, mensaje: 'Supervisor no encontrado' };
      }

      if (!supervisor.activo) {
        return { valido: false, mensaje: 'Supervisor inactivo' };
      }

      const esValido = await bcrypt.compare(codigoPlainText, supervisor.codigo_hash);

      if (esValido) {
        // Actualizar último acceso
        await this.updateUltimoAcceso(supervisor.id);
        return { valido: true, supervisor };
      }

      return { valido: false, mensaje: 'Código incorrecto' };
    } catch (error) {
      console.error('Error verificando código:', error);
      throw error;
    }
  }

  // Verificar código contra todos los supervisores (sin nombre)
  static async verificarCodigoSolo(codigoPlainText) {
    try {
      // Obtener todos los supervisores activos
      const supervisores = await query(
        'SELECT id, nombre, codigo_hash, activo FROM supervisores WHERE activo = true'
      );

      if (!supervisores || supervisores.length === 0) {
        return { valido: false, mensaje: 'No hay supervisores activos' };
      }

      // Verificar el código contra cada supervisor
      for (const supervisor of supervisores) {
        const esValido = await bcrypt.compare(codigoPlainText, supervisor.codigo_hash);

        if (esValido) {
          // Actualizar último acceso
          await this.updateUltimoAcceso(supervisor.id);
          return { valido: true, supervisor };
        }
      }

      return { valido: false, mensaje: 'Código incorrecto' };
    } catch (error) {
      console.error('Error verificando código solo:', error);
      throw error;
    }
  }

  // Actualizar último acceso
  static async updateUltimoAcceso(id) {
    try {
      await query(
        'UPDATE supervisores SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      return true;
    } catch (error) {
      console.error('Error actualizando último acceso:', error);
      throw error;
    }
  }

  // Desactivar supervisor (soft delete)
  static async deactivate(id) {
    try {
      await query(
        'UPDATE supervisores SET activo = FALSE WHERE id = ?',
        [id]
      );
      return true;
    } catch (error) {
      console.error('Error desactivando supervisor:', error);
      throw error;
    }
  }

  // Activar supervisor
  static async activate(id) {
    try {
      await query(
        'UPDATE supervisores SET activo = TRUE WHERE id = ?',
        [id]
      );
      return true;
    } catch (error) {
      console.error('Error activando supervisor:', error);
      throw error;
    }
  }

  // Verificar si existe un supervisor por nombre
  static async existsByName(nombre) {
    try {
      const [supervisor] = await query(
        'SELECT id FROM supervisores WHERE nombre = ?',
        [nombre]
      );
      return !!supervisor;
    } catch (error) {
      console.error('Error verificando existencia de supervisor:', error);
      throw error;
    }
  }
}

export default Supervisor;
