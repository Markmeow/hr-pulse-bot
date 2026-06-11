'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('showcase')
    .setDescription('แสดงรายการคำสั่งทั้งหมดของบอท (Admin เท่านั้น)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xbd93f9)
      .setAuthor({
        name: 'HR Pulse Bot',
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTitle('เมนูคำสั่งของ HR Pulse Bot')
      .setDescription('รายชื่อคำสั่งทั้งหมดที่คุณสามารถใช้งานได้ครับ:')
      .addFields(
        { name: '/auth', value: 'สมัคร / เข้าสู่ระบบ', inline: true },
        { name: '/standup', value: 'บันทึก Daily Standup', inline: true },
        { name: '/dailyreport', value: 'ดูสถานะ Standup ทีม', inline: true },
        { name: '/todo add', value: 'เพิ่มงานใหม่', inline: true },
        { name: '/todo list', value: 'ดูรายการงาน', inline: true },
        { name: '/todo done', value: 'ทำเครื่องหมายงานเสร็จ', inline: true },
        { name: '/remind add', value: 'ตั้งการแจ้งเตือน', inline: true },
        { name: '/remind list', value: 'ดูการแจ้งเตือนทั้งหมด', inline: true },
        { name: '/remind delete', value: 'ลบการแจ้งเตือน', inline: true },
        { name: '/break set', value: 'ตั้งเวลาพัก', inline: true },
        { name: '/break status', value: 'ดูสถานะการพักทีม', inline: true },
        { name: '/break cancel', value: 'ยกเลิกการพัก', inline: true },
        { name: '/event add', value: 'สร้างประกาศอัตโนมัติ', inline: true },
        { name: '/event list', value: 'ดูรายการประกาศ', inline: true },
        { name: '/event delete', value: 'ลบประกาศ', inline: true },
        { name: '/clear [จำนวน]', value: 'ลบข้อความในช่อง', inline: true },
        { name: '/help', value: 'ดูคู่มือตามช่องที่อยู่', inline: true },
        { name: '/showcase', value: 'แสดงหน้านี้', inline: true },
      )
      .setFooter({ text: 'พิมพ์ /help ในแต่ละช่องเพื่อดูคำสั่งละเอียด ✦' });

    await interaction.reply({ embeds: [embed] });
  },
};
