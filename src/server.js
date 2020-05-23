const express = require('express')
const http = require('http')
const  router = require('./router')
const socketio = require('socket.io')
const cors = require('cors')
const game = require('./game')
const creategame = game.world()

const app = express()
const server = http.createServer(app)
const sockets = socketio(server)

app.use(express.static('public'))
app.use(express.json())
app.use(cors())

sockets.on('connection', socket => {
    const {user} = socket.handshake.query
})

app.use((req,res,next) =>{
    req.io = sockets;

    return next()
})

app.use(router)

server.listen(3000, () => {
    console.log(`> Server listening on port: 3000`)
})