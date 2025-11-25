import Supervisor from '../models/Supervisor.js';

/**
 * Servicio para gestión de supervisores
 * Adaptado desde generateHash.js para funcionar vía API
 */

class SupervisorService {
  /**
   * Crear un nuevo supervisor con su hash
   * @param {string} nombre - Nombre del supervisor
   * @param {string} codigoPlainText - Código en texto plano
   * @param {string} creadoPor - Quien crea el supervisor
   * @returns {Object} Información del supervisor creado
   */
  static async crearSupervisor(nombre, codigoPlainText, creadoPor = 'ADMIN') {
    try {
      // Validaciones
      if (!nombre || nombre.trim().length === 0) {
        throw new Error('El nombre del supervisor es requerido');
      }

      if (!codigoPlainText || codigoPlainText.trim().length < 6) {
        throw new Error('El código debe tener al menos 6 caracteres');
      }

      // Verificar si ya existe
      const existe = await Supervisor.existsByName(nombre.trim());
      if (existe) {
        throw new Error('Ya existe un supervisor con ese nombre');
      }

      // Crear supervisor
      const supervisor = await Supervisor.create(
        nombre.trim(),
        codigoPlainText.trim(),
        creadoPor
      );

      console.log(`✅ Supervisor creado: ${nombre}`);

      return {
        success: true,
        message: 'Supervisor creado exitosamente',
        supervisor: {
          id: supervisor.id,
          nombre: supervisor.nombre,
          creado_por: supervisor.creado_por
        }
      };
    } catch (error) {
      console.error('Error en crearSupervisor:', error);
      throw error;
    }
  }

  /**
   * Cambiar el hash de un supervisor existente
   * @param {number} id - ID del supervisor
   * @param {string} nuevoCodigoPlainText - Nuevo código en texto plano
   * @param {string} actualizadoPor - Quien actualiza
   * @returns {Object} Resultado de la actualización
   */
  static async cambiarHash(id, nuevoCodigoPlainText, actualizadoPor = 'ADMIN') {
    try {
      // Validaciones
      if (!id) {
        throw new Error('El ID del supervisor es requerido');
      }

      if (!nuevoCodigoPlainText || nuevoCodigoPlainText.trim().length < 6) {
        throw new Error('El nuevo código debe tener al menos 6 caracteres');
      }

      // Verificar que existe
      const supervisor = await Supervisor.getById(id);
      if (!supervisor) {
        throw new Error('Supervisor no encontrado');
      }

      // Actualizar hash
      await Supervisor.updateHash(
        id,
        nuevoCodigoPlainText.trim(),
        actualizadoPor
      );

      console.log(`✅ Hash actualizado para supervisor: ${supervisor.nombre}`);

      return {
        success: true,
        message: 'Código actualizado exitosamente',
        supervisor: {
          id: supervisor.id,
          nombre: supervisor.nombre
        }
      };
    } catch (error) {
      console.error('Error en cambiarHash:', error);
      throw error;
    }
  }

  /**
   * Listar todos los supervisores
   * @returns {Array} Lista de supervisores (sin hashes)
   */
  static async listarSupervisores() {
    try {
      const supervisores = await Supervisor.getAll();
      return {
        success: true,
        supervisores
      };
    } catch (error) {
      console.error('Error en listarSupervisores:', error);
      throw error;
    }
  }

  /**
   * Obtener un supervisor por ID
   * @param {number} id - ID del supervisor
   * @returns {Object} Datos del supervisor
   */
  static async obtenerSupervisor(id) {
    try {
      const supervisor = await Supervisor.getById(id);
      if (!supervisor) {
        throw new Error('Supervisor no encontrado');
      }

      return {
        success: true,
        supervisor
      };
    } catch (error) {
      console.error('Error en obtenerSupervisor:', error);
      throw error;
    }
  }

  /**
   * Activar/Desactivar supervisor
   * @param {number} id - ID del supervisor
   * @param {boolean} activo - true para activar, false para desactivar
   * @returns {Object} Resultado de la operación
   */
  static async cambiarEstado(id, activo) {
    try {
      const supervisor = await Supervisor.getById(id);
      if (!supervisor) {
        throw new Error('Supervisor no encontrado');
      }

      if (activo) {
        await Supervisor.activate(id);
      } else {
        await Supervisor.deactivate(id);
      }

      console.log(`✅ Supervisor ${activo ? 'activado' : 'desactivado'}: ${supervisor.nombre}`);

      return {
        success: true,
        message: `Supervisor ${activo ? 'activado' : 'desactivado'} exitosamente`
      };
    } catch (error) {
      console.error('Error en cambiarEstado:', error);
      throw error;
    }
  }

  /**
   * Verificar credenciales de supervisor (solo con código)
   * @param {string} codigoPlainText - Código en texto plano
   * @returns {Object} Resultado de la verificación
   */
  static async verificarCredenciales(codigoPlainText) {
    try {
      if (!codigoPlainText) {
        throw new Error('Código es requerido');
      }

      const resultado = await Supervisor.verificarCodigoSolo(
        codigoPlainText.trim()
      );

      return resultado;
    } catch (error) {
      console.error('Error en verificarCredenciales:', error);
      throw error;
    }
  }
}

export default SupervisorService;
