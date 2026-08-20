
CREATE TABLE public.pos (
	pos_id bigserial NOT NULL PRIMARY KEY,
	pos_date date NULL,
	pos_time time NULL,
	store_no text NULL,
	transaction_no text NULL,
	pos_code text NULL,
	total_gross numeric NULL,
	total_nett numeric NULL,
	total_payment numeric NULL,
	cashier_id text NULL,
	loyalty_member text NULL,
	loyalty_id text NULL,
	loyalty_name text NULL,
	transaction_type text NULL,
	transaction_status text NULL,
	transaction_flag text NULL,
	cancel_transaction_no text NULL,
	deposit_transaction_no text NULL,
	flag text NULL,
	site_code text NULL,
	channel text NULL
);