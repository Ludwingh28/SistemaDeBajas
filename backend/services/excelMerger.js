/**
 * Merge simplificado para obtener solo: zona, ruta, vendedor
 */

/**
 * Obtener información de ruta/vendedor de un cliente
 * @param {string} rutaCliente - Ruta del cliente
 * @param {Array} rutasData - Datos de rutas_vendedores.xlsx
 * @returns {Object} - {zona, ruta, vendedor}
 */
export const getRutaInfo = (rutaCliente, rutasData) => {
  if (!rutaCliente) {
    return { zona: "", ruta: "", vendedor: "" };
  }

  const rutaInfo = rutasData.find((ruta) => ruta["RUTA"]?.trim() === rutaCliente.trim());

  return {
    zona: rutaInfo?.["ZONA"] || "",
    ruta: rutaCliente,
    vendedor: rutaInfo?.["VENDEDOR"] || "",
  };
};

/**
 * Buscar nombre del cliente en VentasPOD
 * @param {string} codigoCliente - Código del cliente
 * @param {Array} ventasData - Datos de VentasPOD
 * @returns {string} - Nombre del cliente o ''
 */
export const getNombreCliente = (codigoCliente, ventasData) => {
  const codigo = codigoCliente?.toString().trim();

  const venta = ventasData.find((v) => v["Cliente"]?.toString().trim() === codigo);

  return venta?.["Nombre Cliente"] || "";
};

/**
 * Buscar ruta del cliente en datos de clientes
 * @param {string} codigoCliente - Código del cliente
 * @param {Array} clientesData - Datos de la hoja 'clientes'
 * @returns {string} - Ruta del cliente o ''
 */
export const getRutaCliente = (codigoCliente, clientesData) => {
  const codigo = codigoCliente?.toString().trim().toUpperCase();

  const cliente = clientesData.find((c) => c["CODIGO"]?.toString().trim().toUpperCase() === codigo);

  return cliente?.["RUTA"] || "";
};

/**
 * Buscar todas las ventas de un cliente con fechas
 * @param {string} codigoCliente - Código del cliente
 * @param {Array} ventasData - Datos de VentasPOD
 * @returns {Array} - Array de objetos {fecha, noVenta}
 */
export const getVentasCliente = (codigoCliente, ventasData) => {
  const codigo = codigoCliente?.toString().trim();

  const ventas = ventasData
    .filter((venta) => venta["Cliente"]?.toString().trim() === codigo)
    .map((venta) => ({
      fecha: venta["Fecha"],
      noVenta: venta["No.Venta"],
    }))
    .filter((v) => v.fecha); // Solo ventas con fecha válida

  return ventas;
};

/**
 * Obtener la fecha de venta más reciente
 * @param {Array} ventas - Array de ventas con fechas
 * @returns {Date|null} - Fecha más reciente o null
 */
export const getFechaMasReciente = (ventas) => {
  if (!ventas || ventas.length === 0) return null;

  const fechas = ventas.map((v) => new Date(v.fecha));
  return new Date(Math.max(...fechas));
};

/**
 * Calcular días desde una fecha
 * @param {Date} fecha - Fecha a comparar
 * @returns {number} - Días transcurridos
 */
export const diasDesde = (fecha) => {
  const hoy = new Date();
  const diferencia = hoy - new Date(fecha);
  return Math.floor(diferencia / (1000 * 60 * 60 * 24));
};

/**
 * Formatear fecha a DD-MM-AAAA
 * @param {Date} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export const formatearFecha = (fecha) => {
  const d = new Date(fecha);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const anio = d.getFullYear();
  return `${dia}-${mes}-${anio}`;
};
