import Supervisor from '../models/Supervisor.js';
import { closePool } from '../config/mysql.js';

/**
 * Script para crear un supervisor inicial
 * Uso: node scripts/crearSupervisor.js <nombre> <codigo>
 * Ejemplo: node scripts/crearSupervisor.js "Juan Perez" SUPER2025
 */

async function crearSupervisor() {
  try {
    const args = process.argv.slice(2);

    if (args.length < 2) {
      console.log('');
      console.log('❌ Error: Debes proporcionar nombre y código');
      console.log('');
      console.log('Uso: node scripts/crearSupervisor.js <nombre> <codigo>');
      console.log('');
      console.log('Ejemplos:');
      console.log('  node scripts/crearSupervisor.js "Juan Perez" SUPER2025');
      console.log('  node scripts/crearSupervisor.js "Admin Principal" ADMIN123');
      console.log('');
      process.exit(1);
    }

    const nombre = args[0];
    const codigo = args[1];

    console.log('');
    console.log('========================================');
    console.log('CREAR SUPERVISOR');
    console.log('========================================');
    console.log('');
    console.log(`Nombre: ${nombre}`);
    console.log(`Código: ${codigo}`);
    console.log('');

    // Verificar si ya existe
    const existe = await Supervisor.existsByName(nombre);
    if (existe) {
      console.log('❌ Error: Ya existe un supervisor con ese nombre');
      console.log('');
      process.exit(1);
    }

    // Crear el supervisor
    const supervisor = await Supervisor.create(nombre, codigo, 'SCRIPT');

    console.log('✅ Supervisor creado exitosamente');
    console.log('');
    console.log(`ID: ${supervisor.id}`);
    console.log(`Nombre: ${supervisor.nombre}`);
    console.log(`Código: ${codigo} (guardado como hash)`);
    console.log('');
    console.log('========================================');
    console.log('');
    console.log('El supervisor ya puede hacer login con:');
    console.log(`- Código: ${codigo}`);
    console.log('');

    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Error creando supervisor:', error.message);
    console.error('');
    await closePool();
    process.exit(1);
  }
}

crearSupervisor();
