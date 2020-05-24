const express = require('express');
const router = express.Router();
const game = require('./game')
const creategame = game.world()

router.get('/', (req, res) => {
    return res.json({ message: `Muito Bem!Tudo funcionando!!!` });
});

router.get('/new', (req, res) => {
    const resp = creategame.addNewPlayer({ socketid: "123" })
    res.json(resp)
});

router.get('/ingame', (req, res) => {
    const resp = creategame.addPlayerInGame({ socketid: "321", gameid: "123" })
    res.json(resp)
});

router.get('/play', (req, res) => {
    const resp = creategame.playAttempt({ playerid: "123", gameid: "123", position: { i: 0, j: 0 } })
    res.json(resp)
});

router.get('/remove', (req, res) => {
    const resp = creategame.removePlayer({ playerid: "123" })
    res.json(resp)
});

router.get('/reset', (req, res) => {
    const resp = creategame.resetGame({ gameid: "123" })
    res.json(resp)
});

module.exports = router;