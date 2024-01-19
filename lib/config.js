const fs = require('fs')
const chalk = require('chalk')

global.owner = ['6283838077485']
global.premium = ['6283838077485']
global.ownerr = '+62838-3807-7485'
global.namabot = 'Uno Bot'
global.nama = 'Jaa Ganteng'
global.packname = 'Jaa'
global.author = 'Ganteng'
global.sessionName = 'jaa'
global.foto = `https://telegra.ph/file/a89211423f857c7bc90e4.jpg`
global.sp = '⭔'
global.self = false
global.welcome = false
global.prefa = ['#','.']
global.mess = {
"wait": "*Proses*",
"Iv": "Link yang kamu berikan tidak valid",
"api": "Ups, terjadi kesalahan pada botkey, silahkan hubungi owner untuk memperbaikinya", 
"text": "Perintah ini hanya bisa digunakan text yang valid",
"image": "Perintah ini hanya bisa digunakan image yang valid",
"OnlyGrup": "Perintah ini hanya bisa digunakan di grup",
"OnlyPM": "Perintah ini hanya bisa digunakan di private message",
"GrupAdmin": "Perintah ini hanya bisa digunakan oleh Admin Grup", 
"success": "Succes kak", 
"BotAdmin": "Bot Harus menjadi admin",
"OnlyOwner": "Perintah ini hanya dapat digunakan oleh owner bot",
"OnlyPrem": "Perintah ini khusus member premium",
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update'${__filename}'`))
	delete require.cache[file]
	require(file)
})
