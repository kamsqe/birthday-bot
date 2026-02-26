import { BotHandler } from './src/handlers.ts';
import { TelegramBot, TelegramUpdate } from './src/telegram.ts';
import { DBRepo } from './src/db.ts';
import { encodeInvisibleId } from './src/utils.ts';

class MockDB extends DBRepo {
  constructor() {
    super({} as any);
  }
  
  async upsertUser() { return; }

  async getBirthdaysByUser(tg_id: number) {
    return [
      { id: 1, name: 'Alice', birth_month: 2, birth_day: 28, relationship: 'friend' },
      { id: 2, name: 'Bob', birth_month: 3, birth_day: 15, relationship: 'family' }
    ] as any;
  }

  async addWishlistItem(item: any) {
    console.log(`[MockDB] addWishlistItem -> bId: ${item.birthday_id}, text: ${item.item_text}`);
    return;
  }
}

class MockBot extends TelegramBot {
  constructor() { super('fake-token'); }
  
  async sendMessage(chatId: number, text: string, replyMarkup?: any) {
    console.log(`[MockBot] sendMessage -> chatId: ${chatId}`);
    console.log(`[Text]: ${text.substring(0, 50)}...`);
    console.log(`[Markup]:`, JSON.stringify(replyMarkup));
    return { ok: true, result: { message_id: 100 } };
  }
  
  async editMessageText(chatId: number, messageId: number, text: string, replyMarkup?: any) {
    console.log(`[MockBot] editMessageText -> chatId: ${chatId}, msgId: ${messageId}`);
    console.log(`[Text]: ${text.substring(0, 50)}...`);
    console.log(`[Markup]:`, JSON.stringify(replyMarkup));
    return { ok: true };
  }
  
  async answerCallbackQuery(callbackQueryId: string, text?: string, showAlert?: boolean) {
    console.log(`[MockBot] answerCallbackQuery -> result: ${text}`);
    return { ok: true };
  }
}

async function runTests() {
  const mockDb = new MockDB();
  const mockBot = new MockBot();
  const handler = new BotHandler(mockBot, mockDb, null);

  console.log("--- TEST 1: User sends /list ---");
  await handler.handleUpdate({
    update_id: 1,
    message: {
      message_id: 10,
      text: '/list',
      chat: { id: 12345, type: 'private' },
      from: { id: 12345, is_bot: false, first_name: 'Tester' },
      date: 123123
    }
  } as TelegramUpdate);

  console.log("\n--- TEST 2: User clicks 'Edit / Manage' ---");
  await handler.handleUpdate({
    update_id: 2,
    callback_query: {
      id: 'cb_1',
      from: { id: 12345, is_bot: false, first_name: 'Tester' },
      message: { message_id: 100, chat: { id: 12345, type: 'private' } } as any,
      data: 'list_del_menu:0'
    }
  } as TelegramUpdate);

  console.log("\n--- TEST 3: User clicks 'Back to Dashboard' ---");
  await handler.handleUpdate({
    update_id: 3,
    callback_query: {
      id: 'cb_2',
      from: { id: 12345, is_bot: false, first_name: 'Tester' },
      message: { message_id: 100, chat: { id: 12345, type: 'private' } } as any,
      data: 'list_dash'
    }
  } as TelegramUpdate);
  const hiddenId = encodeInvisibleId(3);
  
  console.log("\n--- TEST 4: User replies to wishlist ---");
  await handler.handleUpdate({
    update_id: 4,
    message: {
      message_id: 11,
      chat: { id: 12345, type: 'private' },
      from: { id: 12345, is_bot: false, first_name: 'Tester' },
      date: 123123,
      text: "MacBook Pro",
      reply_to_message: {
        message_id: 10,
        chat: { id: 12345, type: 'private' },
        date: 123123,
        text: `Reply to this message with a gift idea for Kambsr:${hiddenId}`,
      }
    }
  } as TelegramUpdate);
}

runTests();
