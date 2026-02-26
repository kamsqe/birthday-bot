-- Add utc_offset_hours to users so we know when 9AM local time is
ALTER TABLE users ADD COLUMN utc_offset_hours INTEGER DEFAULT 0;
