import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  // Try socket first
  console.log('🔍 Trying Unix socket connection...');
  try {
    const connection = await mysql.createConnection({
      socketPath: '/var/run/mysqld/mysqld.sock',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ MySQL connection via socket successful!');
    await connection.end();
    process.exit(0);
  } catch (socketError) {
    console.error('❌ Socket connection failed:', socketError.message);

    // Try TCP as fallback
    console.log('\n🔍 Trying TCP connection...');
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      });

      console.log('✅ MySQL connection via TCP successful!');
      await connection.end();
      process.exit(0);
    } catch (tcpError) {
      console.error('❌ TCP connection failed:', tcpError.message);
      console.error('\n📋 Connection details:');
      console.error('   Host:', process.env.DB_HOST || 'localhost');
      console.error('   Port:', process.env.DB_PORT || 3306);
      console.error('   User:', process.env.DB_USER || 'root');
      console.error('   Database:', process.env.DB_NAME);
      process.exit(1);
    }
  }
}

testConnection();
