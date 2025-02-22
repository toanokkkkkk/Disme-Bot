module.exports.config = {
    name: "uptime",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "ChatGPT",
    description: "Xem thời gian bot đã hoạt động",
    commandCategory: "system",
    usages: "[uptime]",
    cooldowns: 5
};

module.exports.run = async function({ api, event }) {
    const time = process.uptime();
    const days = Math.floor(time / (60 * 60 * 24));
    const hours = Math.floor((time % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((time % (60 * 60)) / 60);
    const seconds = Math.floor(time % 60);

    const uptimeString = `${days}d:${hours}h:${minutes}m:${seconds}s`;
    const progress = "━".repeat(15);
    const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

    const message = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃    ⭐ BOT STATUS ⭐    ┃
╰━━━━━━━━━━━━━━━━━━━━━╯

▸ Uptime Information ◂
╭────────────────────
│ ⏱️ Running Time: ${uptimeString}
│ 📊 Memory Usage: ${memory}MB
│ 🔰 Version: ${global.config.version || "2.0.0"}
╰────────────────────

▸ Time Details ◂
╭────────────────────
│ 📆 Days: ${days}
│ 🕐 Hours: ${hours}
│ ⏰ Minutes: ${minutes}
│ ⚡ Seconds: ${seconds}
╰────────────────────

▸ Progress Bar ◂
╭────────────────────
│ [${progress}] 100%
╰────────────────────

✨ Bot is running perfectly!
💫 Made with love by ${global.config.BOTNAME || "Bot"}

`.trim();

    return api.sendMessage(message, event.threadID, event.messageID);
};