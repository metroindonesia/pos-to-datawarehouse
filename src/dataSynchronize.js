import fs from 'fs';
import path from 'path';
import { uniqid } from './uniqid.js';
import { getPosDataByid } from './posData.js'
import { writePosDataBy } from './whData.js'

let isSyncing = false;

// Logger helper function
function writeLog(message, isError = false) {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, 'sync.log');
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${isError ? 'ERROR' : 'INFO'}] ${message}\n`;

  // Hapus kode warna ANSI jika ada sebelum disimpan ke file
  const cleanMessage = formattedMessage.replace(/\x1b\[\d+m/g, '');
  fs.appendFileSync(logFile, cleanMessage, 'utf8');
}

/**
 * Main synchronization logic
 * @param {object} mysqlPool - MySQL Connection Pool
 * @param {object} pgDb - PostgreSQL Database connection (pg-promise)
 */
export async function dataSynchronize(mysqlPool, pgDb) {
  if (isSyncing) {
    console.log(`[${new Date().toISOString()}] Synchronization already in progress. Skipping...`);
    return;
  }

  isSyncing = true;
  console.log(`[${new Date().toISOString()}] Starting data synchronization...`);

  let mysqlConn;
  let totalSyncedRows = 0;
  try {
    mysqlConn = await mysqlPool.getConnection();
    console.log('Successfully acquired MySQL connection from pool.');


    // 1. hapus data yang sudah complete
    {
      await mysqlConn.execute(
        `DELETE FROM sales_transfer_queue WHERE process_iscompleted=1 AND process_expired<NOW()`
      )
    }


    // 2. update proses yang sudah expired dan belum complete
    {
      await mysqlConn.execute(
        `UPDATE sales_transfer_queue   
        SET
        process_status = 0,
        sync_batch = null,
        process_iscompleted = 0,
        process_start = null,
        process_completed = null,
        process_expired = null 
        WHERE process_iscompleted=0 AND process_expired<NOW()`
      )
    }


    // buat dulu code batch untuk menandai proses 
    const batch = uniqid();
    console.log(`Generated sync batch: ${batch}`);



    // 3. Update data pada tabel sales_transfer_queue yang sync_batch is null
    {
      const intervalMinutes = parseInt(process.env.PROCESS_EXPIRED_INTERVAL_MINUTES || '10', 10);
      const [result] = await mysqlConn.execute(
        'UPDATE sales_transfer_queue SET sync_batch = ?, process_expired = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE sync_batch IS NULL',
        [batch, intervalMinutes]
      );
      console.log(`Updated ${result.affectedRows} rows in sales_transfer_queue with batch: ${batch} and expiry interval: ${intervalMinutes} minutes`);
    }



    let hasMoreRows = true;
    while (hasMoreRows) {
      // 3. Ambil 10 baris pertama yang mempunyai time_stamp paling lama yang sync_batch bernilai kode batch saat ini dan belum diproses
      const [rows] = await mysqlConn.execute(
        'SELECT id, data_method FROM sales_transfer_queue WHERE sync_batch = ? AND process_status = 0 ORDER BY time_stamp ASC LIMIT 10',
        [batch]
      );

      if (!rows || rows.length === 0) {
        hasMoreRows = false;
        break;
      }

      console.log(`Processing chunk of ${rows.length} rows...`);
      const ids = rows.map(row => row.id);

      // Tandai 10 baris ini dengan menyetel process_status menjadi 1
      await mysqlConn.query(
        `UPDATE sales_transfer_queue SET process_status=1, process_start=NOW() WHERE id IN (${ids.map(() => '?').join(',')})`,
        ids
      );
      console.log(`Marked ${rows.length} rows in sales_transfer_queue with process_status = 1`);



      // Loop ids dengan transaksi PostgreSQL (pg-promise otomatis menangani BEGIN, COMMIT, dan ROLLBACK)
      try {
        await pgDb.tx(async tx => {
          for (const row of rows) {
            const { id, data_method } = row;
            // Pemrosesan individual per ID
            const data = await getPosDataByid(id, mysqlConn);


            // tulis ke data warehouse
            await writePosDataBy(id, data, data_method, tx)


            // Update process_completed=1 di MySQL
            await mysqlConn.query(
              'UPDATE sales_transfer_queue SET process_iscompleted=1, process_completed=NOW() WHERE id=?',
              [id]
            );
          }
        });
        totalSyncedRows += ids.length;
        console.log(`Transaction successfully committed for ${ids.length} rows.`);


        // beri jeda waktu 10 detik
        console.log('Waiting 10 seconds before processing next chunk...');
        await new Promise(resolve => setTimeout(resolve, 10000));

      } catch (err) {
        console.error('Transaction failed, PostgreSQL changes rolled back:', err.message);
        throw err;
      }
    }




    // Process selesai
    const successMsg = totalSyncedRows === 0
      ? 'Tidak ada data pending yang harus disync'
      : `Synchronization completed successfully. Total rows synchronized: ${totalSyncedRows}`;
    console.log(`[${new Date().toISOString()}] ${successMsg}`);
    writeLog(successMsg);
  } catch (error) {
    const errorMsg = `Error during synchronization: ${error.message}`;
    console.error(`[${new Date().toISOString()}] \x1b[31mError\x1b[0m during synchronization:`, error.message);
    writeLog(errorMsg, true);
  } finally {
    if (mysqlConn) {
      mysqlConn.release();
    }
    isSyncing = false;
  }
}
