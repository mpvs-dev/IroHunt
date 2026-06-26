require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const config = require("./config.js");

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
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    let codigo;
    do {
        codigo = Array.from({ length: 6 }, () => caracteres[Math.floor(Math.random() * caracteres.length)]).join('');
    } while (salas.has(codigo));
    return codigo;
}

function iniciarFaseUno(codigo) {
    if (!salas.has(codigo)) return;

    const sala = salas.get(codigo);

    const colorSecreto = {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256),
    };

    sala.colorActual = colorSecreto;
    sala.estado = 'mostrando';
    sala.guesses = {};

    io.to(codigo).emit('faseMostrando', {
        rondaActual: sala.rondaActual,
        cantidadRondas: config.ronda.cantidadRondas,
        duracion: config.ronda.tiempoMostrarColor,
        color: colorSecreto,
    });

    console.log(`Sala ${codigo} - ronda ${sala.rondaActual} - color: rgb(${colorSecreto.r}, ${colorSecreto.g}, ${colorSecreto.b})`);

    setTimeout(() => {
        iniciarFaseDos(codigo);
    }, config.ronda.tiempoMostrarColor * 1000);
}

function iniciarFaseDos(codigo) {
    if (!salas.has(codigo)) return;

    const sala = salas.get(codigo);
    sala.estado = 'seleccion';

    io.to(codigo).emit('faseSeleccion', {
        duracion: config.ronda.tiempoSeleccion,
    });

    console.log(`Sala ${codigo} - ronda ${sala.rondaActual} - fase seleccion`);

    setTimeout(() => {
        iniciarFaseTres(codigo);
    }, config.ronda.tiempoSeleccion * 1000);
}

io.on('connection', (socket) => {
    console.log(`Jugador conectado: ${socket.id}`);

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
            puntajes: {},
            rondaActual: 0,
            guesses: {},
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

        socket.emit('salaUnida', {
            codigo,
            jugadores: sala.jugadores,
        });

        socket.to(codigo).emit('jugadorUnido', {
            jugadores: sala.jugadores,
        });

        console.log(`${nombre} se unió a la sala ${codigo}`);
    });

    socket.on('iniciarPartida', (codigo) => {
        if (!salas.has(codigo)) return;

        const sala = salas.get(codigo);

        if (sala.jugadores.length < config.sala.minimoJugadores) {
            socket.emit('error', { mensaje: `Necesitas al menos ${config.sala.minimoJugadores} jugadores` });
            return;
        }

        sala.estado = 'jugando';
        sala.rondaActual = 1;
        sala.puntajes = {};
        sala.jugadores.forEach((j) => (sala.puntajes[j.id] = 0));

        io.to(codigo).emit('partidaIniciada', {
            cantidadRondas: config.ronda.cantidadRondas,
            tiempoMostrarColor: config.ronda.tiempoMostrarColor,
            tiempoSeleccion: config.ronda.tiempoSeleccion,
            tiempoResultados: config.ronda.tiempoResultados,
            rondaActual: sala.rondaActual,
        });

        console.log(`Sala ${codigo} inició partida`);
        iniciarFaseUno(codigo);
    });
});

server.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});