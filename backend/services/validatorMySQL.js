import Venta from '../models/Venta.js';
import Cliente from '../models/Cliente.js';
import PlanificacionRuta from '../models/PlanificacionRuta.js';

const DIAS_LIMITE = 90;

/**
 * Formatea una fecha a formato dd/mm/yyyy
 */
function formatearFecha(fecha) {
  if (!fecha) return 'N/A';
  const date = new Date(fecha);
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const anio = date.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

/**
 * Calcula días transcurridos desde una fecha
 */
function diasDesde(fecha) {
  if (!fecha) return null;
  const fechaVenta = new Date(fecha);
  const hoy = new Date();

  // Normalizar a medianoche para comparación de días
  fechaVenta.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);

  const diferencia = hoy - fechaVenta;
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

  return dias >= 0 ? dias : null;
}

/**
 * Validar si un cliente puede ser inhabilitado usando MySQL
 */
export const validarClienteMySQL = async (codigoCliente, motivo) => {
  try {
    console.log(`🔍 Validando: ${codigoCliente} | Motivo: ${motivo}`);

    // 1. Buscar cliente en base de datos
    const cliente = await Cliente.getByCodigo(codigoCliente);

    // 2. Buscar ventas del cliente
    const ventas = await Venta.getByCliente(codigoCliente);

    // 3. Si no hay ventas, buscar nombre en la primera venta histórica
    let nombreCliente = cliente?.nombre || null;

    if (!nombreCliente && ventas.length > 0) {
      nombreCliente = ventas[0].nombre_cliente;
    }

    // Si no se encontró el cliente ni en clientes ni en ventas
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

    // 4. Obtener ruta del cliente
    const rutaCliente = cliente?.ruta || '';

    // 5. Obtener información de zona y vendedor desde planificación de rutas
    let zona = cliente?.zona || '';
    let ruta = rutaCliente;
    let vendedor = '';

    if (rutaCliente) {
      const rutaInfo = await PlanificacionRuta.getByRuta(rutaCliente);
      if (rutaInfo) {
        zona = rutaInfo.zona || zona;
        vendedor = rutaInfo.vendedor || '';
      }
    }

    console.log(`   📊 Total ventas encontradas: ${ventas.length}`);

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
    const ultimaVenta = ventas[0]; // Ya viene ordenado por fecha DESC
    const fechaMasReciente = ultimaVenta.fecha;

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

export default {
  validarClienteMySQL
};
