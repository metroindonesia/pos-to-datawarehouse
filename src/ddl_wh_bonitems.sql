-- public.salesitem definition

-- Drop table

-- DROP TABLE public.salesitem;

CREATE TABLE public.bonitem (
	line_id bigserial NOT NULL,
	bon_id int8 NOT NULL,
	dept_no text NULL,
	class_no text NULL,
	sku text NULL,
	sku_promo text NULL,
	sku_promo_adhoc text NULL,
	qty int4 NOT NULL,
	original_price numeric NULL,
	sales_price numeric NULL,
	sales_gross numeric NULL,
	sales_nett numeric NULL,
	staff_id text NULL,
	staff_name text NULL,
	barcode1 text NULL,
	barcode2 text NULL,
	flag char(1),
	discount_type text NULL,
	discount_value numeric NULL,
	discount_percentage int4 NULL,
	timestamp timestamp,
	CONSTRAINT bonitem_pk PRIMARY KEY (line_id)
);