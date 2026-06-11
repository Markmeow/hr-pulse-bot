'use strict';

const { Events, MessageFlags, EmbedBuilder } = require('discord.js');
const standup = require('../commands/standup');
const auth = require('../utils/authHandler');
const db = require('../database/db');

const checkRegistered = db.prepare('SELECT id FROM users WHERE discord_id = ? AND guild_id = ?');

// คำสั่งที่ไม่ต้องตรวจสอบการลงทะเบียน
const OPEN_COMMANDS = new Set(['auth', 'help']);

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // ---- Slash commands ----
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.warn(`[interaction] Unknown command: ${interaction.commandName}`);
        return;
      }

      // Guard — ตรวจสอบว่าลงทะเบียนแล้วหรือยัง (ยกเว้น open commands)
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

      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`[interaction] Error in /${interaction.commandName}:`, err);
        await safeErrorReply(interaction);
      }
      return;
    }

    // ---- Button interactions ----
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

    // ---- Modal submissions ----
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

/**
 * Reply with a generic error message, handling both replied and un-replied states.
 * @param {import('discord.js').RepliableInteraction} interaction
 */
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
