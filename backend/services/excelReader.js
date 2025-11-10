import ExcelJS from "exceljs";
import fs from "fs/promises";
import { paths, setCachedData, getCachedData, cacheConfig } from "../config/database.js";

/**
 * Leer Excel optimizado para archivos grandes
 * Solo extrae las columnas necesarias
 */
export const readExcelFileOptimized = async (filePath, sheetName, headerRow, columnasNecesarias = null) => {
  try {
    console.log(`📖 Leyendo: ${sheetName} (modo optimizado)...`);

    const workbook = new ExcelJS.Workbook();

    // Opción de lectura con streaming para archivos grandes
    const options = {
      sharedStrings: "cache",
      hyperlinks: "ignore",
      styles: "ignore",
    };

    await workbook.xlsx.readFile(filePath, options);

    const worksheet = sheetName ? workbook.getWorksheet(sheetName) : workbook.worksheets[0];

    if (!worksheet) {
      throw new Error(`Hoja ${sheetName} no encontrada`);
    }

    const data = [];
    const headers = [];
    const headerRowObj = worksheet.getRow(headerRow);

    // Leer headers
    headerRowObj.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value?.toString().trim() || `Column${colNumber}`;
    });

    console.log(
      `   📋 Headers encontrados: ${headers
        .filter((h) => h)
        .slice(1, 10)
        .join(", ")}...`
    );

    // Leer datos fila por fila
    let count = 0;
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRow) return;

      const rowData = {};
      let hasData = false;

      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];

        // Si se especificaron columnas necesarias, solo extraer esas
        if (columnasNecesarias && !columnasNecesarias.includes(header)) {
          return;
        }

        if (header) {
          rowData[header] = cell.value;
          if (cell.value !== null && cell.value !== undefined) {
            hasData = true;
          }
        }
      });

      if (hasData) {
        data.push(rowData);
        count++;

        // Log cada 5000 filas para ver progreso
        if (count % 5000 === 0) {
          console.log(`   ⏳ Procesadas ${count} filas...`);
        }
      }
    });

    console.log(`   ✅ ${sheetName}: ${data.length} registros cargados`);
    return data;
  } catch (error) {
    console.error(`❌ Error leyendo ${filePath}:`, error.message);
    throw error;
  }
};

/**
 * Leer motivos desde archivo .txt
 */
export const readMotivosFile = async () => {
  try {
    const content = await fs.readFile(paths.motivosFile, "utf-8");
    const motivos = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    console.log(`✅ Motivos cargados: ${motivos.length} motivos`);
    return motivos;
  } catch (error) {
    console.error("❌ Error leyendo motivos.txt:", error.message);
    return ["Cierre definitivo", "No cumple requisitos", "Deuda pendiente", "Cambio de giro", "Solicitud del cliente", "Duplicado", "No existe", "Otro"];
  }
};

/**
 * Cargar datos con optimización de memoria
 */
export const loadExcelDataOnStartup = async () => {
  try {
    console.log("🔄 Cargando archivos Excel en memoria (modo optimizado)...\n");

    // 1. VentasPOD - Solo columnas necesarias
    console.log("📊 Cargando VentasPOD...");
    const ventasData = await readExcelFileOptimized(
      paths.excelVentas,
      "VentasPOD",
      7,
      ["No.Venta", "Fecha", "Cliente", "Nombre Cliente"] // Solo estas columnas
    );
    setCachedData("VENTAS_POD_KEY", ventasData);

    // 2. Clientes - Solo columnas necesarias
    console.log("📊 Cargando Clientes...");
    const clientesData = await readExcelFileOptimized(
      paths.excelVentas,
      "clientes",
      8,
      ["CODIGO", "NOMBRE", "RUTA", "ZONA", "ACTIVO"] // Solo estas columnas
    );
    setCachedData("CLIENTES_KEY", clientesData);

    // 3. Rutas vendedores
    console.log("📊 Cargando Rutas...");
    const rutasData = await readExcelFileOptimized(
      paths.excelRutas,
      null,
      1,
      ["RUTA", "ZONA", "DIA", "VENDEDOR"] // Solo estas columnas
    );
    setCachedData("RUTAS_KEY", rutasData);

    // 4. Motivos
    console.log("📊 Cargando Motivos...");
    const motivosData = await readMotivosFile();
    setCachedData(cacheConfig.MOTIVOS_KEY, motivosData);

    console.log("\n" + "=".repeat(60));
    console.log("✅ TODOS LOS ARCHIVOS CARGADOS EN MEMORIA");
    console.log("=".repeat(60));
    console.log(`📊 VentasPOD: ${ventasData.length} registros`);
    console.log(`📊 Clientes: ${clientesData.length} registros`);
    console.log(`📊 Rutas: ${rutasData.length} registros`);
    console.log(`📊 Motivos: ${motivosData.length} motivos`);
    console.log("=".repeat(60) + "\n");

    return true;
  } catch (error) {
    console.error("❌ Error cargando datos:", error.message);
    throw error;
  }
};

// Getters
export const getCachedVentas = () => getCachedData("VENTAS_POD_KEY");
export const getCachedClientes = () => getCachedData("CLIENTES_KEY");
export const getCachedRutas = () => getCachedData("RUTAS_KEY");
export const getCachedMotivos = () => getCachedData(cacheConfig.MOTIVOS_KEY);

// Refrescar cache
export const refreshCache = async () => {
  console.log("🔄 Refrescando cache...");
  await loadExcelDataOnStartup();
};
