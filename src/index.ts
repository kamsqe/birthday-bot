/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { DBRepo } from './db';
import { TelegramBot, TelegramUpdate } from './telegram';
import { BotHandler } from './handlers';
import { processReminders } from './cron';
import { WebAppHtml } from './webapp';
import { handleApiRequest } from './api';

export default {
	async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Serve WebApp HTML
		if (request.method === 'GET' && url.pathname === '/app') {
			return new Response(WebAppHtml, {
				headers: { 'Content-Type': 'text/html;charset=UTF-8' }
			});
		}

		// Handle WebApp API routes
		if (url.pathname.startsWith('/api/')) {
			return handleApiRequest(request, env);
		}

		// Handle Telegram Webhook
		if (request.method === 'POST') {
			try {
				const update: TelegramUpdate = await request.json();
				const dbReop = new DBRepo(env.DB);
				const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN);
				const handler = new BotHandler(bot, dbReop, env.AI);

				ctx.waitUntil(handler.handleUpdate(update).catch(err => {
					console.error('Error handling update:', err);
				}));

				return new Response('OK', { status: 200 });
			} catch (e: any) {
				console.error('Webhook Error:', e.message);
				return new Response('Bad Request', { status: 400 });
			}
		}

		return new Response('Method Not Allowed', { status: 405 });
	},

	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
		const dbRepo = new DBRepo(env.DB);
		const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN);
		ctx.waitUntil(processReminders(dbRepo, bot, env.AI));
	}
} satisfies ExportedHandler<Env>;
