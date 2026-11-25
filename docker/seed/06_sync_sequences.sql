-- =====================================================================================
-- 06. SYNCHRONIZE ALL IDENTITY SEQUENCES IN TARGET SCHEMA
-- Ensures subsequent inserts by FA26SE088-backend never collide with explicit seed IDs.
-- =====================================================================================

DO $$
DECLARE
    rec RECORD;
    max_val BIGINT;
BEGIN
    FOR rec IN
        SELECT
            c.table_schema,
            c.table_name,
            c.column_name,
            pg_get_serial_sequence(format('%I.%I', c.table_schema, c.table_name), c.column_name) AS seq_name
        FROM information_schema.columns c
        WHERE c.table_schema = current_schema()
          AND c.is_identity = 'YES'
    LOOP
        IF rec.seq_name IS NOT NULL THEN
            EXECUTE format('SELECT MAX(%I) FROM %I.%I', rec.column_name, rec.table_schema, rec.table_name)
                INTO max_val;
            IF max_val IS NULL THEN
                PERFORM setval(rec.seq_name, 1, false);
            ELSE
                PERFORM setval(rec.seq_name, max_val, true);
            END IF;
        END IF;
    END LOOP;
END $$;
