import { TelegramBot } from '../telegram';
import { DBRepo } from '../db';
import { Messages } from '../ui/messages';
import { Keyboards } from '../ui/keyboards';
import { paginate } from '../utils';

export class ManageController {
  
  static async manageBrowser(bot: TelegramBot, db: DBRepo, chatId: number, messageId: number, isGroup: boolean, parts: string[]) {
    let page = parseInt(parts[1]) || 0;
    const birthdays = await db.getBirthdaysByUser(chatId);

    if (birthdays.length === 0) {
      await bot.editMessageText(chatId, messageId, `No birthdays saved for this ${isGroup ? 'group' : 'chat'} yet!`);
      return;
    }

    birthdays.sort((a, b) => a.name.localeCompare(b.name));

    const { pageItems, totalPages, currentPage } = paginate(birthdays, page, 5);

    let msg = Messages.manageList(pageItems, currentPage, totalPages);
    
    // We build the dynamic keyboard array here
    const keyboard = { inline_keyboard: [] as any[][] };
    
    pageItems.forEach(b => {
      keyboard.inline_keyboard.push([{ text: `⚙️ Manage ${b.name}`, callback_data: `manage_bday:${b.id}:${currentPage}` }]);
    });

    const navRow = [];
    if (totalPages > 1) {
      navRow.push({ text: '⬅️ Prev', callback_data: `list_del_menu:${currentPage - 1}` });
      navRow.push({ text: 'Next ➡️', callback_data: `list_del_menu:${currentPage + 1}` });
      keyboard.inline_keyboard.push(navRow);
    }
    keyboard.inline_keyboard.push([{ text: '🔙 Back to Dashboard', callback_data: `list_dash` }]);

    await bot.editMessageText(chatId, messageId, msg, keyboard);
  }

  static async manageProfile(bot: TelegramBot, db: DBRepo, chatId: number, messageId: number, parts: string[]) {
    const bId = parseInt(parts[1]);
    const page = parts[2] || '0';

    const b = (await db.getBirthdaysByUser(chatId, 100)).find((x: any) => x.id === bId);
    if (!b) return;

    await bot.editMessageText(
      chatId, 
      messageId, 
      Messages.manageProfile(b), 
      Keyboards.manageProfile(b, page)
    );
  }

  static async deleteConfirm(bot: TelegramBot, db: DBRepo, chatId: number, messageId: number, parts: string[]) {
    const bId = parseInt(parts[1]);
    const page = parts[2];

    const b = (await db.getBirthdaysByUser(chatId, 100)).find((x: any) => x.id === bId);
    if (!b) return;

    await bot.editMessageText(
      chatId, 
      messageId, 
      Messages.deleteConfirm(b.name), 
      Keyboards.deleteConfirm(bId, page)
    );
  }

  static async deleteExecute(bot: TelegramBot, db: DBRepo, chatId: number, messageId: number, parts: string[], queryId: string) {
    const bId = parseInt(parts[1]);
    const page = parts[2];

    await db.deleteBirthday(bId, chatId);
    await bot.answerCallbackQuery(queryId, "✅ Birthday deleted.", false);
    
    // Loop back to manage browser directly using the controller method
    return this.manageBrowser(bot, db, chatId, messageId, chatId < 0, ['list_del_menu', page]);
  }
}
