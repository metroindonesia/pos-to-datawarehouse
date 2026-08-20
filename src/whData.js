
export async function writePosDataBy(id, data, data_method, tx) {
    try {
        const header = data.header && data.header[0];
        if (!header) {
            return;
        }

        const items = data.items || [];
        const payments = data.payments || [];

        await writeHeader(id, header, data_method, tx);
        await writeItems(id, items, data_method, tx);
        await writePayments(id, payments, data_method, tx);

    } catch (err) {
        throw err;
    }
}



async function writeHeader(id, header, data_method, tx) {
    try {

        // Format pos_time from pos_time (timestamp) if available
        let pos_time = null;
        if (header.pos_time) {
            const dateObj = new Date(header.pos_time);
            if (!isNaN(dateObj.getTime())) {
                pos_time = dateObj.toTimeString().split(' ')[0];
            }
        }

        const query = `
            INSERT INTO public.pos (
                pos_id, pos_date, pos_time, store_no, transaction_no, pos_code, 
                total_gross, total_nett, total_payment, cashier_id, loyalty_member, 
                loyalty_id, loyalty_name, transaction_type, transaction_status, 
                transaction_flag, cancel_transaction_no, deposit_transaction_no, 
                flag, site_code, channel
            ) VALUES (
                $[pos_id], $[pos_date], $[pos_time], $[store_no], $[transaction_no], $[pos_code], 
                $[total_gross], $[total_nett], $[total_payment], $[cashier_id], $[loyalty_member], 
                $[loyalty_id], $[loyalty_name], $[transaction_type], $[transaction_status], 
                $[transaction_flag], $[cancel_transaction_no], $[deposit_transaction_no], 
                $[flag], $[site_code], $[channel]
            )
            ON CONFLICT (pos_id) DO UPDATE SET
                pos_date = EXCLUDED.pos_date,
                pos_time = EXCLUDED.pos_time,
                store_no = EXCLUDED.store_no,
                transaction_no = EXCLUDED.transaction_no,
                pos_code = EXCLUDED.pos_code,
                total_gross = EXCLUDED.total_gross,
                total_nett = EXCLUDED.total_nett,
                total_payment = EXCLUDED.total_payment,
                cashier_id = EXCLUDED.cashier_id,
                loyalty_member = EXCLUDED.loyalty_member,
                loyalty_id = EXCLUDED.loyalty_id,
                loyalty_name = EXCLUDED.loyalty_name,
                transaction_type = EXCLUDED.transaction_type,
                transaction_status = EXCLUDED.transaction_status,
                transaction_flag = EXCLUDED.transaction_flag,
                cancel_transaction_no = EXCLUDED.cancel_transaction_no,
                deposit_transaction_no = EXCLUDED.deposit_transaction_no,
                flag = EXCLUDED.flag,
                site_code = EXCLUDED.site_code,
                channel = EXCLUDED.channel
        `;

        const values = {
            pos_id: header.pos_id,
            pos_date: header.pos_date,
            pos_time: pos_time,
            store_no: header.store_no,
            transaction_no: header.transaction_no,
            pos_code: header.pos_code,
            total_gross: header.total_gross,
            total_nett: header.total_netsales, // mapped to total_nett
            total_payment: header.total_payment,
            cashier_id: header.cashier_id,
            loyalty_member: header.loyalty_member,
            loyalty_id: header.loyalty_id,
            loyalty_name: header.loyalty_name,
            transaction_type: header.transaction_type,
            transaction_status: header.transaction_status,
            transaction_flag: header.transaction_flag,
            cancel_transaction_no: header.cancel_transaction_no,
            deposit_transaction_no: header.deposit_transaction_no,
            flag: header.flag,
            site_code: header.site_code,
            channel: header.channel
        };

        await tx.none(query, values);


    } catch (err) {
        throw err;
    }
}


async function writeItems(id, items, data_method, tx) {
    if (!items || items.length === 0) {
        return;
    }

    const query = `
        INSERT INTO public.positem (
            line_id, pos_id, dept_no, class_no, sku, sku_promo, sku_promo_adhoc,
            qty, original_price, sales_price, sales_gross, sales_nett, staff_id, staff_name,
            barcode1, barcode2, flag, discount_type, discount_value, discount_percentage
        ) VALUES (
            $[line_id], $[pos_id], $[dept_no], $[class_no], $[sku], $[sku_promo], $[sku_promo_adhoc],
            $[qty], $[original_price], $[sales_price], $[sales_gross], $[sales_nett], $[staff_id], $[staff_name],
            $[barcode1], $[barcode2], $[flag], $[discount_type], $[discount_value], $[discount_percentage]
        )
        ON CONFLICT (line_id) DO UPDATE SET
            pos_id = EXCLUDED.pos_id,
            dept_no = EXCLUDED.dept_no,
            class_no = EXCLUDED.class_no,
            sku = EXCLUDED.sku,
            sku_promo = EXCLUDED.sku_promo,
            sku_promo_adhoc = EXCLUDED.sku_promo_adhoc,
            qty = EXCLUDED.qty,
            original_price = EXCLUDED.original_price,
            sales_price = EXCLUDED.sales_price,
            sales_gross = EXCLUDED.sales_gross,
            sales_nett = EXCLUDED.sales_nett,
            staff_id = EXCLUDED.staff_id,
            staff_name = EXCLUDED.staff_name,
            barcode1 = EXCLUDED.barcode1,
            barcode2 = EXCLUDED.barcode2,
            flag = EXCLUDED.flag,
            discount_type = EXCLUDED.discount_type,
            discount_value = EXCLUDED.discount_value,
            discount_percentage = EXCLUDED.discount_percentage
    `;

    for (const item of items) {
        const values = {
            line_id: item.line_id,
            pos_id: item.pos_id,
            dept_no: item.dept_no,
            class_no: item.class_no,
            sku: item.sku,
            sku_promo: item.sku_promo,
            sku_promo_adhoc: item.sku_promo_adhoc,
            qty: item.qty,
            original_price: item.original_price,
            sales_price: item.sales_price,
            sales_gross: item.gross,
            sales_nett: item.netsales,
            staff_id: item.staff_id,
            staff_name: item.staff_name,
            barcode1: item.barcode1,
            barcode2: item.barcode2,
            flag: item.flag,
            discount_type: item.discount_type,
            discount_value: item.discount_value,
            discount_percentage: item.discount_percentage ? parseInt(item.discount_percentage, 10) : null
        };
        await tx.none(query, values);
    }
}


async function writePayments(id, payments, data_method, tx) {

}