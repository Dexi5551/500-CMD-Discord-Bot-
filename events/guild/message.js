/**
  * @INFO
  * Loading all needed File Information Parameters
*/
const config = require("../../botconfig/config.json"); //loading config file with token and prefix, and settings
const ee = require("../../botconfig/embed.json"); //Loading all embed settings like color footertext and icon ...
const Discord = require("discord.js"); //this is the official discord.js wrapper for the Discord Api, which we use!
const {MessageEmbed} = require("discord.js"); //this is the official discord.js wrapper for the Discord Api, which we use!
const emoji = require(`../../botconfig/emojis.json`);
const { createBar, format, databasing, escapeRegex, getRandomInt, delay, simple_databasing} = require("../../handlers/functions"); //Loading all needed functions
const requestcmd = require("../../handlers/requestcmds");
//here the event starts
module.exports = async (client, message) => {
  try {
    //if the message is not in a guild (aka in dms), return aka ignore the inputs
    if (!message.guild || !message.channel) return;
    //if the channel is on partial fetch it
    if (message.channel.partial) await message.channel.fetch();
    //if the message is on partial fetch it
    if (message.partial) await message.fetch();
    //ensure all databases for this server/user from the databasing function
    simple_databasing(client, message.guild.id, message.author.id)
    var not_allowed = false;
    const guild_settings = client.settings.get(message.guild.id)
    let es = guild_settings.embed

    //get the setup channel from the database and if its in there sent then do this
    // if the message  author is a bot, return aka ignore the inputs
    if (message.author.bot) return;
    //get the current prefix from the database
    let prefix = guild_settings.prefix
    //if not in the database for some reason use the default prefix
    if (prefix === null) prefix = config.prefix;
    //the prefix can be a Mention of the Bot / The defined Prefix of the Bot
    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
    //if its not that then return
    if (!prefixRegex.test(message.content)) return;
    //now define the right prefix either ping or not ping
    const [, matchedPrefix] = message.content.match(prefixRegex);
    //CHECK IF IN A BOT CHANNEL OR NOT
    if(guild_settings.botchannel.toString() !== ""){
        //if its not in a BotChannel, and user not an ADMINISTRATOR
        if (!guild_settings.botchannel.includes(message.channel.id) && !message.member.hasPermission("ADMINISTRATOR")) {
          //create the info string
            let leftb = "";
            for(let i = 0; i < guild_settings.botchannel.length; i++){
                leftb  +="<#" +guild_settings.botchannel[i] + "> / "
            }
            //send informational message
            try{ message.react("833101993668771842"); }catch{}
            return message.channel.send(new Discord.MessageEmbed()
              .setColor(es.wrongcolor)
              .setFooter(es.footertext, es.footericon)
              .setTitle(`<:no:833101993668771842> Error | Not in the Bot Chat!`)
              .setDescription(`There is a Bot chat setup in this GUILD! try using the Bot Commands here:\n> ${leftb.substr(0, leftb.length - 3)}`)
            ).then(async msg => {
              try{
                await delay(5000)
                if(msg && message.channel.messages.cache.get(msg.id)) msg.delete();
              }catch{ /* */ }
            });
        }
    }
    //create the arguments with sliceing of of the rightprefix length
    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
    //creating the cmd argument by shifting the args by 1
    const cmd = args.shift().toLowerCase();
    //if no cmd added return error
    if (cmd.length === 0){
      if(matchedPrefix.includes(client.user.id))
        return message.channel.send(new Discord.MessageEmbed()
          .setColor(es  .color)
          .setTitle(`${emoji.msg.SUCCESS} **To see all Commands type: \`${prefix}help\`**`)
        );
      return;
      }
    //get the command from the collection
    let command = client.commands.get(cmd);
    //if the command does not exist, try to get it by his alias
    if (!command) command = client.commands.get(client.aliases.get(cmd));
    var customcmd = false;
    var cuc = client.customcommands.get(message.guild.id, "commands")
    for(const cmd of cuc){
        if(cmd.name.toLowerCase() === message.content.slice(prefix.length).split(" ")[0]){
          customcmd = true;
            if(cmd.embed){
            return message.channel.send(new MessageEmbed()
                .setColor(es.color).setThumbnail(es.thumb ? es.footericon : null)
                .setFooter(es.footertext, es.footericon)
                .setDescription(cmd.output)
            );
            }else{
                message.channel.send(cmd.output)
            }
        }
    }
    //if the command is now valid
    if (command && !customcmd){
        if(command.length == 0) {
          if(guild_settings.unkowncmdmessage){
            message.channel.send(new Discord.MessageEmbed()
              .setColor(es.wrongcolor)
              .setFooter(es.footertext, es.footericon)
              .setTitle(`<:no:833101993668771842> Unkown command, try: **\`${prefix}help\`**`)
              .setDescription(`The prefix for this Guild is: \`${prefix}\`\n\nYou can also **ping** me, instead of using a Prefix!\n\nTo see all Commands Type \`${prefix}help [Cat/Cmd]\`\n\nTo see all available setups type \`${prefix}setup\``)
            ).then(async msg => {
              try{
                 msg?.delete({timeout: 5000}).catch(e=>console.log(e));
              }catch{   }
            });
          }
          //RETURN
          return;
        
        }
        if (!client.cooldowns.has(command.name)) { //if its not in the cooldown, set it too there
            client.cooldowns.set(command.name, new Discord.Collection());
        }
        const now = Date.now(); //get the current time
        const timestamps = client.cooldowns.get(command.name); //get the timestamp of the last used commands
        const cooldownAmount = (command.cooldown || 1) * 1000; //get the cooldownamount of the command, if there is no cooldown there will be automatically 1 sec cooldown, so you cannot spam it^^
        if (timestamps.has(message.author.id)) { //if the user is on cooldown
          const expirationTime = timestamps.get(message.author.id) + cooldownAmount; //get the amount of time he needs to wait until he can run the cmd again
          if (now < expirationTime) { //if he is still on cooldonw
            const timeLeft = (expirationTime - now) / 1000; //get the lefttime
            try{ message.react("833101993668771842"); }catch{}
            return message.channel.send(new Discord.MessageEmbed()
              .setColor(es.wrongcolor)
              .setTitle(`<:no:833101993668771842> Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`)
            ); //send an information message
          }
        }
        timestamps.set(message.author.id, now); //if he is not on cooldown, set it to the cooldown
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount); //set a timeout function with the cooldown, so it gets deleted later on again
      try{

        client.stats.inc(message.guild.id, "commands"); //counting our Database stats for SERVER
        client.stats.inc("global", "commands"); //counting our Database Stats for GLOBAL
        
        //IF A FREEBOT RETURN
        let disablecmds = ["setup-radio", "playlist", "autoplay", "youtubetogether", "addroletoeveryone", "giveaway", "blacklist","tiktok", "setup-twitter", "anti", "aichat", "counter", "customcommand"]
        let disablecats = ["soundboard", "custom", "economy", "filter"]
        if(disablecmds.some(i => String(command.name).toLowerCase().includes(i.toLowerCase())) || 
          disablecats.some(i => String(command.category).toLowerCase().includes(i.toLowerCase()))
        ){
          if(require('path').resolve(__dirname).split("/")[3].includes("FREEBOT_")){
            not_allowed = true;
            return message.channel.send(new MessageEmbed()
              .setColor(es.wrongcolor).setFooter(es.footertext, es.footericon)
              .setTitle(`<:no:833101993668771842> **THIS COMMAND IS PREMIUM ONLY** <a:nitro:833402717506502707>`)
              .setDescription(`This means, you need to **pay** in Order to be able to use this Command!\n\n[Website](https://milrato.eu) - [Pay through here](https://discord.gg/FQGXbypRf8)`)
            );
          }
        }

        //if Command has specific permission return error
        if(command.memberpermissions) {
          if (!message.member.hasPermission(command.memberpermissions)) {
            not_allowed = true;
            try{ message.react("833101993668771842"); }catch{}
            message.channel.send(new Discord.MessageEmbed()
              .setColor(es.wrongcolor)
              .setFooter(es.footertext, es.footericon)
              .setTitle("<:no:833101993668771842> Error | You are not not_allowed to run this command!")
              .setDescription(`You need these Permissions: \`${command.memberpermissions.join("`, ``")}\``)
            ).then(async msg => {
              try{
                await delay(5000)
                if(msg && message.channel.messages.cache.get(msg.id)) msg.delete();
              }catch{ /* */ }
            });
            }
          }
        //if Command has specific permission return error

        try{
          //FILTER DUBLICATES IN THE DJ ONLY COMMANDS
          let tracks = guild_settings.djonlycmds;
          const newtracks = [];
          for (let i = 0; i < tracks.length; i++) {
            let exists = false;
            for (j = 0; j < newtracks.length; j++) {
              if (tracks[i] === newtracks[j]) {
                exists = true;
                break;
              }
            }
            if (!exists) {
              newtracks.push(tracks[i]);
            }
          }
          if(tracks.length != newtracks.length)
          client.settings.set(message.guild.id, newtracks, `djonlycmds`)
          
          if(guild_settings.djonlycmds && guild_settings.djonlycmds.length > 0 && String(guild_settings.djonlycmds.join(" ")).toLowerCase().split(" ").includes(command.name.toLowerCase())) {
            //Check if there is a Dj Setup
              const player = client.manager.players.get(message.guild.id);
              //create the string of all djs and if he is a dj then set it to true
              let isdj=false;
              let leftb = "";
                if(guild_settings.djroles.length === 0)
                    leftb = "no Dj Roles, aka all Users are Djs"
                else
                  for(let i = 0; i < guild_settings.djroles.length; i++){
                    if(message.member.roles.cache.has(guild_settings.djroles[i])) isdj = true;
                      if(!message.guild.roles.cache.get(guild_settings.djroles[i])) continue;
                        leftb += "<@&" + guild_settings.djroles[i] + "> | "
                  }
                //if not a DJ and not a nAdmin
                  if(!isdj && !message.member.hasPermission("ADMINISTRATOR")) {
                  if(!player){
                    try{ message.react("833101993668771842").catch(e => console.log("couldn't react this is a catch to prevent a crash".grey)); }catch{}
                    not_allowed = true;
                      return message.channel.send(new Discord.MessageEmbed()
                      .setColor(ee.wrongcolor)
                      .setFooter(ee.footertext, ee.footericon)
                      .setTitle("<:no:833101993668771842> Error | You are not allowed to run this command!")
                      .setDescription(`You need to have one of those Roles:\n${leftb.substr(0, leftb.length-2)}`)
                    ).then(msg => {
                      try{
                          msg.delete({timeout: 5000}).catch(e=>console.log("couldn't delete message this is a catch to prevent a crash".grey));
                      }catch{ /* */ }
                    });
                  }
                  else if(player && player.queue && !player.queue.current){
                    try{ message.react("833101993668771842").catch(e => console.log("couldn't react this is a catch to prevent a crash".grey)); }catch{}
                    not_allowed = true;
                      return message.channel.send(new Discord.MessageEmbed()
                      .setColor(ee.wrongcolor)
                      .setFooter(ee.footertext, ee.footericon)
                      .setTitle("<:no:833101993668771842> Error | You are not allowed to run this command!")
                      .setDescription(`You need to have one of those Roles:\n${leftb.substr(0, leftb.length-2)}`)
                    ).then(msg => {
                      try{
                          msg.delete({timeout: 5000}).catch(e=>console.log("couldn't delete message this is a catch to prevent a crash".grey));
                      }catch{ /* */ }
                    });
                  }
                  else if(player && player.queue.current.requester.id != message.author.id){
                    try{ message.react("833101993668771842").catch(e => console.log("couldn't react this is a catch to prevent a crash".grey)); }catch{}
                    not_allowed = true;
                      return message.channel.send(new Discord.MessageEmbed()
                      .setColor(ee.wrongcolor)
                      .setFooter(ee.footertext, ee.footericon)
                      .setTitle("<:no:833101993668771842> Error | You are not allowed to run this command!")
                      .setDescription(`You need to have one of those Roles:\n${leftb.substr(0, leftb.length-2)}\n\nOr be the Requester (${player.queue.current.requester}) of the current Track!`)
                    ).then(msg => {
                      try{
                          msg.delete({timeout: 5000}).catch(e=>console.log("couldn't delete message this is a catch to prevent a crash".grey));
                      }catch{ /* */ }
                    });
                  } 
              }
          }
        }catch{
          
        }

        ///////////////////////////////
        ///////////////////////////////
        ///////////////////////////////
        ///////////////////////////////

        const player = client.manager.players.get(message.guild.id);
        if(message.guild.me.voice.channel && player) {
          //destroy the player if there is no one
          if(!player.queue) player.destroy();
        }
        
        ///////////////////////////////
        ///////////////////////////////
        ///////////////////////////////
        ///////////////////////////////
        if(command.parameters) {
          if(command.parameters.type == "music"){
             //get the channel instance
            const { channel } = message.member.voice;
            const mechannel = message.guild.me.voice.channel;
            //if not in a voice Channel return error
            if (!channel) {
              not_allowed = true;
              return message.channel.send(new MessageEmbed()
                .setColor(ee.wrongcolor)
                .setFooter(ee.footertext, ee.footericon)
                .setTitle(`<:no:833101993668771842> You need to join a voice channel.`)
              );
            }
            //If there is no player, then kick the bot out of the channel, if connected to
            if(!player && mechannel) {
              message.guild.me.voice.kick().catch(e=>console.log("This prevents a Bug"));
            }
            //if no player available return error | aka not playing anything
            if(command.parameters.activeplayer){
              if (!player){
                not_allowed = true;
                return message.channel.send(new MessageEmbed()
                  .setColor(ee.wrongcolor)
                  .setFooter(ee.footertext, ee.footericon)
                  .setTitle(`<:no:833101993668771842> There is nothing playing`)
                );
              }
              if (!mechannel){
                if(player) try{ player.destroy() }catch{ }
                not_allowed = true;
                return message.channel.send(new MessageEmbed()
                  .setColor(ee.wrongcolor)
                  .setFooter(ee.footertext, ee.footericon)
                  .setTitle(`<:no:833101993668771842> I am not connected to a Channel`)
                );
              }
            }
            //if no previoussong
            if(command.parameters.previoussong){
              if (!player.queue.previous || player.queue.previous === null){
                not_allowed = true;
                return message.channel.send(new MessageEmbed()
                  .setColor(ee.wrongcolor)
                  .setFooter(ee.footertext, ee.footericon)
                  .setTitle(`<:no:833101993668771842> There is no previous song yet!`)
                );
              }
            }
            //if not in the same channel --> return
            if (player && channel.id !== player.voiceChannel && !command.parameters.notsamechannel){
              return message.channel.send(new MessageEmbed()
                .setColor(ee.wrongcolor)
                .setFooter(ee.footertext, ee.footericon)
                .setTitle(`<:no:833101993668771842> You need to be in my voice channel to use this command!`)
                .setDescription(`Channelname: \`🔈 ${message.guild.channels.cache.get(player.voiceChannel).name}\``)
              );
            }
            //if not in the same channel --> return
            if (mechannel && channel.id !== mechannel.id && !command.parameters.notsamechannel){
              return message.channel.send(new MessageEmbed()
                .setColor(ee.wrongcolor)
                .setFooter(ee.footertext, ee.footericon)
                .setTitle(`<:no:833101993668771842> You need to be in my voice channel to use this command!`)
                .setDescription(`Channelname: \`🔈 ${mechannel.name}\``)
              );
            }
          }
        }
        ///////////////////////////////
        ///////////////////////////////
        ///////////////////////////////
        ///////////////////////////////
        //run the command with the parameters:  client, message, args, user, text, prefix,
        if(not_allowed) return;
        //if there is no guild Owner as a Member, fetch it to fix bugs
        if(!message.guild.owner) await message.guild.members.fetch(message.guild.ownerID);
        //execute the cmd
        databasing(client, message.guild.id, message.author.id)
        

        command.run(client, message, args, message.member, args.join(" "), prefix, player);
      }catch (e) {
        console.log(String(e.stack).red)
        return message.channel.send(new Discord.MessageEmbed()
          .setColor(es.wrongcolor)
          .setFooter(es.footertext, es.footericon)
          .setTitle("<:no:833101993668771842> Something went wrong while, running the: `" + command.name + "` command")
          .setDescription(`\`\`\`${e.message ? e.message : e.stack ? String(e.stack).substr(0, 2000) : String(e).substr(0, 2000)}\`\`\``)
        ).then(async msg => {
          try{
            await delay(5000)
            if(msg && message.channel.messages.cache.get(msg.id)) msg.delete();
          }catch{ /* */ }
        });
      }
    }
    else if(!customcmd) {
      if(guild_settings.unkowncmdmessage){
        message.channel.send(new Discord.MessageEmbed()
          .setColor(es.wrongcolor)
          .setFooter(es.footertext, es.footericon)
          .setTitle(`<:no:833101993668771842> Unkown command, try: **\`${prefix}help\`**`)
          .setDescription(`The prefix for this Guild is: \`${prefix}\`\n\nYou can also **ping** me, instead of using a Prefix!\n\nTo see all Commands Type \`${prefix}help [Cat/Cmd]\`\n\nTo see all available setups type \`${prefix}setup\``)
        ).then(async msg => {
          try{
              msg?.delete({timeout: 5000}).catch(e=>console.log(e));
          }catch{   }
        });
      }
      return
    }
  }catch (e){
    console.log(String(e.stack).red)
   return message.channel.send(new MessageEmbed()
      .setColor("RED")
      .setTitle(`<:no:833101993668771842> ERROR | An error occurred!`)
      .setDescription(`\`\`\`${String(JSON.stringify(e)).substr(0, 2000)}\`\`\``)
    );
  }
}
/**
  * @INFO
  * Bot Coded by Tomato#6966 | https://github.com/Tomato6966/discord-js-lavalink-Music-Bot-erela-js
  * @INFO
  * Work for Milrato Development | https://milrato.eu
  * @INFO
  * Please mention Him / Milrato Development, when using this Code!
  * @INFO
*/
