'use strict';

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  MessageFlags,
} = require('discord.js');
const db = require('../database/db');

const MODAL_ID = 'standup_modal';

const insertStandup = db.prepare(
  'INSERT INTO standups (user_id, guild_id, yesterday, today, blockers) VALUES (?, ?, ?, ?, ?)'
);

module.exports = {
  MODAL_ID,

  data: new SlashCommandBuilder()
    .setName('standup')
    .setDescription('บันทึก Daily Standup ของคุณ'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId(MODAL_ID)
      .setTitle('🗒️ Daily Standup');

    const yesterday = new TextInputBuilder()
      .setCustomId('yesterday')
      .setLabel('เมื่อวานทำอะไรไปบ้าง?')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1000);

    const today = new TextInputBuilder()
      .setCustomId('today')
      .setLabel('วันนี้จะทำอะไรบ้าง?')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1000);

    const blockers = new TextInputBuilder()
      .setCustomId('blockers')
      .setLabel('มีอุปสรรคอะไรไหม? (พิมพ์ "ไม่มี" ถ้าไม่มี)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(1000);

    modal.addComponents(
      new ActionRowBuilder().addComponents(yesterday),
      new ActionRowBuilder().addComponents(today),
      new ActionRowBuilder().addComponents(blockers)
    );

    await interaction.showModal(modal);
  },

  async handleModal(interaction) {
    const yesterday = interaction.fields.getTextInputValue('yesterday');
    const today = interaction.fields.getTextInputValue('today');
    const blockers = interaction.fields.getTextInputValue('blockers') || 'ไม่มี';

    insertStandup.run(interaction.user.id, interaction.guildId, yesterday, today, blockers);

    const embed = new EmbedBuilder()
      .setTitle('🗒️ Daily Standup')
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .addFields(
        { name: '✅ เมื่อวาน', value: yesterday.slice(0, 1024) },
        { name: '🎯 วันนี้', value: today.slice(0, 1024) },
        { name: '🚧 อุปสรรค', value: blockers.slice(0, 1024) }
      )
      .setColor(0x57f287)
      .setTimestamp();

    const targetChannelId = process.env.STANDUP_CHANNEL_ID || interaction.channelId;
    let posted = false;

    try {
      const channel = await interaction.client.channels.fetch(targetChannelId).catch(() => null);
      if (channel && channel.isTextBased()) {
        await channel.send({ embeds: [embed] });
        posted = true;
      }
    } catch (err) {
      console.error('[standup] Failed to post summary:', err);
    }

    await interaction.reply({
      content: posted
        ? '✅ บันทึก Standup ของคุณแล้ว และส่งไปยัง channel Standup เรียบร้อย'
        : '✅ บันทึก Standup แล้ว แต่ไม่สามารถส่งไปยัง channel ได้ ตรวจสอบ `STANDUP_CHANNEL_ID` และสิทธิ์ของบอท',
      flags: MessageFlags.Ephemeral,
    });
  },
};
