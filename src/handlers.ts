import { DBRepo } from './db';
import { TelegramBot, TelegramUpdate, InlineKeyboardMarkup } from './telegram';

export class BotHandler {
  constructor(private bot: TelegramBot, private db: DBRepo, private ai: any) {}

  async handleUpdate(update: TelegramUpdate) {
    if (update.message?.text) {
      await this.handleMessage(update.message);
    } else if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
    }
  }

  private async handleMessage(message: any) {
    const text = message.text;
    const chatId = message.chat.id;
    // const userId = message.from.id; We now scope to the chat itself!

    // Ensure the chat exists in our DB (works for both private users & groups)
    await this.db.upsertUser({ tg_id: chatId });

    // Handle Wishlist item replies
    if (message.reply_to_message?.text?.includes('gift idea for')) {
      const { decodeInvisibleId } = require('./utils');
      let bId = decodeInvisibleId(message.reply_to_message.text);

      // Legacy fallback for old un-hidden [ID:X] messages
      if (!bId) {
        const match = message.reply_to_message.text.match(/\[ID:(\d+)\]/);
        if (match) bId = parseInt(match[1]);
      }

      if (bId) {
        await this.db.addWishlistItem({
          birthday_id: bId,
          item_text: text,
          added_by_tg_id: chatId // Or message.from.id if we tracked individual users in group
        });
        await this.bot.sendMessage(chatId, `✅ Added gift idea to the wishlist! Type /list to view it.`);
        return;
      }
    }

    if (text.startsWith('/start')) {
      const isGroup = chatId < 0;
      let msg = '';
      if (isGroup) {
        msg = `🎉 <b>Welcome to the Group Birthday Bot!</b>\n\nI will help this group remember birthdays. When a birthday arrives, I'll send a reminder directly to this chat.\n\nTo get started, add a birthday by typing:\n<code>/add Name</code>`;
      } else {
        msg = `🎉 <b>Welcome to the Birthday Bot!</b>\n\nI'm your personal assistant for tracking birthdays, sending you timely reminders, and helping you generate awesome, personalized messages and GIFs! 🥂\n\n<b>How it works:</b>\n1. Add your friends' birthdays using the <b>Web App</b> or <code>/add</code>\n2. I'll silently keep track of them and send you a reminder exactly when you need it.\n3. You can click "Generate Message" or "Create GIF" right from the reminder!\n\n👇 Click below to open your Dashboard and add someone!`;
      }
      
      const keyboard = isGroup ? undefined : {
        inline_keyboard: [
          [{ text: '📱 Open Web App Dashboard', web_app: { url: `https://birthday-bot.mirmanoov.workers.dev/app` } }],
          [{ text: '❓ How it Works (Tutorial)', callback_data: `help_tutorial` }]
        ]
      };

      await this.bot.sendMessage(chatId, msg, keyboard);
    } 
    else if (text.startsWith('/help')) {
      const msg = `📖 <b>Birthday Bot Quick Guide</b>\n\nHere are the commands you can use:\n\n📱 <b>Dashboard</b>\n<code>/list</code> — Open your Dashboard to see upcoming birthdays and manage your list. This includes the beautiful Web App interface!\n\n➕ <b>Adding Birthdays</b>\n<code>/add Name</code> — Add a new birthday (e.g. <code>/add Michael</code>). The bot will prompt you for the rest.\n\n⚙️ <b>Settings</b>\n<code>/settings</code> — Change your timezone and select when you want to be reminded (e.g. 7 days before, Day-Of, etc.)\n\n🎁 <b>Gift Wishlists</b>\nYou can reply to any text in a chat with "gift idea for [ID]" to save a gift idea for that person!\n\nIf you ever get stuck, just type <code>/start</code> again!`;
      await this.bot.sendMessage(chatId, msg);
    }
    else if (text.startsWith('/admin_setup_commands')) {
      await this.bot.setMyCommands([
        { command: 'start', description: 'Start the bot or view main menu' },
        { command: 'list', description: 'Open your Dashboard to see all birthdays' },
        { command: 'add', description: 'Add a new birthday (e.g. /add Mike)' },
        { command: 'help', description: 'View the tutorial and bot capabilities' },
        { command: 'settings', description: 'Configure timezone and reminder preferences' }
      ]);
      
      const shortDesc = "Your personal assistant for tracking birthdays, sending reminders, and generating awesome messages and GIFs! 🎈";
      await this.bot.setMyShortDescription(shortDesc);
      
      const desc = "🎉 Welcome to the Birthday Bot!\n\nI'm your personal assistant for tracking birthdays and sending you timely reminders.\n\nWhat I can do:\n1. 🗓 Track your friends' birthdays\n2. 🔔 Send you a reminder before the big day\n3. 🎁 Save gift ideas\n4. ✨ Help you generate personalized Birthday messages and GIFs using AI!\n\nHit START below to begin!";
      await this.bot.setMyDescription(desc);

      await this.bot.setChatMenuButton({
        type: "web_app",
        text: "Dashboard",
        web_app: { url: `https://birthday-bot.mirmanoov.workers.dev/app` }
      });

      await this.bot.sendMessage(chatId, `✅ Bot commands, descriptions, and the Dashboard Menu Button successfully registered!`);
    }
    else if (text.startsWith('/list')) {
      const birthdays = await this.db.getBirthdaysByUser(chatId);
      const isGroup = chatId < 0;
      
      if (birthdays.length === 0) {
        await this.bot.sendMessage(chatId, `No birthdays saved for this ${isGroup ? 'group' : 'chat'} yet! Use <code>/add Name</code> to start.`);
        return;
      }

      // Import util helpers dynamically or at top. We will import at top later, for now inline require.
      const { getZodiacSign, getDaysUntilBirthday, getRelationshipIcon } = require('./utils');
      
      const currentYear = new Date().getUTCFullYear();
      
      // Calculate days remaining and sort
      const enriched = birthdays.map(b => {
        const days = getDaysUntilBirthday(b.birth_month, b.birth_day);
        const age = b.birth_year ? (currentYear - b.birth_year) : null;
        const finalAge = (age && days > 0 && b.birth_month < new Date().getUTCMonth() + 1) ? age + 1 : age; // naive age fix for next year
        return { ...b, days, finalAge, sign: getZodiacSign(b.birth_month, b.birth_day), icon: getRelationshipIcon(b.relationship) };
      });

      enriched.sort((a, b) => a.days - b.days);

      const thisWeek = enriched.filter(b => b.days <= 7);
      const next30 = enriched.filter(b => b.days > 7 && b.days <= 30);
      const laterCount = enriched.length - thisWeek.length - next30.length;

      let msg = `📅 <b>Upcoming Birthdays Dashboard</b>\n\n`;

      if (thisWeek.length > 0) {
        msg += `🚨 <b>This Week:</b>\n`;
        thisWeek.forEach(b => {
          const ageStr = b.finalAge ? ` (Turns ${b.days === 0 ? b.finalAge : b.finalAge } ${b.days===0?'today!':'soon'})` : '';
          msg += `- <b>${b.name}</b> ${b.sign} — ${b.days === 0 ? '<b>TODAY! 🎂</b>' : `in ${b.days} days`}${ageStr}\n`;
        });
        msg += `\n`;
      }

      if (next30.length > 0) {
        msg += `🗓️ <b>Next 30 Days:</b>\n`;
        next30.forEach(b => {
          msg += `- ${b.icon} <b>${b.name}</b> ${b.sign} — ${b.birth_month}/${b.birth_day}\n`;
        });
        msg += `\n`;
      }

      if (thisWeek.length === 0 && next30.length === 0) {
        msg += `<i>No birthdays coming up in the next 30 days!</i>\n\n`;
      }

      if (laterCount > 0) {
        msg += `<i>(You have ${laterCount} other birthdays saved for later this year)</i>`;
      }

      const webAppUrl = `https://birthday-bot.mirmanoov.workers.dev/app`;
      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ text: '📱 Open Web App Dashboard', web_app: { url: webAppUrl } }],
          [{ text: '🗓️ Browse all by Month', callback_data: `list_month:current` }],
          [{ text: '🛒 Gift Wishlists', callback_data: `list_wishlist:0` }, { text: '✏️ Edit / Manage', callback_data: `list_del_menu:0` }]
        ]
      };

      await this.bot.sendMessage(chatId, msg, keyboard);
    }
    else if (text.startsWith('/add')) {
      const parts = text.split(' ');
      if (parts.length < 2) {
        await this.bot.sendMessage(chatId, "Please provide a name! Example: <code>/add Mike</code>");
        return;
      }
      const name = parts.slice(1).join(' ').substring(0, 20); // Limit name length
      
      // Step 1: Ask for month
      const keyboard = this.getMonthKeyboard(name);
      await this.bot.sendMessage(chatId, `When is <b>${name}</b>'s birthday?\n\nSelect the month:`, keyboard);
    }
    else if (text.startsWith('/timezone')) {
      const user = await this.db.getUser(chatId);
      const tzOffset = user?.utc_offset_hours || 0;
      
      const keyboard = this.getTimezoneKeyboard(tzOffset);
      await this.bot.sendMessage(chatId, `🌍 <b>Timezone Settings</b>\n\nYour reminders currently send at <b>9:00 AM</b>.\nTo ensure this matches your local time, select your rough GMT offset below:\n\n<i>Current Offset: GMT${tzOffset >= 0 ? '+' : ''}${tzOffset}</i>`, keyboard);
    }
    else if (text.startsWith('/settings')) {
      const user = await this.db.getUser(chatId);
      const pref = user?.reminder_preference === 'day_of' ? 'day_of' : 'all';
      
      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ 
            text: pref === 'all' ? '✅ Full (7d, 3d, 1d, Day of)' : 'Full (7d, 3d, 1d, Day of)', 
            callback_data: `set_pref:all` 
          }],
          [{ 
            text: pref === 'day_of' ? '✅ Day of Only' : 'Day of Only', 
            callback_data: `set_pref:day_of` 
          }]
        ]
      };

      await this.bot.sendMessage(chatId, "⚙️ <b>Settings</b>\n\nChoose reminder frequency for this chat:", keyboard);
    }
    else {
      await this.bot.sendMessage(chatId, "I didn't understand that. Try <code>/start</code>, <code>/add Name</code>, <code>/list</code> or <code>/settings</code>.");
    }
  }

  private async handleCallbackQuery(query: any): Promise<void> {
    const data = query.data;
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    await this.bot.answerCallbackQuery(query.id);

    if (data.startsWith('add_m:')) {
      // User selected month -> Ask for day
      // Format: add_m:Name:Month
      const parts = data.split(':');
      const name = parts[1];
      const month = parseInt(parts[2]);

      const keyboard = this.getDayKeyboard(name, month);
      await this.bot.editMessageText(chatId, messageId, `When is <b>${name}</b>'s birthday in month <b>${month}</b>?\n\nSelect the day:`, keyboard);
    } 
    else if (data.startsWith('add_d:')) {
      // User selected day -> Ask for relationship
      // Format: add_d:Name:Month:Day
      const parts = data.split(':');
      const name = parts[1];
      const month = parts[2];
      const day = parts[3];

      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ text: '🤝 Friend', callback_data: `add_r:${name}:${month}:${day}:friend` }],
          [{ text: '👨‍👩‍👧 Family', callback_data: `add_r:${name}:${month}:${day}:family` }],
          [{ text: '💼 Colleague', callback_data: `add_r:${name}:${month}:${day}:colleague` }],
          [{ text: '❤️ Romantic', callback_data: `add_r:${name}:${month}:${day}:romantic` }]
        ]
      };
      await this.bot.editMessageText(chatId, messageId, `What is your relationship with <b>${name}</b>?`, keyboard);
    }
    else if (data.startsWith('add_r:')) {
      // Finalize saving
      // Format: add_r:Name:Month:Day:Rel
      const parts = data.split(':');
      const name = parts[1];
      const month = parseInt(parts[2]);
      const day = parseInt(parts[3]);
      const rel = parts[4];

      await this.db.addBirthday({
        user_tg_id: chatId, // Attach to the chat entity instead of individual user
        name: name,
        birth_month: month,
        birth_day: day,
        birth_year: null, // MVP: year optional/omitted for simplicity
        relationship: rel,
        reminded_phases: null
      });

      await this.bot.editMessageText(chatId, messageId, `✅ Successfully saved <b>${name}</b>'s birthday (${month}/${day})! I will remind this chat when it's time.`);
    }
    else if (data.startsWith('tpl_cat:')) {
      const parts = data.split(':');
      const bId = parseInt(parts[1]);
      const category = parts[2];
      const index = parts.length > 3 ? parseInt(parts[3]) : 0;

      const { TEMPLATES, renderTemplate } = require('./templates');
      
      const categoryTemplates = TEMPLATES[category] || [];
      if (categoryTemplates.length === 0) {
        await this.bot.answerCallbackQuery(query.id, "No templates found for this category.", true);
        return;
      }

      const safeIndex = (index >= 0 && index < categoryTemplates.length) ? index : 0;
      const tpl = categoryTemplates[safeIndex];

      const bParams = await this.db.getBirthdaysByUser(chatId, 100);
      const b = bParams.find((x: any) => x.id === bId);
      if (!b) return;

      const currentYear = new Date().getUTCFullYear();
      const renderedText = renderTemplate(tpl.text, b.name, b.birth_year);
      
      const keyboard: any[][] = [[]];
      
      if (safeIndex > 0) {
        keyboard[0].push({ text: '⬅️ Prev', callback_data: `tpl_cat:${bId}:${category}:${safeIndex - 1}` });
      }
      if (safeIndex < categoryTemplates.length - 1) {
        keyboard[0].push({ text: '➡️ Next', callback_data: `tpl_cat:${bId}:${category}:${safeIndex + 1}` });
      }

      keyboard.push([{ 
        text: `✈️ Send message (Text)`, 
        url: `https://t.me/share/url?url=${encodeURIComponent(renderedText)}` 
      }]);
      keyboard.push([{ text: `🎉 Create GIF Card`, callback_data: `tpl_gif` }]);
      keyboard.push([{ text: '🔙 Back to Categories', callback_data: `tpl_back:${bId}:${b.relationship || 'friend'}` }]);

      await this.bot.editMessageText(
        chatId, 
        messageId, 
        `📝 <b>Template ${safeIndex + 1}/${categoryTemplates.length}:</b>\n\n${renderedText}`, 
        { inline_keyboard: keyboard }
      );
    }
    else if (data.startsWith('tpl_back:')) {
      const parts = data.split(':');
      const bId = parseInt(parts[1]);
      const rel = parts[2] || 'friend';

      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ text: '🤣 Funny', callback_data: `tpl_cat:${bId}:${rel}_funny` }, { text: '❤️ Heartfelt', callback_data: `tpl_cat:${bId}:${rel}_heartfelt` }],
          [{ text: '🤝 Professional', callback_data: `tpl_cat:${bId}:${rel}_colleague` }, { text: '👨‍👩‍👧 Family', callback_data: `tpl_cat:${bId}:${rel}_family` }],
          [{ text: '✨ Try AI Generator', callback_data: `ai_gen:${bId}:${rel}` }],
          [{ text: 'browse all ' + rel + ' templates', callback_data: `tpl_cat:${bId}:${rel}` }]
        ]
      };

      await this.bot.editMessageText(chatId, messageId, `<i>Choose a message template category:</i>`, keyboard);
    }
    else if (data.startsWith('ai_gen:')) {
      const parts = data.split(':');
      const bId = parseInt(parts[1]);
      const rel = parts[2] || 'friend';

      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ text: '🤣 Make it Funny', callback_data: `ai_exec:${bId}:${rel}:funny` }],
          [{ text: '❤️ Make it Heartfelt', callback_data: `ai_exec:${bId}:${rel}:heartfelt` }],
          [{ text: '🤝 Make it Professional', callback_data: `ai_exec:${bId}:${rel}:professional` }],
          [{ text: '🔙 Back to Categories', callback_data: `tpl_back:${bId}:${rel}` }]
        ]
      };

      await this.bot.editMessageText(
        chatId, 
        messageId, 
        `✨ <b>AI Template Generator</b>\n\nI can write a custom birthday message for you! What kind of vibe are you going for?`, 
        keyboard
      );
    }
    else if (data.startsWith('ai_exec:')) {
      const parts = data.split(':');
      const bId = parseInt(parts[1]);
      const rel = parts[2] || 'friend';
      const vibe = parts[3] || 'funny'; // funny, heartfelt, professional

      // Immediately show loading state
      const loadingKeyboard: InlineKeyboardMarkup = {
        inline_keyboard: [[{ text: '⏳ Generating...', callback_data: `noop` }]]
      };
      await this.bot.editMessageText(chatId, messageId, `🧠 <i>AI is writing your message...</i>`, loadingKeyboard);

      const bParams = await this.db.getBirthdaysByUser(chatId, 100);
      const b = bParams.find((x: any) => x.id === bId);
      if (!b) return;

      const currentYear = new Date().getUTCFullYear();
      const ageStr = b.birth_year ? `They are turning ${currentYear - b.birth_year} years old.` : '';

      const prompt = `Write a short, ${vibe}, and engaging happy birthday message for my ${rel} named ${b.name}. ${ageStr} Do not include placeholders like [Your Name]. Just write the message directly. Keep it to 2-3 sentences max.`;

      try {
        // Use Cloudflare Workers AI with Meta Llama 2
        // We use the recommended text generation model
        const response = await this.ai.run('@cf/meta/llama-2-7b-chat-int8', {
            messages: [
                { role: 'system', content: 'You are a helpful assistant that writes perfect, natural-sounding birthday greetings.' },
                { role: 'user', content: prompt }
            ]
        });

        // The exact structure of response depends on the model. For llama chat models it's typically response.response
        let generatedText = response.response || "Happy Birthday!";
        // Clean up quotes if the AI wrapped it
        generatedText = generatedText.replace(/^["']|["']$/g, '').trim();

        const keyboard: any[][] = [
          [{ text: '🔄 Regenerate', callback_data: `ai_exec:${bId}:${rel}:${vibe}` }],
          [{ text: `✈️ Send message (Text)`, url: `https://t.me/share/url?url=${encodeURIComponent(generatedText)}` }],
          [{ text: `🎉 Create GIF Card`, callback_data: `tpl_gif` }],
          [{ text: '🔙 Change Vibe', callback_data: `ai_gen:${bId}:${rel}` }],
          [{ text: '🔙 Dashboard', callback_data: `list_dash` }]
        ];

        await this.bot.editMessageText(
          chatId, 
          messageId, 
          `✨ <b>AI Generated Greeting:</b>\n\n${generatedText}`, 
          { inline_keyboard: keyboard }
        );

      } catch (err: any) {
        // Fallback
        const kb: InlineKeyboardMarkup = {
          inline_keyboard: [[{ text: '🔙 Back to Categories', callback_data: `tpl_back:${bId}:${rel}` }]]
        };
        await this.bot.editMessageText(chatId, messageId, `❌ Sorry, the AI encountered an error generating your message. Please try again or use standard templates.\n\nError: ${err.message}`, kb);
      }
    }
    else if (data === 'tpl_gif') {
      const rawText = query.message.text || '';
      const parts = rawText.split('\n\n');
      const captionText = parts.length > 1 ? parts.slice(1).join('\n\n') : rawText;

      const gifs = [
        "https://media.tenor.com/CGB-TzH25U4AAAAC/happy-birthday.gif",
        "https://media.tenor.com/i98s985D0RkAAAAC/happy-birthday.gif",
        "https://media.tenor.com/GfU72p-lJxgAAAAC/happy-birthday-steve-carell.gif",
        "https://media.tenor.com/Z4T-rXj0u7oAAAAC/happy-birthday-the-office.gif",
        "https://media.tenor.com/-d1t_7TjDEQAAAAC/michael-scott-the-office.gif"
      ];
      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      await this.bot.sendAnimation(chatId, randomGif, captionText);
      await this.bot.answerCallbackQuery(query.id, "GIF Card created! Forward it to your friend!", false);
    }
    else if (data.startsWith('set_pref:')) {
      const pref = data.split(':')[1];
      
      await this.db.upsertUser({ tg_id: chatId, reminder_preference: pref });
      
      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ 
            text: pref === 'all' ? '✅ Full (7d, 3d, 1d, Day of)' : 'Full (7d, 3d, 1d, Day of)', 
            callback_data: `set_pref:all` 
          }],
          [{ 
            text: pref === 'day_of' ? '✅ Day of Only' : 'Day of Only', 
            callback_data: `set_pref:day_of` 
          }]
        ]
      };

      await this.bot.editMessageText(chatId, messageId, "⚙️ <b>Settings</b>\n\nReminder frequency updated for this chat:", keyboard);
    }
    else if (data.startsWith('set_tz:')) {
      const offset = parseInt(data.split(':')[1]);
      
      await this.db.upsertUser({ tg_id: chatId, utc_offset_hours: offset });
      
      const keyboard = this.getTimezoneKeyboard(offset);
      await this.bot.editMessageText(
        chatId, 
        messageId, 
        `🌍 <b>Timezone Settings</b>\n\nYour reminders currently send at <b>9:00 AM</b>.\nTo ensure this matches your local time, select your rough GMT offset below:\n\n<i>Current Offset: GMT${offset >= 0 ? '+' : ''}${offset}</i>\n\n✅ <b>Saved!</b>`, 
        keyboard
      );
    }
    else if (data.startsWith('list_month:')) {
      const parts = data.split(':');
      let targetMonth = parts[1] === 'current' ? (new Date().getUTCMonth() + 1) : parseInt(parts[1]);
      
      if (targetMonth < 1) targetMonth = 12;
      if (targetMonth > 12) targetMonth = 1;

      const birthdays = await this.db.getBirthdaysByUser(chatId);
      const monthBirthdays = birthdays.filter(b => b.birth_month === targetMonth);
      
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const { getZodiacSign, getRelationshipIcon } = require('./utils');

      let msg = `📅 <b>Birthdays in ${monthNames[targetMonth-1]}</b>\n\n`;
      
      if (monthBirthdays.length === 0) {
        msg += `<i>No birthdays saved for this month.</i>`;
      } else {
        monthBirthdays.sort((a, b) => a.birth_day - b.birth_day);
        monthBirthdays.forEach(b => {
          msg += `- ${b.birth_month}/${b.birth_day}: ${getRelationshipIcon(b.relationship)} <b>${b.name}</b> ${getZodiacSign(b.birth_month, b.birth_day)}\n`;
        });
      }

      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [
            { text: `⬅️ ${monthNames[targetMonth === 1 ? 11 : targetMonth-2]}`, callback_data: `list_month:${targetMonth - 1}` },
            { text: `${monthNames[targetMonth === 12 ? 0 : targetMonth]} ➡️`, callback_data: `list_month:${targetMonth + 1}` }
          ],
          [{ text: '🔙 Back to Dashboard', callback_data: `list_dash` }]
        ]
      };

      await this.bot.editMessageText(chatId, messageId, msg, keyboard);
    }
    else if (data === 'help_tutorial') {
      const msg = `📖 <b>Birthday Bot Quick Guide</b>\n\nHere are the commands you can use:\n\n📱 <b>Dashboard</b>\n<code>/list</code> — Open your Dashboard to see upcoming birthdays and manage your list. This includes the beautiful Web App interface!\n\n➕ <b>Adding Birthdays</b>\n<code>/add Name</code> — Add a new birthday (e.g. <code>/add Michael</code>). The bot will prompt you for the rest.\n\n⚙️ <b>Settings</b>\n<code>/settings</code> — Change your timezone and select when you want to be reminded (e.g. 7 days before, Day-Of, etc.)\n\n🎁 <b>Gift Wishlists</b>\nYou can reply to any text in a chat with "gift idea for [ID]" to save a gift idea for that person!\n\nIf you ever get stuck, just type <code>/start</code> again!`;
      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: `list_dash` }]]
      };
      await this.bot.editMessageText(chatId, messageId, msg, keyboard);
    }
    else if (data === 'list_dash') {
      // essentially mock a /list command by re-rendering the same thing inline
      // Clean up the old inline message to prevent clutter
      // Technically telegram doesn't let bots easily delete messages without full rights, 
      // but we can just use the existing logic to edit it instead! Let's re-run the logic here
      const birthdays = await this.db.getBirthdaysByUser(chatId);
      const isGroup = chatId < 0;
      
      const { getZodiacSign, getDaysUntilBirthday, getRelationshipIcon } = require('./utils');
      const currentYear = new Date().getUTCFullYear();
      
      const enriched = birthdays.map(b => {
        const days = getDaysUntilBirthday(b.birth_month, b.birth_day);
        const age = b.birth_year ? (currentYear - b.birth_year) : null;
        return { ...b, days, sign: getZodiacSign(b.birth_month, b.birth_day), icon: getRelationshipIcon(b.relationship) };
      });

      enriched.sort((a, b) => a.days - b.days);

      const thisWeek = enriched.filter(b => b.days <= 7);
      const next30 = enriched.filter(b => b.days > 7 && b.days <= 30);
      const laterCount = enriched.length - thisWeek.length - next30.length;

      let msg = `📅 <b>Upcoming Birthdays Dashboard</b>\n\n`;

      if (thisWeek.length > 0) {
        msg += `🚨 <b>This Week:</b>\n`;
        thisWeek.forEach(b => {
          msg += `- <b>${b.name}</b> ${b.sign} — ${b.days === 0 ? '<b>TODAY! 🎂</b>' : `in ${b.days} days`}\n`;
        });
        msg += `\n`;
      }

      if (next30.length > 0) {
        msg += `🗓️ <b>Next 30 Days:</b>\n`;
        next30.forEach(b => {
          msg += `- ${b.icon} <b>${b.name}</b> ${b.sign} — ${b.birth_month}/${b.birth_day}\n`;
        });
        msg += `\n`;
      }

      if (thisWeek.length === 0 && next30.length === 0) {
        msg += `<i>No birthdays coming up in the next 30 days!</i>\n\n`;
      }

      if (laterCount > 0) {
        msg += `<i>(You have ${laterCount} other birthdays saved for later this year)</i>`;
      }

      const webAppUrl = `https://birthday-bot.mirmanoov.workers.dev/app`;
      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ text: '📱 Open Web App Dashboard', web_app: { url: webAppUrl } }],
          [{ text: '🗓️ Browse all by Month', callback_data: `list_month:current` }],
          [{ text: '🛒 Gift Wishlists', callback_data: `list_wishlist:0` }, { text: '✏️ Edit / Manage', callback_data: `list_del_menu:0` }]
        ]
      };

      await this.bot.editMessageText(chatId, messageId, msg, keyboard);
    }
    else if (data.startsWith('list_del_menu:')) {
      const parts = data.split(':');
      let page = parseInt(parts[1]) || 0;
      
      const birthdays = await this.db.getBirthdaysByUser(chatId);
      const isGroup = chatId < 0;

      if (birthdays.length === 0) {
        await this.bot.editMessageText(chatId, messageId, `No birthdays saved for this ${isGroup ? 'group' : 'chat'} yet!`);
        return;
      }

      // Sort alphabetically for easier finding
      birthdays.sort((a, b) => a.name.localeCompare(b.name));

      const ITEMS_PER_PAGE = 5;
      const totalPages = Math.ceil(birthdays.length / ITEMS_PER_PAGE);
      if (page < 0) page = totalPages - 1;
      if (page >= totalPages) page = 0;

      const pageItems = birthdays.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

      let msg = `✏️ <b>Manage Saved Birthdays</b> (Page ${page + 1}/${totalPages})\n\nClick a name below to permanently delete their reminder:`;

      const keyboard: InlineKeyboardMarkup = { inline_keyboard: [] };

      // Add a button for each person on this page
      pageItems.forEach(b => {
        keyboard.inline_keyboard.push([{ text: `⚙️ Manage ${b.name}`, callback_data: `manage_bday:${b.id}:${page}` }]);
      });

      // Pagination controls
      const navRow = [];
      if (totalPages > 1) {
        navRow.push({ text: '⬅️ Prev', callback_data: `list_del_menu:${page - 1}` });
        navRow.push({ text: 'Next ➡️', callback_data: `list_del_menu:${page + 1}` });
        keyboard.inline_keyboard.push(navRow);
      }

      keyboard.inline_keyboard.push([{ text: '🔙 Back to Dashboard', callback_data: `list_dash` }]);

      await this.bot.editMessageText(chatId, messageId, msg, keyboard);
    }
    else if (data.startsWith('manage_bday:')) {
      const parts = data.split(':');
      const bId = parseInt(parts[1]);
      const page = parts[2] || '0';

      const birthdays = await this.db.getBirthdaysByUser(chatId, 100);
      const b = birthdays.find((x: any) => x.id === bId);
      if (!b) return;

      const rel = b.relationship || 'friend';
      const { TEMPLATES } = require('./templates');
      const hasTemplates = !!TEMPLATES[rel];

      let msg = `⚙️ <b>Manage Profile: ${b.name}</b>\n\nWhat would you like to do?`;
      
      const keyboard: InlineKeyboardMarkup = { inline_keyboard: [] };
      keyboard.inline_keyboard.push([{ text: '🛒 Wishlist Ideas', callback_data: `wishlist_view:${b.id}` }]);
      
      if (hasTemplates) {
        keyboard.inline_keyboard.push([{ text: '💌 Generate Card', callback_data: `tpl_cat:${b.id}:${rel}` }]);
      }
      
      keyboard.inline_keyboard.push([{ text: `❌ Delete Reminder`, callback_data: `list_del_confirm:${b.id}:${page}` }]);
      keyboard.inline_keyboard.push([{ text: '🔙 Back', callback_data: `list_del_menu:${page}` }]);

      await this.bot.editMessageText(chatId, messageId, msg, keyboard);
    }
    else if (data.startsWith('list_wishlist:')) {
      const parts = data.split(':');
      let page = parseInt(parts[1]) || 0;
      
      const birthdays = await this.db.getBirthdaysByUser(chatId);
      const isGroup = chatId < 0;

      if (birthdays.length === 0) {
        await this.bot.editMessageText(chatId, messageId, `No birthdays saved for this ${isGroup ? 'group' : 'chat'} yet!`);
        return;
      }

      birthdays.sort((a, b) => a.name.localeCompare(b.name));

      const ITEMS_PER_PAGE = 5;
      const totalPages = Math.ceil(birthdays.length / ITEMS_PER_PAGE);
      if (page < 0) page = totalPages - 1;
      if (page >= totalPages) page = 0;

      const pageItems = birthdays.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

      let msg = `🛒 <b>Gift Wishlists</b> (Page ${page + 1}/${totalPages})\n\nSelect a person to view or add ideas for their birthday gift:`;

      const keyboard: InlineKeyboardMarkup = { inline_keyboard: [] };
      pageItems.forEach(b => {
        keyboard.inline_keyboard.push([{ text: `🎁 ${b.name}'s Wishlist`, callback_data: `wishlist_view:${b.id}` }]);
      });

      const navRow = [];
      if (totalPages > 1) {
        navRow.push({ text: '⬅️ Prev', callback_data: `list_wishlist:${page - 1}` });
        navRow.push({ text: 'Next ➡️', callback_data: `list_wishlist:${page + 1}` });
        keyboard.inline_keyboard.push(navRow);
      }

      keyboard.inline_keyboard.push([{ text: '🔙 Back to Dashboard', callback_data: `list_dash` }]);
      await this.bot.editMessageText(chatId, messageId, msg, keyboard);
    }
    else if (data.startsWith('wishlist_view:')) {
      const bId = parseInt(data.split(':')[1]);
      const birthdays = await this.db.getBirthdaysByUser(chatId, 100);
      const b = birthdays.find((x: any) => x.id === bId);
      if (!b) return;

      const items = await this.db.getWishlist(bId);
      let msg = `🛒 <b>${b.name}'s Gift Wishlist</b>\n\n`;

      if (items.length === 0) {
        msg += `<i>No gift ideas saved yet!</i>`;
      } else {
        items.forEach((item, idx) => {
          msg += `<b>${idx + 1}.</b> ${item.item_text}\n`;
        });
      }

      const keyboard: InlineKeyboardMarkup = { inline_keyboard: [] };
      
      if (items.length > 0) {
        const deleteRow = items.map((item, idx) => ({
          text: `❌ ${idx + 1}`,
          callback_data: `wishlist_del:${b.id}:${item.id}`
        }));
        for (let i = 0; i < deleteRow.length; i += 5) {
          keyboard.inline_keyboard.push(deleteRow.slice(i, i + 5));
        }
      }

      keyboard.inline_keyboard.push([{ text: '➕ Add Idea', callback_data: `wishlist_add:${b.id}` }]);
      keyboard.inline_keyboard.push([{ text: '🔙 Back to Wishlists', callback_data: `list_wishlist:0` }]);

      await this.bot.editMessageText(chatId, messageId, msg, keyboard);
    }
    else if (data.startsWith('wishlist_add:')) {
      const bId = parseInt(data.split(':')[1]);
      const birthdays = await this.db.getBirthdaysByUser(chatId, 100);
      const b = birthdays.find((x: any) => x.id === bId);
      if (!b) return;

      const { encodeInvisibleId } = require('./utils');
      const hiddenId = encodeInvisibleId(b.id);

      await this.bot.sendMessage(chatId, `Reply to this message with a gift idea for <b>${b.name}</b>:${hiddenId}`, {
        reply_markup: { force_reply: true, selective: true }
      });
      await this.bot.answerCallbackQuery(query.id);
      return;
    }
    else if (data.startsWith('wishlist_del:')) {
      const parts = data.split(':');
      const bId = parseInt(parts[1]);
      const itemId = parseInt(parts[2]);
      
      await this.db.deleteWishlistItem(itemId, bId);
      
      query.data = `wishlist_view:${bId}`;
      return this.handleCallbackQuery(query);
    }
    else if (data.startsWith('list_del_confirm:')) {
      const parts = data.split(':');
      const bId = parseInt(parts[1]);
      const page = parts[2];

      const birthdays = await this.db.getBirthdaysByUser(chatId, 100);
      const b = birthdays.find((x: any) => x.id === bId);

      if (!b) {
        await this.bot.answerCallbackQuery(query.id, "Birthday not found!", true);
        return;
      }

      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [
            { text: '⚠️ YES, Delete', callback_data: `list_del_exec:${bId}:${page}` },
            { text: 'Cancel', callback_data: `list_del_menu:${page}` }
          ]
        ]
      };

      await this.bot.editMessageText(chatId, messageId, `Are you sure you want to permanently delete the reminder for <b>${b.name}</b>?`, keyboard);
    }
    else if (data.startsWith('list_del_exec:')) {
      const parts = data.split(':');
      const bId = parseInt(parts[1]);
      const page = parts[2];

      await this.db.deleteBirthday(bId, chatId);
      await this.bot.answerCallbackQuery(query.id, "✅ Birthday deleted.", false);
      
      // Auto-return to the menu
      // Manually trigger the callback logic again to refresh
      query.data = `list_del_menu:${page}`;
      await this.handleCallbackQuery(query);
    }
  }

  private getMonthKeyboard(name: string): InlineKeyboardMarkup {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const keyboard: any[][] = [];
    for (let i = 0; i < 12; i += 4) {
      const row = [];
      for (let j = 0; j < 4; j++) {
        row.push({ text: months[i+j], callback_data: `add_m:${name}:${i+j+1}` });
      }
      keyboard.push(row);
    }
    return { inline_keyboard: keyboard };
  }

  private getDayKeyboard(name: string, month: number): InlineKeyboardMarkup {
    // simplified 31 days for UI
    const keyboard: any[][] = [];
    let row: any[] = [];
    for (let i = 1; i <= 31; i++) {
      row.push({ text: i.toString(), callback_data: `add_d:${name}:${month}:${i}` });
      if (row.length === 5 || i === 31) {
        keyboard.push(row);
        row = [];
      }
    }
    return { inline_keyboard: keyboard };
  }

  private getTimezoneKeyboard(currentOffset: number): InlineKeyboardMarkup {
    const keyboard: any[][] = [];
    
    // Most common offsets from GMT-12 to GMT+14
    // We'll organize them in rows of 3
    const offsets = [-12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    
    let row: any[] = [];
    for (const offset of offsets) {
      const isCurrent = offset === currentOffset;
      const label = `${isCurrent ? '✅ ' : ''}GMT${offset >= 0 ? '+' : ''}${offset}`;
      row.push({ text: label, callback_data: `set_tz:${offset}` });
      
      if (row.length === 3) {
        keyboard.push(row);
        row = [];
      }
    }
    if (row.length > 0) keyboard.push(row);

    return { inline_keyboard: keyboard };
  }
}
