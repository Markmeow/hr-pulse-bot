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
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const authChannelId = process.env.AUTH_CHANNEL_ID;

    if (authChannelId && interaction.channelId !== authChannelId) {
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

    if (sub === 'setup') {
      const role = interaction.options.getRole('role', true);
      const imageUrl = interaction.options.getString('image_url');

      await interaction.reply({ content: '✅ ส่ง Auth Panel สำเร็จ!', flags: MessageFlags.Ephemeral });
      await interaction.channel.send({
        embeds: [buildAuthEmbed(imageUrl)],
        components: [buildAuthRow(role.id)],
      });
      return;
    }

    if (sub === 'create') {
      const role = interaction.options.getRole('role', true);
      const channelName = interaction.options.getString('channel_name') || 'ยืนยันตัวตน';
      const imageUrl = interaction.options.getString('image_url');

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
              { name: '「 Channel 」', value: `<#${channel.id}>`, inline: true },
              { name: '「 Role 」', value: `<@&${role.id}>`, inline: true },
              { name: '「 Permission 」', value: '@everyone เห็นได้ แต่พิมพ์ไม่ได้', inline: false }
            )
            .setFooter({ text: '✦ Auth Panel ถูกส่งเข้า channel แล้วอัตโนมัติ ✦' }),
        ],
      });
    }
  },
};
