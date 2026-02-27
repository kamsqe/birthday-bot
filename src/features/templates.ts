import { TelegramBot } from '../telegram';
import { DBRepo } from '../db';
import { Messages } from '../ui/messages';
import { Keyboards } from '../ui/keyboards';
import { TEMPLATES, renderTemplate } from '../templates';
import { AIService } from '../services/ai';

export class TemplateController {

  static async categoryBrowser(bot: TelegramBot, chatId: number, messageId: number, parts: string[]) {
    const bId = parseInt(parts[1]);
    const rel = parts[2] || 'friend';
    await bot.editMessageText(chatId, messageId, Messages.templateCategories(), Keyboards.templateCategories(bId, rel));
  }

  static async viewTemplate(bot: TelegramBot, db: DBRepo, queryId: string, chatId: number, messageId: number, parts: string[]) {
    const bId = parseInt(parts[1]);
    const category = parts[2];
    const index = parts.length > 3 ? parseInt(parts[3]) : 0;
    
    const categoryTemplates = TEMPLATES[category] || [];
    if (categoryTemplates.length === 0) {
      await bot.answerCallbackQuery(queryId, "No templates found for this category.", true);
      return;
    }

    const safeIndex = (index >= 0 && index < categoryTemplates.length) ? index : 0;
    const tpl = categoryTemplates[safeIndex];

    const b = (await db.getBirthdaysByUser(chatId, 100)).find((x: any) => x.id === bId);
    if (!b) return;

    const renderedText = renderTemplate(tpl.text, b.name, b.birth_year);
    const rel = b.relationship || (category.split('_')[0]) || 'friend';

    await bot.editMessageText(
      chatId, 
      messageId, 
      Messages.templateView(safeIndex, categoryTemplates.length, renderedText), 
      Keyboards.templatePaginator(bId, category, safeIndex, categoryTemplates.length, renderedText, rel)
    );
  }

  static async aiPrompt(bot: TelegramBot, chatId: number, messageId: number, parts: string[]) {
    const bId = parseInt(parts[1]);
    const rel = parts[2] || 'friend';
    await bot.editMessageText(chatId, messageId, Messages.aiPrompt(), Keyboards.aiVibePicker(bId, rel));
  }

  static async aiExecute(bot: TelegramBot, db: DBRepo, aiBinding: any, chatId: number, messageId: number, parts: string[]) {
    const bId = parseInt(parts[1]);
    const rel = parts[2] || 'friend';
    const vibe = parts[3] || 'funny';

    // Show loading state immediately
    await bot.editMessageText(chatId, messageId, Messages.aiLoading(), Keyboards.aiLoading());

    const b = (await db.getBirthdaysByUser(chatId, 100)).find((x: any) => x.id === bId);
    if (!b) return;

    const currentYear = new Date().getUTCFullYear();
    const ageStr = b.birth_year ? `They are turning ${currentYear - b.birth_year} years old.` : '';

    const aiService = new AIService(aiBinding);

    try {
      const generatedText = await aiService.generateBirthdayMessage(b.name, ageStr, rel, vibe);
      await bot.editMessageText(
        chatId, 
        messageId, 
        Messages.aiResult(generatedText), 
        Keyboards.aiResult(bId, rel, vibe, generatedText)
      );
    } catch (err: any) {
      const kb = { inline_keyboard: [[{ text: '🔙 Back to Categories', callback_data: `tpl_back:${bId}:${rel}` }]] };
      await bot.editMessageText(chatId, messageId, `❌ ${err.message}`, kb);
    }
  }

  static async generateGif(bot: TelegramBot, rawText: string, chatId: number, messageId: number, parts: string[]) {
    const gifBId = parseInt(parts[1]) || 0;
    const gifRel = parts[2] || 'friend';

    const textParts = rawText.split('\n\n');
    let captionText = textParts.length > 1 ? textParts.slice(1).join('\n\n') : rawText;
    captionText = captionText.replace(/<[^>]*>/g, '').trim();

    const gifs = [
      "https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif",
      "https://media.giphy.com/media/WRL7YgP42OKns6BSzV/giphy.gif",
      "https://media.giphy.com/media/xUOwFZmWFBGJrIYLe0/giphy.gif",
      "https://media.giphy.com/media/l4KhS0BOFBhU2SYIU/giphy.gif",
      "https://media.giphy.com/media/3ohs4lclWYOoT0FRTW/giphy.gif"
    ];
    const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

    const kb = Keyboards.gifCard(gifBId, gifRel);

    try {
      await bot.sendAnimation(chatId, randomGif, captionText);
      await bot.sendMessage(chatId, Messages.gifSuccess(), kb);
    } catch (err: any) {
      await bot.sendMessage(chatId, Messages.gifFallback(captionText), kb);
    }
  }
}
