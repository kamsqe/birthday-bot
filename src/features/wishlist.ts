import { TelegramBot } from '../telegram';
import { DBRepo } from '../db';
import { Messages } from '../ui/messages';
import { Keyboards } from '../ui/keyboards';
import { paginate } from '../utils';

export class WishlistController {
  
  static async browser(bot: TelegramBot, db: DBRepo, chatId: number, messageId: number, isGroup: boolean, parts: string[]) {
    let page = parseInt(parts[1]) || 0;
    const birthdays = await db.getBirthdaysByUser(chatId);

    if (birthdays.length === 0) {
      await bot.editMessageText(chatId, messageId, `No birthdays saved for this ${isGroup ? 'group' : 'chat'} yet!`);
      return;
    }

    birthdays.sort((a, b) => a.name.localeCompare(b.name));
    
    const { pageItems, totalPages, currentPage } = paginate(birthdays, page, 5);

    let msg = Messages.wishlistMenu(totalPages, currentPage);

    const keyboard = { inline_keyboard: [] as any[][] };
    pageItems.forEach(b => {
      keyboard.inline_keyboard.push([{ text: `🎁 ${b.name}'s Wishlist`, callback_data: `wishlist_view:${b.id}` }]);
    });

    const navRow = [];
    if (totalPages > 1) {
      navRow.push({ text: '⬅️ Prev', callback_data: `list_wishlist:${currentPage - 1}` });
      navRow.push({ text: 'Next ➡️', callback_data: `list_wishlist:${currentPage + 1}` });
      keyboard.inline_keyboard.push(navRow);
    }
    keyboard.inline_keyboard.push([{ text: '🔙 Back to Dashboard', callback_data: `list_dash` }]);
    
    await bot.editMessageText(chatId, messageId, msg, keyboard);
  }

  static async view(bot: TelegramBot, db: DBRepo, chatId: number, messageId: number, parts: string[]) {
    const bId = parseInt(parts[1]);
    const b = (await db.getBirthdaysByUser(chatId, 100)).find((x: any) => x.id === bId);
    if (!b) return;

    const items = await db.getWishlist(bId);
    
    await bot.editMessageText(
      chatId, 
      messageId, 
      Messages.wishlistView(b, items), 
      Keyboards.wishlistList(items, bId)
    );
  }

  static async promptAdd(bot: TelegramBot, db: DBRepo, chatId: number, messageId: number, fromUserId: number, isGroupChat: boolean, parts: string[]) {
    const bId = parseInt(parts[1]);
    const b = (await db.getBirthdaysByUser(chatId, 100)).find((x: any) => x.id === bId);
    if (!b) return;

    const stateKey = isGroupChat ? fromUserId : chatId;
    await db.setChatState(stateKey, 'awaiting_wishlist', bId.toString());

    await bot.sendMessage(
      chatId,
      Messages.askWishlist(b.name),
      { force_reply: true, selective: true }
    );
  }

  static async handleWishlistReply(bot: TelegramBot, db: DBRepo, chatId: number, userId: number, text: string, dataState: string, stateKey: number) {
    const bId = parseInt(dataState);
    if (isNaN(bId)) return;
    
    const b = (await db.getBirthdaysByUser(chatId, 100)).find((x: any) => x.id === bId);
    if (!b) return;

    await db.addWishlistItem({
      birthday_id: bId,
      item_text: text.trim().substring(0, 100),
      added_by_tg_id: userId
    });

    await db.clearChatState(stateKey);

    const backKeyboard = {
      inline_keyboard: [[{ text: '🔙 Back to Wishlist', callback_data: `wishlist_view:${bId}` }]]
    };
    
    await bot.sendMessage(chatId, `✅ Added "<b>${text.trim().substring(0, 50)}...</b>" to ${b.name}'s wishlist!`, backKeyboard);
  }

  static async deleteItem(bot: TelegramBot, db: DBRepo, query: any, parts: string[]) {
    const bId = parseInt(parts[1]);
    const itemId = parseInt(parts[2]);
    
    await db.deleteWishlistItem(itemId, bId);
    
    // Instead of passing query back to a monolithic handler, re-invoke View manually
    return this.view(bot, db, query.message.chat.id, query.message.message_id, ['wishlist_view', bId.toString()]);
  }
}
