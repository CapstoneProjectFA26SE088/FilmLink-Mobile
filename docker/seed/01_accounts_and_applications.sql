SET TIME ZONE 'UTC';

-- =====================================================================================
-- 01. ACCOUNTS, LAB REGISTRATION APPLICATIONS & EXPERT UPGRADES
-- Shared password across all accounts: FilmLink@2026
-- =====================================================================================

INSERT INTO user_accounts (
    id, email, password_hash, full_name, phone_number, avatar_blob_key,
    role, status, lock_reason, locked_at, locked_by_account_id,
    email_verified_at, terms_accepted_at, failed_login_count,
    is_in_app_notification_enabled, is_email_notification_enabled, is_push_notification_enabled,
    created_at, updated_at
) VALUES
    (1, 'admin@filmlink.vn', '$2a$10$LUgCsjtPH2MU3.eHXddEIOwBEdcnn8P5u4v8J77TUOQfTtfIqLAx2',
     'Nguyễn Quản Trị', '0901000001', 'avatar/2026/11/11111111-1111-4111-8111-000000000001.jpg',
     'ADMIN', 'ACTIVE', NULL, NULL, NULL,
     '2026-10-01T01:00:00Z', NULL, 0, true, true, true, '2026-10-01T01:00:00Z', '2026-10-01T01:00:00Z'),

    (2, 'moderator@filmlink.vn', '$2a$10$LUgCsjtPH2MU3.eHXddEIOwBEdcnn8P5u4v8J77TUOQfTtfIqLAx2',
     'Trần Kiểm Duyệt', '0901000002', 'avatar/2026/11/11111111-1111-4111-8111-000000000002.jpg',
     'MODERATOR', 'ACTIVE', NULL, NULL, NULL,
     '2026-10-01T02:00:00Z', NULL, 0, true, true, true, '2026-10-01T02:00:00Z', '2026-10-01T02:00:00Z'),

    (3, 'photographer@filmlink.vn', '$2a$10$LUgCsjtPH2MU3.eHXddEIOwBEdcnn8P5u4v8J77TUOQfTtfIqLAx2',
     'Minh Anh Photographer', '0909123456', 'avatar/2026/11/11111111-1111-4111-8111-000000000003.jpg',
     'PHOTOGRAPHER', 'ACTIVE', NULL, NULL, NULL,
     '2026-10-05T03:00:00Z', '2026-10-05T02:55:00Z', 0, true, true, true, '2026-10-05T02:55:00Z', '2026-10-05T03:00:00Z'),

    (4, 'expert@filmlink.vn', '$2a$10$LUgCsjtPH2MU3.eHXddEIOwBEdcnn8P5u4v8J77TUOQfTtfIqLAx2',
     'Lê Bảo Chuyên Gia', '0908654321', 'avatar/2026/11/11111111-1111-4111-8111-000000000004.jpg',
     'PHOTOGRAPHY_EXPERT', 'ACTIVE', NULL, NULL, NULL,
     '2026-10-03T04:00:00Z', '2026-10-03T03:50:00Z', 0, true, true, true, '2026-10-03T03:50:00Z', '2026-10-10T09:00:00Z'),

    (5, 'moclab@filmlink.vn', '$2a$10$LUgCsjtPH2MU3.eHXddEIOwBEdcnn8P5u4v8J77TUOQfTtfIqLAx2',
     'Phạm Hoàng Mộc', '0903111222', 'avatar/2026/11/11111111-1111-4111-8111-000000000005.jpg',
     'FILM_LAB_OWNER', 'ACTIVE', NULL, NULL, NULL,
     '2026-10-02T05:00:00Z', NULL, 0, true, true, true, '2026-10-02T05:00:00Z', '2026-10-02T05:00:00Z'),

    (6, 'darkroom@filmlink.vn', '$2a$10$LUgCsjtPH2MU3.eHXddEIOwBEdcnn8P5u4v8J77TUOQfTtfIqLAx2',
     'Trần Quang Darkroom', '0903333444', 'avatar/2026/11/11111111-1111-4111-8111-000000000006.jpg',
     'FILM_LAB_OWNER', 'ACTIVE', NULL, NULL, NULL,
     '2026-10-02T06:00:00Z', NULL, 0, true, true, true, '2026-10-02T06:00:00Z', '2026-10-02T06:00:00Z'),

    (7, 'llab@filmlink.vn', '$2a$10$LUgCsjtPH2MU3.eHXddEIOwBEdcnn8P5u4v8J77TUOQfTtfIqLAx2',
     'Vũ Hà LLab', '0912555666', 'avatar/2026/11/11111111-1111-4111-8111-000000000007.jpg',
     'FILM_LAB_OWNER', 'ACTIVE', NULL, NULL, NULL,
     '2026-10-02T07:00:00Z', NULL, 0, true, true, true, '2026-10-02T07:00:00Z', '2026-10-02T07:00:00Z'),

    (8, 'locked@filmlink.vn', '$2a$10$LUgCsjtPH2MU3.eHXddEIOwBEdcnn8P5u4v8J77TUOQfTtfIqLAx2',
     'Tài Khoản Bị Khóa', '0907999888', NULL,
     'PHOTOGRAPHER', 'LOCKED',
     'Tài khoản bị khóa tạm thời do vi phạm tiêu chuẩn cộng đồng nhiều lần.',
     '2026-11-10T08:00:00Z', 1,
     '2026-10-06T08:00:00Z', '2026-10-06T07:55:00Z', 0, true, true, true, '2026-10-06T07:55:00Z', '2026-11-10T08:00:00Z'),

    (9, 'buyer@filmlink.vn', '$2a$10$LUgCsjtPH2MU3.eHXddEIOwBEdcnn8P5u4v8J77TUOQfTtfIqLAx2',
     'Hoàng Nam Analog', '0918777666', 'avatar/2026/11/11111111-1111-4111-8111-000000000009.jpg',
     'PHOTOGRAPHER', 'ACTIVE', NULL, NULL, NULL,
     '2026-10-08T09:00:00Z', '2026-10-08T08:50:00Z', 0, true, true, true, '2026-10-08T08:50:00Z', '2026-10-08T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_accounts (
    id, email, password_hash, full_name, phone_number, avatar_blob_key,
    role, status, lock_reason, locked_at, locked_by_account_id,
    email_verified_at, terms_accepted_at, failed_login_count,
    is_in_app_notification_enabled, is_email_notification_enabled, is_push_notification_enabled,
    created_at, updated_at
)
SELECT
    10, 'admin@filmlink.vn', '$2a$10$LUgCsjtPH2MU3.eHXddEIOwBEdcnn8P5u4v8J77TUOQfTtfIqLAx2',
    'Nguyễn Quản Trị', '0901000001', 'avatar/2026/11/11111111-1111-4111-8111-000000000001.jpg',
    'ADMIN', 'ACTIVE', NULL, NULL, NULL,
    '2026-10-01T01:00:00Z', NULL, 0, true, true, true, '2026-10-01T01:00:00Z', '2026-10-01T01:00:00Z'
