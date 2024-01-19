process.on("uncaughtException", console.error); // 
const config = require('./config.js')

const baileys = require('@whiskeysockets/baileys')
const { DisconnectReason, 
jidNormalizedUser,
getAggregateVotesInPollMessage,
makeCacheableSignalKeyStore,
makeInMemoryStore,
PHONENUMBER_MCC,
generateForwardMessageContent, 
proto, 
useMultiFileAuthState, 
jidDecode, 
WAMessageKey, 
prepareWAMessageMedia,
generateWAMessageFromContent, 
generateMessageID, 
generateWAMessage, 
generateWAMessageContent, 
downloadContentFromMessage, 
getContentType, 
areJidsSameUser,
BufferJSON, MessageType,
} = baileys
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const yargs = require('yargs/yargs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const readline = require("readline");
const NodeCache = require("node-cache")
const PhoneNumber = require('awesome-phonenumber')
const { parsePhoneNumber } = require("libphonenumber-js")
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep } = require('./fetcher')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./exif')
let phoneNumber = "62882870573160"
let sessioN = "./lib/session"
const store = makeInMemoryStore({ logger: pino({ level: "fatal" }).child({ level: "fatal" }) })
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

async function startUno() {
process.on("unhandledRejection", (err) => console.error(err))

const { state, saveCreds } = await useMultiFileAuthState(`${sessioN}`)
const msgRetryCounterCache = new NodeCache()

const uno = baileys.default({
logger: pino({ level: "fatal" }).child({ level: "fatal" }),
printQRInTerminal: !pairingCode,
mobile: useMobile,
auth: {
creds: state.creds,
keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
},
browser: ['Chrome (Linux)', '', ''], 
markOnlineOnConnect: true,
generateHighQualityLinkPreview: true,
getMessage: async (key) => {
let jid = jidNormalizedUser(key.remoteJid)
let msg = await store.loadMessage(jid, key.id)

return msg?.message || ""
},
msgRetryCounterCache,
defaultQueryTimeoutMs: undefined,
})
   
store.bind(uno.ev)

uno.ev.on("contacts.update", (update) => {
for (let contact of update) {
let id = jidNormalizedUser(contact.id)
if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
}
})

if (pairingCode && !uno.authState.creds.registered) {
if (useMobile) throw new Error('Cannot use pairing code with mobile api')

let phoneNumber
if (!!phoneNumber) {
phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
console.log(chalk.bgBlack(chalk.redBright("Start with your country's WhatsApp code, Example : 62xxx")))
process.exit(0)
}
} else {
phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number : `)))
phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

         // Ask again when entering the wrong number
if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
console.log(chalk.bgBlack(chalk.redBright("Start with your country's WhatsApp code, Example : 62xxx")))

phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number : `)))
phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
rl.close()
}
}

setTimeout(async () => {
let code = await uno.requestPairingCode(phoneNumber)
code = code?.match(/.{1,4}/g)?.join("-") || code
console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
}, 3000)
}

if (useMobile && !uno.authState.creds.registered) {
const { registration } = uno.authState.creds || { registration: {} }

if (!registration.phoneNumber) {
let phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number : `)))
phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
console.log(chalk.bgBlack(chalk.redBright("Start with your country's WhatsApp code, Example : 62xxx")))

phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number : `)))
phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
}

registration.phoneNumber = "+" + phoneNumber
}

const phoneNumber = parsePhoneNumber(registration.phoneNumber)
if (!phoneNumber.isValid()) throw new Error('Invalid phone number: ' + registration.phoneNumber)

registration.phoneNumber = phoneNumber.format("E.164")
registration.phoneNumberCountryCode = phoneNumber.countryCallingCode
registration.phoneNumberNationalNumber = phoneNumber.nationalNumber

const mcc = PHONENUMBER_MCC[phoneNumber.countryCallingCode]
registration.phoneNumberMobileCountryCode = mcc

async function enterCode() {
try {
const code = await question(chalk.bgBlack(chalk.greenBright(`Please Enter Your OTP Code : `)))
const response = await uno.register(code.replace(/[^0-9]/g, '').trim().toLowerCase())
console.log(chalk.bgBlack(chalk.greenBright("Successfully registered your phone number.")))
console.log(response)
rl.close()
} catch (e) {
console.error('Failed to register your phone number. Please try again.\n', e)
await askOTP()
}
}

