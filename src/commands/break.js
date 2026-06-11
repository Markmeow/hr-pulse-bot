'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../database/db');

const upsertBreak = db.prepare(`
  INSERT INTO breaks (user_id, guild_id, channel_id, break_time, duration_ms, scheduled_at, date, activity)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (user_id, guild_id, date) DO UPDATE SET
    channel_id   = excluded.channel_id,
    break_time   = excluded.break_time,
    duration_ms  = excluded.duration_ms,
    scheduled_at = excluded.scheduled_at,
    activity     = excluded.activity,
    started_at   = NULL,
    returned_at  = NULL,
    end_warned   = 0,
    status       = 'scheduled'
`);
const getMyBreak = db.prepare(
  'SELECT * FROM breaks WHERE user_id = ? AND guild_id = ? AND date = ?'
);
const setReturned = db.prepare(
  "UPDATE breaks SET status = 'returned', returned_at = ? WHERE id = ?"
);
const getAllBreaksToday = db.prepare(
  'SELECT * FROM breaks WHERE guild_id = ? AND date = ? ORDER BY scheduled_at ASC'
);

function parseBreakTime(timeStr) {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return { error: 'รูปแบบเวลาไม่ถูกต้อง ตัวอย่าง: `12:00`' };
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h > 23 || m > 59) return { error: 'ค่าชั่วโมงหรือนาทีไม่ถูกต้อง' };
  const breakDate = new Date();
  breakDate.setHours(h, m, 0, 0);
  if (breakDate.getTime() <= Date.now()) return { error: 'ต้องตั้งเวลาพักในอนาคต' };
  return {
    timestamp: breakDate.getTime(),
    formatted: `${String(h).padStart(2, '0')}:${match[2]}`,
    dateStr: breakDate.toISOString().slice(0, 10),
  };
}

function parseDuration(str) {
  if (!str) return 60 * 60000;
  const match = str.trim().match(/^(?:(\d+)h)?(?:(\d+)m)?$/i);
  if (!match || (!match[1] && !match[2])) return null;
  const ms = (parseInt(match[1] || 0, 10) * 60 + parseInt(match[2] || 0, 10)) * 60000;
  return ms > 0 ? ms : null;
}

