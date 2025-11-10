import bcrypt from "bcryptjs";

// Códigos de supervisores (hasheados)
// Los códigos se cargan desde las variables de entorno
const SUPERVISOR_CODES_ENV = process.env.SUPERVISOR_CODES || "";

// Parsear códigos desde el .env (separados por comas)
export const supervisorHashes = SUPERVISOR_CODES_ENV.split(",")
  .map((code) => code.trim())
  .filter((code) => code.length > 0);

// Verificar si un código es válido
export const verifySupervisorCode = async (codigo) => {
  if (!codigo || typeof codigo !== "string") {
    return false;
  }

  // Comparar con cada hash almacenado
  for (const hash of supervisorHashes) {
    const isValid = await bcrypt.compare(codigo, hash);
    if (isValid) {
      return true;
    }
  }

  return false;
};

// Función helper para generar hash de un código nuevo
// USO: Solo para agregar nuevos supervisores
export const generateSupervisorHash = async (codigo) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(codigo, salt);
  return hash;
};

// Validar que existan códigos configurados
if (supervisorHashes.length === 0) {
  console.warn("⚠️  ADVERTENCIA: No hay códigos de supervisor configurados en .env");
  console.warn("⚠️  Genera códigos con: node scripts/generateHash.js");
}

console.log(`✅ ${supervisorHashes.length} código(s) de supervisor cargado(s)`);
