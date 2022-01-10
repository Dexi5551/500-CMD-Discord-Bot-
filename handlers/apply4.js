//all reactions for the finished channel
let all_finished_reactions = [
  "✅", "❌", "🎟️", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"
]
var moment = require('moment'); // require
//import the config.json file
const config = require("../botconfig/config.json")
//import the Discord Library
const Discord = require("discord.js");

//antispam SET
const antimap = new Map()

//apply cooldown
const cooldown = new Set();

//Start the module
module.exports = client => {

  //define the apply system variable
  let apply_db = client.apply4;

  //once a reaction is added this will fire
  client.on("messageReactionAdd", async (reaction, user) => {
    const {
      message
    } = reaction;
    if (user.bot || !message.guild) return;
    if (message.partial) await message.fetch();
    if (reaction.partial) await reaction.fetch();
    var es = client.settings.get(message.guild.id, "embed")
    apply_db.ensure(message.guild.id, {
      "channel_id": "",
      "message_id": "",
      "f_channel_id": "", //changequestions --> which one (lists everyone with index) --> 4. --> Question

      "QUESTIONS": [{
        "1": "DEFAULT"
      }],

      "TEMP_ROLE": "0",

      "accept": "You've got accepted!",
      "accept_role": "0",

      "deny": "You've got denied!",

      "ticket": "Hey {user}! We have some Questions!",

      "one": {
        "role": "0",
        "message": "Hey you've got accepted for Team 1",
        "image": {
          "enabled": false,
          "url": ""
        }
      },
      "two": {
        "role": "0",
        "message": "Hey you've got accepted for Team 2",
        "image": {
          "enabled": false,
          "url": ""
        }
      },
      "three": {
        "role": "0",
        "message": "Hey you've got accepted for Team 3",
        "image": {
          "enabled": false,
          "url": ""
        }
      },
      "four": {
        "role": "0",
        "message": "Hey you've got accepted for Team 4",
        "image": {
          "enabled": false,
          "url": ""
        }
      },
      "five": {
        "role": "0",
        "message": "Hey you've got accepted for Team 5",
        "image": {
          "enabled": false,
          "url": ""
        }
      }
    });
    /** ///////////////////////////////////////////////////////////// *
     *
     * THIS IF IS FOR DISPLAYING IF THERE WAS A VALID REACTION START POINT
     *
     * ///////////////////////////////////////////////////////////// *
     */
    if (message.id === apply_db.get(message.guild.id, "message_id") && message.channel.id === apply_db.get(message.guild.id, "channel_id") && reaction.emoji.name === "✅") {
      try {
        //remove the users' reaction
        reaction.users.remove(user);

        //COOLDOWN SYSTEM
        if (cooldown.has(user.id)) {
          return user.send(new Discord.MessageEmbed()
            .setColor(es.wrongcolor)
            .setFooter(es.footertext, es.footericon)
            .setTitle(`❌ Please wait 2 minutes before you apply again!`)
            .addField("Why a delay?", "Because that's the only way how I can prevent you from abusing(spamming) Applications!")
          )
        } else {
          cooldown.add(user.id);
          setTimeout(() => {
            cooldown.delete(user.id);
          }, 120 * 1000);
        }
        var originaluser = user;
        var originalchannel = reaction.message.channel;
        //get the guild
        var guild = await message.guild.fetch();

        //get the channel to send the finished applies
        var channel_tosend = guild.channels.cache.get(apply_db.get(message.guild.id, "f_channel_id"));

        //if channel-to-send not found return error
        if (!channel_tosend) return;

        //if no running-application catcher is active set it too true!
        if (!antimap.has(user.id)) antimap.set(user.id)

        //but if he is having an running application somewhere then return error
        else return user.send(new Discord.MessageEmbed()
          .setColor(es.color).setThumbnail(es.thumb ? es.footericon : null)
          .setDescription("You are always having a Running Application somwhere!")
          .setTitle("ERROR")
          .setFooter(es.footertext, es.footericon)
        ).catch(e => {
          message.channel.send(new Discord.MessageEmbed()
            .setColor(es.wrongcolor)
            .setFooter(es.footertext, es.footericon)
            .setTitle("ERROR | Turn your DMs ON")
            .setDescription("```" + e.message + "```")
          ).then(msg => msg.delete({
            timeout: 5000
          }))
        })

        //the array of answers for the current user
        var answers = [];

        //set the counter variable to 0
        var counter = 0;

        //define the url, if there would be an attachment ;)
        var url = "";

        //get all Questions from the Database
        var Questions = apply_db.get(message.guild.id, "QUESTIONS");

        //get the actual current question from the Questions
        var current_question = Object.values(Questions[counter]).join(" ")

        //ask the current (first) Question from the Database
        ask_question(current_question);

        /** @param ask_question {qu} Question == Ask the current Question and push the answer
         * This function is for asking ONE SINGLE Question to the USER
         */
        function ask_question(qu) {
          if (counter === Questions.length) return send_finished();
          //send the user the first question
          user.send(new Discord.MessageEmbed()
              .setColor(es.color).setThumbnail(es.thumb ? es.footericon : null)
              .setDescription(qu)
              .setAuthor(`Question ${counter + 1} / ${Questions.length}`, client.user.displayAvatarURL(), "https://discord.com/api/oauth2/authorize?client_id=806086994031411221&permissions=8&scope=bot%20applications.commands")
              .setFooter(es.footertext, es.footericon)
            ).then(msg => {
              msg.channel.awaitMessages(m => m.author.id === user.id, {
                max: 1,
                time: 60 * 10 * 1000,
                errors: ["time"]
              }).then(async collected => {

                //push the answer of the user into the answers lmfao
                if (collected.first().attachments.size > 0) {
                  if (collected.first().attachments.every(attachIsImage)) {
                    answers.push(`${collected.first().content}\n${url}`);
                  } else {
                    answers.push(`${collected.first().content}\nThere was an attachment, which i cannot display!`);
                  }
                } else {
                  answers.push(`${collected.first().content}`);
                }
                //count up with 1
                counter++;
                //if it reached the questions limit return with the finished embed
                if (counter === Questions.length) return send_finished();

                //get the new current question
                var new_current_question = Object.values(Questions[counter]).join(" ")

                //ask the new current question
                ask_question(new_current_question);

              }).catch(error => {
                console.log(error)
                antimap.delete(user.id)
                return user.send(new Discord.MessageEmbed()
                  .setColor(es.color).setThumbnail(es.thumb ? es.footericon : null)
                  .setTitle("Your max. Time for answering this Question ran out | Application cancelled")
                  .setFooter(es.footertext, es.footericon)
                ).catch(e => {
                  antimap.delete(user.id)
                  message.channel.send(new Discord.MessageEmbed()
                    .setColor(es.wrongcolor)
                    .setFooter(es.footertext, es.footericon)
                    .setTitle("ERROR | Turn your DMs ON")
                    .setDescription("```" + e.message + "```")
                  ).then(msg => msg.delete({
                    timeout: 7500
                  }))
                })
              })
            })
            .catch(e => {
              antimap.delete(user.id)
              message.channel.send(new Discord.MessageEmbed()
                .setColor(es.wrongcolor)
                .setFooter(es.footertext, es.footericon)
                .setTitle("ERROR | Turn your DMs ON")
                .setDescription("```" + e.message + "```")
              ).then(msg => msg.delete({
                timeout: 7500
              }))
            })
        }

        /** @param send_finished {*} == Send the finished application embed to the finished application questions channel ;)
         * This function is for asking ONE SINGLE Question to the USER
         */
        async function send_finished() {
          if (apply_db.get(guild.id, "last_verify")) {
            user.send(new Discord.MessageEmbed()
              .setColor(es.color).setThumbnail(es.thumb ? es.footericon : null)
              .setTitle("Do u really wanna send the Application?")
              .setFooter(es.footertext, es.footericon)
            ).then(async msg => {
              msg.react("✅")
              msg.react("❌")
              const filter = (reaction, user) => {
                return user.id === originaluser.id;
              };
              msg.awaitReactions(filter, {
                  max: 1,
                  time: 60 * 10 * 1000,
                  errors: ['time']
                })
                .then(async collected => {
                  let reaction = collected.first();
                  if (reaction.emoji.name === "✅") {
                    antimap.delete(originaluser.id)
                    var embed = new Discord.MessageEmbed().setFooter(es.footertext, es.footericon)
                      .setColor(es.color).setThumbnail(es.thumb ? es.footericon : null)
                      .setTitle("A new application from: `" + originaluser.tag + "`") //${user.tag} -
                      .setDescription(`**❯** ${originaluser}  |  \`${moment().format().split("-")[2].split("T")[0] + "/" + moment().format().split("-")[1] + "/" + moment().format().split("-")[0]+ " | " + moment().format().split("T")[1]}\``)
                      .setFooter(originaluser.id, originaluser.displayAvatarURL({
                        dynamic: true
                      }))
                      .setThumbnail(originaluser.displayAvatarURL({
                        dynamic: true
                      }))
                      .setTimestamp()

                    //for each question add a field
                    for (var i = 0; i < Questions.length; i++) {
                      try {
                        let qu = Object.values(Questions[i]);
                        if (qu.length > 100) qu = String(Object.values(Questions[i])).substr(0, 100) + " ..."
                        embed.addField(("**" + Object.keys(Questions[i]) + ". |** " + qu).substr(0, 256), ">>> " + String(answers[i]).substr(0, 1000))
                      } catch (e) {
                        console.log(e)
                        /* */
                      }
                    }


                    //send the embed into the channel
                    channel_tosend.send(embed).then(msg => {
                      //react with each emoji of all reactions
                      for (const emoji of all_finished_reactions)
                        msg.react(emoji);
                      //set the message to the database
                      apply_db.set(msg.id, originaluser.id, "temp");
                    });
                    // "Producing Code" (May take some time)
                    const finished_embed = new Discord.MessageEmbed()
                      .setColor(es.color).setThumbnail(es.thumb ? es.footericon : null)
                      .setTitle("Thanks for applying to:\n**❯** `" + message.guild.name + "`")
                      .addField("\u200b", `**❯** Go Back to the Channel ${originalchannel}`).setFooter(es.footertext, es.footericon)

                    //send an informational message
                    originaluser.send(finished_embed)
                    //then try catch
                    try {
                      //find the role from the database
                      var roleid = apply_db.get(message.guild.id, "TEMP_ROLE");
                      if (roleid) {
                        if (roleid.length == 18) {
                          //find the member from the reaction event
                          var member = message.guild.members.cache.get(originaluser.id);
                          //find the role
                          var role = await message.guild.roles.cache.get(roleid);
                          if (!role) return channel_tosend.send("I was not able to find the ROLE")
                          if (!member) return channel_tosend.send("I was not able to find the User, to whom I shall add the ROLE")
                          //add the role
                          member.roles.add(role.id)
                        }
                      }

                    } catch (e) {
                      console.log(e)
                      channel_tosend.send("I am Missing Permissions to grant the TEMPROLE\n" + e.message)
                      /* */
                    }




                  } else {
                    antimap.delete(originaluser.id)
                    originaluser.send(new Discord.MessageEmbed()
                      .setColor(es.wrongcolor)
                      .setTitle("Cancelled your Application")
                      .setFooter(es.footertext, es.footericon)
                    )
                  }
                }).catch(e => {
                  console.log(e)
                  antimap.delete(originaluser.id)
                  originaluser.send(new Discord.MessageEmbed()
                    .setColor(es.wrongcolor)
                    .setTitle("Cancelled your Application")
                    .setFooter(es.footertext, es.footericon)
                  )
                });
            })

          } else {
            antimap.delete(user.id)
            var embed = new Discord.MessageEmbed().setFooter(es.footertext, es.footericon)
              .setColor(es.color).setThumbnail(es.thumb ? es.footericon : null)
              .setTitle("A new application from: `" + originaluser.tag + "`") //${user.tag} -
              .setDescription(`**❯** ${originaluser}  |  \`${moment().format().split("-")[2].split("T")[0] + "/" + moment().format().split("-")[1] + "/" + moment().format().split("-")[0]+ " | " + moment().format().split("T")[1]}\``)
              .setFooter(originaluser.id, originaluser.displayAvatarURL({
                dynamic: true
              }))
              .setTimestamp()

            //for each question add a field
            for (var i = 0; i < Questions.length; i++) {
              try {
                let qu = Object.values(Questions[i]);
                if (qu.length > 100) qu = String(Object.values(Questions[i])).substr(0, 100) + " ..."
                embed.addField(("**" + Object.keys(Questions[i]) + ". |** " + qu).substr(0, 256), ">>> " + String(answers[i]).substr(0, 1000))
              } catch {
                /* */
              }
            }

            //send the embed into the channel
            channel_tosend.send(embed).then(msg => {
              //react with each emoji of all reactions
              for (const emoji of all_finished_reactions)
                msg.react(emoji);
              //set the message to the database
              apply_db.set(msg.id, user.id, "temp");
            });

            // "Producing Code" (May take some time)
            const finished_embed = new Discord.MessageEmbed()
              .setColor(es.color).setThumbnail(es.thumb ? es.footericon : null)
              .setTitle("Thanks for applying to:\n**❯** `" + message.guild.name + "`")
              .addField("\u200b", `**❯** Go Back to the Channel ${originalchannel}`).setFooter(es.footertext, es.footericon)
            originaluser.send(finished_embed)

            //then try catch
            try {
              //find the role from the database
              var roleid = apply_db.get(message.guild.id, "TEMP_ROLE");
              if (roleid) {
                if (roleid.length == 18) {
                  //find the member from the reaction event
                  var member = message.guild.members.cache.get(originaluser.id);
                  //find the role
                  var role = await message.guild.roles.cache.get(roleid);
                  if (!role) return channel_tosend.send("I was not able to find the ROLE")
                  if (!member) return channel_tosend.send("I was not able to find the User, to whom I shall add the ROLE")
                  //add the role
                  member.roles.add(role.id)
                }
              }

            } catch (e) {
              console.log(e)
              channel_tosend.send("I am Missing Permissions to grant the TEMPROLE")
              /* */
            }


          }

        }

        //this function is for turning each attachment into a url
        function attachIsImage(msgAttach) {
          url = msgAttach.url;
          //True if this url is a png image.
          return url.indexOf("png", url.length - "png".length /*or 3*/ ) !== -1 ||
            url.indexOf("jpeg", url.length - "jpeg".length /*or 3*/ ) !== -1 ||
            url.indexOf("gif", url.length - "gif".length /*or 3*/ ) !== -1 ||
            url.indexOf("jpg", url.length - "jpg".length /*or 3*/ ) !== -1;
        }
      } catch (e) {
        console.log(e)
        message.channel.send(new Discord.MessageEmbed()
          .setColor(es.wrongcolor)
          .setFooter(es.footertext, es.footericon)
          .setTitle("ERROR | ERROR")
          .setDescription("```" + e.message + "```")
        ).then(msg => msg.delete({
          timeout: 7500
        }))
      }
    }



    /** ///////////////////////////////////////////////////////////// *
     *
     * THIS IS FOR IF SOMEONE REACTS ON A FINISHED APPLICATION OVERVIEW MESSAGE
     *
     * ///////////////////////////////////////////////////////////// *
     */
    if (message.channel.id === apply_db.get(message.guild.id, "f_channel_id") && (all_finished_reactions.includes(reaction.emoji.name))) {
      try {
        //Entferne Alle Reactions vom BOT
        reaction.message.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));

        //fetch the message from the data
        const targetMessage = await message.channel.messages.fetch(message.id, false, true)

        //if no message found, return an error
        if (!targetMessage)
          return message.reply(new Discord.MessageEmbed()
            .setFooter(es.footertext, es.footericon)
            .setColor(es.wrongcolor)
            .setTitle("Couldn't get information about this Message?")
            .setFooter(es.footertext, es.footericon)
          );

        //get the old embed information
        const oldEmbed = targetMessage.embeds[0];

        //if there is no old embed, return an error
        if (!oldEmbed)
          return message.reply(new Discord.MessageEmbed()
            .setFooter(es.footertext, es.footericon)
            .setColor(es.wrongcolor)
            .setTitle("Not a valid Embed")
            .setFooter(es.footertext, es.footericon)
          );

        //create a new embed
        const embed = new Discord.MessageEmbed()
          .setFooter(es.footertext, es.footericon)
          .setTitle(oldEmbed.title)
          .setDescription(`${oldEmbed.description ? `${oldEmbed.description}\n`: ""} Edited by: ${user} | ${reaction.emoji}`.substr(0, 2048))

        //for each data in it from before hand
        if (oldEmbed.fields[0]) {
          try {
            for (var i = 0; i <= oldEmbed.fields.length; i++) {
              try {
                if (oldEmbed.fields[i]) embed.addField(oldEmbed.fields[i].name, oldEmbed.fields[i].value)
              } catch {}
            }
          } catch {}
        }

        //try to remove all roles after that continue?
        await rome_old_roles(reaction, user, apply_db);

        //if the reaction is for APPROVE
        if (reaction.emoji.name === "✅") {
          //SET THE EMBED COLOR TO GREEN
          embed.setColor("GREEN")

          //EDIT THE EMBED
          targetMessage.edit({embed: embed})

          //CREATE THE APPROVE MESSAGE
          var approve = new Discord.MessageEmbed().setFooter(es.footertext, es.footericon)
            .setColor("GREEN")
            .setTitle("You've got accepted from: `" + message.guild.name + "`")
            .setFooter("By  |  " + user.tag, user.displayAvatarURL({
              dynamic: true
            }))
            .setDescription(apply_db.get(message.guild.id, "accept"))

          //GET THE USER FROM THE DATABASE
          var usert = await client.users.fetch(apply_db.get(message.id, "temp"))

          //TRY CATCH --- ADDING ROLE
          try {
            //get the roleid from the db
            let roleid = apply_db.get(message.id, "accept_role");
            if (roleid) {
              //if no roleid added then return error
              if (roleid.length !== 18) return;
              //try to add the role
              var member = reaction.message.guild.members.cache.get(usert.id)
              member.roles.add(roleid)
            }
          } catch (e) {
            //if an error happens, show it
            message.channel.send(`${user}, couldn't add him the APPROVE ROLE! check if the role exists!\n\n\`\`\`${String(JSON.stringify(e)).substr(0, 2000)}\`\`\``).then(msg => msg.delete({
              timeout: 5000
            }))
          }

          //send the user the approve message
          usert.send(approve).catch(e => {
            message.channel.send("COULDN'T DM THIS PERSON!");
            console.log(e);
          });
        }

        //if the reaction is for deny
        if (reaction.emoji.name === "❌") {
          embed.setColor(es.wrongcolor)
          targetMessage.edit({embed: embed})
          var deny = new Discord.MessageEmbed().setFooter(es.footertext, es.footericon)
            .setColor(es.wrongcolor)
            .setTitle("You've got denied from: `" + message.guild.name + "`")
            .setDescription(apply_db.get(message.guild.id, "deny"))
            .setFooter("By  |  " + user.tag, user.displayAvatarURL({
              dynamic: true
            }))
          var usert = await client.users.fetch(apply_db.get(message.id, "temp"))
          usert.send(deny).catch(e => {
            message.channel.send("COULDN'T DM THIS PERSON!");
            console.log(e);
          });
        }


        //if the reaction is for CREATE A TICKET
        if (reaction.emoji.name === "🎟️") {
          //SET THE EMBED COLOR TO GREEN
          embed.setColor("ORANGE")

          //EDIT THE EMBED
          targetMessage.edit({embed: embed })

          //GET THE USER FROM THE DATABASE
          var usert = await client.users.fetch(apply_db.get(message.id, "temp"))

          //TRY CATCH --- ADDING ROLE
          try {
            message.guild.channels.create(`Ticket-${usert.username}`.substr(0, 32), {
                type: 'text',
                topic: "Just Delete this channel, if not needed there is no delete/close command!",
                permissionOverwrites: [{
                    id: message.guild.id,
                    deny: ['VIEW_CHANNEL'],
                  },
                  {
                    id: usert.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
                  },
                  {
                    id: user.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
                  },
                ],
              })
              .then((channel) => {
                setTimeout(()=>{
                  try{
                    channel.updateOverwrite ("847416435898974251",{
                      VIEW_CHANNEL: false
                    })
                    channel.updateOverwrite (usert.id,{
                      VIEW_CHANNEL: true,
                      SEND_MESSAGES: true
                    })
                    channel.updateOverwrite (user.id,{
                      VIEW_CHANNEL: true,
                      SEND_MESSAGES: true
                    })
                  }catch{

                  }
                }, 2000)
                //TRY CATCH SEND CHANNEL INFORMATION
                try {
                  channel.send(new Discord.MessageEmbed()
                    .setColor(es.color).setThumbnail(es.thumb ? es.footericon : null)
                    .setTitle(`A Ticket for: \`${usert.tag}\``)
                    .setFooter("Just Delete this channel, if not needed there is no delete/close command!", message.guild.iconURL({
                      dynamic: true
                    }))
                    .setDescription(apply_db.get(message.guild.id, "ticket").replace("{user}", `<@${usert.id}>`)))
                  channel.send(`<@${usert.id}>`)
                } catch {
                  /* */
                }

                //try catch send user message
                try {
                  //CREATE THE APPROVE MESSAGE
                  var approve = new Discord.MessageEmbed()
                    .setColor("ORANGE")
                    .setTitle("We've created a Ticket in: `" + message.guild.name + "`")
                    .setFooter("By  |  " + user.tag, user.displayAvatarURL({
                      dynamic: true
                    }))
                    .setDescription(apply_db.get(message.guild.id, "ticket").replace("{user}", `<@${usert.id}>`) + `Channel: <#${channel.id}>`)

                  //send the user the approve message
                  usert.send(approve).catch(e => {
                    message.channel.send("COULDN'T DM THIS PERSON!");
                    console.log(e);
                  });
                } catch {
                  /* */
                }
              });
          } catch (e) {
            //if an error happens, show it
            message.channel.send(`${user}, ERROR \`\`\`${String(JSON.stringify(e)).substr(0, 2000)}\`\`\``).then(msg => msg.delete({
              timeout: 5000
            }))
          }

        }


        //if the reaction is for FIRST ROLE APPROVE
        if (reaction.emoji.name === "1️⃣") {
          //SET THE EMBED COLOR TO GREEN
          embed.setColor("#54eeff")

          //EDIT THE EMBED
          targetMessage.edit({embed: embed})

          //CREATE THE APPROVE MESSAGE
          var approve = new Discord.MessageEmbed().setFooter(es.footertext, es.footericon)
            .setColor("GREEN")
            .setTitle("You've got accepted from: `" + message.guild.name + "`")
            .setFooter("By  |  " + user.tag, user.displayAvatarURL({
              dynamic: true
            }))
            .setDescription(apply_db.get(message.guild.id, "one.message"))
          //if image is enabled then set the image
          if (apply_db.get(message.guild.id, "one.image.enabled")) try {
            approve.setImage(apply_db.get(message.guild.id, "one.image.url"))
          } catch {
            /* */
          }

          //GET THE USER FROM THE DATABASE
          var usert = await client.users.fetch(apply_db.get(message.id, "temp"))

          //send the user the approve message
          usert.send(approve).catch(e => {
            message.channel.send("COULDN'T DM THIS PERSON!");
            console.log(e);
          });

          //TRY CATCH --- ADDING ROLE
          try {
            //get the roleid from the db
            let roleid = apply_db.get(message.guild.id, "one.role");
            if (roleid) {
              //if no roleid added then return error
              if (roleid.length !== 18) return;
              //try to add the role
              var member = reaction.message.guild.members.cache.get(usert.id)
              member.roles.add(roleid)
              console.log("added role")
            }
          } catch (e) {
            //if an error happens, show it
            message.channel.send(`${user}, couldn't add him the APPROVE ROLE! check if the role exists!\n\n\`\`\`${String(JSON.stringify(e)).substr(0, 2000)}\`\`\``).then(msg => msg.delete({
              timeout: 5000
            }))
          }


        }


        //if the reaction is for SECOND ROLE APPROVE
        if (reaction.emoji.name === "2️⃣") {
          //SET THE EMBED COLOR TO GREEN
          embed.setColor("#54cfff")

          //EDIT THE EMBED
          targetMessage.edit({embed: embed})

          //CREATE THE APPROVE MESSAGE
          var approve = new Discord.MessageEmbed().setFooter(es.footertext, es.footericon)
            .setColor("GREEN")
            .setTitle("You've got accepted from: `" + message.guild.name + "`")
            .setFooter("By  |  " + user.tag, user.displayAvatarURL({
              dynamic: true
            }))
            .setDescription(apply_db.get(message.guild.id, "two.message"))
          //if image is enabled then set the image
          if (apply_db.get(message.guild.id, "two.image.enabled")) try {
            approve.setImage(apply_db.get(message.guild.id, "two.image.url"))
          } catch {
            /* */
          }

          //GET THE USER FROM THE DATABASE
          var usert = await client.users.fetch(apply_db.get(message.id, "temp"))

          //send the user the approve message
          usert.send(approve).catch(e => {
            message.channel.send("COULDN'T DM THIS PERSON!");
            console.log(e);
          });

          //TRY CATCH --- ADDING ROLE
          try {
            //get the roleid from the db
            let roleid = apply_db.get(message.guild.id, "two.role");
            if (roleid) {
              //if no roleid added then return error
              if (roleid.length !== 18) return;
              //try to add the role
              var member = reaction.message.guild.members.cache.get(usert.id)
              member.roles.add(roleid)
            }
          } catch (e) {
            //if an error happens, show it
            message.channel.send(`${user}, couldn't add him the APPROVE ROLE! check if the role exists!\n\n\`\`\`${String(JSON.stringify(e)).substr(0, 2000)}\`\`\``).then(msg => msg.delete({
              timeout: 5000
            }))
          }

        }


        //if the reaction is for THIRD ROLE APPROVE
        if (reaction.emoji.name === "3️⃣") {
          //SET THE EMBED COLOR TO GREEN
          embed.setColor("#549bff")

          //EDIT THE EMBED
          targetMessage.edit({embed: embed})

          //CREATE THE APPROVE MESSAGE
          var approve = new Discord.MessageEmbed().setFooter(es.footertext, es.footericon)
            .setColor("GREEN")
            .setTitle("You've got accepted from: `" + message.guild.name + "`")
            .setFooter("By  |  " + user.tag, user.displayAvatarURL({
              dynamic: true
            }))
            .setDescription(apply_db.get(message.guild.id, "three.message"))
          //if image is enabled then set the image
          if (apply_db.get(message.guild.id, "three.image.enabled")) try {
            approve.setImage(apply_db.get(message.guild.id, "three.image.url"))
          } catch {
            /* */
          }

          //GET THE USER FROM THE DATABASE
          var usert = await client.users.fetch(apply_db.get(message.id, "temp"))

          //send the user the approve message
          usert.send(approve).catch(e => {
            message.channel.send("COULDN'T DM THIS PERSON!");
            console.log(e);
          });

          //TRY CATCH --- ADDING ROLE
          try {
            //get the roleid from the db
            let roleid = apply_db.get(message.guild.id, "three.role");
            if (roleid) {
              //if no roleid added then return error
              if (roleid.length !== 18) return;
              //try to add the role
              var member = reaction.message.guild.members.cache.get(usert.id)
              member.roles.add(roleid)
            }
          } catch (e) {
            //if an error happens, show it
            message.channel.send(`${user}, couldn't add him the APPROVE ROLE! check if the role exists!\n\n\`\`\`${String(JSON.stringify(e)).substr(0, 2000)}\`\`\``).then(msg => msg.delete({
              timeout: 5000
            }))
          }
        }


        //if the reaction is for FOURTH ROLE APPROVE
        if (reaction.emoji.name === "4️⃣") {
          //SET THE EMBED COLOR TO GREEN
          embed.setColor("#6254ff")

          //EDIT THE EMBED
          targetMessage.edit({embed: embed})

          //CREATE THE APPROVE MESSAGE
          var approve = new Discord.MessageEmbed().setFooter(es.footertext, es.footericon)
            .setColor("GREEN")
            .setTitle("You've got accepted from: `" + message.guild.name + "`")
            .setFooter("By  |  " + user.tag, user.displayAvatarURL({
              dynamic: true
            }))
            .setDescription(apply_db.get(message.guild.id, "four.message"))
          //if image is enabled then set the image
          if (apply_db.get(message.guild.id, "four.image.enabled")) try {
            approve.setImage(apply_db.get(message.guild.id, "four.image.url"))
          } catch {
            /* */
          }

          //GET THE USER FROM THE DATABASE
          var usert = await client.users.fetch(apply_db.get(message.id, "temp"))

          //send the user the approve message
          usert.send(approve).catch(e => {
            message.channel.send("COULDN'T DM THIS PERSON!");
            console.log(e);
          });

          //TRY CATCH --- ADDING ROLE
          try {
            //get the roleid from the db
            let roleid = apply_db.get(message.guild.id, "four.role");
            if (roleid) {
              //if no roleid added then return error
              if (roleid.length !== 18) return;
              //try to add the role
              var member = reaction.message.guild.members.cache.get(usert.id)
              member.roles.add(roleid)
            }
          } catch (e) {
            //if an error happens, show it
            message.channel.send(`${user}, couldn't add him the APPROVE ROLE! check if the role exists!\n\n\`\`\`${String(JSON.stringify(e)).substr(0, 2000)}\`\`\``).then(msg => msg.delete({
              timeout: 5000
            }))
          }
        }


        //if the reaction is for FITH ROLE APPROVE
        if (reaction.emoji.name === "5️⃣") {
          //SET THE EMBED COLOR TO GREEN
          embed.setColor("#1705e6")

          //EDIT THE EMBED
          targetMessage.edit({embed: embed})

          //CREATE THE APPROVE MESSAGE
          var approve = new Discord.MessageEmbed().setFooter(es.footertext, es.footericon)
            .setColor("GREEN")
            .setTitle("You've got accepted from: `" + message.guild.name + "`")
            .setFooter("By  |  " + user.tag, user.displayAvatarURL({
              dynamic: true
            }))
            .setDescription(apply_db.get(message.guild.id, "five.message"))
          //if image is enabled then set the image
          if (apply_db.get(message.guild.id, "five.image.enabled")) try {
            approve.setImage(apply_db.get(message.guild.id, "five.image.url"))
          } catch {
            /* */
          }

          //GET THE USER FROM THE DATABASE
          var usert = await client.users.fetch(apply_db.get(message.id, "temp"))

          //send the user the approve message
          usert.send(approve).catch(e => {
            message.channel.send("COULDN'T DM THIS PERSON!");
            console.log(e);
          });

          //TRY CATCH --- ADDING ROLE
          try {
            //get the roleid from the db
            let roleid = apply_db.get(message.guild.id, "five.role");
            if (roleid) {
              //if no roleid added then return error
              if (roleid.length !== 18) return;
              //try to add the role
              var member = reaction.message.guild.members.cache.get(usert.id)
              member.roles.add(roleid)
              console.log("added role")
            }
          } catch (e) {
            //if an error happens, show it
            message.channel.send(`${user}, couldn't add him the APPROVE ROLE! check if the role exists!\n\n\`\`\`${String(JSON.stringify(e)).substr(0, 2000)}\`\`\``).then(msg => msg.delete({
              timeout: 5000
            }))
          }
        }
        //EDIT THE TARGET MESSAGE WITH THE NEW EMBED ! ;)
        targetMessage.edit({embed: embed})

      } catch (e) {
        console.log(e)
        message.channel.send(new Discord.MessageEmbed()
          .setColor(es.wrongcolor)
          .setFooter(es.footertext, es.footericon)
          .setTitle("ERROR | ERROR")
          .setDescription("```" + e.message + "```")
        ).then(msg => msg.delete({
          timeout: 7500
        }))
      }
    }
  })
}

