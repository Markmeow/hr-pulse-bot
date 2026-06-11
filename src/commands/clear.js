'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('ลบข้อความในช่องนี้')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((opt) =>
      opt
        .setName('amount')
        .setDescription('จำนวนข้อความที่จะลบ (1–100, ค่าเริ่มต้น: 50)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(false)
    ),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount') ?? 50;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let deleted;
    try {
      deleted = await interaction.channel.bulkDelete(amount, true);
    } catch (err) {
      console.error('[clear] bulkDelete failed:', err);
      return interaction.editReply({
        content: '❌ ลบข้อความไม่ได้ ตรวจสอบว่าบอทมีสิทธิ์ **Manage Messages** ในช่องนี้',
      });
    }

    const reply = await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle('🗑️ เคลียร์ช่องเรียบร้อย')
          .setDescription(`ลบไป **${deleted.size}** ข้อความ`)
          .setFooter({ text: '✦ ข้อความที่เก่ากว่า 14 วันไม่สามารถลบแบบ bulk ได้ ✦' }),
      ],
    });

    setTimeout(() => reply.delete().catch(() => {}), 5000);
  },
};
