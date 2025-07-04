require('dotenv').config()
const express = require('express')
const { Client } = require('discord.js-selfbot-v13')
const client = new Client()

const app = express()
app.get('/', (req, res) => res.send('Bot is running!'))
app.listen(process.env.PORT || 3000, () => {
  console.log('Uptime server started.')
})

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`)
  const channel = await client.channels.fetch(process.env.BUMP_CHANNEL)

  async function bump() {
    try {
      const response = await channel.sendSlash('302050872383242240', 'bump')
      console.count('Bump komutu gönderildi!')

      const embed = response.embeds[0]
      const description = embed?.description || ''

      const match = description.match(/(\d+)\s*dakika/)
      if (match) {
        const totalMinutes = parseInt(match[1])
        const minDelay = totalMinutes * 60 * 1000
        const maxDelay = (totalMinutes + 30) * 60 * 1000

        const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay
        console.log(`Disboard engeli: ${totalMinutes} dakika. Yeni bump: ${Math.round(delay / 60000)} dakika içinde.`)
        setTimeout(() => bump(), delay)
      } else {
        const fallbackDelay = Math.round(Math.random() * (9000000 - 7200000)) + 7200000
        console.log(`Başarılı bump. ${Math.round(fallbackDelay / 60000)} dakika sonra tekrar.`)
        setTimeout(() => bump(), fallbackDelay)
      }
    } catch (err) {
      console.error('Bump sırasında hata:', err)
      setTimeout(() => bump(), 3600000)
    }
  }

  bump()
})

client.login(process.env.TOKEN).catch(err => {
  console.error("Login sırasında hata:", err)
})
