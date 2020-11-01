/**
 * @author PatheticMing
 * This is just a small and personal side project. 
 * Therefore, some private variables are deleted.
*/

'use strict';

const fs = require('fs');
const {Client, MessageEmbed, Guild} = require('discord.js');
const { send } = require('process');
const client = new Client();

const JSON_PATH = "./deadlines.json";

const ERROR_COURSE_CODE = "No such course code:\n\t";
const ERROR_ARGS = "Invalid args:\n\t";
const ERROR_RECORD_INDEX = "Unable to access record (index = '-1'):\n\t";

const prefix = '-';
var $total = 0;

/**
 * @var {string[]} $records - {{deadline0, deadline1, deadline2...}, total}
 */
var $records;

client.once('ready', () => {
   readJson();
   for(let i = 0; i < $records.total; i++) {
      const now = new Date();
      const deadline = new Date($records.records[i].deadline) + (1000*60*60*17);
      // Check if the deadline has already passed
      if(deadline - now < 0) {
         sendMessage(`:bell: **${$records.records[i].title}** from **${$records.records[i].course}** has been automatically removed.`);
         removeRecord($records.records.indexOf($records.records[i]));
         i--;
         continue;
      }
      setAlarm($records.records[i]);
   }
   $records.records = sortByTime();
   console.log($records);
   console.log('Deadline Fighter online!');
});

client.on('message', message => {
   if(!message.content.startsWith(prefix) || message.author.bot) return;
   let command = new String(message.content.slice(prefix.length).split(/ +/, 1));
   let args = message.content.slice(prefix.length+command.length+1).split(/ +/);
   // Commands
   if(command == "list" || command == "l") {
      message.channel.send(`:bangbang: Total of ***${$total}*** deadline(s) found! :`);
      for(let i = 0; i < $total; i++) {
         message.channel.send(command_List($records.records[i], i));
      }
   }else if(command == "add" || command == "a") {
      if(!command_AddDeadline(args)) {
         message.reply("Invalid/missing argurment!");
      }else {
         message.reply("Deadline has been added.");
      }
   }else if(command == "remove" || command == "r") {
      if(!command_RemoveDeadline(args)) {
         message.reply("Invalid/missing argurment!");
      }else {
         message.reply("Deadline has been removed.");
      }
   }
});

function command_List(record, i) {
   var embed = new MessageEmbed().setTitle(`ID\t**${i}**`);

      const deadDate = new Date(String(record.deadline));
      const now = new Date();
      const hours = ((deadDate.getTime() + (1000*60*60*17) - now.getTime()) / (1000*60*60)).toFixed(1);
      embed
      // Set the color of the embed
      .setColor(0xff0000)
      // Course
      .addField("Course", record.course, true)
      // Title of the assignment
      .addField("Title", record.title, true)
      // Deadline
      .addField("Deadline", record.deadline)
      // Time remaining
      .addField("Time Remaining", `You have got **${hours} hours** to finish`);
   
   return embed;
}

function command_AddDeadline(args) {
   // Check argurments
   if(args.length != 3) {
      console.error(ERROR_ARGS + `'${args}'`);
      return false;
   }

   var course, title, deadline, hh;
   course = args.shift();
   title = args.shift();
   deadline = args.shift();
   // hh = parseInt(args.shift());
   // Check user input
   if(codes.indexOf(course) == -1) {
      console.error(ERROR_COURSE_CODE + `'${course}'`);
      return false;
   }
   var deadDate = new Date(String(deadline)) + (1000*60*60*17);
   var now = new Date();
   if(isNaN(Date.parse(deadline)) || (deadDate - now) <= 0) {
      return false;
   }
   var record = {course:course, title:title, deadline:deadline};
   console.log(record);
   setAlarm(record);

   return saveRecord(record);
}

function command_RemoveDeadline(args) {
   // Check argurments
   if(args.length != 1) {
      return false;
   }

   const i = parseInt(args.shift());
   const index = $records.records.indexOf($records.records[i]);
   if(index == -1) {
      return false;
   }
   
   return removeRecord(index);
}

/**
 * The hour of deadline is 0800 by default, add 17 hours to 0000
 * 
 * setTimeout limit is MAX_INT32=(2^31-1), which is about 24.85 days
 * When the deadline diff exceeds the limit, call back itself after 17 days
 * 
 * @param {string[]} record - {course, title, deadline}
 */
