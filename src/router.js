const express = require('express');
const router = express.Router();
const game = require('./game')
const creategame = game.world()

router.get('/', (req, res) => {
    return res.json({ message: `Muito Bem!Tudo funcionando!!!` });
});

router.get('/new', (req, res) => {
    const resp = creategame.addNewPlayer({socketid: "123"})
    res.json(resp)
});

router.get('/ingame', (req, res) => {
    const resp = creategame.addPlayerInGame({socketid: "321", gameid: "123"})
    res.json(resp)
});

module.exports = router;