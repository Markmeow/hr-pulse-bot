'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../database/db');

// Prepared statements
const insertTodo = db.prepare(
  'INSERT INTO todos (user_id, guild_id, task) VALUES (?, ?, ?)'
);
const listOpenTodos = db.prepare(
  'SELECT * FROM todos WHERE user_id = ? AND guild_id = ? AND done = 0 ORDER BY id ASC'
);
const getTodoById = db.prepare(
  'SELECT * FROM todos WHERE id = ? AND user_id = ? AND guild_id = ?'
);
const completeTodo = db.prepare(
  "UPDATE todos SET done = 1, completed_at = datetime('now') WHERE id = ?"
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('todo')
    .setDescription('จัดการรายการงานของคุณ')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('เพิ่มงานใหม่ในรายการ')
        .addStringOption((opt) =>
          opt
            .setName('task')
            .setDescription('งานที่ต้องทำคืออะไร?')
            .setRequired(true)
            .setMaxLength(500)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('list').setDescription('ดูรายการงานที่ยังค้างอยู่')
    )
    .addSubcommand((sub) =>
      sub
        .setName('done')
        .setDescription('ทำเครื่องหมายงานว่าเสร็จแล้ว')
        .addIntegerOption((opt) =>
          opt
            .setName('id')
            .setDescription('หมายเลข ID ของงานที่เสร็จแล้ว (ดูได้จาก /todo list)')
            .setRequired(true)
            .setMinValue(1)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guildId;
    const avatar = interaction.user.displayAvatarURL();
    const name = interaction.user.displayName;

    // ---- /todo add ----
    if (sub === 'add') {
      const task = interaction.options.getString('task', true);
      const result = insertTodo.run(userId, guildId, task);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff79c6)
            .setAuthor({ name, iconURL: avatar })
            .setTitle('🌸 เพิ่มภารกิจใหม่แล้ว!')
            .addFields({ name: '「 ภารกิจ 」', value: task })
            .setFooter({ text: `✦ หมายเลขภารกิจ #${result.lastInsertRowid} ✦` })
            .setTimestamp(),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // ---- /todo list ----
    if (sub === 'list') {
      const todos = listOpenTodos.all(userId, guildId);

      if (todos.length === 0) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xbd93f9)
              .setAuthor({ name, iconURL: avatar })
              .setTitle('🌸 ไม่มีภารกิจค้างอยู่')
              .setDescription('✦ ยอดเยี่ยม! คุณทำภารกิจทั้งหมดเสร็จแล้ว\n\nเพิ่มภารกิจใหม่ได้ด้วย `/todo add`'),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const lines = todos
        .map((t, i) => `\`${String(i + 1).padStart(2, '0')}\` 「 **#${t.id}** 」 ${t.task}`)
        .join('\n');

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xbd93f9)
            .setAuthor({ name, iconURL: avatar })
            .setTitle('✦ รายการภารกิจ ✦')
            .setDescription(lines)
            .setFooter({ text: '🌸 ทำเครื่องหมายเสร็จด้วย /todo done id:<หมายเลข>' }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // ---- /todo done ----
    if (sub === 'done') {
      const id = interaction.options.getInteger('id', true);
      const todo = getTodoById.get(id, userId, guildId);

      if (!todo) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff5555)
              .setTitle('✦ ไม่พบภารกิจ')
              .setDescription(
                `ไม่พบภารกิจ 「 **#${id}** 」 ในรายการของคุณ\n\nตรวจสอบรายการด้วย \`/todo list\``
              ),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (todo.done) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x6272a4)
              .setTitle('✦ ภารกิจนี้เสร็จสิ้นไปแล้ว')
              .setDescription(`「 ภารกิจ **#${id}** 」 ถูกทำเครื่องหมายเสร็จไปแล้ว`),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      completeTodo.run(id);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x50fa7b)
            .setAuthor({ name, iconURL: avatar })
            .setTitle('🌸 ภารกิจสำเร็จแล้ว!')
            .addFields({ name: '「 ภารกิจที่เสร็จ 」', value: `~~${todo.task}~~` })
            .setFooter({ text: `✦ หมายเลขภารกิจ #${id} ✦` })
            .setTimestamp(),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
