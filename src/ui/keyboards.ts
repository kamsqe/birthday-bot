import { InlineKeyboardMarkup } from '../telegram';
import { Birthday } from '../db';
import { TEMPLATES } from '../templates';

export class Keyboards {
  
  static welcome(isGroup: boolean): InlineKeyboardMarkup | undefined {
    if (isGroup) return undefined;
    
    return {
      inline_keyboard: [
        [{ text: '📋 View Birthdays', callback_data: `list_dash` }],
        [{ text: '❓ How it Works', callback_data: `help_tutorial` }]
      ]
    };
  }

  static dashboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [{ text: '🗓️ Browse all by Month', callback_data: `list_month:current` }],
        [{ text: '🛒 Gift Wishlists', callback_data: `list_wishlist:0` }, { text: '✏️ Edit / Manage', callback_data: `list_del_menu:0` }]
      ]
    };
  }

  static monthPicker(name: string): InlineKeyboardMarkup {
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

  static dayPicker(name: string, month: number): InlineKeyboardMarkup {
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

  static relationshipPicker(name: string, month: number, day: number): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [{ text: '🤝 Friend', callback_data: `add_r:${name}:${month}:${day}:friend` }],
        [{ text: '👨‍👩‍👧 Family', callback_data: `add_r:${name}:${month}:${day}:family` }],
        [{ text: '💼 Colleague', callback_data: `add_r:${name}:${month}:${day}:colleague` }],
        [{ text: '❤️ Romantic', callback_data: `add_r:${name}:${month}:${day}:romantic` }]
      ]
    };
  }

  static timezonePicker(currentOffset: number): InlineKeyboardMarkup {
    const keyboard: any[][] = [];
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

  static settings(pref: string): InlineKeyboardMarkup {
    return {
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
  }

  static backToDashboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: `list_dash` }]]
    };
  }

  static manageProfile(b: Birthday, page: string | number): InlineKeyboardMarkup {
    const rel = b.relationship || 'friend';
    const hasTemplates = !!TEMPLATES[rel];
    const keyboard: InlineKeyboardMarkup = { inline_keyboard: [] };
    
    keyboard.inline_keyboard.push([{ text: '🛒 Wishlist Ideas', callback_data: `wishlist_view:${b.id}` }]);
    
    if (hasTemplates) {
      keyboard.inline_keyboard.push([{ text: '💌 Message Templates', callback_data: `tpl_back:${b.id}:${rel}` }]);
      keyboard.inline_keyboard.push([{ text: '✨ AI Generator', callback_data: `ai_gen:${b.id}:${rel}` }]);
    }
    
    keyboard.inline_keyboard.push([{ text: `❌ Delete Reminder`, callback_data: `list_del_confirm:${b.id}:${page}` }]);
    keyboard.inline_keyboard.push([{ text: '🔙 Back', callback_data: `list_del_menu:${page}` }]);

    return keyboard;
  }

  static deleteConfirm(bId: number, page: string | number): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '⚠️ YES, Delete', callback_data: `list_del_exec:${bId}:${page}` },
          { text: 'Cancel', callback_data: `list_del_menu:${page}` }
        ]
      ]
    };
  }

  static templateCategories(bId: number, rel: string): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [{ text: '🤣 Funny', callback_data: `tpl_cat:${bId}:${rel}_funny` }, { text: '❤️ Heartfelt', callback_data: `tpl_cat:${bId}:${rel}_heartfelt` }],
        [{ text: '🤝 Professional', callback_data: `tpl_cat:${bId}:${rel}_colleague` }, { text: '👨‍👩‍👧 Family', callback_data: `tpl_cat:${bId}:${rel}_family` }],
        [{ text: '✨ Try AI Generator', callback_data: `ai_gen:${bId}:${rel}` }],
        [{ text: 'browse all ' + rel + ' templates', callback_data: `tpl_cat:${bId}:${rel}` }]
      ]
    };
  }

  static templatePaginator(bId: number, category: string, index: number, total: number, renderedText: string, rel: string): InlineKeyboardMarkup {
    const keyboard: any[][] = [[]];
      
    if (index > 0) {
      keyboard[0].push({ text: '⬅️ Prev', callback_data: `tpl_cat:${bId}:${category}:${index - 1}` });
    }
    if (index < total - 1) {
      keyboard[0].push({ text: '➡️ Next', callback_data: `tpl_cat:${bId}:${category}:${index + 1}` });
    }

    keyboard.push([{ 
      text: `✈️ Send message (Text)`, 
      url: `https://t.me/share/url?url=${encodeURIComponent(renderedText)}` 
    }]);
    keyboard.push([{ text: `🎉 Create GIF Card`, callback_data: `tpl_gif:${bId}:${rel}` }]);
    keyboard.push([{ text: '🔙 Back to Categories', callback_data: `tpl_back:${bId}:${rel}` }]);

    return { inline_keyboard: keyboard };
  }

  static aiVibePicker(bId: number, rel: string): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [{ text: '🤣 Make it Funny', callback_data: `ai_exec:${bId}:${rel}:funny` }],
        [{ text: '❤️ Make it Heartfelt', callback_data: `ai_exec:${bId}:${rel}:heartfelt` }],
        [{ text: '🤝 Make it Professional', callback_data: `ai_exec:${bId}:${rel}:professional` }],
        [{ text: '🔙 Back to Categories', callback_data: `tpl_back:${bId}:${rel}` }]
      ]
    };
  }

  static aiLoading(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [[{ text: '⏳ Generating...', callback_data: `noop` }]]
    };
  }

  static aiResult(bId: number, rel: string, vibe: string, text: string): InlineKeyboardMarkup {
    return {
        inline_keyboard: [
        [{ text: '🔄 Regenerate', callback_data: `ai_exec:${bId}:${rel}:${vibe}` }],
        [{ text: `✈️ Send message (Text)`, url: `https://t.me/share/url?url=${encodeURIComponent(text)}` }],
        [{ text: `🎉 Create GIF Card`, callback_data: `tpl_gif:${bId}:${rel}` }],
        [{ text: '🔙 Change Vibe', callback_data: `ai_gen:${bId}:${rel}` }],
        [{ text: '🔙 Dashboard', callback_data: `list_dash` }]
      ]
    };
  }

  static gifCard(bId: number, rel: string): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [{ text: '🔙 Back to Categories', callback_data: `tpl_back:${bId}:${rel}` }],
        [{ text: '🔙 Dashboard', callback_data: `list_dash` }]
      ]
    };
  }

  static wishlistList(items: any[], bId: number): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardMarkup = { inline_keyboard: [] };
      
    if (items.length > 0) {
      const deleteRow = items.map((item, idx) => ({
        text: `❌ ${idx + 1}`,
        callback_data: `wishlist_del:${bId}:${item.id}`
      }));
      for (let i = 0; i < deleteRow.length; i += 5) {
        keyboard.inline_keyboard.push(deleteRow.slice(i, i + 5));
      }
    }

    keyboard.inline_keyboard.push([{ text: '➕ Add Idea', callback_data: `wishlist_add:${bId}` }]);
    keyboard.inline_keyboard.push([{ text: '🔙 Back to Wishlists', callback_data: `list_wishlist:0` }]);

    return keyboard;
  }
}
