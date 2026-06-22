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

const salas = new Map();

function generarCodigo() {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo;
    do {
        codigo = Array.from({ length: 6 }, () => caracteres[Math.floor(Math.random() * caracteres.length)]).join('');
    } while (salas.has(codigo));
    return codigo;
}

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

        const codigo = socket.data.sala;
        if (codigo && salas.has(codigo)) {
            const sala = salas.get(codigo);
            sala.jugadores = sala.jugadores.filter((j) => j.id !== socket.id);

            if (sala.jugadores.length === 0) {
                salas.delete(codigo);
                console.log(`Sala ${codigo} eliminada`);
            }
        }
    });

    socket.on('crearSala', (nombre) => {
        const codigo = generarCodigo();

        salas.set(codigo, {
            jugadores: [{ id: socket.id, nombre }],
            colorActual: null,
            estado: 'esperando',
        });

        socket.join(codigo);
        socket.data.sala = codigo;

        socket.emit('salaCreada', {
            codigo,
            jugadores: salas.get(codigo).jugadores,
        });

        console.log(`Sala ${codigo} creada por ${nombre} (${socket.id})`);
    });

    socket.on('unirseSala', ({ codigo, nombre }) => {
        if (!salas.has(codigo)) {
            socket.emit('error', { mensaje: 'La sala no existe' });
            return;
        }

        const sala = salas.get(codigo);

        if (sala.estado !== 'esperando') {
            socket.emit('error', { mensaje: 'La partida ya empezó' });
            return;
        }

        sala.jugadores.push({ id: socket.id, nombre });
        socket.join(codigo);
        socket.data.sala = codigo;

        // avisarle solo al nuevo jugador que entró bien
        socket.emit('salaUnida', {
            codigo,
            jugadores: sala.jugadores,
        });

        // avisarle a TODOS los demás que alguien entró
        socket.to(codigo).emit('jugadorUnido', {
            jugadores: sala.jugadores,
        });

        console.log(`${nombre} se unió a la sala ${codigo}`);
    });
});

server.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});