async function enterCaptcha() {
const response = await sock.requestRegistrationCode({ ...registration, method: 'captcha' })
const pathFile = path.join(process.cwd(), "temp", "captcha.png")
fs.writeFileSync(pathFile, Buffer.from(response.image_blob, 'base64'))
await open(pathFile)
const code = await question(chalk.bgBlack(chalk.greenBright(`Please Enter Your Captcha Code : `)))
fs.unlinkSync(pathFile)
registration.captcha = code.replace(/["']/g, '').trim().toLowerCase()
}

async function askOTP() {
if (!registration.method) {
let code = await question(chalk.bgBlack(chalk.greenBright('What method do you want to use? "sms" or "voice" : ')))
code = code.replace(/["']/g, '').trim().toLowerCase()

if (code !== 'sms' && code !== 'voice') return await askOTP()

registration.method = code
}

try {
await uno.requestRegistrationCode(registration)
await enterCode()
} catch (e) {
console.error('Failed to request registration code. Please try again.\n', e)
if (e?.reason === 'code_checkpoint') {
await enterCaptcha()
}
await askOTP()
}
}

await askOTP()
}

uno.ev.on('group-participants.update', async (anu) => {
console.log(anu)
try {
let metadata = await uno.groupMetadata(anu.id)
let participants = anu.participants
for (let num of participants) { 
if (anu.action == 'add' && global.welcome) { 
asw = `Haii Kak *@${num.split("@")[0]}* Selamat Datang Di Group *${metadata.subject}* 👋
 ▬▭▬▭▬▭▬▭▬▬▭▬▭▬
Terima Kasih Sudah Bergabung Jangan Lupa Baca Deskripsi Yah
▬▭▬▭▬▭▬▭▬▬▭▬▭▬`
uno.sendMessage(anu.id, {  text: asw, mentions: [num]})
}
}
} catch (err) {
console.log(err)
}
})

uno.ev.on('messages.upsert', async chatUpdate => {
try {
mek = chatUpdate.messages[0]
if (!mek.message) return
mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
if (mek.key && mek.key.remoteJid === 'status@broadcast') return
if (!uno.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
if (mek.key.id.startsWith('FatihArridho_')) return
m = smsg(uno, mek, store)
require("./uno")(uno, m, chatUpdate, store)
} catch (err) {
console.log(err)
}
})

uno.decodeJid = (jid) => {
if (!jid) return jid
if (/:\d+@/gi.test(jid)) {
let decode = jidDecode(jid) || {}
return decode.user && decode.server && decode.user + '@' + decode.server || jid
} else return jid
}

uno.public = true

uno.serializeM = (m) => smsg(uno, m, store)

uno.ev.on("connection.update", async (update) => {
const { lastDisconnect, connection, qr } = update
if (connection) {
console.info(`Connection Status : ${connection}`)
}
      
let numberOwner = ["6283838077485"]
      
if (connection === "close") {
let reason = new Boom(lastDisconnect?.error)?.output.statusCode
if (reason === DisconnectReason.badSession) { console.log(`Bad Session File, Please Delete Session and Scan Again`); uno.logout(); }
else if (reason === DisconnectReason.connectionClosed) { console.log("Connection closed, reconnecting...."); startUno(); }
else if (reason === DisconnectReason.connectionLost) { console.log("Connection Lost from Server, reconnecting..."); startUno(); }
else if (reason === DisconnectReason.connectionReplaced) { console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First"); uno.logout(); }
else if (reason === DisconnectReason.loggedOut) { console.log(`Device Logged Out, Please Scan Again And Run.`); uno.logout(); }
else if (reason === DisconnectReason.restartRequired) { console.log("Restart Required, Restarting..."); startUno(); }
else if (reason === DisconnectReason.timedOut) { console.log("connection TimedOut, Reconnecting..."); startUno(); }
else uno.end(`Unknown DisconnectReason: ${reason}|${connection}`)
}

if (connection === "open") {
uno.sendMessage(numberOwner[0] + "@s.whatsapp.net", {
text: `${uno?.user?.name || "uno"} has Connected...`,
})
}
})


uno.ev.on("creds.update", saveCreds)

uno.sendText = (jid, text, quoted = '', options) => uno.sendMessage(jid, { text: text, ...options }, { quoted })

uno.sendFile = async(jid, PATH, fileName, quoted = {}, options = {}) => {
let types = await uno.getFile(PATH, true)
let { filename, size, ext, mime, data } = types
let type = '', mimetype = mime, pathFile = filename
if (options.asDocument) type = 'document'
if (options.asSticker || /webp/.test(mime)) {
let { writeExif } = require('./sticker.js')
let media = { mimetype: mime, data }
pathFile = await writeExif(media, { packname: global.packname, author: global.packname2, categories: options.categories ? options.categories : [] })
await fs.promises.unlink(filename)
type = 'sticker'
mimetype = 'image/webp'}
else if (/image/.test(mime)) type = 'image'
else if (/video/.test(mime)) type = 'video'
else if (/audio/.test(mime)) type = 'audio'
else type = 'document'
await uno.sendMessage(jid, { [type]: { url: pathFile }, mimetype, fileName, ...options }, { quoted, ...options })
return fs.promises.unlink(pathFile)}

uno.sendImage = async (jid, path, caption = '', quoted = '', options) => {
	let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
return await uno.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
}

uno.sendVideo = async (jid, path, caption = '', quoted = '', gif = false, options) => {
let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
return await uno.sendMessage(jid, { video: buffer, caption: caption, gifPlayback: gif, ...options }, { quoted })
}

uno.sendAudio = async (jid, path, quoted = '', ptt = false, options) => {
let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
return await uno.sendMessage(jid, { audio: buffer, ptt: ptt, ...options }, { quoted })
}

uno.sendTextWithMentions = async (jid, text, quoted, options = {}) => uno.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })

uno.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifImg(buff, options)
} else {
buffer = await imageToWebp(buff)
}

await uno.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer
}

uno.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifVid(buff, options)
} else {
buffer = await videoToWebp(buff)
}

