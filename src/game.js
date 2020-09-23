const minimax = require('./bot')
module.exports = {

    world() {

        const state = {
            rooms: {
            }
        }
        const bot = minimax.bot()
        const observers = []

        function subscribe(observerFunction) {
            observers.push(observerFunction)
        }

        function notifyAll(command) {
            for (const observerFunction of observers) {
                observerFunction(command)
            }
        }

        function getRoom(command) {
            if (state.rooms[command.gameid || command.playerid]) {
                return state.rooms[command.gameid || command.playerid]
            } else {
                return { error: true }
            }
        }

        function getNumRooms() {
            return Object.keys(state.rooms).length
        }

        function addNewPlayer(command) {
            const gameid = command.gameid
            let matrix = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
            state.rooms[gameid] = {
                game: matrix,
                players: {},
                parts: {},
                pontuacao: { 1: 0, 2: 0, 3: 0 },
                playerTime: 0,
                bot: false
            }
            console.log("> New room  " + gameid);

            return state.rooms[gameid]
        }

        function addPlayerInGame(command) {
            const playerid = command.socketid
            const gameid = command.gameid
            const players = state.rooms[gameid].players
            const numberPlayers = Object.keys(players).length
            const parts = state.rooms[gameid].parts
            
            if(playerid == 'bot'){
                state.rooms[gameid].bot = true
                state.rooms[gameid].pontuacao = { 1: 0, 2: 0, 3: 0 }
                resetGame({gameid})
            }else{
                if(state.rooms[gameid].bot){
                    state.rooms[gameid].pontuacao = { 1: 0, 2: 0, 3: 0 }
                    resetGame({gameid})
                    removePlayer({playerid: "bot"})
                    state.rooms[gameid].bot = false
                    addPlayerInGame({socketid:playerid,gameid})
                }
            }
            
            if (numberPlayers == 0) {
                state.rooms[gameid].players[playerid] = 1
                state.rooms[gameid].parts[1] = playerid
                state.rooms[gameid].playerTime = 0
            } else {
                if (numberPlayers == 1) {
                    if (parts[1] == null) {
                        state.rooms[gameid].players[playerid] = 1
                        state.rooms[gameid].parts[1] = playerid
                        state.rooms[gameid].playerTime = 2
                    } else {
                        if (parts[2] == null) {
                            state.rooms[gameid].players[playerid] = 2
                            state.rooms[gameid].parts[2] = playerid
                            state.rooms[gameid].playerTime = 1
                        }
                    }
                }
            }
            
            notifyAll({
                type: 'add-player',
                playerTime: state.rooms[gameid].playerTime,
                game: state.rooms[gameid].game,
                players: state.rooms[gameid].parts
            })
           
            return state.rooms[gameid]
        }

        function removePlayer(command) {
            const playerid = command.playerid
            const rooms = state.rooms

            for (let [gameid, room] of Object.entries(rooms)) {
                if (room.players[playerid]) {
                    delete state.rooms[gameid].parts[room.players[playerid]]
                    delete state.rooms[gameid].players[playerid]
                    delete state.rooms[gameid].parts[room.players['bot']]
                    delete state.rooms[gameid].players['bot']
                    const numberPlayers = Object.keys(room.players).length

                    if (numberPlayers == 0) {
                        delete state.rooms[gameid]
                        console.log("> Delete room " + gameid);
                    } else {
                        state.rooms[gameid].playerTime = 0
                        notifyAll({
                            type: 'remove-player',
                            players: state.rooms[gameid].parts,
                            playerTime: state.rooms[gameid].playerTime
                        })
                    }
                }
            }


            return state.rooms
        }

        function playAttempt(command) {
            const gameid = command.gameid
            const playerid = command.playerid
            const { i, j } = command.position
            const part = state.rooms[gameid].players[playerid]

            if (state.rooms[gameid].game[i][j] == 0 && state.rooms[gameid].players[playerid] == state.rooms[gameid].playerTime) {
                state.rooms[gameid].game[i][j] = part
                const { game, situation } = testsGame({ gameid, part, playerid })

                if (state.rooms[gameid].playerTime != 0 && state.rooms[gameid].playerTime != 3) {
                    if (state.rooms[gameid].playerTime == 1) {
                        state.rooms[gameid].playerTime = 2
                    } else {
                        state.rooms[gameid].playerTime = 1
                    }
                }

                notifyAll({
                    type: 'attempt',
                    players: state.rooms[gameid].parts,
                    game,
                    situation,
                    playerTime: state.rooms[gameid].playerTime,
                    pontuacao: state.rooms[gameid].pontuacao
                })

                if( state.rooms[gameid].bot && state.rooms[gameid].players['bot'] == state.rooms[gameid].playerTime){

                   botAttempt(gameid)
                }

                return {
                    game,
                    situation,
                    playerTime: state.rooms[gameid].playerTime,
                    pontuacao: state.rooms[gameid].pontuacao
                }
            } else {
                return { error: 'Fail' }
            }
        }

        function botAttempt(gameid){
            const game = state.rooms[gameid].game
            const vector = []
            for(let i=0;i< 3;i++){
                for(let j=0; j<3; j++){
                    if(game[i][j] == 1){
                        vector.push("X")
                    }else{
                        if(game[i][j] == 2){
                            vector.push("O")
                        }else{
                            vector.push(0)
                        }
                    }
                }
            }
            for(let i=0; i < 9; i++){
                if(vector[i] == 0){
                    vector[i] = i
                }
            }
            
            const index = bot.minimax(vector, (state.rooms[gameid].playerTime == 1)? "X":"O").index

            let position = {}
            if(index < 3){
                position = {i: 0, j: index}
            }else{
                if ( index < 6){
                    position = {i: 1, j: index - 3}
                }
                else{
                    position = {i: 2, j: index - 6}
                }
            }
            
            playAttempt({gameid, playerid:'bot', position})
        }

        function resetGame(command) {
            const gameid = command.gameid
            let matrix = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]

            if (state.rooms[gameid].playerTime == 3 || state.rooms[gameid].bot) {
                state.rooms[gameid].game = matrix
                let n = Math.floor(Math.random() * 10)

                    if (n > 5 ) {
                        state.rooms[gameid].playerTime = 1
                    } else {
                        state.rooms[gameid].playerTime = 2
                    }
            }

            notifyAll({
                type: 'reset-game',
                game: state.rooms[gameid].game,
                playerTime: state.rooms[gameid].playerTime,
                players: state.rooms[gameid].parts
            })

            if(state.rooms[gameid].bot && state.rooms[gameid].players['bot'] == state.rooms[gameid].playerTime){
                botAttempt(gameid)    
            }

            return {
                newGame: { game: state.rooms[gameid].game },
                playerTime: state.rooms[gameid].playerTime
            }
        }

        function testsGame(command) {
            const gameid = command.gameid

            const game = state.rooms[gameid].game
            const part = command.part
            let situation = []

            const result = testsWinner({ part, game })
            if (result.modes > 0) {
                situation = result.situation
                state.rooms[gameid].pontuacao[state.rooms[gameid].players[command.playerid]] += 1
                state.rooms[gameid].playerTime = 3
            } else {
                if (game[0].indexOf(0) == -1 && game[1].indexOf(0) == -1 && game[2].indexOf(0) == -1) {
                    situation.push({ winner: false, type: 'old' })
                    state.rooms[gameid].pontuacao[3] += 1
                    state.rooms[gameid].playerTime = 3
                } else {
                    situation.push({ winner: false, type: 'continue' })
                }
            }


            return { situation, game }
        }

        function testsWinner({ part, game }) {
            const situation = []

            for (let i = 0; i < 3; i++) {
                if (game[i][0] == part && game[i][1] == part && game[i][2] == part) {
                    situation.push({ winner: true, type: 'line', i })
                }
                if (game[0][i] == part && game[1][i] == part && game[2][i] == part) {
                    situation.push({ winner: true, type: 'column', i })
                }
            }

            if (game[0][0] == part && game[1][1] == part && game[2][2] == part) {
                situation.push({ winner: true, type: 'main' })
            }
            if (game[0][2] == part && game[1][1] == part && game[2][0] == part) {
                situation.push({ winner: true, type: 'reverse' })
            }

            return {
                situation,
                modes: situation.length,
            }

        }

        

        return {
            addNewPlayer,
            addPlayerInGame,
            playAttempt,
            removePlayer,
            subscribe,
            getRoom,
            resetGame,
            getNumRooms
        }
    }

}