'use strict';

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require('discord.js');
const crypto = require('node:crypto');
const db = require('../database/db');

const insertKey  = db.prepare('INSERT INTO invite_keys (guild_id, key_value, created_by) VALUES (?, ?, ?)');
const listKeys   = db.prepare('SELECT * FROM invite_keys WHERE guild_id = ? ORDER BY created_at DESC');
const deleteKey  = db.prepare('DELETE FROM invite_keys WHERE key_value = ? AND guild_id = ?');
const findKey    = db.prepare('SELECT * FROM invite_keys WHERE key_value = ? AND guild_id = ?');

function generateKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(12);
  let raw = '';
  for (let i = 0; i < 12; i++) raw += chars[bytes[i] % chars.length];
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

function buildAuthEmbed(imageUrl) {
  const embed = new EmbedBuilder()
    .setTitle('🔒 ระบบยืนยันตัวตน (Authentication)')
    .setDescription(
      'ยินดีต้อนรับ! กรุณากดปุ่มด้านล่างเพื่อยืนยันสิทธิ์และเข้าใช้งานระบบของบอท\n\n' +
        '*(รหัสผ่านจะถูกบันทึกแบบเข้ารหัส Proxy Hash ปลอดภัย 100%)*'
    )
    .setColor(0x5865f2);
  if (imageUrl) embed.setImage(imageUrl);
  return embed;
}

