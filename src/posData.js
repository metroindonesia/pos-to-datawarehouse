export async function getPosDataByid(id, mysqlConn) {
    const data = {}

    try {
        const [header] = await mysqlConn.execute(
            `SELECT 
            A.id as pos_id, 
            A.store_no, 
            A.sales_date as pos_date, 
            A.time_stamp as pos_time,
            A.transaction_no, A.pos_code, A.total_gross, A.total_netsales, 
            A.total_payment, A.cashier_id, A.loyalty_member, A.loyalty_id, A.loyalty_name, A.transaction_type,
            A.transaction_status, A.transaction_flag, A.cancel_transaction_no, A.deposit_transaction_no,
            A.time_stamp, A.flag,
            B.site_code, B.channel
            FROM 
            sales_summary A left join sales_site B on B.sales_summary_id=A.id
            WHERE 
            A.id = ?`,
            [id]
        );


        const [items] = await mysqlConn.execute(
            `SELECT
            A.id as line_id, 
            A.sales_summary_id as pos_id, 
            A.dept_no, A.class_no, A.sku, A.sku_promo, A.sku_promo_adhoc,
            A.qty, A.original_price, A.sales_price, A.gross, A.netsales, A.staff_id, A.staff_name,
            A.barcode1, A.barcode2, A.flag,
            B.discount_type, B.discount_value, B.discount_percentage, B.discount_code
            FROM
            sales_item A left join sales_item_discount B on B.sales_item_id= A.id
            WHERE
            A.sales_summary_id = ?`,
            [id]
        )

        const [payments] = await mysqlConn.execute(
            `SELECT
            A.id as line_id, 
            A.sales_summary_id as pos_id, 
            A.method, A.code, A.card_no, A.amount, A.approval_code
            FROM
            sales_payment A
            WHERE
            A.sales_summary_id = ?`,
            [id]
        )


        data.header = header
        data.items = items
        data.payments = payments


        return data
    } catch (err) {
        throw err
    }
}
