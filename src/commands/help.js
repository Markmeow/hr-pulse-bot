'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

const SECTIONS = {
  auth: () =>
    new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🔒 ช่องยืนยันตัวตน — คำสั่งที่ใช้ได้')
      .addFields(
        {
          name: '📝 สมัครสมาชิก',
          value: 'กดปุ่ม **สมัครสมาชิก** แล้วกรอก username / password',
        },
        {
          name: '🔑 เข้าสู่ระบบ',
          value: 'กดปุ่ม **เข้าสู่ระบบ** สำหรับคนที่มีบัญชีแล้ว',
        },
        {
          name: '🗝️ กรอกคีย์พิเศษ',
          value: 'ถ้า Admin เปิดระบบ Key ต้องกรอก Key ก่อน แล้วค่อยสมัครสมาชิก',
        },
        {
          name: '🔒 ลืมรหัสผ่าน',
          value: 'กดปุ่ม **ลืมรหัสผ่าน** แล้วตั้งรหัสใหม่ได้เลย',
        },
        {
          name: '⚙️ Admin',
          value: [
            '✦ `/auth setup role:` — ส่ง Auth Panel มาที่ช่องนี้',
            '✦ `/auth create role:` — สร้างช่องยืนยันตัวตนใหม่',
            '✦ `/auth key generate` — สร้าง Invite Key',
            '✦ `/auth key list` — ดูสถานะ Key ทั้งหมด',
            '✦ `/auth key revoke key:` — ลบ Key',
          ].join('\n'),
        }
      )
      .setFooter({ text: '✦ ระบบจะจดจำบัญชีของคุณ ไม่ต้อง login ซ้ำ ✦' }),

  standup: () =>
    new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('🗒️ ช่อง Standup — คำสั่งที่ใช้ได้')
      .addFields(
        {
          name: '🗒️ บันทึก Daily Standup',
          value: [
            '✦ `/standup` — เปิดฟอร์มกรอก standup',
            '> • เมื่อวานทำอะไร',
            '> • วันนี้จะทำอะไร',
            '> • มีอุปสรรคไหม',
          ].join('\n'),
        },
        {
          name: '📊 รายงานประจำวัน',
          value: [
            '✦ `/dailyreport` — ดูสถานะการส่ง standup ของทุกคนวันนี้',
            '> แยกตาม Discord Role พร้อมแสดง ✅ / ❌',
          ].join('\n'),
        }
      )
      .setFooter({ text: '✦ สรุป standup จะถูกโพสต์มาในช่องนี้อัตโนมัติ ✦' }),

  break: () =>
    new EmbedBuilder()
      .setColor(0xff79c6)
      .setTitle('🌸 ช่องแจ้งพัก — คำสั่งที่ใช้ได้')
      .addFields(
        {
          name: '⏰ ตั้งเวลาพัก',
          value: [
            '✦ `/break set time: duration: activity:`',
            '> ตัวอย่าง: `/break set time:12:00 duration:1h activity:🍜 กินข้าว`',
            '> บอทจะแจ้งเตือนในช่องนี้เมื่อถึงเวลา',
          ].join('\n'),
        },
        {
          name: '📋 ดูสถานะ',
          value: [
            '✦ `/break status` — ดูสถานะการพักของตัวเอง',
            '✦ `/break dashboard` — ดูสถานะพักของทุกคนวันนี้',
          ].join('\n'),
        },
        {
          name: '✅ แจ้งกลับ',
          value: '✦ `/break return` — แจ้งว่าพักเสร็จแล้วและกลับมาทำงาน',
        },
        {
          name: '🎯 กิจกรรมที่เลือกได้',
          value: '🍜 กินข้าว · 😴 งีบหลับ · ☕ พักดื่มกาแฟ · 🚶 เดินเล่น · 🛁 อาบน้ำ · 🛒 ซื้อของ · 📱 พักสายตา',
        }
      )
      .setFooter({ text: '✦ บอทแจ้งเตือนอีกครั้ง 5 นาทีก่อนหมดเวลา ✦' }),

  general: () =>
    new EmbedBuilder()
      .setColor(0xbd93f9)
      .setTitle('💬 ช่องทั่วไป — คำสั่งที่ใช้ได้')
      .addFields(
        {
          name: '📋 รายการงาน',
          value: [
            '✦ `/todo add task:` — เพิ่มงานใหม่',
            '✦ `/todo list` — ดูงานที่ค้างอยู่',
            '✦ `/todo done id:` — ทำเครื่องหมายเสร็จแล้ว',
          ].join('\n'),
        },
        {
          name: '⏰ การแจ้งเตือน',
          value: [
            '✦ `/remind add when: message:` — ตั้งแจ้งเตือน',
            '✦ `/remind list` — ดูรายการแจ้งเตือนที่รอ',
            '> ตัวอย่าง when: `30m` `2h` `1d` `1h30m` `2025-06-20 14:30`',
          ].join('\n'),
        }
      )
      .setFooter({ text: '✦ คำตอบมองเห็นได้เฉพาะคุณเท่านั้น ✦' }),

  overview: (channelMap) => {
    const lines = [
      channelMap.auth     && `🔒 ยืนยันตัวตน → <#${channelMap.auth}>`,
      channelMap.standup  && `🗒️ Standup → <#${channelMap.standup}>`,
      channelMap.break    && `🌸 แจ้งพัก → <#${channelMap.break}>`,
      channelMap.general  && `💬 ทั่วไป → <#${channelMap.general}>`,
    ].filter(Boolean);

    return new EmbedBuilder()
      .setColor(0xbd93f9)
      .setAuthor({ name: 'HR Pulse Bot — ภาพรวม' })
      .setDescription('พิมพ์ `/help` ในแต่ละช่องเพื่อดูคำสั่งของช่องนั้นๆ')
      .addFields(
        {
          name: '🗺️ ช่องและคำสั่งของแต่ละช่อง',
          value: lines.length > 0
            ? lines.join('\n')
            : 'Admin ยังไม่ได้ตั้งค่า channel ID ใน .env',
        },
        {
          name: '📣 ประกาศอีเว้น *(Admin)*',
          value: [
            '✦ `/event add` — สร้างประกาศอัตโนมัติทุกวัน',
            '✦ `/event list` — ดูรายการประกาศ',
            '✦ `/event edit id:` — แก้ไข · `/event delete id:` — ลบ',
          ].join('\n'),
        }
      )
      .setFooter({ text: '✦ /help ใช้ได้ทุกช่อง ✦' });
  },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('แสดงคำสั่งที่ใช้ได้ในช่องนี้'),

  async execute(interaction) {
    const channelId = interaction.channelId;

    const channelMap = {
      auth:    process.env.AUTH_CHANNEL_ID    || null,
      standup: process.env.STANDUP_CHANNEL_ID || null,
      break:   process.env.BREAK_CHANNEL_ID   || null,
      general: process.env.GENERAL_CHANNEL_ID || null,
    };

    let embed;
    if (channelId === channelMap.auth)    embed = SECTIONS.auth();
    else if (channelId === channelMap.standup) embed = SECTIONS.standup();
    else if (channelId === channelMap.break)   embed = SECTIONS.break();
    else if (channelId === channelMap.general) embed = SECTIONS.general();
    else embed = SECTIONS.overview(channelMap);

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
