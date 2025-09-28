const WebSocket = require('ws');
const http = require('http');
const express = require('express');

let wss;
let currNumber = 0;

function init(server) {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        const interval = setInterval(() => {
            ws.send(JSON.stringify({ number: currNumber }));
        }, 5000);

        ws.on('close', () => {
            clearInterval(interval);
        });
    });
}

setInterval(() => {
    currNumber = Math.floor(Math.random() * 3);
}, 1000);

module.exports = { init };
