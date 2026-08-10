export async function getPosDataByid(id, mysqlConn) {
    const data = {}

    try {
        const [row] = await mysqlConn.execute(
            `SELECT 
            A.id, A.store_no, A.sales_date, A.transaction_no, A.pos_code, A.total_gross, A.total_netsales, A.total_payment, A.cashier_id, A.
            FROM 
            sales_summary A
            WHERE A.id = ?`,
            [id]
        );


        data.header = row



        return data
    } catch (err) {
        throw err
    }
}

