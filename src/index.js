import http from 'http';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import pgPromise from 'pg-promise';
import cron from 'node-cron';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3900;
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '*/5 * * * *';

// PostgreSQL client initialization
const pgp = pgPromise();
const pgDb = pgp({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
  database: process.env.PG_DATABASE || 'datawarehouse',
});

// Helper to get MySQL Connection
async function getMySQLConnection() {
  return await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'pos_db',
  });
}

// Main synchronization logic
let isSyncing = false;
async function syncData() {
  if (isSyncing) {
    console.log(`[${new Date().toISOString()}] Synchronization already in progress. Skipping...`);
    return;
  }

  isSyncing = true;
  console.log(`[${new Date().toISOString()}] Starting data synchronization...`);

  let mysqlConn;
  try {
    // 1. Connect to MySQL Source Database
    mysqlConn = await getMySQLConnection();
    console.log('Successfully connected to MySQL source.');

    // 2. Example synchronization query (Placeholder: Read and write sample data)
    // NOTE: This can be customized according to the tables being synchronized.
    console.log('Reading data from MySQL source...');
    // const [rows] = await mysqlConn.execute('SELECT * FROM transactions WHERE synced = 0');
    
    // 3. Write data to PostgreSQL Target Database using pg-promise
    // Example:
    // if (rows.length > 0) {
    //   await pgDb.tx(async t => {
    //     const queries = rows.map(row => t.none('INSERT INTO target_table(...) VALUES(...)'));
    //     await t.batch(queries);
    //   });
    // }
    
    console.log(`[${new Date().toISOString()}] Synchronization completed successfully.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error during synchronization:`, error.message);
  } finally {
    if (mysqlConn) {
      await mysqlConn.end().catch(err => console.error('Error closing MySQL connection:', err.message));
    }
    isSyncing = false;
  }
}

// 1. Cron Job Configuration
cron.schedule(CRON_SCHEDULE, async () => {
  console.log(`[${new Date().toISOString()}] Triggering scheduled sync (Cron: ${CRON_SCHEDULE})...`);
  await syncData();
});
console.log(`Cron job scheduled with expression: "${CRON_SCHEDULE}"`);

// 2. HTTP Server Configuration
const server = http.createServer(async (req, res) => {
  // Set headers
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'POST') {
    if (req.url === '/sync') {
      // Trigger sync asynchronously so HTTP request returns quickly
      syncData().catch(err => console.error('Sync failed:', err));

      res.writeHead(202);
      res.end(JSON.stringify({ 
        status: 'success', 
        message: 'Synchronization triggered successfully.' 
      }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ 
        status: 'error', 
        message: 'Endpoint not found. Use POST /sync to trigger.' 
      }));
    }
  } else {
    res.writeHead(405);
    res.end(JSON.stringify({ 
      status: 'error', 
      message: 'Method Not Allowed. Use POST method.' 
    }));
  }
});

server.listen(PORT, () => {
  console.log(`HTTP Server is running on port ${PORT}`);
  console.log(`Trigger manual sync via POST: http://localhost:${PORT}/sync`);
});
