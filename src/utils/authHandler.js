'use strict';

const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} = require('discord.js');
const crypto = require('node:crypto');
const db = require('../database/db');

const findByDiscord = db.prepare('SELECT * FROM users WHERE discord_id = ? AND guild_id = ?');
const findByUsername = db.prepare('SELECT * FROM users WHERE username = ? AND guild_id = ?');
const insertUser = db.prepare(
  'INSERT INTO users (discord_id, username, password_hash, guild_id) VALUES (?, ?, ?, ?)'
);
const updateLastLogin = db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?");
const updatePassword = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
const updateApiKey = db.prepare('UPDATE users SET api_key = ? WHERE id = ?');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
}

function eph(content) {
  return { content, flags: MessageFlags.Ephemeral };
}

async function handleRegisterButton(interaction, roleId) {
  const modal = new ModalBuilder()
    .setCustomId(`auth_register_modal:${roleId}`)
    .setTitle('📝 สมัครสมาชิก');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('username')
        .setLabel('ชื่อผู้ใช้ (Username)')
        .setStyle(TextInputStyle.Short)
        .setMinLength(3)
        .setMaxLength(32)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('password')
        .setLabel('รหัสผ่าน (Password)')
        .setStyle(TextInputStyle.Short)
        .setMinLength(6)
        .setMaxLength(64)
        .setPlaceholder('อย่างน้อย 6 ตัวอักษร')
        .setRequired(true)
    )
  );
  await interaction.showModal(modal);
}

async function handleLoginButton(interaction, roleId) {
  const modal = new ModalBuilder()
    .setCustomId(`auth_login_modal:${roleId}`)
    .setTitle('🔑 เข้าสู่ระบบ');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('username')
        .setLabel('ชื่อผู้ใช้ (Username)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('password')
        .setLabel('รหัสผ่าน (Password)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    )
  );
  await interaction.showModal(modal);
}

async function handleResetButton(interaction, roleId) {
  const modal = new ModalBuilder()
    .setCustomId(`auth_reset_modal:${roleId}`)
    .setTitle('🔒 ตั้งรหัสผ่านใหม่');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('username')
        .setLabel('ชื่อผู้ใช้ (Username)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('new_password')
        .setLabel('รหัสผ่านใหม่ (New Password)')
        .setStyle(TextInputStyle.Short)
        .setMinLength(6)
        .setMaxLength(64)
        .setRequired(true)
    )
  );
  await interaction.showModal(modal);
}

async function handleKeyButton(interaction, roleId) {
  const modal = new ModalBuilder()
    .setCustomId(`auth_key_modal:${roleId}`)
    .setTitle('🗝️ กรอกคีย์พิเศษ');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('api_key')
        .setLabel('API Key')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('กรอก API Key ของคุณที่นี่')
        .setRequired(true)
    )
  );
  await interaction.showModal(modal);
}

async function handleRegisterModal(interaction, roleId) {
  const username = interaction.fields.getTextInputValue('username').trim();
  const password = interaction.fields.getTextInputValue('password');
  const guildId = interaction.guildId;

  if (findByDiscord.get(interaction.user.id, guildId)) {
    return interaction.reply(eph('❌ Discord ของคุณถูกลงทะเบียนไปแล้ว กรุณาใช้ปุ่ม **เข้าสู่ระบบ** แทน'));
  }
  if (findByUsername.get(username, guildId)) {
    return interaction.reply(eph(`❌ ชื่อผู้ใช้ **${username}** ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น`));
  }

  insertUser.run(interaction.user.id, username, hashPassword(password), guildId);
  await assignRole(interaction, roleId);
  await interaction.reply(eph(`✅ สมัครสมาชิกสำเร็จ! ยินดีต้อนรับ **${username}** สู่ระบบ 🎉`));
}

async function handleLoginModal(interaction, roleId) {
  const username = interaction.fields.getTextInputValue('username').trim();
  const password = interaction.fields.getTextInputValue('password');

  const user = findByUsername.get(username, interaction.guildId);
  if (!user || user.discord_id !== interaction.user.id) {
    return interaction.reply(eph('❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'));
  }
  if (!verifyPassword(password, user.password_hash)) {
    return interaction.reply(eph('❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'));
  }

  updateLastLogin.run(user.id);
  await assignRole(interaction, roleId);
  await interaction.reply(eph(`✅ เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับกลับมา **${username}** 👋`));
}

async function handleResetModal(interaction, roleId) {
  const username = interaction.fields.getTextInputValue('username').trim();
  const newPassword = interaction.fields.getTextInputValue('new_password');

  const user = findByUsername.get(username, interaction.guildId);
  if (!user || user.discord_id !== interaction.user.id) {
    return interaction.reply(eph('❌ ไม่พบบัญชีนี้ หรือ Discord ของคุณไม่ตรงกับบัญชีดังกล่าว'));
  }

  updatePassword.run(hashPassword(newPassword), user.id);
  await interaction.reply(eph('✅ เปลี่ยนรหัสผ่านสำเร็จแล้ว'));
}

async function handleKeyModal(interaction, roleId) {
  const apiKey = interaction.fields.getTextInputValue('api_key').trim();

  const user = findByDiscord.get(interaction.user.id, interaction.guildId);
  if (!user) {
    return interaction.reply(eph('❌ คุณยังไม่ได้สมัครสมาชิก กรุณากดปุ่ม **สมัครสมาชิก** ก่อน'));
  }

  updateApiKey.run(apiKey, user.id);
  await interaction.reply(eph('✅ บันทึก API Key สำเร็จแล้ว'));
}

async function assignRole(interaction, roleId) {
  try {
    const role = await interaction.guild.roles.fetch(roleId);
    if (role) await interaction.member.roles.add(role);
  } catch (err) {
    console.warn('[auth] Could not assign role:', err.message);
  }
}

async function handleButton(interaction) {
  const colonIdx = interaction.customId.indexOf(':');
  const type = interaction.customId.slice(0, colonIdx);
  const roleId = interaction.customId.slice(colonIdx + 1);

  if (type === 'auth_register') return handleRegisterButton(interaction, roleId);
  if (type === 'auth_login') return handleLoginButton(interaction, roleId);
  if (type === 'auth_reset') return handleResetButton(interaction, roleId);
  if (type === 'auth_key') return handleKeyButton(interaction, roleId);
}

async function handleModal(interaction) {
  const colonIdx = interaction.customId.indexOf(':');
  const type = interaction.customId.slice(0, colonIdx);
  const roleId = interaction.customId.slice(colonIdx + 1);

  if (type === 'auth_register_modal') return handleRegisterModal(interaction, roleId);
  if (type === 'auth_login_modal') return handleLoginModal(interaction, roleId);
  if (type === 'auth_reset_modal') return handleResetModal(interaction, roleId);
  if (type === 'auth_key_modal') return handleKeyModal(interaction, roleId);
}

module.exports = { handleButton, handleModal };
