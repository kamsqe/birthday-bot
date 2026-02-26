CREATE TABLE users (
  tg_id INTEGER PRIMARY KEY,    -- Telegram User ID
  timezone TEXT DEFAULT 'UTC',  -- e.g., 'America/New_York'
  remind_utc_hour INTEGER DEFAULT 14, -- Hour of day to remind in UTC (e.g. 14 = 2 PM)
  language TEXT DEFAULT 'en'
);

CREATE TABLE birthdays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_tg_id INTEGER NOT NULL,           -- FK to users
  name TEXT NOT NULL,
  birth_month INTEGER NOT NULL,
  birth_day INTEGER NOT NULL,
  birth_year INTEGER NULL,      -- Nullable
  relationship TEXT,
  last_reminded_year INTEGER,   -- Idempotency key
  FOREIGN KEY(user_tg_id) REFERENCES users(tg_id) ON DELETE CASCADE
);

CREATE INDEX idx_birthdays_date ON birthdays(birth_month, birth_day);
CREATE INDEX idx_birthdays_user ON birthdays(user_tg_id);
