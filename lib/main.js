process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
const { exec, spawn, execSync } = require("child_process")
const path = require('path')
const os = require('os')
const { fs, watchFile, unwatchFile } = require('fs')

var isRunning = false
function start(file) {
   if (isRunning) return
   isRunning = true
   console.log("Starting . . .")
   let args = [path.join(__dirname, file), ...process.argv.slice(2)]
   let p = spawn(process.argv[0], args, { stdio: ["inherit", "inherit", "inherit", "ipc"] })
   .on("message", (data) => {
      console.log("[RECEIVED]", data)
      switch (data) {
         case "reset":
            platform() === "win32" ? p.kill("SIGINT") : p.kill()
            isRunning = false
            start.apply(this, arguments)
            break
         case "uptime":
            p.send(process.uptime())
            break
      }
   })
   .on("exit", (code) => {
      isRunning = false
      console.error("Exited with code:", code)
      if (code === 0) return
      watchFile(args[0], () => {
         unwatchFile(args[0])
         start(file)
      })
   })
}

start("index.js")