const {
  readdirSync
} = require("fs");
const ascii = require("ascii-table");
let table = new ascii("");
table.setHeading("Command", "Load status");
console.log("Welcome to SERVICE HANDLER /--/ By https://milrato.eu /--/ Discord: Tomato#6966".yellow);
module.exports = (client) => {
  try {
    readdirSync("./commands/").forEach((dir) => {
      const commands = readdirSync(`./commands/${dir}/`).filter((file) => file.endsWith(".js"));
      for (let file of commands) {
        let pull = require(`../commands/${dir}/${file}`);
        if (pull.name) {
          client.commands.set(pull.name, pull);
          table.addRow(file, "Ready");
        } else {
          table.addRow(file, `error -> missing a help.name,or help.name is not a string.`);
          continue;
        }
        if (pull.aliases && Array.isArray(pull.aliases)) pull.aliases.forEach((alias) => client.aliases.set(alias, pull.name));
      }
    });
    //console.log(table.toString().cyan);
  } catch (e) {
    console.log(String(e.stack).bgRed)
  }


  // Requires Manager from discord-giveaways
  const { GiveawaysManager } = require('discord-giveaways');
  // Starts updating currents giveaways
  const manager = new GiveawaysManager(client, {
      storage: './giveaways.json',
      updateCountdownEvery: 10000,
      hasGuildMembersIntent: false,
      default: {
          botsCanWin: false,
          exemptPermissions: ['MANAGE_MESSAGES', 'ADMINISTRATOR'],
          embedColor: require("../botconfig/embed.json").color,
          reaction: '🎉',
          messages: {
              giveaway: '🎉 **GIVEAWAY** 🎉',
              giveawayEnded: '🎉 **GIVEAWAY ENDED** 🎉',
              timeRemaining: 'Time remaining: **{duration}**!',
              inviteToParticipate: 'React with 🎉 to participate!',
              winMessage: 'Congratulations, {winners}!\n\n> You won **{prize}**!\n\n{messageURL}',
              embedFooter: 'Giveaway',
              noWinner: 'Giveaway cancelled, no valid participations.',
              hostedBy: 'Hosted by: {user}',
              winners: 'Winner(s)',
              endedAt: 'Ended at',
              units: {
                  seconds: 'Seconds',
                  minutes: 'Minutes',
                  hours: 'Hours',
                  days: 'Days',
                  pluralS: false // Not needed, because units end with a S so it will automatically removed if the unit value is lower than 2
              }
          }
      }
  });
  // We now have a giveawaysManager property to access the manager everywhere!
  client.giveawaysManager = manager;
};
/**
 * @INFO
 * Bot Coded by Tomato#6966 | https://github.com/Tomato6966/discord-js-lavalink-Music-Bot-erela-js
 * @INFO
 * Work for Milrato Development | https://milrato.eu
 * @INFO
 * Please mention Him / Milrato Development, when using this Code!
 * @INFO
 */
