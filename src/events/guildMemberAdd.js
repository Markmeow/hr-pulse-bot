'use strict';

const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const authChannelId = process.env.AUTH_CHANNEL_ID;

    // DM คนใหม่แจ้งให้ไปยืนยันตัวตน
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🌸 ยินดีต้อนรับสู่ Server!')
      .setDescription(
        `สวัสดี **${member.displayName}**! ยินดีต้อนรับเข้าสู่ **${member.guild.name}** 🎉\n\n` +
          `ก่อนเริ่มใช้งาน กรุณา **ยืนยันตัวตน** ก่อนนะครับ\n` +
          (authChannelId
            ? `➜ ไปที่ช่อง <#${authChannelId}> แล้วกด **สมัครสมาชิก** หรือ **เข้าสู่ระบบ**`
            : `➜ ไปที่ช่องยืนยันตัวตนในเซิร์ฟเวอร์แล้วกด **สมัครสมาชิก** หรือ **เข้าสู่ระบบ**`)
      )
      .addFields({
        name: '「 ขั้นตอน 」',
        value:
          '1️⃣ ไปที่ช่องยืนยันตัวตน\n' +
          '2️⃣ กด 📝 **สมัครสมาชิก** (ถ้ายังไม่มีบัญชี)\n' +
          '3️⃣ กรอก username และ password\n' +
          '4️⃣ ได้รับสิทธิ์เข้าใช้งานระบบ ✅',
      })
      .setFooter({ text: '✦ ระบบจะจดจำบัญชีของคุณ ไม่ต้อง login ซ้ำ ✦' })
      .setTimestamp();

    try {
      await member.send({ embeds: [embed] });
    } catch {
      // user ปิด DM — ส่งใน auth channel แทน
      if (authChannelId) {
        try {
          const channel = await member.guild.channels.fetch(authChannelId).catch(() => null);
          if (channel?.isTextBased()) {
            await channel.send({
              content: `👋 ยินดีต้อนรับ <@${member.id}>! กรุณากด **สมัครสมาชิก** หรือ **เข้าสู่ระบบ** ด้านบนเพื่อเข้าใช้งานระบบครับ`,
            });
          }
        } catch (err) {
          console.error('[guildMemberAdd] Failed to send welcome to auth channel:', err);
        }
      }
    }
  },
};
