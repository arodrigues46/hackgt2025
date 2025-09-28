const express = require('express');
const app = express();
const http = require('http');

const port = 3000;

/* Necessaire pour que le serveur soit accessible par plusieurs domaines */
const cors = require('cors');
app.use(cors());

const server = http.createServer(app);
require('./websocket.js').init(server);
server.listen(port);