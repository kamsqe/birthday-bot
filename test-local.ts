import { BotHandler } from './src/handlers.ts';
import { TelegramBot, TelegramUpdate } from './src/telegram.ts';
import { DBRepo } from './src/db.ts';

class MockDB extends DBRepo {
  private chatStates: Map<number, {state: string, data: string}> = new Map();
  
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

  async getWishlist(birthdayId: number) {
    return [
      { id: 10, birthday_id: birthdayId, item_text: 'MacBook', added_by_tg_id: 12345 }
    ] as any;
  }

  async setChatState(tgId: number, state: string, data: string) {
    this.chatStates.set(tgId, { state, data });
    console.log(`[MockDB] setChatState -> ${state}: ${data}`);
  }

  async getChatState(tgId: number) {
    return this.chatStates.get(tgId) || null;
  }

  async clearChatState(tgId: number) {
    this.chatStates.delete(tgId);
    console.log(`[MockDB] clearChatState -> ${tgId}`);
  }
}

class MockBot extends TelegramBot {
  constructor() { super('fake-token'); }
  
  async sendMessage(chatId: number, text: string, replyMarkup?: any) {
    console.log(`[MockBot] sendMessage -> chatId: ${chatId}`);
    console.log(`[Text]: ${text.substring(0, 80)}...`);
    if (replyMarkup) console.log(`[Markup]:`, JSON.stringify(replyMarkup).substring(0, 200));
    return { ok: true, result: { message_id: 100 } };
  }
  
  async editMessageText(chatId: number, messageId: number, text: string, replyMarkup?: any) {
    console.log(`[MockBot] editMessageText -> chatId: ${chatId}, msgId: ${messageId}`);
    console.log(`[Text]: ${text.substring(0, 80)}...`);
    if (replyMarkup) console.log(`[Markup]:`, JSON.stringify(replyMarkup).substring(0, 200));
    return { ok: true };
  }
  
  async sendAnimation(chatId: number, animation: string, caption?: string, replyMarkup?: any) {
    console.log(`[MockBot] sendAnimation -> chatId: ${chatId}`);
    console.log(`[GIF]: ${animation.substring(0, 50)}`);
    return { ok: true, result: { message_id: 101 } };
  }
  
  async answerCallbackQuery(callbackQueryId: string, text?: string, showAlert?: boolean) {
    console.log(`[MockBot] answerCallbackQuery -> ${text || 'ack'}`);
    return { ok: true };
  }
}

async function runTests() {
  const mockDb = new MockDB();
  const mockBot = new MockBot();
  const handler = new BotHandler(mockBot, mockDb, null);

  console.log("=== TEST 1: /start ===");
  await handler.handleUpdate({
    update_id: 1,
    message: {
      message_id: 10,
      text: '/start',
      chat: { id: 12345, type: 'private' },
      from: { id: 12345, is_bot: false, first_name: 'Tester' },
      date: 123
    }
  } as TelegramUpdate);

  console.log("\n=== TEST 2: /list ===");
  await handler.handleUpdate({
    update_id: 2,
    message: {
      message_id: 11,
      text: '/list',
      chat: { id: 12345, type: 'private' },
      from: { id: 12345, is_bot: false, first_name: 'Tester' },
      date: 123
    }
  } as TelegramUpdate);

  console.log("\n=== TEST 3: Click Edit / Manage ===");
  await handler.handleUpdate({
    update_id: 3,
    callback_query: {
      id: 'cb_1',
      from: { id: 12345, is_bot: false, first_name: 'Tester' },
      message: { message_id: 100, chat: { id: 12345, type: 'private' } } as any,
      data: 'list_del_menu:0'
    }
  } as TelegramUpdate);

  console.log("\n=== TEST 4: Click Manage Alice ===");
  await handler.handleUpdate({
    update_id: 4,
    callback_query: {
      id: 'cb_2',
      from: { id: 12345, is_bot: false, first_name: 'Tester' },
      message: { message_id: 100, chat: { id: 12345, type: 'private' } } as any,
      data: 'manage_bday:1:0'
    }
  } as TelegramUpdate);

  console.log("\n=== TEST 5: Click Message Templates (tpl_back) ===");
  await handler.handleUpdate({
    update_id: 5,
    callback_query: {
      id: 'cb_3',
      from: { id: 12345, is_bot: false, first_name: 'Tester' },
      message: { message_id: 100, chat: { id: 12345, type: 'private' } } as any,
      data: 'tpl_back:1:friend'
    }
  } as TelegramUpdate);

  console.log("\n=== TEST 6: Click Funny template sub-category ===");
  await handler.handleUpdate({
    update_id: 6,
    callback_query: {
      id: 'cb_4',
      from: { id: 12345, is_bot: false, first_name: 'Tester' },
      message: { message_id: 100, chat: { id: 12345, type: 'private' } } as any,
      data: 'tpl_cat:1:friend_funny'
    }
  } as TelegramUpdate);

  console.log("\n=== TEST 7: Click Wishlist Ideas ===");
  await handler.handleUpdate({
    update_id: 7,
    callback_query: {
      id: 'cb_5',
      from: { id: 12345, is_bot: false, first_name: 'Tester' },
      message: { message_id: 100, chat: { id: 12345, type: 'private' } } as any,
      data: 'wishlist_view:1'
    }
  } as TelegramUpdate);

  console.log("\n=== TEST 8: Click Add Idea (state machine) ===");
  await handler.handleUpdate({
    update_id: 8,
    callback_query: {
      id: 'cb_6',
      from: { id: 12345, is_bot: false, first_name: 'Tester' },
      message: { message_id: 100, chat: { id: 12345, type: 'private' } } as any,
      data: 'wishlist_add:1'
    }
  } as TelegramUpdate);

  console.log("\n=== TEST 9: User types gift idea (state should be active) ===");
  await handler.handleUpdate({
    update_id: 9,
    message: {
      message_id: 12,
      text: 'MacBook Pro',
      chat: { id: 12345, type: 'private' },
      from: { id: 12345, is_bot: false, first_name: 'Tester' },
      date: 123
    }
  } as TelegramUpdate);

  console.log("\n=== TEST 10: Back to Dashboard ===");
  await handler.handleUpdate({
    update_id: 10,
    callback_query: {
      id: 'cb_7',
      from: { id: 12345, is_bot: false, first_name: 'Tester' },
      message: { message_id: 100, chat: { id: 12345, type: 'private' } } as any,
      data: 'list_dash'
    }
  } as TelegramUpdate);

  console.log("\n✅ All tests completed.");
}

runTests();