WHERE NOT EXISTS (SELECT 1 FROM user_accounts WHERE email = 'admin@filmlink.vn')
ON CONFLICT (id) DO NOTHING;

INSERT INTO lab_registration_applications (
    id, application_code, lab_name, tax_code, address_line, district, province,
    latitude, longitude, contact_email, contact_phone, status, is_duplicate_suspected,
    rejection_reason, info_request_note, info_requested_at, reviewed_by_account_id, reviewed_at,
    created_at, updated_at
) VALUES
    (1, 'LRA-2026-001', 'Mộc Film Lab', '0316881001',
     '42 Nguyễn Huệ, Phường Bến Nghé', 'Quận 1', 'TP. Hồ Chí Minh',
     10.774389, 106.703412, 'moclab@filmlink.vn', '0903111222',
     'APPROVED', false, NULL, NULL, NULL, 1, '2026-10-02T05:00:00Z',
     '2026-10-01T10:00:00Z', '2026-10-02T05:00:00Z'),

    (2, 'LRA-2026-002', 'Darkroom Sài Gòn', '0316881002',
     '118 Pasteur, Phường Bến Nghé', 'Quận 3', 'TP. Hồ Chí Minh',
     10.781520, 106.692840, 'darkroom@filmlink.vn', '0903333444',
     'APPROVED', false, NULL, NULL, NULL, 1, '2026-10-02T06:00:00Z',
     '2026-10-01T11:00:00Z', '2026-10-02T06:00:00Z'),

    (3, 'LRA-2026-003', 'LLab Analog Hà Nội', '0108991003',
     '25 Hàng Bè, Phường Hàng Bạc', 'Quận Hoàn Kiếm', 'Hà Nội',
     21.033210, 105.853640, 'llab@filmlink.vn', '0912555666',
     'APPROVED', false, NULL, NULL, NULL, 1, '2026-10-02T07:00:00Z',
     '2026-10-01T12:00:00Z', '2026-10-02T07:00:00Z'),

    (4, 'LRA-2026-004', 'Saigon Vintage Film Lab', '0316881004',
     '88 Trần Quốc Thảo, Phường Võ Thị Sáu', 'Quận 3', 'TP. Hồ Chí Minh',
     10.784910, 106.686210, 'vintage.lab@filmlink.vn', '0909444555',
     'PENDING_REVIEW', false, NULL, NULL, NULL, NULL, NULL,
     '2026-11-20T04:00:00Z', '2026-11-20T04:00:00Z'),

    (5, 'LRA-2026-005', 'Đà Nẵng Analog Darkroom', '0401991005',
     '19 Bạch Đằng, Phường Thạch Thang', 'Quận Hải Châu', 'Đà Nẵng',
     16.074520, 108.224110, 'danang.lab@filmlink.vn', '0905222333',
     'AWAITING_INFORMATION', false, NULL,
     'Vui lòng bổ sung bản scan giấy chứng nhận phòng cháy chữa cháy và ảnh chụp khu vực máy scan.',
     '2026-11-18T09:30:00Z', 1, '2026-11-18T09:30:00Z',
     '2026-11-16T08:00:00Z', '2026-11-18T09:30:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO lab_registration_documents (
    id, lab_registration_application_id, file_name, blob_key, content_type, size_bytes
) VALUES
    (1, 1, 'gpkd-moc-film-lab.pdf', 'lab-document/2026/11/22222222-2222-4222-8222-000000000001.pdf', 'application/pdf', 298),
    (2, 2, 'gpkd-darkroom-saigon.pdf', 'lab-document/2026/11/22222222-2222-4222-8222-000000000002.pdf', 'application/pdf', 302),
    (3, 3, 'gpkd-llab-hanoi.pdf', 'lab-document/2026/11/22222222-2222-4222-8222-000000000003.pdf', 'application/pdf', 300),
    (4, 4, 'gpkd-saigon-vintage.pdf', 'lab-document/2026/11/22222222-2222-4222-8222-000000000004.pdf', 'application/pdf', 305),
    (5, 5, 'gpkd-danang-analog.pdf', 'lab-document/2026/11/22222222-2222-4222-8222-000000000005.pdf', 'application/pdf', 304)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lab_registration_application_service_types (lab_registration_application_id, service_type_id)
