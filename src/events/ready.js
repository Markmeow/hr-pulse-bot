'use strict';

const { Events } = require('discord.js');
const { startReminderScheduler } = require('../utils/reminderScheduler');
const { startBreakScheduler } = require('../utils/breakScheduler');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`[ready] Logged in as ${client.user.tag}`);
    console.log(`[ready] Serving ${client.guilds.cache.size} server(s).`);

    startReminderScheduler(client);
    startBreakScheduler(client);
  },
};
