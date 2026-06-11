'use strict';

const db = require('../database/db');
const { discordTimestamp } = require('./time');

// How often (in ms) to check the database for due reminders.
const CHECK_INTERVAL = 30 * 1000; // 30 seconds

// Prepared statements (compiled once for speed)
const getDueReminders = db.prepare(
  'SELECT * FROM reminders WHERE sent = 0 AND remind_at <= ? ORDER BY remind_at ASC'
);
const markSent = db.prepare('UPDATE reminders SET sent = 1 WHERE id = ?');

/**
 * Check for reminders that are due and send them.
 * @param {import('discord.js').Client} client
 */
async function processDueReminders(client) {
  let due;
  try {
    due = getDueReminders.all(Date.now());
  } catch (err) {
    console.error('[reminders] Failed to read due reminders:', err);
    return;
  }

  for (const reminder of due) {
    try {
      const channel = await client.channels.fetch(reminder.channel_id).catch(() => null);

      if (channel && channel.isTextBased()) {
        await channel.send({
          content:
            `🔔 <@${reminder.user_id}> แจ้งเตือน: **${reminder.message}**\n` +
            `_(ตั้งไว้สำหรับ ${discordTimestamp(reminder.remind_at, 'f')})_`,
        });
      } else {
        console.warn(
          `[reminders] Channel ${reminder.channel_id} not found or not text-based; ` +
            `skipping reminder #${reminder.id}.`
        );
      }
    } catch (err) {
      console.error(`[reminders] Failed to deliver reminder #${reminder.id}:`, err);
    } finally {
      // Mark as sent regardless, so we never spam a broken reminder forever.
      try {
        markSent.run(reminder.id);
      } catch (err) {
        console.error(`[reminders] Failed to mark reminder #${reminder.id} as sent:`, err);
      }
    }
  }
}

/**
 * Start the recurring reminder check. Call once after the client is ready.
 * @param {import('discord.js').Client} client
 */
function startReminderScheduler(client) {
  // Run once immediately so reminders that were due while the bot was offline fire on boot.
  processDueReminders(client);
  setInterval(() => processDueReminders(client), CHECK_INTERVAL);
  console.log(`[reminders] Scheduler started (checking every ${CHECK_INTERVAL / 1000}s).`);
}

module.exports = { startReminderScheduler };
