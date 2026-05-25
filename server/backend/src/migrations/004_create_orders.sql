-- Migration 004: create orders and order_items tables

CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS orders
(
    id         BIGSERIAL    PRIMARY KEY,
    table_id   BIGINT       NOT NULL REFERENCES restaurant_tables(id),
    status     order_status NOT NULL DEFAULT 'pending',
    note       TEXT         NOT NULL DEFAULT '',
    total      NUMERIC(8,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_table_id_idx  ON orders (table_id);
CREATE INDEX IF NOT EXISTS orders_status_idx    ON orders (status);

CREATE TABLE IF NOT EXISTS order_items
(
    id           BIGSERIAL    PRIMARY KEY,
    order_id     BIGINT       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id BIGINT       NOT NULL REFERENCES menu_items(id),
    name         TEXT         NOT NULL,   -- snapshot at order time
    price        NUMERIC(8,2) NOT NULL,   -- snapshot at order time
    quantity     INT          NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);
