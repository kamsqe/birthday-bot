import { DBRepo } from './db';
import { TelegramBot, TelegramUpdate } from './telegram';
import { Router } from './router';
import { processReminders } from './cron';

export default {
	async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
		// Handle Telegram Webhook
		if (request.method === 'POST') {
			try {
				const update: TelegramUpdate = await request.json();
				const db = new DBRepo(env.DB);
				const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN);
				const router = new Router(bot, db, env.AI);

				ctx.waitUntil(router.handleUpdate(update).catch(err => {
					console.error('Error handling update:', err);
				}));

				return new Response('OK', { status: 200 });
			} catch (e: any) {
				console.error('Webhook Error:', e.message);
				return new Response('Bad Request', { status: 400 });
			}
		}

		return new Response('Birthday Bot is running.', { status: 200 });
	},

	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
		const dbRepo = new DBRepo(env.DB);
		const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN);
		ctx.waitUntil(processReminders(dbRepo, bot, env.AI));
	}
} satisfies ExportedHandler<Env>;
