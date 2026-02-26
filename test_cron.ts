import { DBRepo } from './src/db';
import { TelegramBot } from './src/telegram';
import { processReminders } from './src/cron';

// This is a local script to force processReminders() against the local D1 instance
// For production, we would use npx wrangler trigger --scheduled
// However, since we want to see output right now, let's fake it.

// Mock DB wrapper for local sqlite testing
const Database = require('better-sqlite3');
const dbs = new Database('./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/94fa9360-a38e-44f0-9c6c-2690888f61a0.sqlite');

const mockD1 = {
  prepare: (query: string) => ({
    bind: (...args: any[]) => ({
      first: async () => dbs.prepare(query).get(...args) || null,
      all: async () => ({ results: dbs.prepare(query).all(...args) }),
      run: async () => dbs.prepare(query).run(...args),
    })
  })
} as any;

const db = new DBRepo(mockD1);
const bot = new TelegramBot('8685636899:AAFnS9EdOt5zm_BAWPzDEvS4N2MTWxQbdNw');

console.log("Forcing cron job test...");
processReminders(db, bot).then(() => {
    console.log("Done.");
}).catch(console.error);
