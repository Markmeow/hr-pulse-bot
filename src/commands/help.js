'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('แสดงคำสั่งทั้งหมด'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xbd93f9)
      .setAuthor({
        name: 'HR Pulse Bot — คู่มือการใช้งาน',
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setDescription('🌸 รายการคำสั่งทั้งหมดที่ใช้ได้ในระบบ')
      .addFields(
        {
          name: '📋 รายการงาน',
          value: [
            '✦ `/todo add task:` — เพิ่มงานใหม่',
            '✦ `/todo list` — ดูงานที่ค้างอยู่',
            '✦ `/todo done id:` — ทำเครื่องหมายเสร็จแล้ว',
          ].join('\n'),
          inline: false,
        },
        {
          name: '🗒️ Daily Standup',
          value: '✦ `/standup` — บันทึกว่าเมื่อวานทำอะไร วันนี้จะทำอะไร มีอุปสรรคไหม',
          inline: false,
        },
        {
          name: '📊 รายงานประจำวัน',
          value: '✦ `/dailyreport` — ดูสถานะการส่ง standup ของทุกคน แยกตาม Role',
          inline: false,
        },
        {
          name: '⏰ การแจ้งเตือน',
          value: [
            '✦ `/remind add when: message:` — ตั้งแจ้งเตือน',
            '✦ `/remind list` — ดูรายการแจ้งเตือนที่รอ',
            '> ตัวอย่าง when: `30m` `2h` `1d` `1h30m` `2025-06-20 14:30`',
          ].join('\n'),
          inline: false,
        },
        {
          name: '🌸 การพักประจำวัน',
          value: [
            '✦ `/break set time: duration: activity:` — ตั้งเวลาพัก + เลือกกิจกรรม',
            '✦ `/break status` — ดูสถานะการพักของตัวเอง',
            '✦ `/break return` — แจ้งกลับมาทำงานต่อ',
            '✦ `/break dashboard` — ดูสถานะพักของทุกคนวันนี้',
          ].join('\n'),
          inline: false,
        },
        {
          name: '📣 ประกาศอีเว้น  *(Admin)*',
          value: [
            '✦ `/event add` — สร้างประกาศที่โพสต์อัตโนมัติทุกวัน',
            '✦ `/event list` — ดูรายการประกาศทั้งหมด',
            '✦ `/event edit id:` — แก้ไขประกาศ',
            '✦ `/event delete id:` — ลบประกาศ',
          ].join('\n'),
          inline: false,
        },
        {
          name: '🔒 ระบบยืนยันตัวตน  *(Admin)*',
          value: [
            '✦ `/auth setup role:` — ส่ง Auth Panel ไปยัง channel นี้',
            '✦ `/auth create role:` — สร้าง channel ยืนยันตัวตนใหม่พร้อม permission',
          ].join('\n'),
          inline: false,
        },
      )
      .setFooter({ text: '✦ คำตอบส่วนใหญ่มองเห็นได้เฉพาะคุณเท่านั้น  •  /help' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
