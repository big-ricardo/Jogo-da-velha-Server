module.exports = {

     world(){

        const state = {
            rooms:{
            }
        }

        function addNewPlayer(command){
            const playerid = command.socketid
            let matriz = [[0,0,0],[0,0,0],[0,0,0]]
            state.rooms[playerid] = {
                id: playerid,
                game: matriz,
                players:{}
            }
            state.rooms[playerid].players[playerid] = 1
    
            return state.rooms[playerid]
        }
    
        function addPlayerInGame(command){
            const playerid = command.socketid
            const gameid = command.gameid
            const numberPlayer = state.rooms[gameid].players[2]
    
            if(numberPlayer == null){
                state.rooms[gameid].players[playerid] = 2
            }

            return state.rooms[gameid]
        }

        function playAttempt(command){

        }

        return{
            addNewPlayer,
            addPlayerInGame
        }
     }

}