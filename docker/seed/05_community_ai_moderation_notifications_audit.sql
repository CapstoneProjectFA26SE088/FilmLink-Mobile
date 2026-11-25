SET TIME ZONE 'UTC';

-- =====================================================================================
-- 05. COMMUNITY, EXPERT ARTICLES, PGVECTOR KNOWLEDGE BASE, AI CHATBOT,
--     MODERATION, COMPLAINTS, NOTIFICATIONS & AUDIT LOGS
-- =====================================================================================

-- Lab Reviews (Order 3 CLOSED)
INSERT INTO lab_reviews (
    id, service_order_id, film_lab_id, author_account_id, rating, content, status,
    lab_reply, lab_replied_at, created_at, updated_at
) VALUES
    (1, 3, 1, 3, 5,
     'Tráng Express cực nhanh mà chất lượng scan Noritsu rất sạch, tông màu da Kodak ColorPlus giữ rất tự nhiên.',
     'VISIBLE',
     'Cảm ơn Minh Anh đã tin tưởng Mộc Film Lab! Hẹn gặp bạn ở những cuộn phim dự án sắp tới.',
     '2026-11-10T06:00:00Z', '2026-11-10T05:00:00Z', '2026-11-10T06:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO lab_review_photos (id, lab_review_id, blob_key, display_order) VALUES
    (1, 1, 'lab-image/2026/11/33333333-3333-4333-8333-000000000013.jpg', 1)
ON CONFLICT (id) DO NOTHING;

-- Photo Feed
INSERT INTO photo_feed_posts (
    id, author_account_id, caption, film_stock_id, film_stock_name_text, camera, film_lab_id, status
)
SELECT 1, 3,
       'Buổi sáng cà phê bệt Nhà Thờ Đức Bà cùng Kodak Gold 200 tráng tại Mộc Film Lab.',
       fs.id, NULL, 'Olympus OM-1n', 1, 'VISIBLE'
FROM film_stocks fs WHERE fs.stock_name = 'Gold 200'
ON CONFLICT (id) DO NOTHING;

INSERT INTO photo_feed_posts (
    id, author_account_id, caption, film_stock_id, film_stock_name_text, camera, film_lab_id, status
)
SELECT 2, 4,
       'Độ chuyển xám và hạt bạc mịn đặc trưng khi push Ilford HP5 Plus +1 stop.',
       fs.id, NULL, 'Hasselblad 500C/M', 2, 'VISIBLE'
FROM film_stocks fs WHERE fs.stock_name = 'HP5 Plus'
ON CONFLICT (id) DO NOTHING;

INSERT INTO photo_feed_post_images (id, photo_feed_post_id, blob_key, display_order) VALUES
    (1, 1, 'lab-image/2026/11/33333333-3333-4333-8333-000000000014.jpg', 1),
    (2, 2, 'lab-image/2026/11/33333333-3333-4333-8333-000000000015.jpg', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO photo_feed_post_likes (photo_feed_post_id, user_account_id) VALUES
    (1, 4), (1, 9), (2, 3)
ON CONFLICT DO NOTHING;

INSERT INTO photo_feed_comments (id, photo_feed_post_id, author_account_id, content, status) VALUES
    (1, 1, 4, 'Đo sáng vùng highlight tốt lắm, màu vàng nắng giữ rất đẹp.', 'VISIBLE'),
    (2, 2, 3, 'Nhìn chất hạt của khổ 120 trên Hasselblad thật sự quá đã mắt!', 'VISIBLE')
ON CONFLICT (id) DO NOTHING;

-- Forum Threads & Answers
INSERT INTO forum_threads (id, author_account_id, title, content, status) VALUES
    (1, 3, 'Kinh nghiệm đo sáng cho Kodak Vision3 500T khi chụp đêm không dùng filter 85B',
     'Mình chuẩn bị gửi cuộn Vision3 500T đi tráng ECN-2 tại LLab. Cho mình hỏi mọi người hay set ISO 400 hay 500 và có cần bù sáng khi chụp dưới đèn đường vàng không?',
     'VISIBLE'),
    (2, 9, 'So sánh chất màu scan Noritsu HS-1800 và Fujifilm Frontier SP-3000 cho Portra 400',
     'Anh em thường chọn Noritsu cho độ chi tiết hay Frontier cho tone xanh rêu mát mắt khi chụp chân dung ngoài trời?',
     'VISIBLE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO forum_answers (id, forum_thread_id, author_account_id, content, status) VALUES
    (1, 1, 4, 'Vision3 500T có vĩ độ phơi sáng rất rộng. Bạn có thể đo ở ISO 400 (+1/3 EV) để giữ chi tiết vùng tối tốt và cân bằng trắng khi scan sẽ dễ khử ám vàng hơn.', 'VISIBLE'),
    (2, 2, 4, 'Portra 400 trên Noritsu giữ màu da tự nhiên và nhiều chi tiết shadow để hậu kỳ TIFF, còn Frontier cho màu pastel rực hơn ngay từ file JPG.', 'VISIBLE')
ON CONFLICT (id) DO NOTHING;

-- Expert Articles (PUBLISHED + APPROVED for Knowledge Base RAG)
INSERT INTO expert_articles (
    id, author_account_id, title, category, content, status,
    kb_status, kb_submitted_at, kb_reviewed_by_account_id, kb_reviewed_at
) VALUES
    (1, 4, 'Hướng dẫn kỹ thuật Push/Pull phim C-41 và B&W chuẩn xác', 'TUTORIAL',
     'Push phim là việc chụp ở mức ISO cao hơn ISO định mức của nhà sản xuất (ví dụ set ISO 800 cho cuộn Ilford HP5 Plus 400 hoặc Portra 400) và yêu cầu phòng lab tăng thời gian tráng tương ứng (+1 stop hoặc +2 stops). Kỹ thuật này giúp chụp trong điều kiện thiếu sáng và tăng độ tương phản hạt phim. Ngược lại, Pull phim (-1 stop) giảm thời gian tráng để làm dịu tương phản khi chụp nắng gắt. Lưu ý báo rõ số stop push/pull ngay khi đặt đơn và áp dụng đồng nhất cho cả cuộn phim.',
     'PUBLISHED', 'APPROVED', '2026-10-12T04:00:00Z', 2, '2026-10-12T08:00:00Z'),

    (2, 4, 'So sánh Kodak Portra 400 và Kodak Gold 200 cho chụp chân dung & đường phố', 'FILM_REVIEW',
     'Kodak Portra 400 nổi bật với dải tương phản rộng, màu da trung tính mịn màng và khả năng cứu sáng vượt trội khi đo dư 1-2 stops, phù hợp cho chân dung chuyên nghiệp và ảnh cưới. Trong khi đó Kodak Gold 200 có giá thành hợp lý hơn, mang sắc vàng ấm hoài cổ rất hợp chụp đường phố ban ngày nắng đẹp. Cả hai đều sử dụng quy trình tráng C-41 tiêu chuẩn.',
     'PUBLISHED', 'APPROVED', '2026-10-15T04:00:00Z', 2, '2026-10-15T09:00:00Z'),

    (3, 4, 'Quy trình bảo quản phim điện ảnh ECN-2 và lưu ý tẩy lớp Remjet', 'TUTORIAL',
     'Phim điện ảnh Kodak Vision3 (50D, 250D, 500T) được phủ lớp carbon đen chống lóa Remjet ở mặt sau. Tuyệt đối không đưa cuộn phim còn Remjet vào bể tráng C-41 thông thường vì lớp than sẽ làm nhiễm bẩn hóa chất của lab. Hãy gửi tới các phòng lab hỗ trợ quy trình ECN-2 chuẩn để tẩy Remjet trước khi tráng và scan giữ trọn dải màu điện ảnh.',
     'PUBLISHED', 'APPROVED', '2026-10-18T04:00:00Z', 2, '2026-10-18T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Knowledge Base Chunks with 1536-dim pgvector embeddings (text-embedding-3-small)
INSERT INTO knowledge_base_chunks (
    id, expert_article_id, chunk_index, content, token_count, embedding_model, embedding
) VALUES
    (1, 1, 0,
     'Push phim là việc chụp ở mức ISO cao hơn ISO định mức (ví dụ set ISO 800 cho Ilford HP5 Plus 400) và tăng thời gian tráng (+1 hoặc +2 stops) để chụp thiếu sáng và tăng tương phản.',
     48, 'text-embedding-3-small',
     (SELECT array_agg(round(((sin((gs * 1.1) / 17.0) + cos((gs * 0.7) / 23.0)) / 40.0)::numeric, 6)::real)::public.vector(1536) FROM generate_series(1, 1536) gs)),

    (2, 1, 1,
     'Pull phim (-1 stop) giảm thời gian tráng giúp làm dịu độ tương phản khi chụp nắng gắt. Cần khai báo số stop push/pull đồng nhất cho toàn bộ cuộn phim khi tạo đơn dịch vụ.',
     44, 'text-embedding-3-small',
     (SELECT array_agg(round(((sin((gs * 1.7) / 19.0) + cos((gs * 1.3) / 29.0)) / 40.0)::numeric, 6)::real)::public.vector(1536) FROM generate_series(1, 1536) gs)),

    (3, 2, 0,
     'Kodak Portra 400 có dải dynamic range rộng, màu da trung tính tự nhiên, chịu overexpose 1-2 stops rất tốt cho chụp chân dung và cưới, tráng bằng hóa chất C-41.',
     45, 'text-embedding-3-small',
     (SELECT array_agg(round(((sin((gs * 2.3) / 13.0) + cos((gs * 1.9) / 31.0)) / 40.0)::numeric, 6)::real)::public.vector(1536) FROM generate_series(1, 1536) gs)),

    (4, 2, 1,
     'Kodak Gold 200 phù hợp chụp đường phố ban ngày với tông vàng ấm hoài cổ và chi phí tiết kiệm hơn Portra 400, cùng sử dụng quy trình C-41.',
     39, 'text-embedding-3-small',
     (SELECT array_agg(round(((sin((gs * 2.9) / 11.0) + cos((gs * 2.1) / 37.0)) / 40.0)::numeric, 6)::real)::public.vector(1536) FROM generate_series(1, 1536) gs)),

    (5, 3, 0,
     'Phim điện ảnh Kodak Vision3 50D, 250D, 500T có lớp phủ Remjet ở mặt sau. Không tráng bằng máy C-41 thường mà phải dùng quy trình ECN-2 để tẩy sạch lớp than chống lóa.',
     47, 'text-embedding-3-small',
     (SELECT array_agg(round(((sin((gs * 3.1) / 15.0) + cos((gs * 2.7) / 41.0)) / 40.0)::numeric, 6)::real)::public.vector(1536) FROM generate_series(1, 1536) gs)),

    (6, 3, 1,
     'Nên chọn các phòng lab hỗ trợ ECN-2 chuyên dụng như Mộc Film Lab hoặc LLab Analog Hà Nội khi gửi Kodak Vision3 500T để đảm bảo an toàn hóa chất và màu sắc chính xác.',
     46, 'text-embedding-3-small',
     (SELECT array_agg(round(((sin((gs * 3.7) / 21.0) + cos((gs * 3.3) / 43.0)) / 40.0)::numeric, 6)::real)::public.vector(1536) FROM generate_series(1, 1536) gs))
ON CONFLICT (id) DO NOTHING;

-- Workshops
INSERT INTO workshop_events (
    id, organiser_account_id, event_type, title, description, location,
    starts_at, ends_at, max_places, status
) VALUES
    (1, 4, 'PHOTOWALK', 'Sài Gòn Morning Analog Photowalk — Quận 1',
     'Buổi đi bộ chụp phim sáng cuối tuần cùng Photography Expert Lê Bảo, chia sẻ kỹ thuật đo sáng sunny-16 và cách chọn cuộn phim phù hợp ánh sáng đô thị.',
     'Nhà Thờ Đức Bà & Bưu Điện Thành Phố, Quận 1, TP.HCM',
     '2026-12-06T00:30:00Z', '2026-12-06T03:30:00Z', 25, 'OPEN')
ON CONFLICT (id) DO NOTHING;

INSERT INTO workshop_event_registrations (workshop_event_id, user_account_id) VALUES
    (1, 3), (1, 9)
ON CONFLICT DO NOTHING;

-- AI Interactions, Chatbot Sessions & Messages, Image Analyses & Scan Quality
INSERT INTO ai_interactions (
    id, user_account_id, feature, status, is_fallback, model_name,
    latency_ms, prompt_tokens, completion_tokens, feedback
) VALUES
    (1, 3, 'ADVISORY_CHATBOT', 'SUCCEEDED', false, 'gpt-4o-mini', 820, 420, 145, 'HELPFUL')
ON CONFLICT (id) DO NOTHING;

INSERT INTO chatbot_sessions (
    id, user_account_id, title, last_message_at
) VALUES
    (1, 3, 'Tư vấn Push phim Portra & Vision3 ECN-2', '2026-11-23T10:01:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO chatbot_messages (
    id, chatbot_session_id, sender, content, citations, ai_interaction_id, created_at
) VALUES
    (1, 1, 'USER', 'Khi nào nên push phim lên +1 stop và cần lưu ý gì khi gửi lab tráng?', NULL, NULL, '2026-11-23T10:00:00Z'),
    (2, 1, 'ASSISTANT',
     'Bạn nên push +1 stop khi chụp trong điều kiện thiếu sáng bằng cách set ISO máy cao gấp đôi ISO định mức (ví dụ ISO 800 cho cuộn 400) và chọn tùy chọn Push +1 ngay trên đơn đặt dịch vụ để lab tăng thời gian tráng đồng nhất cho cả cuộn phim.',
     '[{"expertArticleId":1,"title":"Hướng dẫn kỹ thuật Push/Pull phim C-41 và B&W chuẩn xác"}]'::jsonb,
     1, '2026-11-23T10:01:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO image_analyses (
    id, scan_file_id, photo_feed_post_image_id, status, attempt_count,
    predicted_film_stock_id, film_stock_confidence, style_tags, is_confirmed,
    description, confirmed_at, confirmed_by_account_id, confirmed_style_tags,
    embedding_model, embedding
)
SELECT 1, 3, NULL, 'COMPLETED', 1, fs.id, 0.915,
       ARRAY['warm-tones', 'street', 'afternoon-light'], true,
       'Warm golden-hour street scene with soft highlights characteristic of Kodak ColorPlus 200.',
       '2026-11-10T04:10:00Z', 3, ARRAY['warm-tones', 'street'],
       'text-embedding-3-small',
       (SELECT array_agg(round(((sin((gs * 4.1) / 19.0) + cos((gs * 1.5) / 27.0)) / 40.0)::numeric, 6)::real)::public.vector(1536) FROM generate_series(1, 1536) gs)
FROM film_stocks fs WHERE fs.stock_name = 'ColorPlus 200'
ON CONFLICT (id) DO NOTHING;

INSERT INTO scan_quality_assessments (
    id, scan_file_id, sharpness_score, is_blurry, exposure_assessment,
    is_resolution_sufficient, has_warning
) VALUES
    (1, 3, 185.40, false, 'CORRECT', true, false)
ON CONFLICT (id) DO NOTHING;

-- Moderation & Complaints
INSERT INTO moderation_actions (
    id, target_type, target_id, decision, reason, content_author_account_id,
    author_sanction, reverts_action_id, moderator_account_id
) VALUES
    (1, 'FORUM_ANSWER', 1, 'KEEP', NULL, 4, 'NONE', NULL, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO content_reports (
    id, reporter_account_id, target_type, target_id, violation_type, description,
    status, moderation_action_id, handled_by_account_id, handled_at
) VALUES
    (1, 9, 'FORUM_ANSWER', 1, 'MISINFORMATION', 'Kiểm tra lại thông số bù sáng khi chụp Vision3 500T.',
     'DISMISSED', 1, 2, '2026-11-20T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO complaints (
    id, complaint_code, raised_by_account_id, service_order_id, consignment_sale_id,
    complaint_type, description, status, conclusion, resolution_reason,
    refund_amount_vnd, is_commission_waived, resolved_by_account_id, resolved_at
) VALUES
    (1, 'CMP-2026-001', 3, 3, NULL, 'SCAN_QUALITY',
     'Hai khung đầu của cuộn Vision3 respool có vệt sáng nhẹ ở rìa khung ảnh, nhờ kiểm tra giúp.',
     'RESOLVED', 'DISMISSED',
     'Sau khi đối chiếu âm bản gốc và log bàn giao, vệt sáng do lộ sáng đầu cuộn lúc lắp phim vào máy, chất lượng tráng scan đạt chuẩn.',
     NULL, false, 1, '2026-11-10T02:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Notifications (types adhere to ck_notifications_type)
INSERT INTO notifications (
    id, user_account_id, notification_type, title, content, link_path,
    target_type, target_id, is_read, read_at, created_at
) VALUES
    (1, 3, 'ORDER', 'Đơn SO261122A1B2C3 đang ở công đoạn Scan',
     'Mộc Film Lab đang tiến hành scan cuộn phim thứ 2/2 trên máy Noritsu HS-1800.',
     '/orders/1', 'SERVICE_ORDER', 1, false, NULL, '2026-11-23T08:05:00Z'),

    (2, 3, 'SCHEDULE_CHANGE', 'Cập nhật ngày hẹn trả đơn SO261122A1B2C3',
     'Lịch trả dự kiến được điều chỉnh sang 26/11/2026. Vui lòng phản hồi lựa chọn của bạn.',
     '/orders/1', 'SERVICE_ORDER', 1, false, NULL, '2026-11-23T08:10:00Z'),

    (3, 3, 'ORDER', 'Đơn SO261115D4E5F6 đã giao phim & scan',
     'Darkroom Sài Gòn đã hoàn tất giao cuộn Ilford HP5 Plus 400. Hãy xác nhận đã nhận phim.',
     '/orders/2', 'SERVICE_ORDER', 2, false, NULL, '2026-11-18T09:35:00Z'),

    (4, 3, 'PAYMENT', 'Thanh toán thành công đơn SO261108G7H8J9',
     'Giao dịch VNPay FLTXN261108001 số tiền 235.000đ đã được xác nhận.',
     '/orders/3', 'SERVICE_ORDER', 3, true, '2026-11-08T02:10:00Z', '2026-11-08T02:07:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notification_deliveries (
    id, notification_id, channel, status, attempt_count, sent_at
) VALUES
    (1, 1, 'EMAIL', 'SENT', 1, '2026-11-23T08:05:10Z'),
    (2, 2, 'EMAIL', 'SENT', 1, '2026-11-23T08:10:10Z'),
    (3, 3, 'EMAIL', 'SENT', 1, '2026-11-18T09:35:10Z'),
    (4, 4, 'EMAIL', 'SENT', 1, '2026-11-08T02:07:10Z')
ON CONFLICT (id) DO NOTHING;

-- Audit Logs (strictly matching AuditAction.java & AuditTargetType.java, read-only trigger!)
INSERT INTO audit_logs (
    id, occurred_at, actor_account_id, actor_role, action, target_type, target_id,
    outcome, reason, before_data, after_data
) VALUES
    (1, '2026-10-02T05:00:00Z', 1, 'ADMIN', 'LAB_APPLICATION_APPROVED', 'LAB_REGISTRATION_APPLICATION', 1,
     'SUCCESS', 'Hồ sơ pháp lý hợp lệ, duyệt mở Mộc Film Lab.',
     '{"status":"PENDING_REVIEW"}'::jsonb, '{"status":"APPROVED","filmLabId":1}'::jsonb),

    (2, '2026-10-02T05:15:00Z', 5, 'FILM_LAB_OWNER', 'MACHINE_CREATED', 'MACHINE', 1,
     'SUCCESS', NULL, NULL, '{"machineCode":"MOC-PROC-01","machineType":"PROCESSOR"}'::jsonb),

    (3, '2026-10-02T05:25:00Z', 5, 'FILM_LAB_OWNER', 'LAB_ACCEPTING_ORDERS_CHANGED', 'FILM_LAB', 1,
     'SUCCESS', NULL, '{"acceptingOrders":false}'::jsonb, '{"acceptingOrders":true}'::jsonb),

    (4, '2026-10-12T08:05:00Z', 2, 'MODERATOR', 'KNOWLEDGE_BASE_REINDEXED', 'KNOWLEDGE_BASE_ENTRY', NULL,
     'SUCCESS', 'Lập chỉ mục chunk pgvector cho Knowledge Base mẫu.',
     NULL, '{"articleCount":3,"chunkCount":6,"embeddingModel":"text-embedding-3-small"}'::jsonb),

    (5, '2026-11-22T02:00:00Z', 3, 'PHOTOGRAPHER', 'ORDER_CREATED', 'SERVICE_ORDER', 1,
     'SUCCESS', NULL, NULL,
     '{"orderCode":"SO261122A1B2C3","filmLabId":1,"status":"AWAITING_LAB_CONFIRMATION","estimatedTotalVnd":170000}'::jsonb)
ON CONFLICT (id) DO NOTHING;
