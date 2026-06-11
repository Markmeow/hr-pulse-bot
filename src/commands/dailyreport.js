'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');

const getAllUsers = db.prepare('SELECT * FROM users WHERE guild_id = ?');
const hasStandupToday = db.prepare(
  "SELECT id FROM standups WHERE user_id = ? AND guild_id = ? AND date(created_at) = date('now')"
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dailyreport')
    .setDescription('แสดงสถานะการส่ง Daily Standup ของทุกคนวันนี้'),

  async execute(interaction) {
    await interaction.deferReply();

    const guildId = interaction.guildId;
    const today = new Date().toISOString().slice(0, 10);
    const users = getAllUsers.all(guildId);

    if (users.length === 0) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x6272a4)
            .setTitle('✦ ยังไม่มีสมาชิกลงทะเบียนในระบบ')
            .setDescription('สมาชิกต้องลงทะเบียนผ่านระบบ Auth ก่อน'),
        ],
      });
      return;
    }

    const roleGroups = new Map();

    for (const user of users) {
      const member = await interaction.guild.members.fetch(user.discord_id).catch(() => null);
      const submitted = !!hasStandupToday.get(user.discord_id, guildId);
      const status = submitted ? '✅' : '❌';
      const displayName = member ? member.displayName : user.username;

      let roleKey = 'ไม่มี Role';
      if (member) {
        const topRole = member.roles.cache
          .filter((r) => r.id !== interaction.guild.roles.everyone.id)
          .sort((a, b) => b.position - a.position)
          .first();
        if (topRole) roleKey = topRole.name;
      }

      if (!roleGroups.has(roleKey)) roleGroups.set(roleKey, []);
      roleGroups.get(roleKey).push(`${status} @${displayName}`);
    }

    const embed = new EmbedBuilder()
      .setColor(0xbd93f9)
      .setTitle(`🌸 รายงานประจำวัน ประจำวันที่ ${today}`)
      .setTimestamp();

    let doneCount = 0;
    let totalCount = 0;

    for (const [roleName, members] of roleGroups) {
      doneCount += members.filter((m) => m.startsWith('✅')).length;
      totalCount += members.length;
      embed.addFields({
        name: `「 ${roleName} 」`,
        value: members.join('\n'),
        inline: true,
      });
    }

    embed.setFooter({ text: `✦ ส่งแล้ว ${doneCount}/${totalCount} คน ✦` });

    await interaction.editReply({ embeds: [embed] });
  },
};
