'use strict';

const db = require('../database/db');

const CHECK_INTERVAL = 60 * 1000;

const getDueBreaks = db.prepare(
  "SELECT * FROM breaks WHERE status = 'scheduled' AND scheduled_at <= ?"
);
const getEndingBreaks = db.prepare(
  `SELECT * FROM breaks
   WHERE status = 'on_break'
     AND end_warned = 0
     AND started_at + duration_ms - 300000 <= ?
     AND started_at + duration_ms > ?`
);
const getExpiredBreaks = db.prepare(
  `SELECT * FROM breaks
   WHERE status = 'on_break'
     AND started_at + duration_ms <= ?`
);
const markOnBreak = db.prepare(
  "UPDATE breaks SET status = 'on_break', started_at = ? WHERE id = ?"
);
const markEndWarned = db.prepare('UPDATE breaks SET end_warned = 1 WHERE id = ?');
const markReturned = db.prepare(
  "UPDATE breaks SET status = 'returned', returned_at = ? WHERE id = ?"
);

function endTimeStr(startMs, durationMs) {
  const d = new Date(startMs + durationMs);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

async function processDueBreaks(client) {
  const now = Date.now();

  let due = [];
  try { due = getDueBreaks.all(now); } catch (err) {
    console.error('[breaks] Failed to read due breaks:', err);
  }
  for (const r of due) {
    try {
      const channel = await client.channels.fetch(r.channel_id).catch(() => null);
      if (channel?.isTextBased()) {
        const dur = r.duration_ms || 3600000;
        const actLine = r.activity ? `\n> กิจกรรม: **${r.activity}**` : '';
        await channel.send({
          content:
            `🌸 <@${r.user_id}> ถึงเวลาพักแล้ว! **${r.break_time} น.** 🍵\n` +
            `> พักถึง **${endTimeStr(now, dur)} น.** — แจ้งกลับด้วย \`/break return\`` +
            actLine,
        });
      }
    } catch (err) {
      console.error(`[breaks] Failed to notify break #${r.id}:`, err);
    } finally {
      try { markOnBreak.run(now, r.id); } catch (err) {
        console.error(`[breaks] Failed to mark on_break #${r.id}:`, err);
      }
    }
  }

  let ending = [];
  try { ending = getEndingBreaks.all(now, now); } catch (err) {
    console.error('[breaks] Failed to read ending breaks:', err);
  }
  for (const r of ending) {
    try {
      const channel = await client.channels.fetch(r.channel_id).catch(() => null);
      if (channel?.isTextBased()) {
        await channel.send({
          content:
            `⏰ <@${r.user_id}> เหลืออีก **5 นาที** ก็จะหมดเวลาพักแล้วนะ!\n` +
            `> กลับมาทำงานต่อด้วย \`/break return\``,
        });
      }
      markEndWarned.run(r.id);
    } catch (err) {
      console.error(`[breaks] Failed to warn break #${r.id}:`, err);
    }
  }

  let expired = [];
  try { expired = getExpiredBreaks.all(now); } catch (err) {
    console.error('[breaks] Failed to read expired breaks:', err);
  }
  for (const r of expired) {
    try {
      const channel = await client.channels.fetch(r.channel_id).catch(() => null);
      if (channel?.isTextBased()) {
        await channel.send({
          content:
            `🔔 <@${r.user_id}> หมดเวลาพักแล้ว! ยินดีต้อนรับกลับมาทำงาน 💪\n` +
            `> *(ระบบบันทึกการพักให้อัตโนมัติแล้ว)*`,
        });
      }
      markReturned.run(now, r.id);
    } catch (err) {
      console.error(`[breaks] Failed to auto-end break #${r.id}:`, err);
      try { markReturned.run(now, r.id); } catch {}
    }
  }
}

function startBreakScheduler(client) {
  processDueBreaks(client);
  setInterval(() => processDueBreaks(client), CHECK_INTERVAL);
  console.log(`[breaks] Scheduler started (checking every ${CHECK_INTERVAL / 1000}s).`);
}

module.exports = { startBreakScheduler };