await uno.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer
}
 
uno.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
let quoted = message.msg ? message.msg : message
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(message, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}
let type = await FileType.fromBuffer(buffer)
trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
await fs.writeFileSync(trueFileName, buffer)
return trueFileName
}

uno.downloadMediaMessage = async (message) => {
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(message, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
	}
	return buffer
 }
 
uno.copyNForward = async (jid, message, forceForward = false, options = {}) => {
let vtype
if (options.readViewOnce) {
message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
vtype = Object.keys(message.message.viewOnceMessage.message)[0]
delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
delete message.message.viewOnceMessage.message[vtype].viewOnce
message.message = {
...message.message.viewOnceMessage.message
}}
let mtype = Object.keys(message.message)[0]
let content = await generateForwardMessageContent(message, forceForward)
let ctype = Object.keys(content)[0]
		let context = {}
if (mtype != "conversation") context = message.message[mtype].contextInfo
content[ctype].contextInfo = {
...context,
...content[ctype].contextInfo
}
const waMessage = await generateWAMessageFromContent(jid, content, options ? {
...content[ctype],
...options,
...(options.contextInfo ? {
contextInfo: {
...content[ctype].contextInfo,
...options.contextInfo
}
} : {})
} : {})
await uno.relayMessage(jid, waMessage.message, { messageId:waMessage.key.id })
return waMessage
}

uno.cMod = (jid, copy, text = '', sender = uno.user.id, options = {}) => {
let mtype = Object.keys(copy.message)[0]
let isEphemeral = mtype === 'ephemeralMessage'
if (isEphemeral) {
mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
}
let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
let content = msg[mtype]
if (typeof content === 'string') msg[mtype] = text || content
else if (content.caption) content.caption = text || content.caption
else if (content.text) content.text = text || content.text
if (typeof content !== 'string') msg[mtype] = {
...content,
...options
}
if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
copy.key.remoteJid = jid
copy.key.fromMe = sender === uno.user.id
return proto.WebMessageInfo.fromObject(copy)
}

uno.getFile = async (PATH, save) => {
let res
let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
let type = await FileType.fromBuffer(data) || {
mime: 'application/octet-stream',
ext: '.bin'
}
filename = path.join(__filename, '../src/' + new Date * 1 + '.' + type.ext)
if (data && save) fs.promises.writeFile(filename, data)
return {
res,
filename,
	size: await getSizeMedia(data),
...type,
data
}}
return uno
}

startUno()


let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update ${__filename}`))
	delete require.cache[file]
	require(file)
})
