SET TIME ZONE 'UTC';

-- =====================================================================================
-- 04. PAYMENTS, COMMISSIONS, PAYOUTS, SUBSCRIPTIONS & MARKETPLACE CONSIGNMENT
-- =====================================================================================

INSERT INTO commission_rate_rules (
    id, film_lab_id, service_package_id, rate_percent, note, created_by_account_id
) VALUES
    (1, 1, NULL, 10.00, 'Mức hoa hồng chuẩn áp dụng cho Mộc Film Lab.', 1),
    (2, 2, NULL,  9.50, 'Ưu đãi đối tác chuyên Slide E-6 & Medium Format.', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subscription_plans (
    id, plan_code, plan_name, description, monthly_price_vnd, has_display_priority, status
) VALUES
    (1, 'STANDARD_LAB', 'Gói Tiêu Chuẩn', 'Hiển thị đầy đủ bảng giá, máy móc và nhận đơn trực tuyến trên FilmLink.', 0, false, 'ACTIVE'),
    (2, 'PRO_PARTNER',  'Gói Đối Tác Ưu Tiên', 'Gắn nhãn ưu tiên hiển thị tại trang khám phá và đề xuất phòng lab.', 490000, true, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO lab_subscriptions (
    id, film_lab_id, subscription_plan_id, starts_at, ends_at, status
) VALUES
    (1, 1, 2, '2026-11-01T00:00:00Z', '2026-12-01T00:00:00Z', 'ACTIVE'),
    (2, 2, 1, '2026-11-01T00:00:00Z', '2026-12-01T00:00:00Z', 'ACTIVE'),
    (3, 3, 2, '2026-11-01T00:00:00Z', '2026-12-01T00:00:00Z', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Monthly Commission Debts (Oct 2026 settled, Nov 2026 open/unpaid)
INSERT INTO commission_debts (
    id, film_lab_id, billing_period, due_date, total_amount_vnd, paid_amount_vnd,
    status, settled_at, settled_by_account_id
) VALUES
    (1, 1, DATE '2026-10-01', DATE '2026-11-10', 120000, 120000, 'PAID', '2026-11-05T07:00:00Z', 1),
    (2, 2, DATE '2026-10-01', DATE '2026-11-10',  85000,      0, 'UNPAID', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO commission_debt_reminders (
    id, commission_debt_id, reminder_type, reminder_day, contacted_by_account_id, contact_outcome, reminded_at
) VALUES
    (1, 2, 'AUTO', 1, NULL, NULL, '2026-11-11T01:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO payout_accounts (
    id, film_lab_id, user_account_id, bank_name, bank_account_number, account_holder_name
) VALUES
    (1, 1,    NULL, 'Vietcombank', '0071001122334', 'PHAM HOANG MOC'),
    (2, 2,    NULL, 'Techcombank', '1903344556677', 'TRAN QUANG DARKROOM'),
    (3, NULL, 9,    'ACB',         '889900112233',  'HOANG NAM ANALOG')
ON CONFLICT (id) DO NOTHING;

INSERT INTO payouts (
    id, payout_code, recipient_type, film_lab_id, recipient_account_id, amount_vnd, status,
    bank_name, bank_account_number, account_holder_name, receipt_blob_key,
    executed_by_account_id, paid_at
) VALUES
    (1, 'PO-2026-0001', 'FILM_LAB', 1, NULL, 211500, 'PAID',
     'Vietcombank', '0071001122334', 'PHAM HOANG MOC',
     'handover-photo/2026/11/44444444-4444-4444-8444-000000000004.jpg',
     1, '2026-11-12T08:00:00Z'),

    (2, 'PO-2026-0002', 'SELLER', NULL, 9, 3825000, 'PAID',
     'ACB', '889900112233', 'HOANG NAM ANALOG',
     'handover-photo/2026/11/44444444-4444-4444-8444-000000000005.jpg',
     1, '2026-11-19T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Marketplace Consignment Settings & Listings (matching FilmLink Analog Marketplace)
INSERT INTO consignment_lab_settings (
    film_lab_id, is_accepting_consignments, consignment_fee_rate, slot_minutes, appointments_per_slot
) VALUES
    (1, true, 10.00, 30, 2),
    (2, true, 12.00, 30, 1),
    (3, true, 10.00, 45, 1)
ON CONFLICT (film_lab_id) DO NOTHING;

INSERT INTO consignment_bookings (
    id, booking_code, seller_account_id, film_lab_id, slot_start_at, slot_end_at,
    status, checked_in_at
) VALUES
    (1, 'CB-2026-001', 9, 1, '2026-11-06T03:00:00Z', '2026-11-06T03:30:00Z', 'CHECKED_IN', '2026-11-06T03:05:00Z'),
    (2, 'CB-2026-002', 4, 2, '2026-11-10T07:00:00Z', '2026-11-10T07:30:00Z', 'CHECKED_IN', '2026-11-10T07:02:00Z'),
    (3, 'CB-2026-003', 9, 1, '2026-11-14T04:00:00Z', '2026-11-14T04:30:00Z', 'CHECKED_IN', '2026-11-14T04:04:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO consignment_items (
    id, consignment_booking_id, item_type, item_name, seller_description,
    desired_price_vnd, status, closing_reason, agreed_price_vnd, price_agreed_at
) VALUES
    (1, 1, 'CAMERA_BODY', 'Olympus OM-1 Chrome + Zuiko 50mm f/1.4 MC',
     'Máy cơ thuần hoàn toàn, đo sáng kim phản hồi chuẩn, view ngắm trong, ống kính Zuiko 50mm f/1.4 kính sạch không mốc rễ.',
     6000000, 'LISTED', NULL, 5800000, '2026-11-06T06:00:00Z'),

    (2, 2, 'CAMERA_BODY', 'Contax T2 Titanium Silver',
     'Ngoại hình đẹp sưu tầm, thấu kính Carl Zeiss Sonnar 38mm f/2.8 sắc nét, đèn flash và auto focus hoạt động mượt mà.',
     18500000, 'LISTED', NULL, 18000000, '2026-11-10T10:00:00Z'),

    (3, 3, 'LENS', 'Nikon Nikkor 35mm f/2 AI-S',
     'Ống kính góc rộng huyền thoại ngàm F Nikon, vòng lấy nét êm mượt, lá khẩu sạch dầu, kèm filter UV và hood zin.',
     4800000, 'SOLD', NULL, 4500000, '2026-11-14T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO consignment_item_photos (
    id, consignment_item_id, source, blob_key, display_order, uploaded_by_account_id
) VALUES
    (1, 1, 'SELLER',     'lab-image/2026/11/33333333-3333-4333-8333-000000000011.jpg', 1, 9),
    (2, 1, 'INSPECTION', 'handover-photo/2026/11/44444444-4444-4444-8444-000000000001.jpg', 1, 5),
    (3, 2, 'SELLER',     'lab-image/2026/11/33333333-3333-4333-8333-000000000012.jpg', 1, 4),
    (4, 2, 'INSPECTION', 'handover-photo/2026/11/44444444-4444-4444-8444-000000000002.jpg', 1, 6),
    (5, 3, 'INSPECTION', 'handover-photo/2026/11/44444444-4444-4444-8444-000000000003.jpg', 1, 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO condition_reports (
    id, consignment_item_id, overall_grade, conclusion, decline_reason,
    inspector_account_id, inspected_at
) VALUES
    (1, 1, 'A', 'ACCEPTED', NULL, 5, '2026-11-06T05:00:00Z'),
    (2, 2, 'A', 'ACCEPTED', NULL, 6, '2026-11-10T09:00:00Z'),
    (3, 3, 'B', 'ACCEPTED', NULL, 5, '2026-11-14T06:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO condition_report_checks (condition_report_id, check_code, result, note) VALUES
    (1, 'SHUTTER',             'PASS', 'Tốc độ 1/1000s tới 1s chính xác.'),
    (1, 'LIGHT_METERING',      'PASS', 'Đo sáng chuẩn sai số < 0.3 EV.'),
    (1, 'LIGHT_SEALS',         'PASS', 'Ron chắn sáng mới thay.'),
    (2, 'SHUTTER',             'PASS', 'Màn trập chính xác.'),
    (2, 'LIGHT_METERING',      'PASS', 'Đo sáng chính xác.'),
    (3, 'FUNGUS',              'PASS', 'Không mốc.'),
    (3, 'HAZE',                'PASS', 'Kính trong.'),
    (3, 'FOCUS_RING',          'PASS', 'Vòng nét mượt.')
ON CONFLICT (condition_report_id, check_code) DO NOTHING;

INSERT INTO price_offers (
    id, consignment_item_id, purpose, round_number, offered_by_party, offered_by_account_id,
    price_vnd, justification, status, response_due_at, responded_at
) VALUES
    (1, 1, 'INITIAL', 1, 'LAB', 5, 5800000,
     'Thẩm định hạng A, giá đề xuất 5.800.000đ phù hợp thị trường máy cơ sưu tầm.',
     'ACCEPTED', '2026-11-09T05:30:00Z', '2026-11-06T06:00:00Z'),

    (2, 2, 'INITIAL', 1, 'LAB', 6, 18000000,
     'Contax T2 ngoại hình xuất sắc, đề xuất niêm yết 18.000.000đ.',
     'ACCEPTED', '2026-11-13T09:30:00Z', '2026-11-10T10:00:00Z'),

    (3, 3, 'INITIAL', 1, 'LAB', 5, 4500000,
     'Ống kính có xước nhẹ thân vỏ ngoài, đề xuất 4.500.000đ.',
     'ACCEPTED', '2026-11-17T07:00:00Z', '2026-11-14T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO consignment_listings (
    id, consignment_item_id, film_lab_id, title, description, price_vnd,
    is_pickup_at_lab, is_delivery_available, status,
    consignment_started_at, expires_at, published_at
) VALUES
    (1, 1, 1, 'Olympus OM-1 Chrome + Zuiko 50mm f/1.4 MC (Grade A)',
     'Thân máy Olympus OM-1 cơ thuần đã qua kiểm định tại Mộc Film Lab: tốc độ màn trập chuẩn, đo sáng ổn định, kính Zuiko 50mm f/1.4 không mốc rễ.',
     5800000, true, true, 'ON_SALE',
     '2026-11-06T06:05:00Z', '2027-01-05T06:05:00Z', '2026-11-06T06:05:00Z'),

    (2, 2, 2, 'Contax T2 Titanium Silver (Grade A)',
     'Máy compact film cao cấp Contax T2 ngoại hình gần như mới, đã kiểm tra toàn diện hệ thống AF, flash và buồng phim tại Darkroom Sài Gòn.',
     18000000, true, false, 'ON_SALE',
     '2026-11-10T10:05:00Z', '2027-01-09T10:05:00Z', '2026-11-10T10:05:00Z'),

    (3, 3, 1, 'Nikon Nikkor 35mm f/2 AI-S (Grade B)',
     'Ống kính Nikon 35mm f/2 AI-S đã kiểm định quang học tại Mộc Film Lab: kính trước sau sạch đẹp, lá khẩu nhạy, bảo hành kiểm định 7 ngày.',
     4500000, true, true, 'SOLD',
     '2026-11-14T08:05:00Z', '2027-01-13T08:05:00Z', '2026-11-14T08:05:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO consignment_sales (
    id, sale_code, idempotency_key, consignment_listing_id, film_lab_id, buyer_account_id,
    payment_method, handover_method, status,
    item_price_vnd, shipping_fee_vnd, total_vnd,
    payment_due_at, handed_over_at, return_window_ends_at,
    consignment_fee_rate, consignment_fee_vnd, commission_rate, commission_vnd, seller_payout_vnd,
    created_at, updated_at
) VALUES
    (1, 'CS-2026-0001', '20000000-0000-4000-8000-000000000001', 3, 1, 3,
     'ONLINE', 'PICKUP_AT_LAB', 'COMPLETED',
     4500000, 0, 4500000,
     '2026-11-16T04:15:00Z', '2026-11-16T08:00:00Z', '2026-11-23T08:00:00Z',
     10.00, 450000, 5.00, 225000, 3825000,
     '2026-11-16T04:00:00Z', '2026-11-16T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO consignment_handovers (
    id, consignment_sale_id, handover_method, shipment_id, amount_collected_vnd,
    is_recipient_code_verified, note, performed_by_account_id, occurred_at
) VALUES
    (1, 1, 'PICKUP_AT_LAB', NULL, NULL, true,
     'Người mua kiểm tra ống kính tại quầy Mộc Film Lab và xác nhận mã CS-2026-0001.', 5, '2026-11-16T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO consignment_handover_photos (
    id, consignment_handover_id, blob_key, display_order
) VALUES
    (1, 1, 'handover-photo/2026/11/44444444-4444-4444-8444-000000000005.jpg', 1),
    (2, 1, 'handover-photo/2026/11/44444444-4444-4444-8444-000000000006.jpg', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO seller_ratings (
    id, consignment_sale_id, seller_score, inspection_score, comment
) VALUES
    (1, 1, 5, 5, 'Ống kính đúng mô tả biên bản thẩm định của Mộc Film Lab, vòng nét rất mượt.')
ON CONFLICT (id) DO NOTHING;

-- Payments, Gateway Callbacks, Commissions & Payout Items
INSERT INTO payments (
    id, transaction_code, purpose, direction, method, status, amount_vnd,
    service_order_id, consignment_sale_id, commission_debt_id, counterparty_account_id,
    refunded_payment_id, payment_url_expires_at, gateway_transaction_no, gateway_response_code,
    gateway_bank_code, shipment_id, recorded_by_account_id, receipt_blob_key,
    confirmation_status, confirmation_due_at, confirmation_reminder_count, confirmed_at, succeeded_at
) VALUES
    -- Order 3 ONLINE VNPay SUCCEEDED
    (1, 'FLTXN261108001', 'ORDER_PAYMENT', 'IN', 'VNPAY', 'SUCCEEDED', 235000,
     3, NULL, NULL, 3, NULL, '2026-11-08T02:20:00Z', '14588901', '00', 'NCB',
     NULL, NULL, NULL, 'NOT_REQUIRED', NULL, 0, NULL, '2026-11-08T02:07:00Z'),

    -- Order 2 PAY_AT_LAB SUCCEEDED + CONFIRMED
    (2, 'FLTXN261118002', 'ORDER_PAYMENT', 'IN', 'PAY_AT_LAB', 'SUCCEEDED', 155000,
     2, NULL, NULL, 3, NULL, NULL, NULL, NULL, NULL,
     NULL, 6, 'handover-photo/2026/11/44444444-4444-4444-8444-000000000004.jpg',
     'CONFIRMED', '2026-11-25T09:30:00Z', 0, '2026-11-18T12:00:00Z', '2026-11-18T09:30:00Z'),

    -- Order 4 ONLINE VNPay PENDING (awaiting user action on Mobile)
    (3, 'FLTXN261124003', 'ORDER_PAYMENT', 'IN', 'VNPAY', 'PENDING', 105000,
     4, NULL, NULL, 3, NULL, '2026-11-24T11:15:00Z', NULL, NULL, NULL,
     NULL, NULL, NULL, 'NOT_REQUIRED', NULL, 0, NULL, NULL),

    -- Consignment Sale 1 ONLINE VNPay SUCCEEDED
    (4, 'FLTXN261116004', 'SALE_PAYMENT', 'IN', 'VNPAY', 'SUCCEEDED', 4500000,
     NULL, 1, NULL, 3, NULL, '2026-11-16T04:15:00Z', '14599210', '00', 'VCB',
     NULL, NULL, NULL, 'NOT_REQUIRED', NULL, 0, NULL, '2026-11-16T04:05:00Z'),

    -- Debt 1 BANK_TRANSFER SUCCEEDED
    (5, 'FLTXN261105005', 'DEBT_PAYMENT', 'IN', 'BANK_TRANSFER', 'SUCCEEDED', 120000,
     NULL, NULL, 1, 5, NULL, NULL, NULL, NULL, NULL,
     NULL, 1, 'handover-photo/2026/11/44444444-4444-4444-8444-000000000006.jpg',
     'NOT_REQUIRED', NULL, 0, NULL, '2026-11-05T07:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO payment_gateway_events (
    id, provider, event_type, transaction_code, payment_id, gateway_transaction_no,
    response_code, amount_vnd, is_signature_valid, raw_payload
) VALUES
    (1, 'VNPAY', 'IPN', 'FLTXN261108001', 1, '14588901', '00', 235000, true,
     '{"vnp_TxnRef":"FLTXN261108001","vnp_ResponseCode":"00","vnp_Amount":"23500000"}'::jsonb),
    (2, 'VNPAY', 'IPN', 'FLTXN261116004', 4, '14599210', '00', 4500000, true,
     '{"vnp_TxnRef":"FLTXN261116004","vnp_ResponseCode":"00","vnp_Amount":"450000000"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO commissions (
    id, kind, film_lab_id, service_order_id, consignment_sale_id, complaint_id,
    base_amount_vnd, rate_percent, amount_vnd, collection_mode, status,
    commission_debt_id, eligible_at
) VALUES
    (1, 'ORDER', 1, 3, NULL, NULL, 235000, 10.00, 23500, 'DEDUCTED', 'SETTLED', NULL, '2026-11-10T04:00:00Z'),
    (2, 'SALE',  1, NULL, 1, NULL, 4500000, 5.00, 225000, 'DEDUCTED', 'SETTLED', NULL, '2026-11-16T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO payout_items (
    id, payout_id, service_order_id, consignment_sale_id, amount_vnd
) VALUES
    (1, 1, 3, NULL, 211500),
    (2, 2, NULL, 1, 3825000)
ON CONFLICT (id) DO NOTHING;
