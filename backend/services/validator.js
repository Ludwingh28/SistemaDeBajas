import { getRutaCliente, getRutaInfo, getNombreCliente, getVentasCliente, getFechaMasReciente, diasDesde, formatearFecha } from "./excelMerger.js";
import { getCachedData, cacheConfig } from "../config/database.js";

const DIAS_LIMITE = 90;

/**
 * Validar si un cliente puede ser inhabilitado
 *
 * @param {string} codigoCliente - Código del cliente
 * @param {string} motivo - Motivo de la solicitud
 * @returns {Object} - Resultado completo para el reporte
 */
export const validarCliente = (codigoCliente, motivo) => {
  try {
    console.log(`🔍 Validando: ${codigoCliente} | Motivo: ${motivo}`);

    // 1. Obtener datos del cache
    const ventasData = getCachedData("VENTAS_POD_KEY"); // VentasPOD
    const clientesData = getCachedData("CLIENTES_KEY"); // Hoja clientes
    const rutasData = getCachedData("RUTAS_KEY"); // rutas_vendedores.xlsx

    if (!ventasData || !clientesData || !rutasData) {
      throw new Error("Datos no disponibles en cache");
    }

    // 2. Obtener nombre del cliente
    const nombreCliente = getNombreCliente(codigoCliente, ventasData);

    if (!nombreCliente) {
      return {
        codigoCliente,
        nombreCliente: "CLIENTE NO ENCONTRADO",
        motivo,
        zona: "",
        ruta: "",
        vendedor: "",
        resultado: "NO",
        razon: `Cliente con código ${codigoCliente} no encontrado en la base de datos`,
      };
    }

    // 3. Obtener ruta del cliente
    const rutaCliente = getRutaCliente(codigoCliente, clientesData);

    // 4. Obtener zona y vendedor
    const { zona, ruta, vendedor } = getRutaInfo(rutaCliente, rutasData);

    // 5. Buscar ventas del cliente
    const ventas = getVentasCliente(codigoCliente, ventasData);

    // 6. CASO 1: Cliente sin ventas registradas
    if (ventas.length === 0) {
      return {
        codigoCliente,
        nombreCliente,
        motivo,
        zona,
        ruta,
        vendedor,
        resultado: "SI",
        razon: "No tiene ventas registradas",
      };
    }

    // 7. Cliente con ventas - obtener la más reciente
    const fechaMasReciente = getFechaMasReciente(ventas);
    const diasTranscurridos = diasDesde(fechaMasReciente);
    const fechaFormateada = formatearFecha(fechaMasReciente);

    console.log(`   📊 Ventas: ${ventas.length} | Última: ${fechaFormateada} (hace ${diasTranscurridos} días)`);

    // 8. CASO 2: Última venta > 90 días
    if (diasTranscurridos > DIAS_LIMITE) {
      return {
        codigoCliente,
        nombreCliente,
        motivo,
        zona,
        ruta,
        vendedor,
        resultado: "SI",
        razon: `Última venta hace ${diasTranscurridos} días (${fechaFormateada})`,
      };
    }

    // 9. CASO 3: Última venta <= 90 días
    const esDuplicado = motivo.toLowerCase().includes("duplicado");

    if (esDuplicado) {
      // Caso especial DUPLICADO con ventas recientes
      return {
        codigoCliente,
        nombreCliente,
        motivo,
        zona,
        ruta,
        vendedor,
        resultado: "DERIVADO A REVISIÓN MANUAL",
        razon: `Derivado a revisión manual con Inteligencia Comercial. Última venta hace ${diasTranscurridos} días (${fechaFormateada})`,
      };
    }

    // Caso normal con ventas recientes
    return {
      codigoCliente,
      nombreCliente,
      motivo,
      zona,
      ruta,
      vendedor,
      resultado: "NO",
      razon: `Última venta hace ${diasTranscurridos} días (${fechaFormateada})`,
    };
  } catch (error) {
    console.error("❌ Error validando cliente:", error);

    // Retornar error estructurado
    return {
      codigoCliente,
      nombreCliente: "ERROR",
      motivo,
      zona: "",
      ruta: "",
      vendedor: "",
      resultado: "ERROR",
      razon: `Error procesando solicitud: ${error.message}`,
    };
  }
};
