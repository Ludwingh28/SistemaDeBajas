import ExcelJS from "exceljs";
import fs from "fs/promises";
import { paths } from "../config/database.js";

/**
 * Obtener nombre de la hoja según el día actual
 * Formato: DIA_dd_mmm_aaaa
 * Ejemplo: LUN_10_Nov_2025
 */
const getNombreHoja = () => {
  const fecha = new Date();

  const dias = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  const diaSemana = dias[fecha.getDay()];
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = meses[fecha.getMonth()];
  const anio = fecha.getFullYear();

  return `${diaSemana}_${dia}_${mes}_${anio}`;
};

/**
 * Verificar si el archivo de reporte existe
 */
const existeReporte = async () => {
  try {
    await fs.access(paths.reporteDisqualification);
    return true;
  } catch {
    return false;
  }
};

/**
 * Crear nuevo workbook de reporte
 */
const crearNuevoReporte = () => {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Sistema de Bajas";
  workbook.created = new Date();
  workbook.modified = new Date();

  return workbook;
};

/**
 * Configurar estilos de la hoja
 */
const aplicarEstilos = (worksheet) => {
  // Estilo de headers
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0070C0" }, // Azul
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  // Ancho de columnas
  worksheet.columns = [
    { key: "codigoCliente", width: 15 },
    { key: "nombreCliente", width: 30 },
    { key: "motivo", width: 25 },
    { key: "zona", width: 20 },
    { key: "ruta", width: 20 },
    { key: "vendedor", width: 30 },
    { key: "resultado", width: 20 },
    { key: "razon", width: 50 },
  ];

  // Bordes y alineación para todas las celdas
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      if (rowNumber > 1) {
        cell.alignment = { vertical: "middle", wrapText: true };
      }
    });
  });

  // Auto-filtro en headers
  worksheet.autoFilter = {
    from: "A1",
    to: "H1",
  };

  // Congelar primera fila
  worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];
};

/**
 * Aplicar color según resultado
 */
const aplicarColoresPorResultado = (worksheet) => {
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const resultado = row.getCell(7).value; // Columna G (resultado)

    if (resultado === "SI") {
      // Verde claro para SI
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFC6EFCE" }, // Verde claro
        };
      });
    } else if (resultado === "NO") {
      // Rojo claro para NO
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFC7CE" }, // Rojo claro
        };
      });
    } else if (resultado?.includes("DERIVADO")) {
      // Amarillo para derivados
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFEB9C" }, // Amarillo claro
        };
      });
    }
  });
};

/**
 * Agregar solicitud al reporte
 * @param {Object} solicitud - Datos de la solicitud validada
 */
export const agregarSolicitudAlReporte = async (solicitud) => {
  try {
    console.log("📊 Agregando solicitud al reporte...");

    const existe = await existeReporte();
    const nombreHoja = getNombreHoja();

    let workbook;
    let worksheet;

    if (existe) {
      // Cargar workbook existente
      workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(paths.reporteDisqualification);

      // Verificar si ya existe la hoja del día
      worksheet = workbook.getWorksheet(nombreHoja);

      if (!worksheet) {
        // Crear nueva hoja para hoy
        worksheet = workbook.addWorksheet(nombreHoja);

        // Agregar headers
        worksheet.addRow(["Código Cliente", "Nombre Cliente", "Motivo", "Zona", "Ruta", "Vendedor", "Resultado", "Razón"]);
      }
    } else {
      // Crear nuevo workbook
      workbook = crearNuevoReporte();
      worksheet = workbook.addWorksheet(nombreHoja);

      // Agregar headers
      worksheet.addRow(["Código Cliente", "Nombre Cliente", "Motivo", "Zona", "Ruta", "Vendedor", "Resultado", "Razón"]);
    }

    // Agregar datos de la solicitud
    worksheet.addRow([solicitud.codigoCliente, solicitud.nombreCliente, solicitud.motivo, solicitud.zona, solicitud.ruta, solicitud.vendedor, solicitud.resultado, solicitud.razon]);

    // Aplicar estilos
    aplicarEstilos(worksheet);
    aplicarColoresPorResultado(worksheet);

    // Guardar archivo
    await workbook.xlsx.writeFile(paths.reporteDisqualification);

    console.log(`✅ Solicitud agregada a: ${nombreHoja}`);
    return true;
  } catch (error) {
    console.error("❌ Error agregando solicitud al reporte:", error);
    throw error;
  }
};