/** ////////////////////////////////////////// *
 * FUNCTION FOR REMOVING ALL OLD ROLES
 * ////////////////////////////////////////// *
 */
function rome_old_roles(reaction, user, apply_db) {
  new Promise(resolve => {
    //get the reactionmember from the reactions
    let reactionmember = reaction.message.guild.member(user);

    //get the temprole, Try to remove the temprole if its valid
    let temprole = apply_db.get(reaction.message.guild.id, "TEMP_ROLE");
    console.log(temprole)
    if (temprole != "0") {
      try {
        if (reactionmember.roles.cache.has(temprole))
          reactionmember.roles.remove(temprole);
      } catch {
        /* */
      }
    }

    //get the one.role, Try to remove the temprole if its valid
    let onerole = apply_db.get(reaction.message.guild.id, "one.role");
    console.log(onerole)
    if (onerole != "0") {
      try {
        if (reactionmember.roles.cache.has(onerole))
          reactionmember.roles.remove(onerole);
      } catch {
        /* */
      }
    }
    //get the two.role, Try to remove the temprole if its valid
    let tworole = apply_db.get(reaction.message.guild.id, "two.role");
    if (tworole != "0") {
      try {
        if (reactionmember.roles.cache.has(tworole))
          reactionmember.roles.remove(tworole);
      } catch {
        /* */
      }
    }

    //get the three.role, Try to remove the temprole if its valid
    let threerole = apply_db.get(reaction.message.guild.id, "three.role");
    if (threerole != "0") {
      try {
        if (reactionmember.roles.cache.has(threerole))
          reactionmember.roles.remove(threerole);
      } catch {
        /* */
      }
    }

    //get the four.role, Try to remove the temprole if its valid
    let fourrole = apply_db.get(reaction.message.guild.id, "four.role");
    if (fourrole != "0") {
      try {
        if (reactionmember.roles.cache.has(fourrole))
          reactionmember.roles.remove(fourrole);
      } catch {
        /* */
      }
    }

    //get the five.role, Try to remove the temprole if its valid
    let fiverole = apply_db.get(reaction.message.guild.id, "five.role");
    if (fiverole != "0") {
      try {
        if (reactionmember.roles.cache.has(fiverole))
          reactionmember.roles.remove(fiverole);
      } catch {
        /* */
      }
    }
  })
}