function setAlarm(record) {
   const index = $records.records.indexOf(record);
   if(index == -1) {
      // record removed, ignore the outdated setTimeout()
      return;
   }
   let now = new Date();
   let deadline = new Date(String(record.deadline));
   if(deadline.getTime() + (1000*60*60*17) > 0x7FFFFFFF) {
      setTimeout(() => {setAlarm(record)}, 1000*60*60*24*17);
      return;
   }

   deadline += (1000*60*60*17);
   let _7days = new Date(deadline - (1000*60*60*24*7));
   let _3days = new Date(deadline - (1000*60*60*24*3));
   let _1day = new Date(deadline - (1000*60*60*24));
   const _cache = client.guilds.cache.get(GUILD_ID).roles.cache;
   let role, hours, dayCount;
   switch(record.course) {
      case STR_1:
         role = _cache.get(KEY_1);
         break;
      case STR_2:
         role = _cache.get(KEY_2);
         break;
      case STR_3:
         role = _cache.get(KEY_3);
         break;
      case STR_4:
         role = _cache.get(KEY_4);
         break;
      case STR_5:
         role = _cache.get(KEY_5);
         break;
      case STR_6:
         role = _cache.get(KEY_6);
         break;
      case STR_7:
         role = _cache.get(KEY_7);
         break;
   }
   dayCount = ((deadline - now)/(1000*60*60*24)).toFixed(1);
   if(dayCount >= 7) {
      // Seven days
      hours = ((deadline - _7days)/(1000*60*60)).toFixed(1);
      setTimeout(() => {sendMessage(`${role}, :bell: You have still got ***${hours}*** hours to finish **${record.title}**!`);}, _7days - now);
   }
   if(dayCount >= 3) {
      // Three days
      hours = ((deadline - _3days)/(1000*60*60)).toFixed(1);
      setTimeout(() => {sendMessage(`${role}, :bell: You have still got ***${hours}*** hours to finish **${record.title}**!`)}, _3days - now);
   }
      // One day
   if(dayCount >= 1) {
      hours = ((deadline - _1day)/(1000*60*60)).toFixed(1);
      setTimeout(() => {sendMessage(`${role}, :bell: You have still got ***${hours}*** hours to finish **${record.title}**!`)}, _1day - now);
   }
   // Deadline
   setTimeout(() => {sendMessage(`${role}, :wave: Say goodbye to **${record.title}**.`);
                     removeRecord($records.records.indexOf(record));}, deadline - now + 3000);
}

function sendMessage(content) {
   const channel = client.channels.cache.get(CHANNEL_ID);
   channel.send(content);
}

function readJson() {
   if(fs.existsSync(JSON_PATH)) {
      var data = fs.readFileSync(JSON_PATH);
      $records = JSON.parse(data);
      $total = $records.total;
      $records.records = sortByTime();
      console.log("Read JSON");
   }else {
      $records = {records:[],total:$total}
      console.log("No JSON found");
   }
}

function saveRecord(record) {
   // Check if file exists
   if(fs.existsSync(JSON_PATH)) {
      fs.readFile(JSON_PATH, function(e, data) {
         if(e) { throw e;}
         $total++;
         $records = JSON.parse(data);
         $records.records.push(record);
         $records.total = $total;
         $records.records = sortByTime();
         fs.writeFile(JSON_PATH, JSON.stringify($records), 'utf8', function(e) {
            if(e) { throw e;}
         });
      });
   }else {
      $total++;
      $records.records.push(record);
      $records.total = $total;
      fs.writeFile(JSON_PATH, JSON.stringify($records), 'utf8', function(e) {
         if(e) { throw e;}
      });
   }
   return true;
}

function removeRecord(index) {
   if(index == -1) {
      console.error(ERROR_RECORD_INDEX + `index = ${index}`);
      return false;
   }
   var temp = $records.records.splice(index, 1);
   if(temp != undefined) {
      if(fs.existsSync(JSON_PATH)) {
         $records.total = --$total;
         fs.writeFile(JSON_PATH, JSON.stringify($records), 'utf8', function(e) {
            if(e) { throw e;}
         });
      }
      return true;
   }
   return false;
}

function sortByTime() {
   var tempArr = $records.records;
   return mergeSort(tempArr);
}

function mergeSort(arr) {
   if(arr.length > 1) {
      let mid = Math.floor(arr.length/2);
      // left
      var leftArr = arr.slice(0, mid);
      // right
      var rightArr = arr.slice(mid);
      //merge
      return merge(mergeSort(leftArr), mergeSort(rightArr));
   }else {
      return arr;
   }
}

function merge(leftArr, rightArr) {
   var arr = [], left = 0, right = 0;
   // Merge until one of the array has no element left
   while(left < leftArr.length && right < rightArr.length) {
      var left_Deadline = (new Date(String(leftArr[left].deadline))).getTime() + (1000*60*60*17);
      var right_Deadline = (new Date(String(rightArr[right].deadline))).getTime() + (1000*60*60*17);
      if(left_Deadline < right_Deadline) {
         arr.push(leftArr[left]);
         left++;
      }else {
         arr.push(rightArr[right]);
         right++;
      }
   }
   // Join the rest of the element(s) to the array
   return arr.concat(leftArr.slice(left)).concat(rightArr.slice(right));
}

client.login(DISCORD_TOKEN);