function endTimeStr(startMs, durationMs) {
  const d = new Date(startMs + durationMs);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function progressBar(elapsedMs, totalMs, len = 12) {
  const pct = Math.min(Math.max(elapsedMs / totalMs, 0), 1);
  const filled = Math.round(pct * len);
  const bar = '█'.repeat(filled) + '░'.repeat(len - filled);
  return `\`${bar}\` **${Math.round(pct * 100)}%**`;
}

function timeRemaining(endMs) {
  const mins = Math.ceil(Math.max(endMs - Date.now(), 0) / 60000);
  if (mins <= 0) return '⌛ หมดเวลาแล้ว';
  if (mins < 60) return `⏱️ เหลืออีก **${mins} นาที**`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `⏱️ เหลืออีก **${h} ชม. ${m} นาที**` : `⏱️ เหลืออีก **${h} ชั่วโมง**`;
}

function durationText(ms) {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} นาที`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} ชม. ${m} นาที` : `${h} ชั่วโมง`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('break')
    .setDescription('ระบบการพักประจำวัน')
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('ตั้งเวลาเริ่มพักประจำวัน — เช่น /break set time:12:00 duration:1h')
        .addStringOption((opt) =>
          opt.setName('time').setDescription('เวลาที่ต้องการพัก (HH:MM เช่น 12:00)').setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('duration')
            .setDescription('ระยะเวลาพัก เช่น 30m, 1h, 1h30m (ค่าเริ่มต้น: 1h)')
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName('activity')
            .setDescription('จะพักทำอะไร?')
            .setRequired(false)
            .setMaxLength(60)
            .addChoices(
              { name: '🍜 กินข้าว',              value: '🍜 กินข้าว'              },
              { name: '😴 งีบหลับ',              value: '😴 งีบหลับ'              },
              { name: '☕ พักดื่มกาแฟ/ชา',       value: '☕ พักดื่มกาแฟ/ชา'       },
              { name: '🚶 เดินเล่น/ออกกำลังกาย', value: '🚶 เดินเล่น/ออกกำลังกาย' },
              { name: '🛁 อาบน้ำ',               value: '🛁 อาบน้ำ'               },
              { name: '🛒 ไปซื้อของ',            value: '🛒 ไปซื้อของ'            },
              { name: '📱 พักสายตา',             value: '📱 พักสายตา'             }
            )
        )
    )
    .addSubcommand((sub) =>
      sub.setName('status').setDescription('ตรวจสอบสถานะการพักของตัวเอง')
    )
    .addSubcommand((sub) =>
      sub.setName('return').setDescription('แจ้งว่าพักเสร็จแล้วและกลับมาทำงานต่อ')
    )
    .addSubcommand((sub) =>
      sub.setName('dashboard').setDescription('ดูสถานะการพักของทุกคนในวันนี้')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guildId;
    const avatar = interaction.user.displayAvatarURL();
    const name = interaction.user.displayName;

    if (sub === 'set') {
      const timeStr = interaction.options.getString('time', true);
      const durStr = interaction.options.getString('duration');
      const activity = interaction.options.getString('activity') ?? null;
      const parsed = parseBreakTime(timeStr);

      if ('error' in parsed) {
        await interaction.reply({
          embeds: [new EmbedBuilder().setColor(0xff5555).setTitle('✦ ตั้งเวลาพักไม่ได้').setDescription(parsed.error)],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const durationMs = parseDuration(durStr);
      if (durationMs === null) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff5555)
              .setTitle('✦ รูปแบบ duration ไม่ถูกต้อง')
              .setDescription('ตัวอย่าง: `30m` `1h` `1h30m`'),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const endTime = endTimeStr(parsed.timestamp, durationMs);
      upsertBreak.run(userId, guildId, interaction.channelId, parsed.formatted, durationMs, parsed.timestamp, parsed.dateStr, activity);

      const fields = [
        { name: '「 ช่วงเวลาพัก 」', value: `**${parsed.formatted} — ${endTime} น.**`, inline: true },
        { name: '「 ระยะเวลา 」', value: durationText(durationMs), inline: true },
        { name: '「 สถานะ 」', value: '⏳ รอพัก', inline: true },
      ];
      if (activity) fields.push({ name: '「 กิจกรรม 」', value: activity, inline: true });

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff79c6)
            .setAuthor({ name, iconURL: avatar })
            .setTitle('🌸 ตั้งเวลาพักแล้ว!')
            .addFields(...fields)
            .setFooter({ text: '✦ บอทจะแจ้งเตือนเมื่อถึงเวลาพัก และแจ้งอีกครั้ง 5 นาทีก่อนหมดเวลา ✦' })
            .setTimestamp(),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'status') {
      const today = new Date().toISOString().slice(0, 10);
      const r = getMyBreak.get(userId, guildId, today);

      if (!r) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x6272a4)
              .setAuthor({ name, iconURL: avatar })
              .setTitle('✦ ยังไม่ได้ตั้งเวลาพักวันนี้')
              .setDescription('ตั้งเวลาพักได้ด้วย `/break set time:12:00`'),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const dur = r.duration_ms || 3600000;
      const endTime = endTimeStr(r.scheduled_at, dur);
      const fields = [
        { name: '「 ช่วงเวลาพัก 」', value: `**${r.break_time} — ${endTime} น.**`, inline: true },
        { name: '「 ระยะเวลา 」', value: durationText(dur), inline: true },
      ];

      if (r.status === 'scheduled') {
        fields.push({ name: '「 สถานะ 」', value: '⏳ รอพัก', inline: true });
      } else if (r.status === 'on_break' && r.started_at) {
        const elapsed = Date.now() - r.started_at;
        const endMs = r.started_at + dur;
        fields.push(
          { name: '「 สถานะ 」', value: '🌙 กำลังพักอยู่', inline: true },
          { name: '「 ความคืบหน้า 」', value: `${progressBar(elapsed, dur)}\n${timeRemaining(endMs)}`, inline: false }
        );
      } else if (r.status === 'returned' && r.started_at && r.returned_at) {
        const actual = r.returned_at - r.started_at;
        fields.push(
          { name: '「 สถานะ 」', value: '✅ กลับมาแล้ว', inline: true },
          { name: '「 พักจริงๆ 」', value: durationText(actual), inline: true }
        );
      }

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xbd93f9)
            .setAuthor({ name, iconURL: avatar })
            .setTitle('🌸 สถานะการพักของคุณ')
            .addFields(...fields)
            .setFooter({ text: `✦ วันที่ ${today} ✦` }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'return') {
      const today = new Date().toISOString().slice(0, 10);
      const r = getMyBreak.get(userId, guildId, today);

      if (!r || r.status === 'scheduled') {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x6272a4)
              .setTitle('✦ ยังไม่ได้เริ่มพัก')
              .setDescription('คุณยังไม่ได้เริ่มพักในวันนี้'),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      if (r.status === 'returned') {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x6272a4)
              .setTitle('✦ กลับมาทำงานแล้ว')
              .setDescription('คุณแจ้งกลับมาทำงานไปแล้วก่อนหน้านี้'),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const now = Date.now();
      setReturned.run(now, r.id);
      const actual = r.started_at ? now - r.started_at : null;
      const planned = r.duration_ms || 3600000;

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x50fa7b)
            .setAuthor({ name, iconURL: avatar })
            .setTitle('🌸 กลับมาทำงานแล้ว!')
            .addFields(
              { name: '「 พักจริงๆ 」', value: actual ? durationText(actual) : '—', inline: true },
              { name: '「 แผนที่ตั้งไว้ 」', value: durationText(planned), inline: true },
              {
                name: '「 สรุป 」',
                value:
                  actual && actual < planned
                    ? `⚡ กลับก่อนเวลา **${durationText(planned - actual)}**`
                    : actual && actual > planned
                      ? `🐢 เกินเวลา **${durationText(actual - planned)}**`
                      : '✨ ตรงเวลาพอดี!',
                inline: false,
              }
            )
            .setFooter({ text: '✦ ยินดีต้อนรับกลับมา! ✦' })
            .setTimestamp(),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'dashboard') {
      const today = new Date().toISOString().slice(0, 10);
      const records = getAllBreaksToday.all(guildId, today);

      if (records.length === 0) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xbd93f9)
              .setTitle('✦ ยังไม่มีใครตั้งเวลาพักวันนี้')
              .setDescription('ตั้งเวลาพักได้ด้วย `/break set time:12:00`'),
          ],
        });
        return;
      }

      const onBreak = records.filter((r) => r.status === 'on_break');
      const pending = records.filter((r) => r.status === 'scheduled');
      const completed = records.filter((r) => r.status === 'returned');

      const fmt = (r) => {
        const dur = r.duration_ms || 3600000;
        const end = endTimeStr(r.scheduled_at, dur);
        const act = r.activity ? ` · ${r.activity}` : '';
        return `> <@${r.user_id}> — **${r.break_time}–${end} น.**${act}`;
      };

      const sections = [];

      if (onBreak.length > 0) {
        const lines = onBreak.map((r) => {
          const dur = r.duration_ms || 3600000;
          const end = endTimeStr(r.scheduled_at, dur);
          const elapsed = r.started_at ? Date.now() - r.started_at : 0;
          const endMs = r.started_at ? r.started_at + dur : 0;
          const act = r.activity ? ` · ${r.activity}` : '';
          return (
            `> <@${r.user_id}> — **${r.break_time}–${end} น.**${act}\n` +
            `> ${progressBar(elapsed, dur)} ${timeRemaining(endMs)}`
          );
        });
        sections.push(`☕ **กำลังพักอยู่ (${onBreak.length})**\n${lines.join('\n')}`);
      }

      if (pending.length > 0) {
        const lines = pending.map(fmt);
        sections.push(`⏳ **รอพัก — Upcoming (${pending.length})**\n${lines.join('\n')}`);
      }

      if (completed.length > 0) {
        const lines = completed.map((r) => {
          const dur = r.duration_ms || 3600000;
          const end = endTimeStr(r.scheduled_at, dur);
          const actual = r.started_at && r.returned_at ? r.returned_at - r.started_at : null;
          const extra = actual ? ` *(${durationText(actual)})*` : '';
          return `> <@${r.user_id}> — **${r.break_time}–${end} น.**${extra}`;
        });
        sections.push(`✅ **เสร็จสิ้นแล้ววันนี้ (${completed.length})**\n${lines.join('\n')}`);
      }

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xbd93f9)
            .setTitle('✦ Daily Break Dashboard ✦')
            .setDescription(sections.join('\n\n'))
            .addFields({
              name: '「 สรุป 」',
              value: `☕ พักอยู่ **${onBreak.length}**  ·  ⏳ รอพัก **${pending.length}**  ·  ✅ เสร็จแล้ว **${completed.length}**`,
            })
            .setFooter({ text: `🌸 วันที่ ${today}` })
            .setTimestamp(),
        ],
      });
    }
  },
};
