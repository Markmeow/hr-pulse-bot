'use strict';

const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const db = require('../database/db');

const COLOR_MAP = {
  purple: 0xbd93f9,
  blue:   0x5865f2,
  pink:   0xff79c6,
  green:  0x57f287,
  orange: 0xffb86c,
  red:    0xff5555,
};

const colorChoices = [
  { name: '🟣 ม่วง',    value: 'purple' },
  { name: '🔵 น้ำเงิน', value: 'blue'   },
  { name: '🩷 ชมพู',    value: 'pink'   },
  { name: '🟢 เขียว',   value: 'green'  },
  { name: '🟠 ส้ม',     value: 'orange' },
  { name: '🔴 แดง',     value: 'red'    },
];

const insertEvent = db.prepare(`
  INSERT INTO events (guild_id, channel_id, title, description, post_time, ping_everyone, ping_role_id, color, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const getEvent   = db.prepare('SELECT * FROM events WHERE id = ? AND guild_id = ?');
const listEvents = db.prepare('SELECT * FROM events WHERE guild_id = ? ORDER BY post_time ASC');
const updateEvent = db.prepare(`
  UPDATE events
  SET title = ?, description = ?, post_time = ?, channel_id = ?,
      ping_everyone = ?, ping_role_id = ?, color = ?, active = ?
  WHERE id = ? AND guild_id = ?
`);
const deleteEvent = db.prepare('DELETE FROM events WHERE id = ? AND guild_id = ?');

function parseTime(str) {
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(str)) return str;
  if (/^\d:[0-5]\d$/.test(str)) return `0${str}`;
  return null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('จัดการประกาศอีเว้นอัตโนมัติ (Admin เท่านั้น)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('เพิ่มประกาศอีเว้นใหม่')
        .addStringOption((opt) =>
          opt.setName('title').setDescription('หัวข้อประกาศ').setRequired(true).setMaxLength(100)
        )
        .addStringOption((opt) =>
          opt.setName('description').setDescription('เนื้อหาประกาศ').setRequired(true).setMaxLength(2000)
        )
        .addStringOption((opt) =>
          opt.setName('time').setDescription('เวลาที่จะโพสต์ทุกวัน (HH:MM เช่น 09:00)').setRequired(true)
        )
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('ช่องที่จะโพสต์')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addBooleanOption((opt) =>
          opt.setName('ping_everyone').setDescription('แท็ก @everyone ด้วยไหม?').setRequired(false)
        )
        .addRoleOption((opt) =>
          opt.setName('ping_role').setDescription('Role ที่จะแท็ก (ถ้ามี)').setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName('color')
            .setDescription('สีของ embed (ค่าเริ่มต้น: ม่วง)')
            .setRequired(false)
            .addChoices(...colorChoices)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('list').setDescription('ดูรายการอีเว้นทั้งหมด')
    )
    .addSubcommand((sub) =>
      sub
        .setName('edit')
        .setDescription('แก้ไขอีเว้น')
        .addIntegerOption((opt) =>
          opt.setName('id').setDescription('ID ของอีเว้นที่จะแก้ไข').setRequired(true).setMinValue(1)
        )
        .addStringOption((opt) =>
          opt.setName('title').setDescription('หัวข้อใหม่').setRequired(false).setMaxLength(100)
        )
        .addStringOption((opt) =>
          opt.setName('description').setDescription('เนื้อหาใหม่').setRequired(false).setMaxLength(2000)
        )
        .addStringOption((opt) =>
          opt.setName('time').setDescription('เวลาใหม่ (HH:MM)').setRequired(false)
        )
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('ช่องใหม่')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt.setName('ping_everyone').setDescription('แท็ก @everyone?').setRequired(false)
        )
        .addRoleOption((opt) =>
          opt.setName('ping_role').setDescription('Role ที่จะแท็ก').setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName('color').setDescription('สีใหม่').setRequired(false).addChoices(...colorChoices)
        )
        .addBooleanOption((opt) =>
          opt.setName('active').setDescription('เปิด (true) / ปิด (false) อีเว้นนี้').setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('ลบอีเว้น')
        .addIntegerOption((opt) =>
          opt.setName('id').setDescription('ID ของอีเว้นที่จะลบ').setRequired(true).setMinValue(1)
        )
    ),

  async execute(interaction) {
    const sub     = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === 'add') {
      const title       = interaction.options.getString('title', true);
      const description = interaction.options.getString('description', true);
      const rawTime     = interaction.options.getString('time', true);
      const channel     = interaction.options.getChannel('channel', true);
      const pingEveryone = interaction.options.getBoolean('ping_everyone') ?? false;
      const pingRole    = interaction.options.getRole('ping_role');
      const colorKey    = interaction.options.getString('color') ?? 'purple';

      const postTime = parseTime(rawTime);
      if (!postTime) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff5555)
              .setTitle('✦ รูปแบบเวลาไม่ถูกต้อง')
              .setDescription('ตัวอย่าง: `09:00`, `12:30`, `18:00`'),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      const result = insertEvent.run(
        guildId, channel.id, title, description, postTime,
        pingEveryone ? 1 : 0, pingRole?.id ?? null, COLOR_MAP[colorKey],
        interaction.user.id
      );

      const pingText = [
        pingEveryone && '@everyone',
        pingRole && `<@&${pingRole.id}>`,
      ].filter(Boolean).join(' ') || 'ไม่มี';

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('✅ เพิ่มอีเว้นสำเร็จ!')
            .addFields(
              { name: '「 ID 」',      value: `#${result.lastInsertRowid}`, inline: true  },
              { name: '「 หัวข้อ 」',   value: title,                        inline: true  },
              { name: '「 เวลา 」',     value: `**${postTime} น.** ทุกวัน`, inline: true  },
              { name: '「 ช่อง 」',     value: `<#${channel.id}>`,           inline: true  },
              { name: '「 แท็ก 」',     value: pingText,                     inline: true  }
            )
            .setFooter({ text: '✦ บอทจะโพสต์ประกาศนี้อัตโนมัติทุกวัน ✦' }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'list') {
      const events = listEvents.all(guildId);

      if (events.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x6272a4)
              .setTitle('✦ ยังไม่มีอีเว้น')
              .setDescription('เพิ่มได้ด้วย `/event add`'),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      const lines = events.map((e) => {
        const status = e.active ? '✅' : '⏸️';
        const ping = [e.ping_everyone && '@everyone', e.ping_role_id && `<@&${e.ping_role_id}>`]
          .filter(Boolean).join(' ') || 'ไม่มี';
        return `${status} \`#${e.id}\` **${e.post_time} น.** — ${e.title}\n> ช่อง: <#${e.channel_id}> · แท็ก: ${ping}`;
      }).join('\n\n');

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xbd93f9)
            .setTitle('🗓️ รายการอีเว้นอัตโนมัติ')
            .setDescription(lines)
            .setFooter({ text: `✦ ทั้งหมด ${events.length} รายการ ✦` }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'edit') {
      const id       = interaction.options.getInteger('id', true);
      const existing = getEvent.get(id, guildId);

      if (!existing) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff5555)
              .setTitle('✦ ไม่พบอีเว้น')
              .setDescription(`ไม่พบอีเว้น #${id} ตรวจสอบรายการด้วย \`/event list\``),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      const title       = interaction.options.getString('title')       ?? existing.title;
      const description = interaction.options.getString('description') ?? existing.description;
      const rawTime     = interaction.options.getString('time');
      const postTime    = rawTime ? parseTime(rawTime) : existing.post_time;

      if (!postTime) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff5555)
              .setTitle('✦ รูปแบบเวลาไม่ถูกต้อง')
              .setDescription('ตัวอย่าง: `09:00`, `12:30`'),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      const channel      = interaction.options.getChannel('channel');
      const channelId    = channel?.id ?? existing.channel_id;
      const pingEveryone = interaction.options.getBoolean('ping_everyone') ?? !!existing.ping_everyone;
      const pingRole     = interaction.options.getRole('ping_role');
      const pingRoleId   = pingRole ? pingRole.id : existing.ping_role_id;
      const colorKey     = interaction.options.getString('color');
      const color        = colorKey ? COLOR_MAP[colorKey] : existing.color;
      const active       = interaction.options.getBoolean('active') ?? !!existing.active;

      updateEvent.run(title, description, postTime, channelId, pingEveryone ? 1 : 0, pingRoleId, color, active ? 1 : 0, id, guildId);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle(`✅ แก้ไขอีเว้น #${id} สำเร็จ`)
            .addFields(
              { name: '「 หัวข้อ 」', value: title,                          inline: true },
              { name: '「 เวลา 」',   value: `**${postTime} น.** ทุกวัน`,   inline: true },
              { name: '「 ช่อง 」',   value: `<#${channelId}>`,              inline: true },
              { name: '「 สถานะ 」',  value: active ? '✅ เปิด' : '⏸️ ปิด', inline: true },
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'delete') {
      const id       = interaction.options.getInteger('id', true);
      const existing = getEvent.get(id, guildId);

      if (!existing) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff5555)
              .setTitle('✦ ไม่พบอีเว้น')
              .setDescription(`ไม่พบอีเว้น #${id} ตรวจสอบรายการด้วย \`/event list\``),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      deleteEvent.run(id, guildId);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle(`🗑️ ลบอีเว้น #${id} สำเร็จ`)
            .setDescription(`หัวข้อ: **${existing.title}** (${existing.post_time} น.) ถูกลบแล้ว`),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
