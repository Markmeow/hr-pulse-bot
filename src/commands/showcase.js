'use strict';

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits,
} = require('discord.js');

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('showcase')
    .setDescription('โพสต์ตัวอย่างทุกฟีเจอร์ของบอทในช่องนี้ (Admin เท่านั้น)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.reply({ content: '🌸 กำลังโพสต์ showcase...', flags: MessageFlags.Ephemeral });

    const ch = interaction.channel;

    // ── 1. Header ──────────────────────────────────────────────────
    await ch.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xbd93f9)
          .setAuthor({
            name: 'HR Pulse Bot',
            iconURL: interaction.client.user.displayAvatarURL(),
          })
          .setTitle('✦ ยินดีต้อนรับสู่ HR Pulse Bot ✦')
          .setDescription(
            '🌸 บอทช่วยจัดการงานภายในทีม Internship\n' +
            'ดูได้เลยว่าบอททำอะไรได้บ้าง 👇'
          )
          .addFields(
            { name: '🔒 Auth', value: 'ระบบยืนยันตัวตน', inline: true },
            { name: '🗒️ Standup', value: 'Daily Standup', inline: true },
            { name: '📊 Report', value: 'รายงานประจำวัน', inline: true },
            { name: '📋 Todo', value: 'รายการงาน', inline: true },
            { name: '⏰ Remind', value: 'การแจ้งเตือน', inline: true },
            { name: '🌸 Break', value: 'ระบบพักผ่อน', inline: true },
            { name: '📣 Event', value: 'ประกาศอัตโนมัติ', inline: true },
            { name: '🗑️ Clear', value: 'เคลียร์ช่อง', inline: true },
            { name: '❓ Help', value: 'คู่มือแต่ละช่อง', inline: true },
          )
          .setFooter({ text: '✦ HR Pulse Bot — Internship Assistant ✦' }),
      ],
    });

    await delay(800);

    // ── 2. Auth ────────────────────────────────────────────────────
    await ch.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('🔒 ระบบยืนยันตัวตน (Authentication)')
          .setDescription(
            'สมาชิกใหม่ต้องยืนยันตัวตนก่อนใช้งานระบบ\n\n' +
            '**ขั้นตอน:**\n' +
            '1️⃣ กรอก Invite Key ที่ได้จาก Admin (ถ้ามีระบบ Key)\n' +
            '2️⃣ กด **สมัครสมาชิก** แล้วตั้ง username / password\n' +
            '3️⃣ ระบบจดจำบัญชี ไม่ต้อง login ซ้ำ ✅'
          )
          .addFields(
            { name: '📝 สมัครสมาชิก', value: 'ตั้ง username และ password ครั้งแรก', inline: true },
            { name: '🔑 เข้าสู่ระบบ', value: 'สำหรับคนที่มีบัญชีแล้ว', inline: true },
            { name: '🔒 ลืมรหัสผ่าน', value: 'ตั้งรหัสผ่านใหม่ได้เลย', inline: true },
            { name: '🗝️ Invite Key', value: 'Admin สร้าง key แจกสมาชิก ป้องกันคนนอกเข้า', inline: false },
          ),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('demo_register').setLabel('สมัครสมาชิก (Register)').setEmoji('📝').setStyle(ButtonStyle.Primary).setDisabled(true),
          new ButtonBuilder().setCustomId('demo_login').setLabel('เข้าสู่ระบบ (Login)').setEmoji('🔑').setStyle(ButtonStyle.Success).setDisabled(true),
          new ButtonBuilder().setCustomId('demo_reset').setLabel('ลืมรหัสผ่าน (Reset)').setEmoji('🔒').setStyle(ButtonStyle.Danger).setDisabled(true),
          new ButtonBuilder().setCustomId('demo_key').setLabel('กรอกคีย์พิเศษ (Key)').setEmoji('🗝️').setStyle(ButtonStyle.Secondary).setDisabled(true),
        ),
      ],
    });

    await delay(800);

    // ── 3. Standup ─────────────────────────────────────────────────
    await ch.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle('🗒️ Daily Standup')
          .setDescription('รัน `/standup` แล้วกรอกฟอร์ม บอทจะส่งสรุปมาที่ช่อง standup')
          .addFields(
            { name: '✅ เมื่อวาน', value: 'ทำ feature login และ review PR ของทีม', inline: false },
            { name: '🎯 วันนี้', value: 'ทำ API endpoint ของ dashboard และเขียน unit test', inline: false },
            { name: '🚧 อุปสรรค', value: 'ติด bug เรื่อง CORS ของ server กำลังหาวิธีแก้อยู่', inline: false },
          )
          .setAuthor({ name: 'ตัวอย่าง — สมาชิกทีม' })
          .setTimestamp(),
      ],
    });

    await delay(800);

    // ── 4. Daily Report ────────────────────────────────────────────
    await ch.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xbd93f9)
          .setTitle('📊 Daily Report ประจำวันที่ 2026-06-11')
          .setDescription('รัน `/dailyreport` เพื่อดูสถานะการส่ง standup ของทุกคน แยกตาม Role')
          .addFields(
            {
              name: '「 TN Backend 」',
              value: '✅ @Backend-Kong\n✅ @Backend-Mark\n❌ @Backend-Non\n❌ @Backend-Pook',
              inline: true,
            },
            {
              name: '「 TN Frontend 」',
              value: '✅ @Frontend-Aom\n❌ @Frontend-Game\n✅ @Frontend-Tik',
              inline: true,
            },
          )
          .setFooter({ text: '✦ ส่งแล้ว 4/7 คน ✦' })
          .setTimestamp(),
      ],
    });

    await delay(800);

    // ── 5. Todo ────────────────────────────────────────────────────
    await ch.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff79c6)
          .setTitle('📋 ระบบรายการงาน (Todo)')
          .setDescription('จัดการงานส่วนตัวได้ด้วยคำสั่ง `/todo`')
          .addFields(
            {
              name: '✦ รายการภารกิจ ✦',
              value: [
                '`01` 「 **#1** 」 ทำ API documentation',
                '`02` 「 **#2** 」 Review code ของทีม',
                '`03` 「 **#3** 」 ประชุม Sprint planning',
              ].join('\n'),
            },
            {
              name: '🌸 คำสั่งที่ใช้ได้',
              value: '`/todo add task:` · `/todo list` · `/todo done id:`',
            },
          ),
      ],
    });

    await delay(800);

    // ── 6. Remind ──────────────────────────────────────────────────
    await ch.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xfee75c)
          .setTitle('⏰ ระบบแจ้งเตือน (Reminder)')
          .setDescription('ตั้งแจ้งเตือนได้ด้วย `/remind add` บอทจะ ping คุณเมื่อถึงเวลา')
          .addFields(
            {
              name: '📋 ตัวอย่างการแจ้งเตือน',
              value: [
                '**#1** • <t:1749600000:R> — ส่งรายงานสัปดาห์',
                '**#2** • <t:1749610800:R> — ประชุมทีม Backend',
                '**#3** • <t:1749621600:R> — Review PR ก่อนสิ้นวัน',
              ].join('\n'),
            },
            {
              name: '⏱️ รูปแบบเวลา',
              value: '`30m` `2h` `1d` `1h30m` `2026-06-20 14:30`',
            },
          ),
      ],
    });

    await delay(800);

    // ── 7. Break ───────────────────────────────────────────────────
    await ch.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff79c6)
          .setTitle('🌸 ระบบพักประจำวัน (Break)')
          .setDescription('ตั้งเวลาพักด้วย `/break set` บอทจะแจ้งเตือนทุกคนในช่องเมื่อถึงเวลา')
          .addFields(
            {
              name: '「 ตัวอย่าง: สถานะการพักของคุณ 」',
              value: [
                '**ช่วงพัก:** 12:00 — 13:00 น.',
                '**ระยะเวลา:** 1 ชั่วโมง',
                '**กิจกรรม:** 🍜 กินข้าว',
                '**ความคืบหน้า:** `████████░░░░` **67%**',
                '⏱️ เหลืออีก **20 นาที**',
              ].join('\n'),
            },
          ),
      ],
    });

    await delay(400);

    await ch.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xbd93f9)
          .setTitle('✦ Daily Break Dashboard ✦')
          .setDescription(
            '☕ **กำลังพักอยู่ (2)**\n' +
            '> <@000000000000000001> — **12:00–13:00 น.** · 🍜 กินข้าว\n' +
            '> `████████░░░░` **67%** ⏱️ เหลืออีก **20 นาที**\n' +
            '> <@000000000000000002> — **12:30–13:00 น.** · 😴 งีบหลับ\n' +
            '> `████░░░░░░░░` **33%** ⏱️ เหลืออีก **30 นาที**\n\n' +
            '⏳ **รอพัก — Upcoming (1)**\n' +
            '> <@000000000000000003> — **13:00–14:00 น.**\n\n' +
            '✅ **เสร็จสิ้นแล้ววันนี้ (1)**\n' +
            '> <@000000000000000004> — **10:00–10:30 น.** · ☕ พักกาแฟ *(28 นาที)*'
          )
          .addFields({
            name: '「 สรุป 」',
            value: '☕ พักอยู่ **2**  ·  ⏳ รอพัก **1**  ·  ✅ เสร็จแล้ว **1**',
          })
          .setFooter({ text: '🌸 วันที่ 2026-06-11' })
          .setTimestamp(),
      ],
    });

    await delay(800);

    // ── 8. Event ───────────────────────────────────────────────────
    await ch.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xffb86c)
          .setTitle('📣 ระบบประกาศอีเว้น (Event Scheduler)')
          .setDescription('Admin สร้างประกาศที่บอทจะโพสต์อัตโนมัติ**ทุกวัน**ตามเวลาที่กำหนด')
          .addFields(
            {
              name: '🗓️ ตัวอย่างประกาศที่ตั้งไว้',
              value: [
                '✅ `#1` **09:00 น.** — ได้เวลาเริ่มงานแล้ว!',
                '✅ `#2` **12:00 น.** — พักเที่ยงแล้วจ้า!',
                '✅ `#3` **13:00 น.** — หมดเวลาพัก กลับมาลุยกัน!',
                '✅ `#4` **18:00 น.** — เลิกงานกันได้แล้ว!',
              ].join('\n'),
            },
            {
              name: '⚙️ คำสั่ง Admin',
              value: '`/event add` · `/event list` · `/event edit id:` · `/event delete id:`',
            },
          ),
      ],
    });

    await delay(800);

    // ── 9. Clear & Help ────────────────────────────────────────────
    await ch.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x6272a4)
          .setTitle('🛠️ คำสั่งอื่นๆ')
          .addFields(
            {
              name: '🗑️ /clear [amount]',
              value: 'ลบข้อความในช่องได้สูงสุด 100 ข้อความต่อครั้ง (ต้องมีสิทธิ์ Manage Messages)',
              inline: false,
            },
            {
              name: '❓ /help',
              value: 'แสดงคำสั่งที่ใช้ได้ในช่องนั้นๆ แต่ละช่องแสดงข้อมูลต่างกัน',
              inline: false,
            },
          )
          .setFooter({ text: '✦ HR Pulse Bot — พร้อมใช้งาน ✦' }),
      ],
    });

    await interaction.editReply({ content: '✅ โพสต์ showcase เสร็จแล้วครับ!' });
  },
};
