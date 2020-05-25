const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
    return res.json({ message: `Muito Bem!Tudo funcionando!!!` });
});

router.get('/room', (req, res) => {
    const gameid = req.query.gameid
    const {error} = req.game.getRoom({gameid})
    if(error){
        res.json({error: true})
    }else{
        res.json({error: false})
    }
});

module.exports = router;