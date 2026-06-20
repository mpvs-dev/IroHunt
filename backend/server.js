require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_URL }));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: CLIENT_URL },
});

io.on('connection', (socket) => {
    console.log(`Jugador conectado: ${socket.id}`);

    socket.on('hola', (nombre) => {
        console.log(`${nombre} dice hola (${socket.id})`);
        socket.emit('bienvenida', {
            mensaje: `Hola ${nombre}, estas conectado al servidor`,
            id: socket.id,
        });
    });

    socket.on('disconnect', () => {
        console.log(`Jugador desconectado: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});