const express = require('express')
const http = require('http')
const router = require('./router')
const socketio = require('socket.io')
const cors = require('cors')
const create = require('./game')


const app = express()
const server = http.createServer(app)
const sockets = socketio(server)

app.use(express.static('public'))
app.use(express.json())
app.use(cors())

const game = create.world()

game.subscribe((command) => {
    console.log(`> Emitting ${command.type}`)
    sockets.to(command.players[1]).emit(command.type, command)
    sockets.to(command.players[2]).emit(command.type, command)
})

sockets.on('connection', (socket) => {
    const playerid = socket.id
    const { gameid } = socket.handshake.query
    console.log(`> Player connected: ${playerId}`)

    if (gameid) {
        game.addPlayerInGame({ socketid: playerid, gameid })
        socket.emit('setup', game.getRoom({ gameid }))
    } else {
        game.addNewPlayer({ socketid: playerid })
        socket.emit('setup', game.getRoom({ playerid }))
    }

    socket.on('disconnect', () => {
        game.removePlayer({ playerid })
        console.log(`> Player disconnected: ${playerId}`)
    })

    socket.on('move', (command) => {
        command.playerid = playerid
        command.type = 'move'

        game.playAttempt(command)
    })

})

app.use((req, res, next) => {
    req.io = sockets;

    return next()
})

app.use(router)

server.listen(3000, () => {
    console.log(`> Server listening on port: 3000`)
})