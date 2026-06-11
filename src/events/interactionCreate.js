'use strict';

const { Events, MessageFlags, EmbedBuilder } = require('discord.js');
const standup = require('../commands/standup');
const auth = require('../utils/authHandler');
const db = require('../database/db');

const checkRegistered = db.prepare('SELECT id FROM users WHERE discord_id = ? AND guild_id = ?');

const OPEN_COMMANDS = new Set(['auth', 'help', 'event', 'clear']);

const CHANNEL_GUARDS = {
  auth:        'AUTH_CHANNEL_ID',
  standup:     'STANDUP_CHANNEL_ID',
  dailyreport: 'STANDUP_CHANNEL_ID',
  break:       'BREAK_CHANNEL_ID',
  todo:        'GENERAL_CHANNEL_ID',
  remind:      'GENERAL_CHANNEL_ID',
};

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.warn(`[interaction] Unknown command: ${interaction.commandName}`);
        return;
      }

      if (!OPEN_COMMANDS.has(interaction.commandName)) {
        const registered = checkRegistered.get(interaction.user.id, interaction.guildId);
        if (!registered) {
          const authChannelId = process.env.AUTH_CHANNEL_ID;
          const mention = authChannelId ? `<#${authChannelId}>` : 'ช่องยืนยันตัวตน';
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff5555)
                .setTitle('🔒 กรุณายืนยันตัวตนก่อน')
                .setDescription(
                  `คุณยังไม่ได้ลงทะเบียนในระบบ\nกรุณาไปที่ ${mention} เพื่อ **สมัครสมาชิก** หรือ **เข้าสู่ระบบ** ก่อนใช้งานครับ`
                ),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      const envKey = CHANNEL_GUARDS[interaction.commandName];
      const requiredChannelId = envKey ? process.env[envKey] : null;
      if (requiredChannelId && interaction.channelId !== requiredChannelId) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff5555)
              .setTitle('✦ ใช้คำสั่งนี้ในช่องนี้ไม่ได้')
              .setDescription(`คำสั่ง \`/${interaction.commandName}\` ใช้ได้เฉพาะใน <#${requiredChannelId}> เท่านั้น`),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`[interaction] Error in /${interaction.commandName}:`, err);
        await safeErrorReply(interaction);
      }
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith('auth_')) {
        try {
          await auth.handleButton(interaction);
        } catch (err) {
          console.error('[interaction] Error handling auth button:', err);
          await safeErrorReply(interaction);
        }
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      try {
        if (interaction.customId === standup.MODAL_ID) {
          await standup.handleModal(interaction);
        } else if (interaction.customId.startsWith('auth_')) {
          await auth.handleModal(interaction);
        }
      } catch (err) {
        console.error('[interaction] Error handling modal submit:', err);
        await safeErrorReply(interaction);
      }
    }
  },
};

async function safeErrorReply(interaction) {
  const payload = {
    content: '⚠️ Something went wrong while handling that. Please try again.',
    flags: MessageFlags.Ephemeral,
  };

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  } catch (err) {
    console.error('[interaction] Failed to send error reply:', err);
  }
}
