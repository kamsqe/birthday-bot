import { DBRepo } from './db';
import { validateInitData } from './auth';
import { TelegramBot } from './telegram';

export async function handleApiRequest(request: Request, env: any): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // WebApp Auth validation
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Telegram ')) {
    return new Response('Unauthorized - Missing Telegram initData', { status: 401 });
  }

  const initData = authHeader.replace('Telegram ', '');
  const user = await validateInitData(initData, env.TELEGRAM_BOT_TOKEN);
  
  if (!user || (!user.id && user !== true)) {
    return new Response('Unauthorized - Invalid Signature', { status: 401 });
  }

  // user could be `true` if we couldn't parse JSON but signature matched. Let's assume we can parse it.
  const tgId = user.id;
  const db = new DBRepo(env.DB);

  if (request.method === 'GET' && path === '/api/birthdays') {
    const birthdays = await db.getBirthdaysByUser(tgId);
    return new Response(JSON.stringify(birthdays), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'POST' && path === '/api/birthdays') {
    try {
      const body = await request.json() as any;
      
      await db.addBirthday({
        user_tg_id: tgId,
        name: body.name,
        birth_month: body.birth_month,
        birth_day: body.birth_day,
        birth_year: body.birth_year || null,
        relationship: body.relationship || 'friend',
        reminded_phases: null
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
  }

  if (request.method === 'DELETE' && path.startsWith('/api/birthdays/')) {
    const bId = parseInt(path.split('/').pop() || '0');
    if (!bId) return new Response('Bad Request', { status: 400 });

    // Ensure user owns this birthday
    const existing = await db.getBirthdaysByUser(tgId, 100);
    if (!existing.some(b => b.id === bId)) {
      return new Response('Forbidden', { status: 403 });
    }

    await db.deleteBirthday(bId, tgId);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'POST' && path.startsWith('/api/manage/')) {
    const bId = parseInt(path.split('/').pop() || '0');
    if (!bId) return new Response('Bad Request', { status: 400 });

    const existing = await db.getBirthdaysByUser(tgId, 100);
    const b = existing.find(x => x.id === bId);
    if (!b) return new Response('Forbidden', { status: 403 });

    const rel = b.relationship || 'friend';
    const hasTemplates = ['friend', 'family', 'colleague', 'romantic'].includes(rel);

    const keyboard: any = { inline_keyboard: [] };
    keyboard.inline_keyboard.push([{ text: '🛒 Wishlist Ideas', callback_data: `wishlist_view:${b.id}` }]);
    if (hasTemplates) {
      keyboard.inline_keyboard.push([{ text: '💌 Generate Card', callback_data: `tpl_cat:${b.id}:${rel}` }]);
    }
    keyboard.inline_keyboard.push([{ text: `❌ Delete Reminder`, callback_data: `list_del_confirm:${b.id}:0` }]);

    const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN);
    await bot.sendMessage(tgId, `⚙️ <b>Manage Profile: ${b.name}</b>\n\nWhat would you like to do?`, keyboard);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Not Found', { status: 404 });
}
