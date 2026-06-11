'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('แสดงคำสั่งทั้งหมด'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Internship Assistant Bot — คำสั่งทั้งหมด')
      .setDescription('นี่คือสิ่งที่ฉันช่วยคุณได้:')
      .setColor(0x5865f2)
      .addFields(
        {
          name: '📋 รายการงาน',
          value:
            '`/todo add task:<ข้อความ>` — เพิ่มงานใหม่\n' +
            '`/todo list` — ดูรายการงานที่ค้างอยู่\n' +
            '`/todo done id:<หมายเลข>` — ทำเครื่องหมายงานว่าเสร็จแล้ว',
        },
        {
          name: '🗒️ Daily Standup',
          value:
            '`/standup` — เปิดฟอร์มบันทึกว่าเมื่อวานทำอะไร วันนี้จะทำอะไร และมีอุปสรรคอะไรบ้าง สรุปจะถูกส่งไปยัง channel Standup ของทีม',
        },
        {
          name: '⏰ การแจ้งเตือน',
          value:
            '`/remind add when:<เวลา> message:<ข้อความ>` — ตั้งการแจ้งเตือน\n' +
            '`/remind list` — ดูรายการแจ้งเตือนที่รอดำเนินการ\n' +
            '_ตัวอย่างเวลา: `30m`, `2h`, `1d`, `1h30m` หรือ `2025-06-20 14:30`_',
        },
        {
          name: '🌸 การพักประจำวัน',
          value:
            '`/break set time:<HH:MM>` — ตั้งเวลาพัก บอทจะแจ้งเตือนเมื่อถึงเวลา\n' +
            '`/break status` — ดูสถานะการพักของตัวเอง\n' +
            '`/break return` — แจ้งว่าพักเสร็จแล้วและกลับมาทำงานต่อ\n' +
            '`/break dashboard` — ดูสถานะการพักของทุกคนในวันนี้',
        },
        {
          name: '🔒 ระบบยืนยันตัวตน',
          value:
            '`/auth setup role:<role>` — ส่ง Auth Panel ไปยัง channel นี้ (Admin เท่านั้น)',
        },
        {
          name: 'ℹ️ อื่นๆ',
          value: '`/help` — แสดงข้อความนี้',
        }
      )
      .setFooter({ text: 'เคล็ดลับ: คำตอบส่วนใหญ่จะมองเห็นได้เฉพาะคุณเท่านั้น' });

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
