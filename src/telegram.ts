export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  reply_to_message?: TelegramMessage;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  inline_message_id?: string;
  data?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
  web_app?: { url: string };
}

export class TelegramBot {
  constructor(private token: string) {}

  private async callApi(method: string, payload: any): Promise<any> {
    const url = `https://api.telegram.org/bot${this.token}/${method}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        console.error(`Telegram API Error (${method}):`, await response.text());
        throw new Error(`Telegram API Call failed: ${method}`);
    }
    
    return response.json();
  }

  async sendMessage(chatId: number, text: string, replyMarkup?: any) {
    return this.callApi('sendMessage', {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup
    });
  }

  async sendAnimation(chatId: number, animation: string, caption?: string, replyMarkup?: any) {
    return this.callApi('sendAnimation', {
      chat_id: chatId,
      animation: animation,
      caption: caption,
      parse_mode: 'HTML',
      reply_markup: replyMarkup
    });
  }

  async editMessageText(chatId: number, messageId: number, text: string, replyMarkup?: InlineKeyboardMarkup) {
    return this.callApi('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup
    });
  }

  async setMyCommands(commands: { command: string, description: string }[]) {
    return this.callApi('setMyCommands', { commands });
  }

  async setMyDescription(description: string, languageCode?: string) {
    return this.callApi('setMyDescription', { description, language_code: languageCode });
  }

  async setMyShortDescription(shortDescription: string, languageCode?: string) {
    return this.callApi('setMyShortDescription', { short_description: shortDescription, language_code: languageCode });
  }

  async setChatMenuButton(menuButton: any) {
    return this.callApi('setChatMenuButton', { menu_button: menuButton });
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string, showAlert = false) {
    return this.callApi('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: showAlert
    });
  }
}
