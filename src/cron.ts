import { DBRepo, Birthday } from './db';
import { TelegramBot, InlineKeyboardMarkup } from './telegram';
import { TEMPLATES } from './templates';

export async function processReminders(db: DBRepo, bot: TelegramBot, ai: any) {
  const now = new Date();
  const currentUtcHour = now.getUTCHours();
  const currentYear = now.getUTCFullYear();

  console.log("Running advanced cron for UTC hour " + currentUtcHour);

  try {
    // 0. Gamification: Year in Review (December 31st at 9:00 AM Local Time)
    const targetOffset = 9 - currentUtcHour;
    const localTimeCheck = new Date(now.getTime() + (targetOffset * 60 * 60 * 1000));
    
    if (localTimeCheck.getUTCMonth() === 11 && localTimeCheck.getUTCDate() === 31) {
      console.log("Triggering Year In Review for offset " + targetOffset);
      const stats = await db.getYearInReviewStats(currentUtcHour);
      for (const stat of stats) {
        if (stat.b_count > 0) {
          const msg = `📊 <b>Your Year in Review!</b>\n\nYou're an amazing friend! This year you tracked <b>${stat.b_count}</b> birthdays and made sure nobody was forgotten.\n\nHere's to another year of great relationships! 🥂`;
          try {
            await bot.sendMessage(stat.tg_id, msg);
          } catch(e) {}
        }
      }
    }

    // 1. Fetch ALL birthdays for users who have a matching remind_utc_hour
    const candidates = await db.getBirthdaysForReminderQuery(currentUtcHour);
    if (!candidates || candidates.length === 0) return;

    const remindersToSend: { b: Birthday & { tg_id: number }, offset: number }[] = [];

    // 2. Calculate offsets
    for (const b of candidates) {
      // If user has a timezone offset, calculating 'today' requires shifting UTC by that offset
      const offsetMs = (b as any).utc_offset_hours * 60 * 60 * 1000;
      
      // The user's local date/time right now
      const localNow = new Date(now.getTime() + offsetMs);
      const localYear = localNow.getUTCFullYear();
      
      const localTodayStart = Date.UTC(localYear, localNow.getUTCMonth(), localNow.getUTCDate());
      let nextBdayLocal = Date.UTC(localYear, b.birth_month - 1, b.birth_day);

      // If their birthday this year already passed (in their local time), shift to next year
      if (nextBdayLocal < localTodayStart) {
        nextBdayLocal = Date.UTC(localYear + 1, b.birth_month - 1, b.birth_day);
      }

      // Calculate difference in exact 24 hour chunks
      const diffTime = nextBdayLocal - localTodayStart;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Supported offsets: -7, -3, -1, 0 (0 means today)
      // Because diffDays might evaluate slightly weirdly across timezones if we purely did Math.ceil
      // We check if it matches exactly one of our tracking phases.
      // For a bot running roughly every hour, evaluating diffDays == 7 means "7 days from today"

      let targetPhase: number | null = null;
      if (diffDays === 7) targetPhase = -7;
      else if (diffDays === 3) targetPhase = -3;
      else if (diffDays === 1) targetPhase = -1;
      else if (diffDays === 0) targetPhase = 0;

      if (targetPhase === null) continue; // Not a target day

      // 3. User Preference Check
      // If user only wants the day-of reminder, skip the negative offsets
      if (b.reminder_preference === 'day_of' && targetPhase < 0) {
        continue;
      }

      // 4. Idempotency Check
      // Parse JSON from database: {"year": 2024, "sent": [-7]}
      let phaseData = { year: currentYear, sent: [] as number[] };
      if (b.reminded_phases) {
        try {
          const parsed = JSON.parse(b.reminded_phases);
          if (parsed.year === currentYear) {
            phaseData = parsed;
          }
        } catch(e) {}
      }

      if (!phaseData.sent.includes(targetPhase)) {
        // Safe to send
        remindersToSend.push({ b, offset: targetPhase });
        
        // Update DB immediately to avoid concurrent run issues
        phaseData.sent.push(targetPhase);
        await db.updateRemindedPhases(b.id!, JSON.stringify(phaseData));
      }
    }

    console.log("Found " + remindersToSend.length + " advanced reminders to dispatch.");

    // 5. Send Telegram Messages
    const BATCH_SIZE = 25;
    for (let i = 0; i < remindersToSend.length; i += BATCH_SIZE) {
      const batch = remindersToSend.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (item) => {
        try {
          const { b, offset } = item;
          const age = b.birth_year ? (currentYear - b.birth_year).toString() : 'another year';
          const rel = b.relationship || 'friend';
          
          let text = "";
          let replyMarkup: InlineKeyboardMarkup | undefined;

          if (offset === 0) {
             text = "🚨  <b>Today is " + b.name + "'s birthday!</b> (Turns " + age + " today)\n";
             text += "They are categorized as a <i>" + rel + "</i>.\n\n";
             
             const hasTemplates = !!TEMPLATES[rel];
             if (hasTemplates) {
               text += "<i>Choose a message template category:</i>";
               replyMarkup = {
                 inline_keyboard: [
                   [{ text: '🤣 Funny', callback_data: "tpl_cat:" + b.id + ":" + rel + "_funny" }, { text: '❤️ Heartfelt', callback_data: "tpl_cat:" + b.id + ":" + rel + "_heartfelt" }],
                   [{ text: '🤝 Professional', callback_data: "tpl_cat:" + b.id + ":" + rel + "_colleague" }, { text: '👨‍👩‍👧 Family', callback_data: "tpl_cat:" + b.id + ":" + rel + "_family" }],
                   [{ text: 'browse all ' + rel + ' templates', callback_data: "tpl_cat:" + b.id + ":" + rel }]
                 ]
               };
             } else {
               text += "Don't forget to wish them a Happy Birthday!";
             }
          } 
          else if (offset === -1) {
             text = "🔔  <b>Tomorrow is " + b.name + "'s birthday!</b>\nJust a heads up to be ready!";
          }
          else if (offset === -3) {
             const items = await db.getWishlist(b.id!);
             const wishText = items.length > 0 ? "\n\n🛒 <b>Saved Gift Ideas:</b>\n" + items.map(i => "• " + i.item_text).join("\n") : "";
             text = "🗓️  <b>" + b.name + "'s birthday is in 3 days!</b>\nTime to pick out a card or gift." + wishText;
          }
          else if (offset === -7) {
             const items = await db.getWishlist(b.id!);
             const wishText = items.length > 0 ? "\n\n🛒 <b>Saved Gift Ideas:</b>\n" + items.map(i => "• " + i.item_text).join("\n") : "";
             text = "⏰  <b>" + b.name + "'s birthday is exactly 1 week away.</b>\nIt's sneaking up on you!" + wishText;
          }

          if (text) {
             await bot.sendMessage(b.tg_id, text, replyMarkup);
          }
        } catch (err: any) {
          console.error("Failed to send reminder to User " + item.b.tg_id, err.message);
        }
      }));

      if (i + BATCH_SIZE < remindersToSend.length) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  } catch (globalErr) {
    console.error("Cron advanced error:", globalErr);
  }
}
