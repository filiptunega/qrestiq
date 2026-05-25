-- Migration 003: create menu_items table

CREATE TABLE IF NOT EXISTS menu_items
(
    id         BIGSERIAL    PRIMARY KEY,
    category   TEXT         NOT NULL,
    name       TEXT         NOT NULL,
    description TEXT        NOT NULL DEFAULT '',
    price      NUMERIC(8,2) NOT NULL CHECK (price >= 0),
    img_url    TEXT         NOT NULL DEFAULT '',
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order INT          NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS menu_items_category_idx ON menu_items (category);
