import { query } from '../config/mysql.js';

class Venta {
  // Obtener ventas de un cliente
  static async getByCliente(codigoCliente) {
    try {
      const ventas = await query(
        'SELECT fecha, codigo_cliente, nombre_cliente FROM ventas WHERE codigo_cliente = ? ORDER BY fecha DESC',
        [codigoCliente]
      );
      return ventas;
    } catch (error) {
      console.error('Error obteniendo ventas por cliente:', error);
      throw error;
    }
  }

  // Obtener última venta de un cliente
  static async getUltimaVentaCliente(codigoCliente) {
    try {
      const [venta] = await query(
        'SELECT fecha FROM ventas WHERE codigo_cliente = ? ORDER BY fecha DESC LIMIT 1',
        [codigoCliente]
      );
      return venta;
    } catch (error) {
      console.error('Error obteniendo última venta:', error);
      throw error;
    }
  }

  // Insertar ventas en batch (más eficiente)
  static async insertBatch(ventas) {
    if (!ventas || ventas.length === 0) return 0;

    try {
      const values = ventas.map(v => [v.fecha, v.codigo_cliente, v.nombre_cliente]);

      const placeholders = ventas.map(() => '(?, ?, ?)').join(',');
      const flatValues = values.flat();

      await query(
        `INSERT INTO ventas (fecha, codigo_cliente, nombre_cliente) VALUES ${placeholders}`,
        flatValues
      );

      return ventas.length;
    } catch (error) {
      console.error('Error insertando ventas en batch:', error);
      throw error;
    }
  }

  // Limpiar ventas antiguas (opcional - para mantenimiento)
  static async deleteOlderThan(fecha) {
    try {
      const result = await query(
        'DELETE FROM ventas WHERE fecha < ?',
        [fecha]
      );
      return result.affectedRows;
    } catch (error) {
      console.error('Error eliminando ventas antiguas:', error);
      throw error;
    }
  }

  // Contar total de ventas
  static async count() {
    try {
      const [result] = await query('SELECT COUNT(*) as total FROM ventas');
      return parseInt(result?.total) || 0;
    } catch (error) {
      console.error('Error contando ventas:', error);
      throw error;
    }
  }

  // Obtener rango de fechas en la BD
  static async getRangoFechas() {
    try {
      const [result] = await query(
        'SELECT MIN(fecha) as min_fecha, MAX(fecha) as max_fecha, COUNT(DISTINCT fecha) as dias FROM ventas'
      );
      return result;
    } catch (error) {
      console.error('Error obteniendo rango de fechas:', error);
      throw error;
    }
  }

  // Truncar tabla (para reemplazar todos los datos)
  static async truncate() {
    try {
      await query('TRUNCATE TABLE ventas');
      return true;
    } catch (error) {
      console.error('Error truncando tabla ventas:', error);
      throw error;
    }
  }
}

export default Venta;
