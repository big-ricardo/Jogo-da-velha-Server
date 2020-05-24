module.exports = {

    world() {

        const state = {
            rooms: {
            }
        }

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
            return state.rooms[command.gameid]
        }

        function addNewPlayer(command) {
            const playerid = command.socketid
            let matriz = [[0, 2, 1], [0, 2, 2], [1, 0, 2]]
            state.rooms[playerid] = {
                id: playerid,
                game: matriz,
                players: {},
                parts: {},
                playerTime: null
            }
            state.rooms[playerid].players[playerid] = 1
            state.rooms[playerid].parts[1] = playerid

            return state.rooms[playerid]
        }

        function addPlayerInGame(command) {
            const playerid = command.socketid
            const gameid = command.gameid
            const players = state.rooms[gameid].players
            const numberPlayers = Object.keys(players).length
            const parts = state.rooms[gameid].parts

            if (numberPlayers == 1) {
                if (parts[2] == null) {
                    state.rooms[gameid].players[playerid] = 2
                    state.rooms[gameid].parts[2] = playerid
                    state.rooms[gameid].playerTime = 1
                } else {
                    if (parts[1] == null) {
                        state.rooms[gameid].players[playerid] = 1
                        state.rooms[gameid].parts[1] = playerid
                        state.rooms[gameid].playerTime = 2
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
                }
            }

            notifyAll({
                type: 'remove-player',
                players: state.rooms[gameid].parts
            })

            return state.rooms
        }

        function playAttempt(command) {
            const gameid = command.gameid
            const playerid = command.playerid
            const { i, j } = command.position
            const part = state.rooms[gameid].players[playerid]

            if (state.rooms[gameid].game[i][j] == 0 && state.rooms[gameid].players[playerid] == state.rooms[gameid].playerTime) {
                state.rooms[gameid].game[i][j] = part
                const newGame = testsGame({ gameid, part })

                notifyAll({
                    type: 'attempt',
                    players: state.rooms[gameid].parts,
                    newGame
                })

                return newGame
            } else {
                return { error: 'Fail' }
            }
        }

        function testsGame(command) {
            const gameid = command.gameid
            const game = state.rooms[gameid].game
            const part = command.part
            let situation = []

            if (game[0].indexOf(0) == -1 && game[1].indexOf(0) == -1 && game[2].indexOf(0) == -1) {
                situation.push({ winner: false, type: 'old' })
            } else {
                const result = testsWinner({ part, game })
                if (result.modes > 0) {
                    situation = result.situation
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
                modes: situation.length
            }

        }

        return {
            addNewPlayer,
            addPlayerInGame,
            playAttempt,
            removePlayer,
            subscribe,
            getRoom
        }
    }

}