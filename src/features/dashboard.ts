import { TelegramBot } from '../telegram';
import { DBRepo } from '../db';
import { Messages } from '../ui/messages';
import { Keyboards } from '../ui/keyboards';
import { getZodiacSign, getDaysUntilBirthday, getRelationshipIcon } from '../utils';

export class DashboardController {
  
  static async list(bot: TelegramBot, db: DBRepo, chatId: number, isGroup: boolean) {
    const birthdays = await db.getBirthdaysByUser(chatId);
    
    if (birthdays.length === 0) {
      await bot.sendMessage(chatId, Messages.emptyDashboard(isGroup));
      return;
    }

    const { thisWeek, next30, laterCount } = this.processBirthdays(birthdays);
    
    await bot.sendMessage(chatId, Messages.dashboard(thisWeek, next30, laterCount, isGroup), Keyboards.dashboard());
  }

  static async listInline(bot: TelegramBot, db: DBRepo, chatId: number, messageId: number, isGroup: boolean) {
    const birthdays = await db.getBirthdaysByUser(chatId);
    
    if (birthdays.length === 0) {
      await bot.editMessageText(chatId, messageId, Messages.emptyDashboard(isGroup));
      return;
    }

    const { thisWeek, next30, laterCount } = this.processBirthdays(birthdays);
    
    await bot.editMessageText(chatId, messageId, Messages.dashboard(thisWeek, next30, laterCount, isGroup), Keyboards.dashboard());
  }

  static async listByMonth(bot: TelegramBot, db: DBRepo, chatId: number, messageId: number, parts: string[]) {
    let targetMonth = parts[1] === 'current' ? (new Date().getUTCMonth() + 1) : parseInt(parts[1]);
    
    if (targetMonth < 1) targetMonth = 12;
    if (targetMonth > 12) targetMonth = 1;

    const birthdays = await db.getBirthdaysByUser(chatId);
    const monthBirthdays = birthdays.filter(b => b.birth_month === targetMonth);
    
    monthBirthdays.sort((a, b) => a.birth_day - b.birth_day);

    const msg = Messages.monthList(monthBirthdays, targetMonth);
    const keyboard = {
      inline_keyboard: [
        [
          { text: `⬅️ Prev`, callback_data: `list_month:${targetMonth - 1}` },
          { text: `Next ➡️`, callback_data: `list_month:${targetMonth + 1}` }
        ],
        [{ text: '🔙 Back to Dashboard', callback_data: `list_dash` }]
      ]
    };

    await bot.editMessageText(chatId, messageId, msg, keyboard);
  }

  private static processBirthdays(birthdays: any[]) {
    const currentYear = new Date().getUTCFullYear();
    
    const enriched = birthdays.map(b => {
      const days = getDaysUntilBirthday(b.birth_month, b.birth_day);
      const age = b.birth_year ? (currentYear - b.birth_year) : null;
      const finalAge = (age && days > 0 && b.birth_month < new Date().getUTCMonth() + 1) ? age + 1 : age; 
      return { ...b, days, finalAge, sign: getZodiacSign(b.birth_month, b.birth_day), icon: getRelationshipIcon(b.relationship) };
    });

    enriched.sort((a, b) => a.days - b.days);

    const thisWeek = enriched.filter(b => b.days <= 7);
    const next30 = enriched.filter(b => b.days > 7 && b.days <= 30);
    const laterCount = enriched.length - thisWeek.length - next30.length;

    return { thisWeek, next30, laterCount };
  }
}
