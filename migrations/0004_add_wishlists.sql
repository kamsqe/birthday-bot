CREATE TABLE IF NOT EXISTS wishlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    birthday_id INTEGER NOT NULL,
    item_text TEXT NOT NULL,
    added_by_tg_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (birthday_id) REFERENCES birthdays(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wishlist_birthday ON wishlists(birthday_id);
