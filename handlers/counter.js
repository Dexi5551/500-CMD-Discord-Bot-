
const Quick = require('quick.db-plus');
const db7 = new Quick.db('CounterBotChannel'); 
module.exports = function (client, options) {
    const description = {
        name: "chatbot",
        filename: "chatbot.js",
        version: "3.2"
    }

    console.log(` :: ⬜️ Module: ${description.name} | Loaded version ${description.version} from ("${description.filename}")`)

    client.on("message", message => {
        if(message.author.bot) return;
        if(message.channel.id == db7.get(`counterchat_${message.guild.id}`)){
   
        let count = db7.get(`counter_${message.guild.id}`);
        if(!count) db7.set(`counter_${message.guild.id}`, {
          number: 0,
          author: client.user.id
        });
        if (count === null) count = db7.set(`counter_${message.guild.id}`, {
          number: 0,
          author: client.user.id
        });
        
        if (!message.author.bot && message.author.id === count.author) {
          message.delete();
          message.reply("Please wait for your turn").then(m => m.delete({timeout: 3000}));
          return;
        }
        if (!message.author.bot && isNaN(message.content)) {
          message.delete();
          message.reply("Messages in this channel must be a number").then(m => m.delete({timeout: 3000}));
          return;
        }
        if (!message.author.bot && parseInt(message.content) !== count.number + 1) {
          message.delete();
          message.reply(`Next number must be ${count.number + 1}`).then(m => m.delete({timeout: 3000}));
          return;
        }
        count = db7.set(`counter_${message.guild.id}`, { number: count.number + 1, author: message.author.id });
      }
  })
}
