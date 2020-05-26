const express = require('express');
const router = express.Router();
const crypto = require('crypto')

router.get('/', (req, res) => {
    return res.json({
        message: `Muito Bem!Tudo funcionando!!!`,
        rooms_online: req.game.getNumRooms()
    });
});

router.get('/room', (req, res) => {
    const gameid = req.query.gameid
    const { error } = req.game.getRoom({ gameid })
    if (error) {
        res.json({ error: true })
    } else {
        res.json({ error: false })
    }
});

router.get('/newroom', (req, res) => {

    const gameid = crypto.randomBytes(4)
    const socketid = gameid.toString('hex')

    const room = req.game.addNewPlayer({ gameid: socketid })

    res.json({ gameid: socketid, room })
});

module.exports = router;