-- Migration 002: create restaurant tables
-- Stores physical tables in the restaurant.

CREATE TABLE IF NOT EXISTS restaurant_tables
(
    id         BIGSERIAL   PRIMARY KEY,
    number     INT         NOT NULL UNIQUE,
    is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default tables (mirrors the current tables.json)
INSERT INTO restaurant_tables (number) VALUES
    (1),(2),(3),(5),(7),(8),(10),(12),(15),(18),(32)
ON CONFLICT (number) DO NOTHING;
