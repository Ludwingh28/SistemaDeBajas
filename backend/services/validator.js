import { getRutaCliente, getRutaInfo, getNombreCliente, getVentasCliente, getFechaMasReciente, diasDesde, formatearFecha } from "./excelMerger.js";
import { getCachedData, cacheConfig } from "../config/database.js";

const DIAS_LIMITE = 90;

/**
 * Validar si un cliente puede ser inhabilitado
 */
export const validarCliente = (codigoCliente, motivo) => {
  try {
    console.log(`🔍 Validando: ${codigoCliente} | Motivo: ${motivo}`);

    // 1. Obtener datos del cache
    const ventasData = getCachedData("VENTAS_POD_KEY");
    const clientesData = getCachedData("CLIENTES_KEY");
    const rutasData = getCachedData("RUTAS_KEY");

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

    console.log(`   📊 Total ventas encontradas: ${ventas.length}`);

    // DEBUG: Mostrar primeras 3 ventas con fechas
    if (ventas.length > 0) {
      console.log(`   📅 Primeras ventas (para debug):`);
      ventas.slice(0, 3).forEach((v, i) => {
        console.log(`      ${i + 1}. Fecha: ${formatearFecha(v.fecha)} | Raw: ${v.fechaRaw} | NoVenta: ${v.noVenta}`);
      });
    }

    // 6. CASO 1: Cliente sin ventas registradas
    if (ventas.length === 0) {
      console.log(`   ✅ Resultado: SIN VENTAS`);
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

    if (!fechaMasReciente) {
      console.log(`   ⚠️  Ventas encontradas pero sin fechas válidas`);
      return {
        codigoCliente,
        nombreCliente,
        motivo,
        zona,
        ruta,
        vendedor,
        resultado: "SI",
        razon: "No tiene ventas con fechas válidas",
      };
    }

    const diasTranscurridos = diasDesde(fechaMasReciente);
    const fechaFormateada = formatearFecha(fechaMasReciente);

    console.log(`   📊 Ventas válidas: ${ventas.length}`);
    console.log(`   📅 Última venta: ${fechaFormateada}`);
    console.log(`   ⏱️  Días transcurridos: ${diasTranscurridos}`);

    // 8. Validar que los días sean razonables
    if (diasTranscurridos === null || diasTranscurridos < 0) {
      console.log(`   ⚠️  Fecha inválida detectada`);
      return {
        codigoCliente,
        nombreCliente,
        motivo,
        zona,
        ruta,
        vendedor,
        resultado: "ERROR",
        razon: "Error al procesar fechas de ventas. Contacte al administrador.",
      };
    }

    // 9. CASO 2: Última venta > 90 días
    if (diasTranscurridos > DIAS_LIMITE) {
      console.log(`   ✅ Resultado: APROBADO (> ${DIAS_LIMITE} días)`);
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

    // 10. CASO 3: Última venta <= 90 días
    const esDuplicado = motivo.toLowerCase().includes("duplicado");

    if (esDuplicado) {
      console.log(`   ⚠️  Resultado: DERIVADO (Duplicado con ventas recientes)`);
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

    console.log(`   ❌ Resultado: RECHAZADO (ventas recientes)`);
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