function buildAuthRow(roleId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`auth_register:${roleId}`)
      .setLabel('สมัครสมาชิก (Register)')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`auth_login:${roleId}`)
      .setLabel('เข้าสู่ระบบ (Login)')
      .setEmoji('🔑')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`auth_reset:${roleId}`)
      .setLabel('ลืมรหัสผ่าน (Reset Password)')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`auth_key:${roleId}`)
      .setLabel('กรอกคีย์พิเศษ (Enter Key)')
      .setEmoji('🗝️')
      .setStyle(ButtonStyle.Secondary)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('auth')
    .setDescription('จัดการระบบยืนยันตัวตน')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('setup')
        .setDescription('ส่ง Auth Panel ไปยัง channel นี้')
        .addRoleOption((opt) =>
          opt.setName('role').setDescription('Role ที่จะให้เมื่อ Login/Register สำเร็จ').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('image_url').setDescription('URL รูปภาพใน embed (ไม่บังคับ)').setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('สร้าง channel ยืนยันตัวตนใหม่พร้อม permission และ Auth Panel อัตโนมัติ')
        .addRoleOption((opt) =>
          opt.setName('role').setDescription('Role ที่จะให้เมื่อ Login/Register สำเร็จ').setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('channel_name')
            .setDescription('ชื่อ channel ที่จะสร้าง (ค่าเริ่มต้น: ยืนยันตัวตน)')
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName('image_url').setDescription('URL รูปภาพใน embed (ไม่บังคับ)').setRequired(false)
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName('key')
        .setDescription('จัดการ Invite Key')
        .addSubcommand((sub) =>
          sub
            .setName('generate')
            .setDescription('สร้าง Invite Key ใหม่')
            .addIntegerOption((opt) =>
              opt
                .setName('count')
                .setDescription('จำนวน Key ที่จะสร้าง (1–10)')
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)
            )
        )
        .addSubcommand((sub) =>
          sub.setName('list').setDescription('ดูรายการ Key ทั้งหมด')
        )
        .addSubcommand((sub) =>
          sub
            .setName('revoke')
            .setDescription('ลบ Key')
            .addStringOption((opt) =>
              opt.setName('key').setDescription('Key ที่จะลบ เช่น ABCD-EFGH-1234').setRequired(true)
            )
        )
    ),

  async execute(interaction) {
    const sub   = interaction.options.getSubcommand();
    const group = interaction.options.getSubcommandGroup();
    const guildId = interaction.guildId;
    const authChannelId = process.env.AUTH_CHANNEL_ID;

    if (!group && authChannelId && interaction.channelId !== authChannelId) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff5555)
            .setTitle('✦ ไม่สามารถใช้คำสั่งนี้ที่นี่ได้')
            .setDescription(`คำสั่ง \`/auth\` ต้องใช้ใน <#${authChannelId}> เท่านั้น`),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (group === 'key') {
      if (sub === 'generate') {
        const count = interaction.options.getInteger('count') ?? 1;
        const generated = [];

        for (let i = 0; i < count; i++) {
          let key, attempts = 0;
          do {
            key = generateKey();
            attempts++;
          } while (attempts < 10 && findKey.get(key, guildId));

          try {
            insertKey.run(guildId, key, interaction.user.id);
            generated.push(key);
          } catch {
            generated.push(`(ซ้ำ — ลองใหม่)`);
          }
        }

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x57f287)
              .setTitle(`🗝️ สร้าง Invite Key สำเร็จ (${generated.length} key)`)
              .setDescription(
                generated.map((k) => `\`${k}\``).join('\n')
              )
              .setFooter({ text: '✦ คัดลอก key แล้วส่งให้สมาชิกทีมผ่าน DM หรือ LINE ✦' }),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (sub === 'list') {
        const keys = listKeys.all(guildId);

        if (keys.length === 0) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x6272a4)
                .setTitle('✦ ยังไม่มี Invite Key')
                .setDescription('สร้างได้ด้วย `/auth key generate`'),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }

        const statusIcon = { active: '🟢', reserved: '🟡', used: '🔴' };
        const lines = keys.map((k) => {
          const icon = statusIcon[k.status] ?? '⚪';
          const extra = k.status === 'used'
            ? ` — ใช้โดย <@${k.used_by}>`
            : k.status === 'reserved'
              ? ` — จองโดย <@${k.reserved_by}>`
              : '';
          return `${icon} \`${k.key_value}\`${extra}`;
        }).join('\n');

        const active   = keys.filter((k) => k.status === 'active').length;
        const reserved = keys.filter((k) => k.status === 'reserved').length;
        const used     = keys.filter((k) => k.status === 'used').length;

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xbd93f9)
              .setTitle('🗝️ รายการ Invite Key ทั้งหมด')
              .setDescription(lines)
              .addFields({
                name: '「 สรุป 」',
                value: `🟢 ว่าง **${active}**  ·  🟡 จองแล้ว **${reserved}**  ·  🔴 ใช้แล้ว **${used}**`,
              })
              .setFooter({ text: '✦ ลบ key ด้วย /auth key revoke key:<key> ✦' }),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (sub === 'revoke') {
        const keyValue = interaction.options.getString('key', true).trim().toUpperCase();
        const existing = findKey.get(keyValue, guildId);

        if (!existing) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff5555)
                .setTitle('✦ ไม่พบ Key นี้')
                .setDescription(`\`${keyValue}\` ไม่มีในระบบ`),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }

        deleteKey.run(keyValue, guildId);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x57f287)
              .setTitle('🗑️ ลบ Key สำเร็จ')
              .setDescription(`\`${keyValue}\` ถูกลบออกจากระบบแล้ว`),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    if (sub === 'setup') {
      const role     = interaction.options.getRole('role', true);
      const imageUrl = interaction.options.getString('image_url');

      await interaction.reply({ content: '✅ ส่ง Auth Panel สำเร็จ!', flags: MessageFlags.Ephemeral });
      await interaction.channel.send({
        embeds: [buildAuthEmbed(imageUrl)],
        components: [buildAuthRow(role.id)],
      });
      return;
    }

    if (sub === 'create') {
      const role        = interaction.options.getRole('role', true);
      const channelName = interaction.options.getString('channel_name') || 'ยืนยันตัวตน';
      const imageUrl    = interaction.options.getString('image_url');

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const channel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel],
            deny: [
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.CreatePublicThreads,
            ],
          },
          {
            id: role.id,
            allow: [PermissionFlagsBits.ViewChannel],
            deny: [PermissionFlagsBits.SendMessages],
          },
          {
            id: interaction.client.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
        ],
      });

      await channel.send({
        embeds: [buildAuthEmbed(imageUrl)],
        components: [buildAuthRow(role.id)],
      });

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('✅ สร้าง Auth Channel สำเร็จ!')
            .addFields(
              { name: '「 Channel 」',    value: `<#${channel.id}>`,                      inline: true },
              { name: '「 Role 」',       value: `<@&${role.id}>`,                         inline: true },
              { name: '「 Permission 」', value: '@everyone เห็นได้ แต่พิมพ์ไม่ได้', inline: false }
            )
            .setFooter({ text: '✦ Auth Panel ถูกส่งเข้า channel แล้วอัตโนมัติ ✦' }),
        ],
      });
    }
  },
};
