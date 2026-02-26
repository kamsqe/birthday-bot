import { DBRepo } from './db';
import { validateInitData } from './auth';

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

  return new Response('Not Found', { status: 404 });
}
