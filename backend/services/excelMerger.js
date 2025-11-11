/**
 * Convertir fecha de Excel a Date de JavaScript
 * Excel almacena fechas como números seriales desde 1900-01-01
 */
const excelDateToJSDate = (excelDate) => {
  // Si ya es un objeto Date, devolverlo
  if (excelDate instanceof Date) {
    return excelDate;
  }

  // Si es string, intentar parsearlo
  if (typeof excelDate === "string") {
    const parsed = new Date(excelDate);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    return null;
  }

  // Si es número (fecha serial de Excel)
  if (typeof excelDate === "number") {
    // Excel fecha serial: días desde 1900-01-01
    // Pero Excel tiene un bug: cuenta 1900 como año bisiesto (no lo es)
    // Por eso restamos 1 día si la fecha es después del 28-feb-1900

    const EXCEL_EPOCH = new Date(1899, 11, 30); // 30 de diciembre de 1899
    const msPerDay = 24 * 60 * 60 * 1000;

    const jsDate = new Date(EXCEL_EPOCH.getTime() + excelDate * msPerDay);

    // Validar que la fecha sea razonable (después del año 2000)
    if (jsDate.getFullYear() < 2000) {
      console.warn(`⚠️  Fecha sospechosa: ${jsDate.toISOString()} (Excel: ${excelDate})`);
      return null;
    }

    return jsDate;
  }

  return null;
};

/**
 * Obtener información de ruta/vendedor de un cliente
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
 */
export const getNombreCliente = (codigoCliente, ventasData) => {
  const codigo = codigoCliente?.toString().trim();

  const venta = ventasData.find((v) => v["Cliente"]?.toString().trim() === codigo);

  return venta?.["Nombre Cliente"] || "";
};

/**
 * Buscar ruta del cliente en datos de clientes
 */
export const getRutaCliente = (codigoCliente, clientesData) => {
  const codigo = codigoCliente?.toString().trim().toUpperCase();

  const cliente = clientesData.find((c) => c["CODIGO"]?.toString().trim().toUpperCase() === codigo);

  return cliente?.["RUTA"] || "";
};

/**
 * Buscar todas las ventas de un cliente con fechas
 */
export const getVentasCliente = (codigoCliente, ventasData) => {
  const codigo = codigoCliente?.toString().trim();

  const ventas = ventasData
    .filter((venta) => venta["Cliente"]?.toString().trim() === codigo)
    .map((venta) => {
      const fechaRaw = venta["Fecha"];
      const fechaConvertida = excelDateToJSDate(fechaRaw);

      return {
        fecha: fechaConvertida,
        noVenta: venta["No.Venta"],
        fechaRaw: fechaRaw, // Para debug
      };
    })
    .filter((v) => v.fecha !== null); // Solo ventas con fecha válida

  return ventas;
};

/**
 * Obtener la fecha de venta más reciente
 */
export const getFechaMasReciente = (ventas) => {
  if (!ventas || ventas.length === 0) return null;

  const fechas = ventas.map((v) => v.fecha).filter((f) => f !== null);

  if (fechas.length === 0) return null;

  return new Date(Math.max(...fechas.map((f) => f.getTime())));
};

/**
 * Calcular días desde una fecha
 */
export const diasDesde = (fecha) => {
  if (!fecha || !(fecha instanceof Date)) {
    return null;
  }

  const hoy = new Date();

  // Normalizar a medianoche para cálculo preciso
  const hoyNormalizado = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const fechaNormalizada = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

  const diferencia = hoyNormalizado - fechaNormalizada;
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

  return dias;
};

/**
 * Formatear fecha a DD-MM-AAAA
 */
export const formatearFecha = (fecha) => {
  if (!fecha || !(fecha instanceof Date)) {
    return "Fecha inválida";
  }

  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();

  return `${dia}-${mes}-${anio}`;
};
