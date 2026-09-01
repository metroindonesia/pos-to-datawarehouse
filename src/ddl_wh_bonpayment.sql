CREATE TABLE public.bonpayment (
	line_id bigserial NOT NULL,
	bon_id int8 NOT NULL,
	method text,
	code text,
	card_no text,
	amount numeric NULL,
	approval_code text,
	flag char(1),
	timestamp timestamp,
	CONSTRAINT bonpayment_pk PRIMARY KEY (line_id)
);

