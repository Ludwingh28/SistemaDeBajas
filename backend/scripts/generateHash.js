import bcrypt from "bcryptjs";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("╔════════════════════════════════════════╗");
console.log("║   🔐 Generador de Códigos Secretos     ║");
console.log("╚════════════════════════════════════════╝\n");

rl.question("Ingresa el código que quieres hashear: ", async (codigo) => {
  if (!codigo || codigo.trim().length === 0) {
    console.error("❌ Error: Debes ingresar un código");
    rl.close();
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(codigo.trim(), salt);

    console.log("\n✅ Hash generado exitosamente:\n");
    console.log("════════════════════════════════════════");
    console.log(hash);
    console.log("════════════════════════════════════════\n");
    console.log("📋 Copia este hash y agrégalo a tu .env en SUPERVISOR_CODES");
    console.log("💡 Ejemplo: SUPERVISOR_CODES=" + hash + ",otro_hash\n");
  } catch (error) {
    console.error("❌ Error generando hash:", error.message);
  }

  rl.close();
});
