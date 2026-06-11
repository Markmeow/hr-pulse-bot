'use strict';

const { EmbedBuilder } = require('discord.js');
const db = require('../database/db');

const CHECK_INTERVAL = 60 * 1000;

const getDueEvents = db.prepare(`
  SELECT * FROM events
  WHERE active = 1
    AND post_time = ?
    AND (last_sent_date IS NULL OR last_sent_date != ?)
`);
const markEventSent = db.prepare('UPDATE events SET last_sent_date = ? WHERE id = ?');

async function processEvents(client) {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const today = now.toLocaleDateString('en-CA');

  let due = [];
  try { due = getDueEvents.all(currentTime, today); } catch (err) {
    console.error('[events] Failed to read due events:', err);
    return;
  }

  for (const event of due) {
    try {
      const channel = await client.channels.fetch(event.channel_id).catch(() => null);
      if (!channel?.isTextBased()) continue;

      const pingParts = [];
      if (event.ping_everyone) pingParts.push('@everyone');
      if (event.ping_role_id) pingParts.push(`<@&${event.ping_role_id}>`);

      const embed = new EmbedBuilder()
        .setColor(event.color || 0xbd93f9)
        .setTitle(event.title)
        .setDescription(event.description)
        .setTimestamp();

      await channel.send({
        content: pingParts.length > 0 ? pingParts.join(' ') : undefined,
        embeds: [embed],
      });
    } catch (err) {
      console.error(`[events] Failed to post event #${event.id}:`, err);
    } finally {
      try { markEventSent.run(today, event.id); } catch (err) {
        console.error(`[events] Failed to mark event #${event.id} as sent:`, err);
      }
    }
  }
}

function startEventScheduler(client) {
  processEvents(client);
  setInterval(() => processEvents(client), CHECK_INTERVAL);
  console.log(`[events] Scheduler started (checking every ${CHECK_INTERVAL / 1000}s).`);
}

module.exports = { startEventScheduler };
