-- Chat states for multi-step conversation flows (e.g. wishlist input)
CREATE TABLE IF NOT EXISTS chat_states (
  tg_id INTEGER PRIMARY KEY,
  state TEXT NOT NULL,
  data TEXT,
  expires_at INTEGER NOT NULL
);
