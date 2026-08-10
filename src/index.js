import http from 'http';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import pgPromise from 'pg-promise';
import cron from 'node-cron';
import { syncData } from './syncData.js';

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

// MySQL Connection Pool (persistent)
const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'pos_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


// Function to check database connections
async function checkConnections() {
  console.log('Checking database connections...');
  
  // Test MySQL
  try {
    const conn = await mysqlPool.getConnection();
    conn.release();
    console.log('MySQL connection test: SUCCESS');
  } catch (error) {
    console.error('MySQL connection test: FAILED -', error.message);
    throw error;
  }

  // Test PostgreSQL
  try {
    const obj = await pgDb.connect();
    obj.done(); // release connection
    console.log('PostgreSQL connection test: SUCCESS');
  } catch (error) {
    console.error('PostgreSQL connection test: FAILED -', error.message);
    throw error;
  }
}

// Start the service if connections are successful
async function start() {
  try {
    await checkConnections();

    const isRunNow = process.argv.includes('now');
    if (isRunNow) {
      console.log('Running synchronization immediately ("now" parameter detected)...');
      await syncData(mysqlPool, pgDb);
      console.log('Immediate synchronization finished. Exiting...');
      await mysqlPool.end();
      pgp.end();
      process.exit(0);
    }
    
    // 1. Cron Job Configuration
    cron.schedule(CRON_SCHEDULE, async () => {
      console.log(`[${new Date().toISOString()}] Triggering scheduled sync (Cron: ${CRON_SCHEDULE})...`);
      await syncData(mysqlPool, pgDb);
    });
    console.log(`Cron job scheduled with expression: "${CRON_SCHEDULE}"`);

    // 2. HTTP Server Configuration
    const server = http.createServer(async (req, res) => {
      // Set headers
      res.setHeader('Content-Type', 'application/json');

      if (req.method === 'POST') {
        if (req.url === '/sync') {
          // Trigger sync asynchronously so HTTP request returns quickly
          syncData(mysqlPool, pgDb).catch(err => console.error('Sync failed:', err));

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
  } catch (error) {
    console.error('Fatal: Service failed to start due to database connection error.');
    process.exit(1);
  }
}

start();
