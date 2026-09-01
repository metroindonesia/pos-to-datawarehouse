-- metro_pos.sales_transfer_queue definition

CREATE TABLE `sales_transfer_queue` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sales_summary_id` int(11) DEFAULT NULL,
  `process_status` tinyint(4) DEFAULT '0' COMMENT '0=new, 1=proses',
  `sync_batch` varchar(36) DEFAULT NULL,
  `process_start` timestamp NULL DEFAULT NULL,
  `process_iscompleted` tinyint(1) NOT NULL DEFAULT '0',
  `process_completed` timestamp NULL DEFAULT NULL,
  `process_expired` timestamp NULL DEFAULT NULL,
  `data_method` varchar(10) DEFAULT NULL,
  `time_stamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sales_summary_id` (`sales_summary_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1858 DEFAULT CHARSET=utf8mb4;