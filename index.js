require('dotenv').config();
const express = require('express');
const { Client } = require('discord.js-selfbot-v13');

// Express sunucusu
const app = express();
app.get('/', (req, res) => {
    res.send('Bot is running!');
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Uptime server running on port ${PORT}`);
});

// Discord Selfbot
const client = new Client();

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const channel = await client.channels.fetch(process.env.BUMP_CHANNEL);

    async function bump() {
        await channel.sendSlash('302050872383242240', 'bump');
        console.count('Bumped!');
    }

    function loop() {
        var randomNum = Math.round(Math.random() * (9000000 - 7200000 + 1)) + 7200000;
        setTimeout(function () {
            bump();
            loop();
        }, randomNum);
    }

    bump();
    loop();
});

client.login(process.env.TOKEN);
