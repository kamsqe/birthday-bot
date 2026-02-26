export interface User {
  tg_id: number;
  timezone: string;
  remind_utc_hour: number;
  language: string;
  reminder_preference: string;
  utc_offset_hours?: number;
}

export interface Birthday {
  id?: number;
  user_tg_id: number;
  name: string;
  birth_month: number;
  birth_day: number;
  birth_year: number | null;
  relationship: string | null;
  reminded_phases: string | null; // e.g., JSON '{"year": 2024, "sent": [-7, -3, -1, 0]}'
}

export interface Wishlist {
  id?: number;
  birthday_id: number;
  item_text: string;
  added_by_tg_id: number;
  created_at?: string;
}

export class DBRepo {
  constructor(private db: D1Database) {}

  async getUser(tg_id: number): Promise<User | null> {
    const stmt = this.db.prepare(`SELECT * FROM users WHERE tg_id = ?`).bind(tg_id);
    return await stmt.first<User>();
  }

  async upsertUser(user: Partial<User> & { tg_id: number }): Promise<void> {
    const existing = await this.getUser(user.tg_id);
    if (existing) {
      await this.db.prepare(
        `UPDATE users SET timezone = ?, remind_utc_hour = ?, language = ?, reminder_preference = ?, utc_offset_hours = ? WHERE tg_id = ?`
      ).bind(
        user.timezone ?? existing.timezone,
        user.remind_utc_hour ?? existing.remind_utc_hour,
        user.language ?? existing.language,
        user.reminder_preference ?? existing.reminder_preference,
        user.utc_offset_hours ?? existing.utc_offset_hours ?? 0,
        user.tg_id
      ).run();
    } else {
      await this.db.prepare(
        `INSERT INTO users (tg_id, timezone, remind_utc_hour, language, reminder_preference, utc_offset_hours) VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        user.tg_id,
        user.timezone ?? 'UTC',
        user.remind_utc_hour ?? 14, // default 2 PM UTC
        user.language ?? 'en',
        user.reminder_preference ?? 'all',
        user.utc_offset_hours ?? 0
      ).run();
    }
  }

  async addBirthday(b: Birthday): Promise<void> {
    await this.db.prepare(
      `INSERT INTO birthdays (user_tg_id, name, birth_month, birth_day, birth_year, relationship) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(b.user_tg_id, b.name, b.birth_month, b.birth_day, b.birth_year, b.relationship).run();
  }
  
  async getBirthdaysByUser(tg_id: number, limit = 50, offset = 0): Promise<Birthday[]> {
    const { results } = await this.db.prepare(
      `SELECT * FROM birthdays WHERE user_tg_id = ? ORDER BY birth_month ASC, birth_day ASC LIMIT ? OFFSET ?`
    ).bind(tg_id, limit, offset).all<Birthday>();
    return results;
  }

  async deleteBirthday(birthdayId: number, user_tg_id: number): Promise<void> {
    await this.db.prepare(
      `DELETE FROM birthdays WHERE id = ? AND user_tg_id = ?`
    ).bind(birthdayId, user_tg_id).run();
  }
  
  async getBirthdaysForReminderQuery(targetUtcHour: number): Promise<(Birthday & { tg_id: number, reminder_preference: string, utc_offset_hours: number })[]> {
    // We want to fetch users whose local time is roughly 9 AM.
    // Local Time = UTC Time + Offset
    // 9 = targetUtcHour + Offset
    // Offset = 9 - targetUtcHour
    const targetOffset = 9 - targetUtcHour;

    const { results } = await this.db.prepare(`
      SELECT b.*, u.tg_id, u.reminder_preference, u.utc_offset_hours
      FROM birthdays b
      JOIN users u ON b.user_tg_id = u.tg_id
      WHERE u.utc_offset_hours = ? OR (u.remind_utc_hour = ? AND u.utc_offset_hours = 0)
    `).bind(targetOffset, targetUtcHour).all<Birthday & { tg_id: number, reminder_preference: string, utc_offset_hours: number }>();
    
    return results;
  }

  async getYearInReviewStats(targetUtcHour: number): Promise<{ tg_id: number, b_count: number }[]> {
    const targetOffset = 9 - targetUtcHour;
    const { results } = await this.db.prepare(`
      SELECT u.tg_id, COUNT(b.id) as b_count
      FROM users u
      LEFT JOIN birthdays b ON u.tg_id = b.user_tg_id
      WHERE u.utc_offset_hours = ? OR (u.remind_utc_hour = ? AND u.utc_offset_hours = 0)
      GROUP BY u.tg_id
    `).bind(targetOffset, targetUtcHour).all<{ tg_id: number, b_count: number }>();
    
    return results;
  }

  async updateRemindedPhases(birthdayId: number, phaseData: string): Promise<void> {
    await this.db.prepare(
      `UPDATE birthdays SET reminded_phases = ? WHERE id = ?`
    ).bind(phaseData, birthdayId).run();
  }

  async getWishlist(birthdayId: number): Promise<Wishlist[]> {
    const { results } = await this.db.prepare(
      `SELECT * FROM wishlists WHERE birthday_id = ? ORDER BY created_at ASC`
    ).bind(birthdayId).all<Wishlist>();
    return results;
  }

  async addWishlistItem(item: Wishlist): Promise<void> {
    await this.db.prepare(
      `INSERT INTO wishlists (birthday_id, item_text, added_by_tg_id) VALUES (?, ?, ?)`
    ).bind(item.birthday_id, item.item_text, item.added_by_tg_id).run();
  }

  async deleteWishlistItem(itemId: number, birthdayId: number): Promise<void> {
    await this.db.prepare(
      `DELETE FROM wishlists WHERE id = ? AND birthday_id = ?`
    ).bind(itemId, birthdayId).run();
  }
}
