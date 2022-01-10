var {
    Manager
  } = require("erela.js"), {
      MessageEmbed
    } = require("discord.js"),
    ms = require("ms"),

    config = require("../../botconfig/config.json"),
    emoji = require("../../botconfig/emojis.json"),
    ee = require("../../botconfig/embed.json"),

    {
      databasing,
    } = require("../../handlers/functions");
  module.exports = (client) => {

      client.once("ready", () => {
        client.manager.init(client.user.id);
      });
      
      client.on("raw", (d) => client.manager.updateVoiceState(d));
      
      //Log if a Channel gets deleted, and the Bot was in, then delete the player if the player exists!
      client.on("channelDelete", async channel => {
        try {
          if (channel.type === "voice") {
            if (channel.members.has(client.user.id)) {
              var player = client.manager.players.get(channel.guild.id);
              if (!player) return;
              if (channel.id === player.voiceChannel) {
                //destroy
                player.destroy();
              }
            }
          }
        } catch {}
      })
      //If the Bot gets Remove from the Guild and there is still a player, remove it ;)
      client.on("guildRemove", async guild => {
        try {
          var player = client.manager.players.get(guild.id);
          if (!player) return;
          if (guild.id == player.guild) {
            //destroy
            player.destroy();
          }
        } catch {
          /* */ }
      })
      client.on("voiceStateUpdate", async (oldState, newState) => {
        // LEFT V12
        if (oldState.channelID && !newState.channelID) {
          //if bot left
          try {
            if (oldState.member.user.id === client.user.id) {
              var player = client.manager.players.get(oldState.guild.id);
              if (!player) return;
              //destroy
              player.destroy();
            }
          } catch {}
        }
        var player = client.manager.players.get(newState.guild.id);
        if (!player) return;
        databasing(client, player.guild, player.get("playerauthor"));
        if (config.settings.leaveOnEmpty_Channel.enabled && oldState && oldState.channel) {
          player = client.manager.players.get(oldState.guild.id);
          //if not connect return player.destroy()
          if (!oldState.guild.me.voice.channel) {
            return player.destroy();
          }
          //wait some time...
          if (player && oldState.guild.channels.cache.get(player.voiceChannel).members.size === 1) {
            setTimeout(async () => {
              try {
                player = client.manager.players.get(oldState.guild.id);
                //if not connect return player.destroy()
                if (!oldState.guild.me.voice.channel && player) {
                  return player.destroy();
                }
                //wait some time...
                var vc = oldState.guild.channels.cache.get(player.voiceChannel)
                if (player && vc && vc.members.size === 1) {
                  var embed = new MessageEmbed()
                    .setTitle(`${emoji.msg.ERROR} Queue has ended | Channel Empty`)
                    .setDescription(`I left the Channel: ${client.channels.cache.get(player.voiceChannel).name} because the Channel was empty for: ${ms(config.settings.leaveOnEmpty_Channel.time_delay, { long: true })}`)
                    .setColor(ee.wrongcolor)
                    .setFooter(ee.footertext, ee.footericon);
                  //if        player afk                              or      guild afk     is enbaled return and not destroy the PLAYER
                  if (player.get(`afk-${player.get("playerauthor")}`) || player.get(`afk-${player.guild}`))
                    return client.channels.cache.get(player.textChannel).send(embed.setDescription(`I will not Leave the Channel, cause afk is ✔️ Enabled`)).then(msg => {
                      try {
                        msg.delete({
                          timeout: 4000
                        }).catch(e => console.log("couldn't delete message this is a catch to prevent a crash".grey));
                      } catch {
                        /* */ }
                    });
                  client.channels.cache.get(player.textChannel).send(embed).then(msg => {
                    try {
                      msg.delete({
                        timeout: 4000
                      }).catch(e => console.log("couldn't delete message this is a catch to prevent a crash".grey));
                    } catch {
                      /* */ }
                  });
                  try {
                    client.channels.cache
                      .get(player.textChannel)
                      .messages.fetch(player.get("playermessage")).then(msg => {
                        try {
                          msg.delete({
                            timeout: 4000
                          }).catch(e => console.log("couldn't delete message this is a catch to prevent a crash".grey));
                        } catch {
                          /* */ }
                      });
                  } catch (e) {
                    console.log(String(e.stack).yellow);
                  }
                  player.destroy();
                }
              } catch (e) {
                console.log(String(e.stack).yellow);
              }
            }, config.settings.leaveOnEmpty_Channel.time_delay);
          }
        }
      });
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
  