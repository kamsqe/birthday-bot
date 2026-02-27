import { TelegramBot } from '../telegram';
import { DBRepo } from '../db';
import { Messages } from '../ui/messages';
import { Keyboards } from '../ui/keyboards';
import { formatDate } from '../utils';

export class OnboardingController {
  
  static async start(bot: TelegramBot, chatId: number, isGroup: boolean) {
    await bot.sendMessage(chatId, Messages.welcome(isGroup), Keyboards.welcome(isGroup));
  }

  static async help(bot: TelegramBot, chatId: number) {
    await bot.sendMessage(chatId, Messages.help());
  }

  static async helpInline(bot: TelegramBot, chatId: number, messageId: number) {
    await bot.editMessageText(chatId, messageId, Messages.help(), Keyboards.backToDashboard());
  }

  static async adminSetup(bot: TelegramBot, chatId: number) {
    await bot.setMyCommands([
      { command: 'start', description: 'Start the bot or view main menu' },
      { command: 'list', description: 'Open your Dashboard to see all birthdays' },
      { command: 'add', description: 'Add a new birthday (e.g. /add Mike)' },
      { command: 'help', description: 'View the tutorial and bot capabilities' },
      { command: 'settings', description: 'Configure timezone and reminder preferences' }
    ]);
    
    const shortDesc = "Your personal assistant for tracking birthdays, sending reminders, and generating awesome messages and GIFs! 🎈";
    await bot.setMyShortDescription(shortDesc);
    
    const desc = "🎉 Welcome to the Birthday Bot!\n\nI'm your personal assistant for tracking birthdays and sending you timely reminders.\n\nWhat I can do:\n1. 🗓 Track your friends' birthdays\n2. 🔔 Send you a reminder before the big day\n3. 🎁 Save gift ideas\n4. ✨ Help you generate personalized Birthday messages and GIFs using AI!\n\nHit START below to begin!";
    await bot.setMyDescription(desc);

    await bot.sendMessage(chatId, `✅ Bot commands and descriptions successfully registered!`);
  }

  static async addBirthday(bot: TelegramBot, chatId: number, text: string) {
    const parts = text.split(' ');
    if (parts.length < 2) {
      await bot.sendMessage(chatId, "Please provide a name! Example: <code>/add Mike</code>");
      return;
    }
    const name = parts.slice(1).join(' ').substring(0, 20);
    
    await bot.sendMessage(chatId, `When is <b>${name}</b>'s birthday?\n\nSelect the month:`, Keyboards.monthPicker(name));
  }

  static async addMonth(bot: TelegramBot, chatId: number, messageId: number, parts: string[]) {
    const name = parts[1];
    const month = parseInt(parts[2]);
    await bot.editMessageText(chatId, messageId, `When is <b>${name}</b>'s birthday in month <b>${month}</b>?\n\nSelect the day:`, Keyboards.dayPicker(name, month));
  }

  static async addDay(bot: TelegramBot, chatId: number, messageId: number, parts: string[]) {
    const name = parts[1];
    const month = parseInt(parts[2]);
    const day = parseInt(parts[3]);
    await bot.editMessageText(chatId, messageId, `What is your relationship with <b>${name}</b>?`, Keyboards.relationshipPicker(name, month, day));
  }

  static async addRelation(bot: TelegramBot, db: DBRepo, chatId: number, messageId: number, parts: string[]) {
    const name = parts[1];
    const month = parseInt(parts[2]);
    const day = parseInt(parts[3]);
    const rel = parts[4];

    await db.addBirthday({
      user_tg_id: chatId,
      name: name,
      birth_month: month,
      birth_day: day,
      birth_year: null,
      relationship: rel,
      reminded_phases: null
    });

    await bot.editMessageText(chatId, messageId, `✅ Successfully saved <b>${name}</b>'s birthday (${formatDate(month, day)})! I will remind this chat when it's time.`);
  }

  static async timezoneParams(bot: TelegramBot, db: DBRepo, chatId: number) {
    const user = await db.getUser(chatId);
    const tzOffset = user?.utc_offset_hours || 0;
    await bot.sendMessage(chatId, Messages.timezoneSettings(tzOffset), Keyboards.timezonePicker(tzOffset));
  }

  static async setTimezone(bot: TelegramBot, db: DBRepo, chatId: number, messageId: number, parts: string[]) {
    const offset = parseInt(parts[1]);
    await db.upsertUser({ tg_id: chatId, utc_offset_hours: offset });
    await bot.editMessageText(chatId, messageId, Messages.timezoneSettings(offset, true), Keyboards.timezonePicker(offset));
  }

  static async settings(bot: TelegramBot, db: DBRepo, chatId: number) {
    const user = await db.getUser(chatId);
    const pref = user?.reminder_preference === 'day_of' ? 'day_of' : 'all';
    await bot.sendMessage(chatId, Messages.reminderSettings(), Keyboards.settings(pref));
  }

  static async setPreference(bot: TelegramBot, db: DBRepo, chatId: number, messageId: number, parts: string[]) {
    const pref = parts[1];
    await db.upsertUser({ tg_id: chatId, reminder_preference: pref });
    await bot.editMessageText(chatId, messageId, Messages.reminderSettings(true), Keyboards.settings(pref));
  }
}
