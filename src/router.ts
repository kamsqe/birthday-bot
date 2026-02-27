import { TelegramBot, TelegramUpdate } from './telegram';
import { DBRepo } from './db';
import { OnboardingController } from './features/onboarding';
import { DashboardController } from './features/dashboard';
import { ManageController } from './features/manage';
import { TemplateController } from './features/templates';
import { WishlistController } from './features/wishlist';

export class Router {
  constructor(
    private bot: TelegramBot, 
    private db: DBRepo,
    private ai: any
  ) {}

  async handleUpdate(update: TelegramUpdate) {
    if (update.message?.text) {
      await this.handleMessage(update.message);
    } else if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
    }
  }

  private async handleMessage(message: any) {
    let text = message.text || '';
    const chatId = message.chat.id;
    const isGroup = chatId < 0;
    const userId = message.from?.id || chatId;

    if (text.startsWith('/')) {
      text = text.split('@')[0];
    }

    await this.db.upsertUser({ tg_id: chatId });

    // Global State Check (Wishlist fallback)
    const stateKey = isGroup ? userId : chatId;
    const chatState = await this.db.getChatState(stateKey);
    if (chatState && text && !text.startsWith('/')) {
      if (chatState.state === 'awaiting_wishlist') {
        return WishlistController.handleWishlistReply(this.bot, this.db, chatId, userId, text, chatState.data, stateKey);
      }
    }

    if (isGroup && message.reply_to_message?.from?.is_bot && !text.startsWith('/')) {
      return; 
    }

    if (isGroup && !text.startsWith('/')) return;

    if (text.startsWith('/start')) {
      return OnboardingController.start(this.bot, chatId, isGroup);
    }
    if (text.startsWith('/help')) {
      return OnboardingController.help(this.bot, chatId);
    }
    if (text.startsWith('/admin_setup_commands')) {
      return OnboardingController.adminSetup(this.bot, chatId);
    }
    if (text.startsWith('/list')) {
      return DashboardController.list(this.bot, this.db, chatId, isGroup);
    }
    if (text.startsWith('/add')) {
      return OnboardingController.addBirthday(this.bot, chatId, text);
    }
    if (text.startsWith('/timezone')) {
      return OnboardingController.timezoneParams(this.bot, this.db, chatId);
    }
    if (text.startsWith('/settings')) {
      return OnboardingController.settings(this.bot, this.db, chatId);
    }

    if (!isGroup) {
      await this.bot.sendMessage(chatId, "I didn't understand that. Try <code>/start</code>, <code>/add Name</code>, <code>/list</code> or <code>/settings</code>.");
    }
  }

  private async handleCallbackQuery(query: any): Promise<void> {
    const data = query.data;
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const isGroup = chatId < 0;

    // Acknowledge the callback hit immediately to prevent loading spinners
    await this.bot.answerCallbackQuery(query.id);

    const parts = data.split(':');
    const action = parts[0];

    try {
      switch (action) {
        // --- ONBOARDING & SETTINGS ---
        case 'add_m':
          return OnboardingController.addMonth(this.bot, chatId, messageId, parts);
        case 'add_d':
          return OnboardingController.addDay(this.bot, chatId, messageId, parts);
        case 'add_r':
          return OnboardingController.addRelation(this.bot, this.db, chatId, messageId, parts);
        case 'set_pref':
          return OnboardingController.setPreference(this.bot, this.db, chatId, messageId, parts);
        case 'set_tz':
          return OnboardingController.setTimezone(this.bot, this.db, chatId, messageId, parts);
        case 'help_tutorial':
          return OnboardingController.helpInline(this.bot, chatId, messageId);

        // --- DASHBOARD ---
        case 'list_dash':
          return DashboardController.listInline(this.bot, this.db, chatId, messageId, isGroup);
        case 'list_month':
          return DashboardController.listByMonth(this.bot, this.db, chatId, messageId, parts);

        // --- MANAGE ---
        case 'list_del_menu':
          return ManageController.manageBrowser(this.bot, this.db, chatId, messageId, isGroup, parts);
        case 'manage_bday':
          return ManageController.manageProfile(this.bot, this.db, chatId, messageId, parts);
        case 'list_del_confirm':
          return ManageController.deleteConfirm(this.bot, this.db, chatId, messageId, parts);
        case 'list_del_exec':
          return ManageController.deleteExecute(this.bot, this.db, chatId, messageId, parts, query.id);

        // --- WISHLIST ---
        case 'list_wishlist':
          return WishlistController.browser(this.bot, this.db, chatId, messageId, isGroup, parts);
        case 'wishlist_view':
          return WishlistController.view(this.bot, this.db, chatId, messageId, parts);
        case 'wishlist_add':
          return WishlistController.promptAdd(this.bot, this.db, chatId, messageId, query.from.id, isGroup, parts);
        case 'wishlist_del':
          return WishlistController.deleteItem(this.bot, this.db, query, parts);

        // --- TEMPLATES & AI ---
        case 'tpl_back':
          return TemplateController.categoryBrowser(this.bot, chatId, messageId, parts);
        case 'tpl_cat':
          return TemplateController.viewTemplate(this.bot, this.db, query.id, chatId, messageId, parts);
        case 'tpl_gif':
          return TemplateController.generateGif(this.bot, query.message.text, chatId, messageId, parts);
        case 'ai_gen':
          return TemplateController.aiPrompt(this.bot, chatId, messageId, parts);
        case 'ai_exec':
          return TemplateController.aiExecute(this.bot, this.db, this.ai, chatId, messageId, parts);
          
        case 'noop':
          return;
          
        default:
          console.log(`Unknown routed action: ${action}`);
      }
    } catch (e: any) {
      console.error(`Route Error [${data}]:`, e);
      // Failsafe error toast
      await this.bot.sendMessage(chatId, `❌ An error occurred processing this action. Try again.`);
    }
  }
}
