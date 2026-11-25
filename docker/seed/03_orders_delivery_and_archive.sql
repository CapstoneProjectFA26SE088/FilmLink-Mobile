SET TIME ZONE 'UTC';

-- =====================================================================================
-- 03. SERVICE ORDERS, ROLLS, PROCESSING STAGES, SCHEDULING, DELIVERY & FILM ARCHIVE
-- Order codes follow ServiceOrderServiceImpl: SO + yyMMdd + 6 Crockford base-32 chars
-- =====================================================================================

INSERT INTO service_orders (
    id, order_code, idempotency_key, photographer_account_id, film_lab_id,
    status, status_before_suspension, service_tier, film_handover_method, payment_method,
    special_request, customer_address_line, customer_district, customer_province, customer_phone,
    pickup_window_start_at, pickup_window_end_at,
    estimated_total_vnd, final_total_vnd, price_locked_at,
    expected_return_at, promised_return_at, machine_assignment_confirmed_at,
    lab_response_due_at, accepted_at, rejection_reason,
    delivered_at, closed_at, keep_negatives_at_lab,
    cancelled_at, cancelled_by_account_id, cancellation_reason, cancellation_fee_vnd,
    created_at, updated_at
) VALUES
    -- 1: IN_PROCESSING (at SCANNING stage, has active schedule_change awaiting response!)
    (1, 'SO261122A1B2C3', '10000000-0000-4000-8000-000000000001', 3, 1,
     'IN_PROCESSING', NULL, 'STANDARD', 'SELF_DROP_OFF', 'PAY_AT_LAB',
     'Giữ nguyên dải màu ấm Kodak Gold, cắt đoạn 6 kiểu cho vào sleeve.',
     NULL, NULL, NULL, NULL, NULL, NULL,
     170000, 170000, '2026-11-22T07:00:00Z',
     '2026-11-25T10:00:00Z', '2026-11-26T10:00:00Z', '2026-11-22T07:30:00Z',
     '2026-11-23T02:00:00Z', '2026-11-22T03:00:00Z', NULL,
     NULL, NULL, false,
     NULL, NULL, NULL, NULL,
     '2026-11-22T02:00:00Z', '2026-11-23T08:00:00Z'),

    -- 2: DELIVERED (ready for Photographer Confirm Receipt -> CLOSED, with archived roll & previews)
    (2, 'SO261115D4E5F6', '10000000-0000-4000-8000-000000000002', 3, 2,
     'DELIVERED', NULL, 'STANDARD', 'PICKUP', 'PAY_AT_LAB',
     'Push +1 stop cuộn Ilford HP5 Plus 400 lên ISO 800, scan độ tương phản cao.',
     '72 Lê Thánh Tôn, Phường Bến Nghé', 'Quận 1', 'TP. Hồ Chí Minh', '0909123456',
     '2026-11-15T03:00:00Z', '2026-11-15T05:00:00Z',
     155000, 155000, '2026-11-15T07:00:00Z',
     '2026-11-18T10:00:00Z', '2026-11-18T10:00:00Z', '2026-11-15T07:15:00Z',
     '2026-11-16T02:00:00Z', '2026-11-15T02:30:00Z', NULL,
     '2026-11-18T09:30:00Z', NULL, false,
     NULL, NULL, NULL, NULL,
     '2026-11-15T02:00:00Z', '2026-11-18T09:30:00Z'),

    -- 3: CLOSED (fully closed order with 2 archived rolls, online payment, lab review)
    (3, 'SO261108G7H8J9', '10000000-0000-4000-8000-000000000003', 3, 1,
     'CLOSED', NULL, 'EXPRESS', 'SELF_DROP_OFF', 'ONLINE',
     'Cắt âm bản giữ cẩn thận, giao link full-res sớm cho dự án cưới.',
     NULL, NULL, NULL, NULL, NULL, NULL,
     235000, 235000, '2026-11-08T04:00:00Z',
     '2026-11-09T10:00:00Z', '2026-11-09T10:00:00Z', '2026-11-08T04:15:00Z',
     '2026-11-09T02:00:00Z', '2026-11-08T02:30:00Z', NULL,
     '2026-11-09T09:45:00Z', '2026-11-10T04:00:00Z', false,
     NULL, NULL, NULL, NULL,
     '2026-11-08T02:00:00Z', '2026-11-10T04:00:00Z'),

    -- 4: AWAITING_PAYMENT (ONLINE order awaiting VNPay sandbox payment or cancellation)
    (4, 'SO261124K2M3N4', '10000000-0000-4000-8000-000000000004', 3, 3,
     'AWAITING_PAYMENT', NULL, 'STANDARD', 'SELF_DROP_OFF', 'ONLINE',
     'Tráng ECN-2 tách lớp remjet cẩn thận giúp mình.',
     NULL, NULL, NULL, NULL, NULL, NULL,
     105000, NULL, NULL,
     '2026-11-28T10:00:00Z', NULL, NULL,
     NULL, NULL, NULL,
     NULL, NULL, false,
     NULL, NULL, NULL, NULL,
     '2026-11-24T11:00:00Z', '2026-11-24T11:00:00Z'),

    -- 5: AWAITING_LAB_CONFIRMATION (PICKUP order ready for lab accept or Photographer cancel)
    (5, 'SO261124P5Q6R7', '10000000-0000-4000-8000-000000000005', 3, 1,
     'AWAITING_LAB_CONFIRMATION', NULL, 'STANDARD', 'PICKUP', 'PAY_AT_LAB',
     'Gọi trước 15 phút khi shipper đến lấy cuộn phim.',
     '72 Lê Thánh Tôn, Phường Bến Nghé', 'Quận 1', 'TP. Hồ Chí Minh', '0909123456',
     '2026-11-26T02:00:00Z', '2026-11-26T04:00:00Z',
     110000, NULL, NULL,
     '2026-11-29T10:00:00Z', NULL, NULL,
     '2026-11-25T15:00:00Z', NULL, NULL,
     NULL, NULL, false,
     NULL, NULL, NULL, NULL,
     '2026-11-24T15:00:00Z', '2026-11-24T15:00:00Z'),

    -- 6: CANCELLED (historical cancelled order)
    (6, 'SO261112S8T9V0', '10000000-0000-4000-8000-000000000006', 3, 2,
     'CANCELLED', NULL, 'STANDARD', 'SELF_DROP_OFF', 'PAY_AT_LAB',
     NULL,
     NULL, NULL, NULL, NULL, NULL, NULL,
     160000, NULL, NULL,
     '2026-11-16T10:00:00Z', NULL, NULL,
     '2026-11-13T04:00:00Z', NULL, NULL,
     NULL, NULL, false,
     '2026-11-12T06:00:00Z', 3, 'Đổi kế hoạch đi công tác nên tạm hoãn gửi tráng cuộn slide E-6.', 0,
     '2026-11-12T04:00:00Z', '2026-11-12T06:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Film Rolls (note V20261105_2103 dropped development_batch_id)
INSERT INTO film_rolls (
    id, service_order_id, roll_sequence, film_stock_id, film_stock_name_text,
    film_format_id, film_process_id, service_package_id, service_package_scan_option_id,
    exposure_count, shooting_iso, push_pull_stops,
    unit_price_vnd, scan_option_price_vnd, push_pull_surcharge_vnd, express_surcharge_vnd,
    status, is_added_at_receipt
)
SELECT v.id, v.order_id, v.seq, fs.id, v.free_stock,
       sp.film_format_id, sp.film_process_id, sp.id, v.scan_opt_id,
       v.exposures, v.iso, v.push_pull,
       sp.price_vnd, COALESCE(opt.price_vnd, 0), v.pp_fee, v.exp_fee,
       v.roll_status, false
FROM (VALUES
    (1, 1, 1, 'Gold 200',        NULL,                         1, 1, 36, 200, 0,     0,     0, 'RECEIVED'),
    (2, 1, 2, 'Portra 400',      NULL,                         1, 1, 36, 400, 0,     0,     0, 'RECEIVED'),
    (3, 2, 1, 'HP5 Plus',        NULL,                         6, 7, 12, 800, 1, 20000,     0, 'RECEIVED'),
    (4, 3, 1, 'ColorPlus 200',   NULL,                         2, 3, 36, 200, 0,     0, 34500, 'RECEIVED'),
    (5, 3, 2, NULL,              'Kodak Vision3 500T Respool', 1, 2, 36, 500, 0,     0, 25500, 'RECEIVED'),
    (6, 4, 1, 'Vision3 500T',    NULL,                         8, 8, 36, 500, 0,     0,     0, 'DECLARED'),
    (7, 5, 1, 'Portra 400',      NULL,                         4, 5, 12, 400, 0,     0,     0, 'DECLARED'),
    (8, 6, 1, 'Ektachrome E100', NULL,                         5, 6, 36, 100, 0,     0,     0, 'DECLARED')
) AS v(id, order_id, seq, stock_name, free_stock, pkg_id, scan_opt_id, exposures, iso, push_pull, pp_fee, exp_fee, roll_status)
JOIN service_packages sp ON sp.id = v.pkg_id
LEFT JOIN film_stocks fs ON fs.stock_name = v.stock_name
LEFT JOIN service_package_scan_options opt ON opt.id = v.scan_opt_id
ON CONFLICT (id) DO NOTHING;

-- Print line attached to Order 3 (4R x 10 @ 6000 = 60,000 VND)
INSERT INTO order_print_lines (
    id, service_order_id, film_roll_id, print_size_id, quantity, unit_price_vnd, amount_vnd
)
SELECT 1, 3, 4, ps.id, 10, 6000, 60000
FROM print_sizes ps WHERE ps.code = '4R'
ON CONFLICT (id) DO NOTHING;

-- Capacity Allocations (V20261105_2103)
INSERT INTO order_capacity_allocations (
    id, service_order_id, film_lab_id, work_date, film_process_id, film_format_id,
    service_tier, roll_count, order_received_at
)
SELECT v.id, v.order_id, v.lab_id, v.work_date::date, fp.id, ff.id, v.tier, v.rolls, v.recv::timestamptz
FROM (VALUES
    (1, 1, 1, '2026-11-23', 'C41', '135', 'STANDARD', 2, '2026-11-22T07:00:00Z'),
    (2, 2, 2, '2026-11-16', 'C41', '120', 'STANDARD', 1, '2026-11-15T07:00:00Z'),
    (3, 3, 1, '2026-11-08', 'C41', '135', 'EXPRESS',  2, '2026-11-08T04:00:00Z')
) AS v(id, order_id, lab_id, work_date, fp_code, ff_code, tier, rolls, recv)
JOIN film_processes fp ON fp.code = v.fp_code
JOIN film_formats ff ON ff.code = v.ff_code
ON CONFLICT (id) DO NOTHING;

-- Schedule Changes (1 pending response on Order 1, 1 historical answered on Order 3)
INSERT INTO schedule_changes (
    id, service_order_id, machine_incident_id, step_applied, old_promised_at, new_promised_at,
    requires_response, response_due_at, customer_choice, customer_note, responded_at
) VALUES
    (1, 1, 1, 'RESCHEDULED', '2026-11-25T10:00:00Z', '2026-11-26T10:00:00Z',
     true, '2026-11-27T10:00:00Z', NULL, NULL, NULL),
    (2, 3, 1, 'MOVED_MACHINE', '2026-11-09T09:00:00Z', '2026-11-09T10:00:00Z',
     true, '2026-11-11T09:00:00Z', 'WAIT', 'Không sao, mình chờ giao trong ngày 09/11.', '2026-11-08T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Processing Stage Records (APPEND-ONLY trigger!)
INSERT INTO processing_stage_records (
    id, service_order_id, stage, note, is_admin_reversion, recorded_by_account_id, recorded_at
) VALUES
    -- Order 1: RECEIVED -> DEVELOPING -> WASHING -> DRYING -> SCANNING (current)
    (1,  1, 'RECEIVED',   'Đã nhận đủ 2 cuộn Kodak Gold 200 và Portra 400 nguyên vẹn.', false, 5, '2026-11-22T07:00:00Z'),
    (2,  1, 'DEVELOPING', 'Tráng hóa chất C-41 chuẩn 37.8°C trên Noritsu QSF-V30.',      false, 5, '2026-11-22T09:00:00Z'),
    (3,  1, 'WASHING',    'Rửa và ổn định bề mặt nhũ tương hoàn tất.',                   false, 5, '2026-11-22T10:00:00Z'),
    (4,  1, 'DRYING',     'Sấy khô âm bản trong tủ kín lọc bụi.',                       false, 5, '2026-11-22T11:00:00Z'),
    (5,  1, 'SCANNING',   'Đang scan cuộn 2/2 (Portra 400) trên Noritsu HS-1800.',      false, 5, '2026-11-23T08:00:00Z'),

    -- Order 2: All 6 stages complete (DELIVERED)
    (6,  2, 'RECEIVED',   'Đã nhận cuộn Ilford HP5 Plus 400, ghi chú push +1 stop.',    false, 6, '2026-11-15T07:00:00Z'),
    (7,  2, 'DEVELOPING', 'Tráng B&W thủ công Jobo CPP-3 push +1 stop.',                false, 6, '2026-11-15T10:00:00Z'),
    (8,  2, 'WASHING',    'Rửa sạch hóa chất theo quy chuẩn lưu trữ.',                  false, 6, '2026-11-15T11:00:00Z'),
    (9,  2, 'DRYING',     'Sấy tự nhiên không đốm nước.',                               false, 6, '2026-11-15T13:00:00Z'),
    (10, 2, 'SCANNING',   'Scan 6x6 High-Res trên Hasselblad & Frontier.',              false, 6, '2026-11-16T08:00:00Z'),
    (11, 2, 'QC',         'Kiểm tra độ nét, khử bụi và tải preview lên Archive.',       false, 6, '2026-11-17T09:00:00Z'),

    -- Order 3: All 6 stages complete (CLOSED)
    (12, 3, 'RECEIVED',   'Nhận 2 cuộn Express tại quầy Mộc Film Lab.',                 false, 5, '2026-11-08T04:00:00Z'),
    (13, 3, 'DEVELOPING', 'Tráng C-41 ưu tiên Express.',                                false, 5, '2026-11-08T05:30:00Z'),
    (14, 3, 'WASHING',    'Hoàn tất rửa ổn định.',                                      false, 5, '2026-11-08T06:15:00Z'),
    (15, 3, 'DRYING',     'Hoàn tất sấy âm bản.',                                       false, 5, '2026-11-08T07:00:00Z'),
    (16, 3, 'SCANNING',   'Scan 6000x4000 16-bit TIFF trên Noritsu HS-1800.',           false, 5, '2026-11-09T03:00:00Z'),
    (17, 3, 'QC',         'QC hoàn tất và bàn giao link Archive + 10 ảnh in 4R.',       false, 5, '2026-11-09T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Delivery Shipments, Webhook Events & Handovers (note V20261021_2053 added consignment_sale_id)
INSERT INTO shipments (
    id, service_order_id, consignment_sale_id, direction, shipping_type, provider, integration_mode,
    provider_order_code, status, estimated_fee_vnd, actual_fee_vnd, fee_payer, cod_amount_vnd,
    recipient_address_line, recipient_district, recipient_province, recipient_phone,
    driver_name, driver_phone
) VALUES
    (1, 2, NULL, 'TO_LAB', 'PICKUP', 'AHAMOVE', 'API', 'AHA-261115-001', 'DELIVERED',
     25000, 25000, 'PHOTOGRAPHER', 0,
     '118 Pasteur, Phường Bến Nghé', 'Quận 3', 'TP. Hồ Chí Minh', '0903333444',
     'Nguyễn Văn Tài', '0902111333'),
    (2, 2, NULL, 'RETURN_TO_PHOTOGRAPHER', 'PICKUP', 'AHAMOVE', 'API', 'AHA-261118-002', 'DELIVERED',
     25000, 25000, 'PHOTOGRAPHER', 0,
     '72 Lê Thánh Tôn, Phường Bến Nghé', 'Quận 1', 'TP. Hồ Chí Minh', '0909123456',
     'Nguyễn Văn Tài', '0902111333')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shipment_status_events (
    id, shipment_id, status, provider_status_code, occurred_at, raw_payload
) VALUES
    (1, 1, 'PICKING_UP', 'ASSIGNING', '2026-11-15T03:10:00Z', '{"code":"AHA-261115-001","state":"ASSIGNING"}'::jsonb),
    (2, 1, 'DELIVERED',  'COMPLETED', '2026-11-15T04:45:00Z', '{"code":"AHA-261115-001","state":"COMPLETED"}'::jsonb),
    (3, 2, 'DELIVERED',  'COMPLETED', '2026-11-18T09:30:00Z', '{"code":"AHA-261118-002","state":"COMPLETED"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO film_handovers (
    id, service_order_id, shipment_id, handover_point, roll_count, note,
    performed_by_account_id, performed_by_name, occurred_at
) VALUES
    (1, 1, NULL, 'RECEIVED_AT_LAB',             2, 'Khách giao trực tiếp tại quầy Mộc Film Lab.',         5, NULL,               '2026-11-22T07:00:00Z'),
    (2, 2, 1,    'COLLECTED_FROM_PHOTOGRAPHER', 1, 'Shipper nhận 1 cuộn 120 tại Quận 1.',                 NULL, 'Nguyễn Văn Tài', '2026-11-15T03:30:00Z'),
    (3, 2, 1,    'RECEIVED_AT_LAB',             1, 'Lab kiểm đếm đủ 1 cuộn Ilford HP5 Plus 120.',         6, NULL,               '2026-11-15T07:00:00Z'),
    (4, 2, 2,    'RETURNED_TO_PHOTOGRAPHER',    1, 'Đã trả âm bản đóng bao kèm tem chống ẩm.',           NULL, 'Nguyễn Văn Tài', '2026-11-18T09:30:00Z'),
    (5, 3, NULL, 'RECEIVED_AT_LAB',             2, 'Khách giao trực tiếp 2 cuộn 35mm Express.',           5, NULL,               '2026-11-08T04:00:00Z'),
    (6, 3, NULL, 'COLLECTED_AT_LAB',            2, 'Khách ký nhận âm bản và 10 ảnh in 4R tại quầy.',     3, NULL,               '2026-11-09T09:45:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO film_handover_photos (id, film_handover_id, blob_key, display_order) VALUES
    (1, 1, 'handover-photo/2026/11/44444444-4444-4444-8444-000000000001.jpg', 1),
    (2, 3, 'handover-photo/2026/11/44444444-4444-4444-8444-000000000002.jpg', 1),
    (3, 5, 'handover-photo/2026/11/44444444-4444-4444-8444-000000000003.jpg', 1)
ON CONFLICT (id) DO NOTHING;

-- Digital Film Archive (only RECEIVED rolls of READY_FOR_HANDOVER/DELIVERED/CLOSED orders appear in GET /me/archive)
INSERT INTO archive_rolls (
    id, film_roll_id, full_resolution_link, link_verified_at, frame_count_discrepancy_note,
    camera, lens, shot_on, location, note, delivered_at
) VALUES
    (1, 3, 'https://drive.filmlink.vn/archive/SO261115D4E5F6-roll-1-hp5', '2026-11-17T08:55:00Z', NULL,
     'Hasselblad 500C/M', 'Carl Zeiss Planar 80mm f/2.8', '2026-11-10', 'Đà Lạt, Lâm Đồng',
     'Sương sớm đồi chè Cầu Đất, đo sáng spot vùng bóng +1 stop.', '2026-11-17T09:00:00Z'),

    (2, 4, 'https://drive.filmlink.vn/archive/SO261108G7H8J9-roll-1-colorplus', '2026-11-09T07:55:00Z', NULL,
     'Olympus OM-1n', 'Zuiko 50mm f/1.4 MC', '2026-11-03', 'Quận 1, TP. Hồ Chí Minh',
     'Bộ ảnh dạo phố buổi chiều nắng vàng khu Bưu điện Thành phố.', '2026-11-09T08:00:00Z'),

    (3, 5, 'https://drive.filmlink.vn/archive/SO261108G7H8J9-roll-2-vision3', '2026-11-09T07:58:00Z',
     'Cuộn respool chụp được 34/36 kiểu rõ nét, 2 kiểu đầu bị cháy sáng đầu phim.',
     'Nikon FM2', 'Nikkor 35mm f/2 AI-S', '2026-11-04', 'Bến Bạch Đằng, TP.HCM',
     'Chụp đêm ánh đèn đường với Kodak Vision3 500T.', '2026-11-09T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Preview Scan Files (exact byte sizes & SHA-256 checksums matching generated files in /uploads)
INSERT INTO scan_files (
    id, film_roll_id, frame_number, blob_key, size_bytes, width_px, height_px, checksum_sha256, is_current
) VALUES
    (1, 3, 1, 'preview-scan/2026/11/55555555-5555-4555-8555-000000000004.jpg', 1422, 64, 64, '6eb6cdab7293f5b6a1312b41723b051ef0954bbb814d6c469edae51476dde93a', true),
    (2, 3, 2, 'preview-scan/2026/11/55555555-5555-4555-8555-000000000005.jpg', 1422, 64, 64, '6eb6cdab7293f5b6a1312b41723b051ef0954bbb814d6c469edae51476dde93a', true),
    (3, 4, 1, 'preview-scan/2026/11/55555555-5555-4555-8555-000000000001.jpg', 1503, 64, 64, '172b923e928f14687cd91ba311d631f94a540ef39e4a7a28a5af03bada41f61f', true),
    (4, 4, 2, 'preview-scan/2026/11/55555555-5555-4555-8555-000000000003.jpg', 1503, 64, 64, '172b923e928f14687cd91ba311d631f94a540ef39e4a7a28a5af03bada41f61f', true),
    (5, 5, 1, 'preview-scan/2026/11/55555555-5555-4555-8555-000000000002.jpg', 1464, 64, 64, 'c405bffa8aabe5affdc4d802b92dcd3d892ed11b0ddd5d67eb35118c9077d834', true),
    (6, 5, 2, 'preview-scan/2026/11/55555555-5555-4555-8555-000000000006.jpg', 1464, 64, 64, 'c405bffa8aabe5affdc4d802b92dcd3d892ed11b0ddd5d67eb35118c9077d834', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO scan_usage_consents (
    id, scan_file_id, film_lab_id, granted_by_account_id, granted_at, revoked_at
) VALUES
    (1, 3, 1, 3, '2026-11-10T04:05:00Z', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO scan_copy_deletions (
    id, service_order_id, film_lab_id, due_at, reminder_count
) VALUES
    (1, 2, 2, '2026-12-18T09:30:00Z', 0),
    (2, 3, 1, '2026-12-09T09:45:00Z', 0)
ON CONFLICT (id) DO NOTHING;
