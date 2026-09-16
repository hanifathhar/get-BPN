const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

console.log('=== DIAGNOSTIK ORACLE CLIENT LINUX ===');
console.log('OS Platform:', process.platform);
console.log('Node.js Version:', process.version);
console.log('Oracledb Version:', oracledb.versionString);

const libDir = process.env.ORACLE_CLIENT_DIR || '/opt/oracle/instantclient_19_23';
console.log('Target Oracle LibDir:', libDir);
console.log('Directory Exists?:', fs.existsSync(libDir));

if (fs.existsSync(libDir)) {
  const files = fs.readdirSync(libDir);
  console.log('Files in LibDir (Sample):', files.slice(0, 10));
}

try {
  oracledb.initOracleClient({ libDir });
  console.log('✅ initOracleClient BERHASIL!');
  console.log('Thick Mode Active?:', !oracledb.thin);
  console.log('Oracle Client Version:', oracledb.oracleClientVersionString);
} catch (err) {
  console.error('❌ GAGAL initOracleClient:', err.message);
  console.error('Detail Stack:', err);
}

async function testConnection() {
  try {
    const conn = await oracledb.getConnection({
      user: process.env.DB_USER || 'PBB',
      password: process.env.DB_PASSWORD || 'PBB',
      connectString: '103.167.12.59:1521/SISMIOP'
    });
    console.log('✅ BERHASIL CONNECT KE ORACLE DATABASE SISMIOP!');
    const res = await conn.execute('SELECT 1 FROM DUAL');
    console.log('Query result:', res.rows);
    await conn.close();
  } catch (e) {
    console.error('❌ GAGAL QUERY DATABASE:', e.message);
  }
}

testConnection();
