//import the config.json file
const config = require("../botconfig/config.json")
var ee = require(`../botconfig/embed.json`);
var emoji = require(`../botconfig/emojis.json`);
var {
    MessageEmbed, MessageAttachment
} = require(`discord.js`);
const { databasing } = require("./functions")
const fetch = require("node-fetch")
module.exports = client => {
  
    client.on("message", async message => {
        try{
            if (!message.guild || !message.channel || message.author.bot) return;
            client.settings.ensure(message.guild.id, {
                aichat: "no",
            });
            let chatbot = client.settings.get(message.guild.id, "aichat");
            if(!chatbot || chatbot == "no") return;
            if(message.channel.id == chatbot){
              if(message.attachments.size > 0)
              {
                  const attachment = new MessageAttachment("https://cdn.discordapp.com/attachments/816645188461264896/826736269509525524/I_CANNOT_READ_FILES.png")
                  return message.channel.send(attachment)
              }
              fetch(`http://api.brainshop.ai/get?bid=153861&key=0ZjvbPWKAxJvcJ96&uid=1&msg=${encodeURIComponent(message)}`)
             .then(res => res.json())
             .then(data => {
                message.channel.send(data.cnt).catch(e => console.log("CHATBOT:".underline.red + " :: " + e.stack.toString().red));
             });
            }
        }catch{}
    })

}