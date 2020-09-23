const express = require('express')
const http = require('http')
const router = require('./router')
const socketio = require('socket.io')
const cors = require('cors')
const create = require('./game')
const minimax = require('./bot')

const app = express()
const server = http.createServer(app)
const sockets = socketio(server)

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
    if (!game.getRoom({gameid}).error) {
        game.addPlayerInGame({ socketid: playerid, gameid })
        socket.emit('setup', game.getRoom({ gameid }))
        console.log(`> Player connected in room ${gameid}: ${playerid}`)
    }else{
        game.addNewPlayer({gameid})
        game.addPlayerInGame({ socketid: playerid, gameid })
        socket.emit('setup', game.getRoom({ gameid }))
    }

    socket.on('disconnect', () => {
        game.removePlayer({ playerid })
        console.log(`> Player disconnected: ${playerid}`)
    })

    socket.on('add-bot', () => {
        game.addPlayerInGame({ socketid: 'bot', gameid })
        console.log(`> bot adicionado: ${gameid}`)
    })

    socket.on('move', (command) => {
        command.playerid = playerid
        command.type = 'move'
        if(command.gameid == 0){
            command.gameid = playerid
        }
        game.playAttempt(command)
    })

    socket.on('reset', (command)=>{
        command.type = 'reset'
        game.resetGame(command)
    })

})

app.use((req, res, next) => {
    req.io = sockets;
    req.game = game
    return next()
})

app.use(router)

server.listen(process.env.PORT || 3333, () => {
    console.log(`> Server listening on port: 3333`)
})