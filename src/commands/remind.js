'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../database/db');
const { parseWhen, discordTimestamp } = require('../utils/time');

const insertReminder = db.prepare(
  'INSERT INTO reminders (user_id, guild_id, channel_id, message, remind_at) VALUES (?, ?, ?, ?, ?)'
);
const listPendingReminders = db.prepare(
  'SELECT * FROM reminders WHERE user_id = ? AND guild_id = ? AND sent = 0 ORDER BY remind_at ASC'
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('ตั้งและดูการแจ้งเตือน')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('ตั้งเวลาแจ้งเตือน')
        .addStringOption((opt) =>
          opt
            .setName('when')
            .setDescription('เช่น 30m, 2h, 1d, 1h30m หรือ 2025-06-20 14:30')
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('message')
            .setDescription('จะให้แจ้งเตือนเรื่องอะไร?')
            .setRequired(true)
            .setMaxLength(500)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('list').setDescription('ดูรายการแจ้งเตือนที่รอดำเนินการ')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    // ---- /remind add ----
    if (sub === 'add') {
      const when = interaction.options.getString('when', true);
      const message = interaction.options.getString('message', true);

      const parsed = parseWhen(when);
      if ('error' in parsed) {
        await interaction.reply({
          content: `❌ ${parsed.error}`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const result = insertReminder.run(
        userId,
        guildId,
        interaction.channelId,
        message,
        parsed.timestamp
      );

      await interaction.reply({
        content:
          `⏰ ตั้งการแจ้งเตือน **#${result.lastInsertRowid}** ไว้ที่ ` +
          `${discordTimestamp(parsed.timestamp, 'F')} ` +
          `(${discordTimestamp(parsed.timestamp, 'R')}):\n> ${message}`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // ---- /remind list ----
    if (sub === 'list') {
      const reminders = listPendingReminders.all(userId, guildId);

      if (reminders.length === 0) {
        await interaction.reply({
          content: '📭 คุณไม่มีการแจ้งเตือนที่รอดำเนินการ เพิ่มได้ด้วย `/remind add`',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const lines = reminders
        .map(
          (r) =>
            `**#${r.id}** • ${discordTimestamp(r.remind_at, 'R')} — ${r.message}`
        )
        .join('\n');

      const embed = new EmbedBuilder()
        .setTitle('⏰ การแจ้งเตือนที่รอดำเนินการ')
        .setDescription(lines)
        .setColor(0xfee75c);

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  },
};
