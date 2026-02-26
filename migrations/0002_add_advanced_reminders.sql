-- Add reminder preference to users
ALTER TABLE users ADD COLUMN reminder_preference TEXT DEFAULT 'all';

-- Drop the old idempotency column in favor of a new tracking system
ALTER TABLE birthdays DROP COLUMN last_reminded_year;

-- Add a JSON string column to track which reminder offsets have been sent this year
-- Format: {"year": 2024, "sent": [-7, -3, -1, 0]}
ALTER TABLE birthdays ADD COLUMN reminded_phases TEXT;
