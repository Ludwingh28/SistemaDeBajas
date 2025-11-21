import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración del pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_bajas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Función para verificar la conexión
export const verificarConexion = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Conexión a MySQL exitosa');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ Error conectando a MySQL:', error.message);
    return false;
  }
};

// Función para ejecutar queries
export const query = async (sql, params) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error ejecutando query:', error);
    throw error;
  }
};

// Función para obtener una conexión del pool
export const getConnection = async () => {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Error obteniendo conexión:', error);
    throw error;
  }
};

export default pool;