SELECT v.app_id, st.id
FROM (VALUES
    (1, 'DEVELOPING'), (1, 'SCANNING'), (1, 'PRINTING'),
    (2, 'DEVELOPING'), (2, 'SCANNING'), (2, 'PRINTING'),
    (3, 'DEVELOPING'), (3, 'SCANNING'),
    (4, 'DEVELOPING'), (4, 'SCANNING'),
    (5, 'DEVELOPING'), (5, 'SCANNING')
) AS v(app_id, code)
JOIN service_types st ON st.code = v.code
ON CONFLICT DO NOTHING;

INSERT INTO lab_registration_application_film_processes (lab_registration_application_id, film_process_id)
SELECT v.app_id, fp.id
FROM (VALUES
    (1, 'C41'), (1, 'BW'), (1, 'ECN2'),
    (2, 'C41'), (2, 'BW'), (2, 'E6'),
    (3, 'C41'), (3, 'BW'), (3, 'ECN2'),
    (4, 'C41'), (4, 'BW'),
    (5, 'C41'), (5, 'BW')
) AS v(app_id, code)
JOIN film_processes fp ON fp.code = v.code
ON CONFLICT DO NOTHING;

INSERT INTO lab_registration_application_film_formats (lab_registration_application_id, film_format_id)
SELECT v.app_id, ff.id
FROM (VALUES
    (1, '135'), (1, '120'),
    (2, '135'), (2, '120'), (2, '4X5'),
    (3, '135'), (3, '120'),
    (4, '135'),
    (5, '135'), (5, '120')
) AS v(app_id, code)
JOIN film_formats ff ON ff.code = v.code
ON CONFLICT DO NOTHING;

INSERT INTO expert_upgrade_applications (
    id, applicant_account_id, portfolio_url, experience_summary,
    status, rejection_reason, reviewed_by_account_id, reviewed_at,
    created_at, updated_at
) VALUES
    (1, 4, 'https://portfolio.filmlink.vn/le-bao-analog',
     '8 năm kinh nghiệm tráng rọi thủ công C-41, B&W Ilford và E-6 tại TP.HCM, giảng viên workshop đo sáng máy cơ và cân chỉnh màu scan Frontier/Noritsu.',
     'APPROVED', NULL, 1, '2026-10-10T09:00:00Z',
     '2026-10-08T03:00:00Z', '2026-10-10T09:00:00Z'),

    (2, 9, 'https://portfolio.filmlink.vn/hoang-nam-film',
     '5 năm chụp ảnh đường phố với phim 35mm và Medium Format 6x6, từng viết loạt bài đánh giá Kodak Portra, CineStill 800T và bảo dưỡng ống kính Zuiko.',
     'PENDING_REVIEW', NULL, NULL, NULL,
     '2026-11-19T10:00:00Z', '2026-11-19T10:00:00Z')
ON CONFLICT (id) DO NOTHING;