/**
 * Generar Excel del reporte completo para descarga de supervisores
 * @returns {Buffer} - Buffer del Excel generado
 */
export const generarReporteParaDescarga = async () => {
  try {
    console.log("📥 Generando reporte para descarga...");

    const existe = await existeReporte();

    if (!existe) {
      // Si no existe, crear un reporte vacío
      const workbook = crearNuevoReporte();
      const worksheet = workbook.addWorksheet("Sin datos");

      worksheet.addRow(["No hay solicitudes registradas aún"]);

      return await workbook.xlsx.writeBuffer();
    }

    // Leer el reporte existente
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(paths.reporteDisqualification);

    // Convertir a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    console.log("✅ Reporte generado para descarga");
    return buffer;
  } catch (error) {
    console.error("❌ Error generando reporte para descarga:", error);
    throw error;
  }
};

/**
 * Obtener estadísticas del reporte actual (hoja de hoy)
 */
export const getEstadisticasReporte = async () => {
  try {
    const existe = await existeReporte();

    if (!existe) {
      return {
        existe: false,
        hojaHoy: null,
        totalSolicitudes: 0,
        aprobadas: 0,
        rechazadas: 0,
        derivadas: 0,
      };
    }

    const nombreHoja = getNombreHoja();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(paths.reporteDisqualification);

    const worksheet = workbook.getWorksheet(nombreHoja);

    if (!worksheet) {
      return {
        existe: true,
        hojaHoy: false,
        totalSolicitudes: 0,
        aprobadas: 0,
        rechazadas: 0,
        derivadas: 0,
      };
    }

    let aprobadas = 0;
    let rechazadas = 0;
    let derivadas = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const resultado = row.getCell(7).value;

      if (resultado === "SI") aprobadas++;
      else if (resultado === "NO") rechazadas++;
      else if (resultado?.includes("DERIVADO")) derivadas++;
    });

    return {
      existe: true,
      hojaHoy: true,
      nombreHoja,
      totalSolicitudes: aprobadas + rechazadas + derivadas,
      aprobadas,
      rechazadas,
      derivadas,
    };
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas:", error);
    return {
      existe: false,
      error: error.message,
    };
  }
};

/**
 * Limpiar reportes antiguos (opcional - para mantenimiento)
 * Mantiene solo los últimos 30 días
 */
export const limpiarReportesAntiguos = async () => {
  try {
    const existe = await existeReporte();
    if (!existe) return;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(paths.reporteDisqualification);

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30); // 30 días atrás

    let hojasEliminadas = 0;

    workbook.eachSheet((worksheet) => {
      // Parsear nombre de hoja para obtener fecha
      // Formato: DIA_dd_mmm_aaaa
      const partes = worksheet.name.split("_");

      if (partes.length === 4) {
        const dia = parseInt(partes[1]);
        const mes = partes[2];
        const anio = parseInt(partes[3]);

        // Convertir mes texto a número
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const mesNum = meses.indexOf(mes);

        if (mesNum !== -1) {
          const fechaHoja = new Date(anio, mesNum, dia);

          if (fechaHoja < fechaLimite) {
            workbook.removeWorksheet(worksheet.id);
            hojasEliminadas++;
            console.log(`🗑️  Hoja eliminada: ${worksheet.name}`);
          }
        }
      }
    });

    if (hojasEliminadas > 0) {
      await workbook.xlsx.writeFile(paths.reporteDisqualification);
      console.log(`✅ ${hojasEliminadas} hoja(s) antigua(s) eliminada(s)`);
    }
  } catch (error) {
    console.error("❌ Error limpiando reportes antiguos:", error);
  }
};
