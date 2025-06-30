require('dotenv').config();
const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const { Streamer, prepareStream, playStream, Utils } = require('@dank074/discord-video-stream');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const client = new Client();
const streamer = new Streamer(client);

let currentStreamCommand = null;

const https = require('https');

https.get("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", res => {
    console.log("Sunucuya erişildi, durum:", res.statusCode);
}).on('error', err => {
    console.error("Sunucuya erişilemedi:", err.message);
});

// Basit yayın kontrol paneli
app.get('/', (req, res) => {
    res.send(`
        <h2>Yayın Kontrol Paneli</h2>
        <form method="POST" action="/start">
            <input type="text" name="url" placeholder="Video URL" required>
            <button type="submit">Yayını Başlat</button>
        </form>
        <form method="POST" action="/stop" style="margin-top:10px;">
            <button type="submit">Yayını Durdur</button>
        </form>
        <form method="POST" action="/seek" style="margin-top:10px;">
            <input type="number" name="seconds" placeholder="Kaç saniye ileri" required>
            <button type="submit">İleri Sar</button>
        </form>
    `);
});

// Yayını başlatma
app.post('/start', async (req, res) => {
    const url = req.body.url;
    if (currentStreamCommand) return res.send('Zaten aktif yayın var.');

    try {
        await streamer.joinVoice(process.env.GUILD_ID, process.env.VOICE_CHANNEL_ID);

        const { command, output } = prepareStream(url, {
            height: 1080,
            frameRate: 30,
            bitrateVideo: 5000,
            videoCodec: Utils.normalizeVideoCodec('H264'),
            h26xPreset: 'veryfast'
        });

        command.on('error', (err) => console.error('FFmpeg hatası:', err));
        await playStream(output, streamer, { type: 'go-live' });

        currentStreamCommand = { command, url };
        res.send('Yayın başlatıldı.');
    } catch (err) {
        console.error(err);
        res.send('Yayın başlatılamadı.');
    }
});

// Yayını durdurma
app.post('/stop', (req, res) => {
    if (currentStreamCommand) {
        currentStreamCommand.command.kill('SIGINT');
        currentStreamCommand = null;
        return res.send('Yayın durduruldu.');
    }
    res.send('Aktif yayın yok.');
});

// İleri sarma
app.post('/seek', async (req, res) => {
    const url = req.body.url;
    console.log('Gelen URL:', url); // Bu null veya boş mu?

    if (!url || url === 'null') {
        return res.send('Geçersiz URL');
    }
    const seconds = parseInt(req.body.seconds);
    if (!currentStreamCommand) return res.send('Önce yayını başlatmalısın.');

    try {
        currentStreamCommand.command.kill('SIGINT');

        const { command, output } = prepareStream(currentStreamCommand.url, {
            height: 1080,
            frameRate: 30,
            bitrateVideo: 5000,
            videoCodec: Utils.normalizeVideoCodec('H264'),
            h26xPreset: 'veryfast',
            customFfmpegFlags: ['-ss', `${seconds}`]
        });

        command.on('error', (err) => console.error('FFmpeg hatası:', err));
        await playStream(output, streamer, { type: 'go-live' });

        currentStreamCommand.command = command;
        res.send(`${seconds} saniye ileri sarıldı.`);
    } catch (err) {
        console.error(err);
        res.send('İleri sarma başarısız.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Uptime ve yayın kontrol paneli port ${PORT} üzerinde çalışıyor.`);
});

// Discord Selfbot + Bump Sistemi
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const channel = await client.channels.fetch(process.env.BUMP_CHANNEL);

    async function bump() {
        await channel.sendSlash('302050872383242240', 'bump');
        console.count('Bumped!');
    }

    function loop() {
        const randomNum = Math.round(Math.random() * (9000000 - 7200000 + 1)) + 7200000;
        setTimeout(() => {
            bump();
            loop();
        }, randomNum);
    }

    bump();
    loop();
});

streamer.client.login(process.env.TOKEN);
