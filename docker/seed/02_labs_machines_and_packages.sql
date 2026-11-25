SET TIME ZONE 'UTC';

-- =====================================================================================
-- 02. FILM LABS, OPENING HOURS, IMAGES, MACHINES, SERVICE PACKAGES & PRINT PRICING
-- =====================================================================================

INSERT INTO film_labs (
    id, owner_account_id, lab_registration_application_id, lab_name, description,
    address_line, district, province, latitude, longitude,
    contact_email, contact_phone, is_accepting_orders, qc_buffer_hours,
    express_daily_cap_percent, express_surcharge_percent, express_commitment_working_days,
    created_at, updated_at
) VALUES
    (1, 5, 1, 'Mộc Film Lab',
     'Phòng lab chuyên tráng C-41 bằng hóa chất Kodak Flexicolor kiểm soát nhiệt độ tự động và scan độ phân giải cao 16-bit TIFF trên Noritsu HS-1800.',
     '42 Nguyễn Huệ, Phường Bến Nghé', 'Quận 1', 'TP. Hồ Chí Minh', 10.774389, 106.703412,
     'moclab@filmlink.vn', '0903111222', true, 4, 30, 30, 1,
     '2026-10-02T05:05:00Z', '2026-10-02T05:05:00Z'),

    (2, 6, 2, 'Darkroom Sài Gòn',
     'Phòng tối chuyên biệt cho phim dương bản E-6, Medium Format 120, Large Format 4x5 và tráng thủ công B&W hạt mịn bằng hóa chất Ilford.',
     '118 Pasteur, Phường Bến Nghé', 'Quận 3', 'TP. Hồ Chí Minh', 10.781520, 106.692840,
     'darkroom@filmlink.vn', '0903333444', true, 6, 25, 25, 2,
     '2026-10-02T06:05:00Z', '2026-10-02T06:05:00Z'),

    (3, 7, 3, 'LLab Analog Hà Nội',
     'Lab phim lâu đời tại phố cổ Hà Nội, nổi tiếng với tone màu Fujifilm Frontier SP-3000 ấm áp và quy trình tẩy lớp chống lóa Remjet ECN-2 sạch hoàn toàn.',
     '25 Hàng Bè, Phường Hàng Bạc', 'Quận Hoàn Kiếm', 'Hà Nội', 21.033210, 105.853640,
     'llab@filmlink.vn', '0912555666', true, 4, 35, 20, 1,
     '2026-10-02T07:05:00Z', '2026-10-02T07:05:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO film_lab_opening_hours (film_lab_id, day_of_week, is_closed, opens_at, closes_at)
SELECT lab.id, dow.day_of_week, false,
       CASE WHEN dow.day_of_week = 7 THEN TIME '10:00' ELSE TIME '09:00' END,
       CASE WHEN dow.day_of_week = 7 THEN TIME '18:00' ELSE TIME '20:00' END
FROM (VALUES (1), (2), (3)) AS lab(id)
CROSS JOIN (VALUES (1), (2), (3), (4), (5), (6), (7)) AS dow(day_of_week)
ON CONFLICT (film_lab_id, day_of_week) DO NOTHING;

INSERT INTO film_lab_images (id, film_lab_id, blob_key, display_order) VALUES
    (1, 1, 'lab-image/2026/11/33333333-3333-4333-8333-000000000001.jpg', 1),
    (2, 1, 'lab-image/2026/11/33333333-3333-4333-8333-000000000002.jpg', 2),
    (3, 2, 'lab-image/2026/11/33333333-3333-4333-8333-000000000003.jpg', 1),
    (4, 2, 'lab-image/2026/11/33333333-3333-4333-8333-000000000004.jpg', 2),
    (5, 3, 'lab-image/2026/11/33333333-3333-4333-8333-000000000005.jpg', 1),
    (6, 3, 'lab-image/2026/11/33333333-3333-4333-8333-000000000006.jpg', 2)
ON CONFLICT (id) DO NOTHING;

-- Machines (BR-57: >= 1 ACTIVE PROCESSOR & >= 1 ACTIVE SCANNER per lab)
INSERT INTO machines (id, film_lab_id, machine_code, model_name, machine_type, capacity_per_hour, status) VALUES
    (1, 1, 'MOC-PROC-01', 'Noritsu QSF-V30',           'PROCESSOR', 30,  'ACTIVE'),
    (2, 1, 'MOC-SCAN-01', 'Noritsu HS-1800',           'SCANNER',   400, 'ACTIVE'),
    (3, 1, 'MOC-SCAN-02', 'Fujifilm Frontier SP-3000', 'SCANNER',   360, 'ACTIVE'),
    (4, 2, 'DRK-PROC-01', 'Jobo CPP-3 Rotary',         'PROCESSOR', 24,  'ACTIVE'),
    (5, 2, 'DRK-SCAN-01', 'Fujifilm Frontier SP-3000', 'SCANNER',   350, 'ACTIVE'),
    (6, 2, 'DRK-SCAN-02', 'Hasselblad Flextight X5',   'SCANNER',   180, 'ACTIVE'),
    (7, 3, 'LLB-PROC-01', 'Noritsu QSF-V50 & ECN-2',   'PROCESSOR', 28,  'ACTIVE'),
    (8, 3, 'LLB-SCAN-01', 'Fujifilm Frontier SP-3000', 'SCANNER',   380, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO machine_film_processes (machine_id, film_process_id)
SELECT v.machine_id, fp.id
FROM (VALUES
    (1, 'C41'), (1, 'BW'), (1, 'ECN2'),
    (2, 'C41'), (2, 'BW'), (2, 'ECN2'),
    (3, 'C41'), (3, 'BW'),
    (4, 'C41'), (4, 'BW'), (4, 'E6'),
    (5, 'C41'), (5, 'BW'), (5, 'E6'),
    (6, 'C41'), (6, 'BW'), (6, 'E6'),
    (7, 'C41'), (7, 'BW'), (7, 'ECN2'),
    (8, 'C41'), (8, 'BW'), (8, 'ECN2')
) AS v(machine_id, code)
JOIN film_processes fp ON fp.code = v.code
ON CONFLICT DO NOTHING;

INSERT INTO machine_film_formats (machine_id, film_format_id)
SELECT v.machine_id, ff.id
FROM (VALUES
    (1, '135'), (1, '120'),
    (2, '135'), (2, '120'),
    (3, '135'), (3, '120'),
    (4, '135'), (4, '120'), (4, '4X5'),
    (5, '135'), (5, '120'),
    (6, '135'), (6, '120'), (6, '4X5'),
    (7, '135'), (7, '120'),
    (8, '135'), (8, '120')
) AS v(machine_id, code)
JOIN film_formats ff ON ff.code = v.code
ON CONFLICT DO NOTHING;

INSERT INTO machine_working_hours (machine_id, day_of_week, is_closed, opens_at, closes_at)
SELECT m.id, dow.day_of_week, false,
       CASE WHEN dow.day_of_week = 7 THEN TIME '10:00' ELSE TIME '09:00' END,
       CASE WHEN dow.day_of_week = 7 THEN TIME '18:00' ELSE TIME '20:00' END
FROM (VALUES (1), (2), (3), (4), (5), (6), (7), (8)) AS m(id)
CROSS JOIN (VALUES (1), (2), (3), (4), (5), (6), (7)) AS dow(day_of_week)
ON CONFLICT (machine_id, day_of_week) DO NOTHING;

-- 1 resolved machine incident on Lab 1 (history for schedule-change sample)
INSERT INTO machine_incidents (
    id, machine_id, cause, description, unavailable_from, expected_available_at,
    machine_status_after, reported_by_account_id, resolved_at
) VALUES
    (1, 3, 'CHEMICALS_RUN_OUT',
     'Máy scan Frontier SP-3000 tạm dừng thay bóng đèn hiệu chuẩn màu định kỳ trong buổi chiều.',
     '2026-11-18T06:00:00Z', '2026-11-18T11:00:00Z',
     'MAINTENANCE', 5, '2026-11-18T10:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- Service Packages (note V20261105_2105 removed express_surcharge_vnd from service_packages)
INSERT INTO service_packages (
    id, film_lab_id, package_name, service_type_id, film_process_id, film_format_id,
    price_vnd, turnaround_days, is_push_pull_available, push_pull_surcharge_per_stop_vnd, status
)
SELECT v.id, v.lab_id, v.package_name, st.id, fp.id, ff.id,
       v.price_vnd, v.turnaround_days, v.is_push_pull, v.pp_surcharge, 'ON_SALE'
FROM (VALUES
    (1, 1, 'Tráng C-41 + Scan Tiêu Chuẩn (Noritsu)',  'SCANNING',   'C41',  '135',  75000, 2, true,  15000),
    (2, 1, 'Tráng C-41 + Scan Pro TIFF 16-bit',        'SCANNING',   'C41',  '135', 115000, 2, true,  15000),
    (3, 1, 'Tráng Thủ Công B&W (Ilford ID-11) + Scan', 'SCANNING',   'BW',   '135',  95000, 3, true,  20000),
    (4, 1, 'Tráng Phim 120 C-41 + Scan Noritsu',       'SCANNING',   'C41',  '120', 110000, 2, false,  NULL),
    (5, 2, 'Tráng Dương Bản E-6 + Scan Frontier',      'SCANNING',   'E6',   '135', 160000, 3, false,  NULL),
    (6, 2, 'Tráng Phim 120 C-41 + Scan High-Res',      'SCANNING',   'C41',  '120', 110000, 2, true,  15000),
    (7, 2, 'Tráng Sheet Film 4x5 B&W + Flextight X5',  'DEVELOPING', 'BW',   '4X5', 190000, 4, true,  25000),
    (8, 3, 'Tráng Phim Điện Ảnh ECN-2 + Scan Frontier','SCANNING',   'ECN2', '135',  85000, 3, true,  15000),
    (9, 3, 'Tráng C-41 Tiêu Chuẩn Phố Cổ + Scan',      'SCANNING',   'C41',  '135',  70000, 1, true,  10000)
) AS v(id, lab_id, package_name, st_code, fp_code, ff_code, price_vnd, turnaround_days, is_push_pull, pp_surcharge)
JOIN service_types st ON st.code = v.st_code
JOIN film_processes fp ON fp.code = v.fp_code
JOIN film_formats ff ON ff.code = v.ff_code
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_package_scan_options (id, service_package_id, resolution_label, price_vnd) VALUES
    (1, 1, '3000 x 2000 px (JPG Standard)',      10000),
    (2, 1, '4500 x 3000 px (JPG High-Res)',      25000),
    (3, 2, '6000 x 4000 px (TIFF 16-bit)',       35000),
    (4, 3, '4500 x 3000 px (B&W Fine Grain)',    20000),
    (5, 4, '4800 x 4800 px (6x6 Medium Format)', 25000),
    (6, 5, '5400 x 3600 px (Slide Frontier)',    30000),
    (7, 6, '4800 x 4800 px (120 High-Res)',      25000),
    (8, 8, '3600 x 2400 px (ECN-2 Cine Grade)',  20000),
    (9, 9, '3000 x 2000 px (Frontier Warm)',     10000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO print_price_tiers (id, film_lab_id, print_size_id, min_quantity, unit_price_vnd)
SELECT v.id, v.lab_id, ps.id, v.min_qty, v.unit_price
FROM (VALUES
    (1, 1, '4R', 1,   6000),
    (2, 1, '4R', 20,  5000),
    (3, 1, '6R', 1,  15000),
    (4, 1, 'A4', 1,  35000),
    (5, 2, '4R', 1,   7000),
    (6, 2, '5R', 1,  12000),
    (7, 2, '8R', 1,  28000)
) AS v(id, lab_id, size_code, min_qty, unit_price)
JOIN print_sizes ps ON ps.code = v.size_code
ON CONFLICT (id) DO NOTHING;
