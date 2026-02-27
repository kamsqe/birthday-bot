import { Birthday } from '../db';
import { getZodiacSign, getRelationshipIcon } from '../utils';

export class Messages {
  static welcome(isGroup: boolean): string {
    if (isGroup) {
      return `🎉 <b>Welcome to the Group Birthday Bot!</b>\n\nI will help this group remember birthdays. When a birthday arrives, I'll send a reminder directly to this chat.\n\n<b>Commands:</b>\n<code>/add Name</code> — Add a birthday\n<code>/list</code> — View all birthdays\n<code>/settings</code> — Configure reminders\n<code>/help</code> — Full guide`;
    }
    return `🎉 <b>Welcome to the Birthday Bot!</b>\n\nI'm your personal assistant for tracking birthdays, sending you timely reminders, and helping you generate awesome, personalized messages and GIFs! 🥂\n\n<b>How it works:</b>\n1. Add your friends' birthdays using <code>/add Name</code>\n2. I'll silently keep track of them and send you reminders\n3. Use <b>Edit / Manage</b> to generate messages, GIFs, and save gift ideas!\n\n👇 Try the commands below to get started!`;
  }

  static help(): string {
    return `📖 <b>Birthday Bot Quick Guide</b>\n\nHere are the commands you can use:\n\n📋 <b>Dashboard</b>\n<code>/list</code> — See upcoming birthdays with manage options\n\n➕ <b>Adding Birthdays</b>\n<code>/add Name</code> — Add a new birthday (e.g. <code>/add Michael</code>)\n\n⚙️ <b>Settings</b>\n<code>/settings</code> — Change timezone and reminder frequency\n\n🎁 <b>Gift Wishlists</b>\nUse <b>Edit / Manage → Wishlist Ideas → ➕ Add Idea</b> from the /list menu to save gift ideas for each person.\n\n💌 <b>Message Templates & AI</b>\nUse <b>Edit / Manage → Message Templates</b> to browse pre-written messages, or <b>AI Generator</b> to create a custom one!\n\n🎉 <b>GIF Cards</b>\nGenerate a birthday GIF from the templates menu — forward it to your friend!\n\nType <code>/start</code> anytime to see the welcome screen.`;
  }

  static dashboard(thisWeek: any[], next30: any[], laterCount: number, isGroup: boolean): string {
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

    return msg;
  }

  static emptyDashboard(isGroup: boolean): string {
    return `No birthdays saved for this ${isGroup ? 'group' : 'chat'} yet! Use <code>/add Name</code> to start.`;
  }

  static monthList(monthBirthdays: Birthday[], targetMonth: number): string {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let msg = `📅 <b>Birthdays in ${monthNames[targetMonth-1]}</b>\n\n`;
    
    if (monthBirthdays.length === 0) {
      msg += `<i>No birthdays saved for this month.</i>`;
    } else {
      monthBirthdays.forEach(b => {
        msg += `- ${b.birth_month}/${b.birth_day}: ${getRelationshipIcon(b.relationship)} <b>${b.name}</b> ${getZodiacSign(b.birth_month, b.birth_day)}\n`;
      });
    }
    return msg;
  }

  static manageList(pageItems: Birthday[], page: number, totalPages: number): string {
    return `✏️ <b>Manage Saved Birthdays</b> (Page ${page + 1}/${totalPages})\n\nClick a name below to permanently delete their reminder:`;
  }

  static manageProfile(b: Birthday): string {
    return `⚙️ <b>Manage Profile: ${b.name}</b>\n\nWhat would you like to do?`;
  }

  static wishlistMenu(totalPages: number, page: number): string {
    return `🛒 <b>Gift Wishlists</b> (Page ${page + 1}/${totalPages})\n\nSelect a person to view or add ideas for their birthday gift:`;
  }

  static wishlistView(b: Birthday, items: any[]): string {
    let msg = `🛒 <b>${b.name}'s Gift Wishlist</b>\n\n`;
    if (items.length === 0) {
      msg += `<i>No gift ideas saved yet!</i>`;
    } else {
      items.forEach((item, idx) => {
        msg += `<b>${idx + 1}.</b> ${item.item_text}\n`;
      });
    }
    return msg;
  }

  static askWishlist(name: string): string {
    return `🎁 <b>Send me your gift idea for ${name}!</b>\n\n<i>Reply to this message with your idea. You have 5 minutes.</i>`;
  }

  static deleteConfirm(name: string): string {
    return `Are you sure you want to permanently delete the reminder for <b>${name}</b>?`;
  }

  static templateCategories(): string {
    return `<i>Choose a message template category:</i>`;
  }

  static templateView(index: number, total: number, text: string): string {
    return `📝 <b>Template ${index + 1}/${total}:</b>\n\n${text}`;
  }

  static aiPrompt(): string {
    return `✨ <b>AI Template Generator</b>\n\nI can write a custom birthday message for you! What kind of vibe are you going for?`;
  }

  static aiLoading(): string {
    return `🧠 <i>AI is writing your message...</i>`;
  }

  static aiResult(text: string): string {
    return `✨ <b>AI Generated Greeting:</b>\n\n${text}`;
  }

  static gifSuccess(): string {
    return `🎉 GIF Card created! Forward the GIF above to your friend.`;
  }

  static gifFallback(text: string): string {
    return `🎂🎉 <b>Birthday Card:</b>\n\n${text}\n\n<i>(GIF couldn't load, but the message is ready to forward!)</i>`;
  }

  static timezoneSettings(offset: number, saved: boolean = false): string {
    return `🌍 <b>Timezone Settings</b>\n\nYour reminders currently send at <b>9:00 AM</b>.\nTo ensure this matches your local time, select your rough GMT offset below:\n\n<i>Current Offset: GMT${offset >= 0 ? '+' : ''}${offset}</i>${saved ? '\n\n✅ <b>Saved!</b>' : ''}`;
  }

  static reminderSettings(saved: boolean = false): string {
    return `⚙️ <b>Settings</b>\n\n${saved ? 'Reminder frequency updated for this chat:' : 'Choose reminder frequency for this chat:'}`;
  }
}
