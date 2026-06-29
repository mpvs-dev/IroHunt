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
const timeouts = new Map();

function generarCodigo() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    let codigo;
    do {
        codigo = Array.from({ length: 6 }, () => caracteres[Math.floor(Math.random() * caracteres.length)]).join('');
    } while (salas.has(codigo));
    return codigo;
}

function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return {
        r: Math.round(f(0) * 255),
        g: Math.round(f(8) * 255),
        b: Math.round(f(4) * 255),
    };
}

function rgbToLab(r, g, b) {
    let [rl, gl, bl] = [r, g, b].map((c) => {
        c /= 255;
        return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
    });
    const x = (rl * 0.4124 + gl * 0.3576 + bl * 0.1805) / 0.95047;
    const y = (rl * 0.2126 + gl * 0.7152 + bl * 0.0722) / 1.0;
    const z = (rl * 0.0193 + gl * 0.1192 + bl * 0.9505) / 1.08883;
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    return { L: 116 * f(y) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) };
}

function calcularPuntaje(colorReal, colorGuess) {
    const rgbReal = hslToRgb(colorReal.h, colorReal.s, colorReal.l);
    const rgbGuess = hslToRgb(colorGuess.h, colorGuess.s, colorGuess.l);
    const labReal = rgbToLab(rgbReal.r, rgbReal.g, rgbReal.b);
    const labGuess = rgbToLab(rgbGuess.r, rgbGuess.g, rgbGuess.b);
    const deltaE = Math.sqrt(
        Math.pow(labReal.L - labGuess.L, 2) +
        Math.pow(labReal.a - labGuess.a, 2) +
        Math.pow(labReal.b - labGuess.b, 2)
    );
    const cercania = Math.max(0, 1 - deltaE / 100);
    return Math.round(cercania * 1000);
}

function iniciarFaseUno(codigo) {
    if (!salas.has(codigo)) return;

    const sala = salas.get(codigo);

    const colorSecreto = {
        h: Math.floor(Math.random() * 361),
        s: Math.floor(Math.random() * 101),
        l: Math.floor(Math.random() * 101),
    };

    sala.colorActual = colorSecreto;
    sala.estado = 'mostrando';
    sala.guesses = {};

    io.to(codigo).emit('faseMostrando', {
        rondaActual: sala.rondaActual,
        cantidadRondas: sala.config.cantidadRondas,
        duracion: sala.config.tiempoMostrarColor,
        color: colorSecreto,
    });

    console.log(`Sala ${codigo} - ronda ${sala.rondaActual} - color: rgb(${colorSecreto.r}, ${colorSecreto.g}, ${colorSecreto.b})`);

    setTimeout(() => {
        iniciarFaseDos(codigo);
    }, sala.config.tiempoMostrarColor * 1000);
}

function iniciarFaseDos(codigo) {
    if (!salas.has(codigo)) return;

    const sala = salas.get(codigo);
    sala.estado = 'seleccion';

    io.to(codigo).emit('faseSeleccion', {
        duracion: sala.config.tiempoSeleccion,
    });

    console.log(`Sala ${codigo} - ronda ${sala.rondaActual} - fase seleccion`);

    const timeout = setTimeout(() => {
        iniciarFaseTres(codigo);
    }, sala.config.tiempoSeleccion * 1000);

    timeouts.set(codigo, timeout);
}

function iniciarFaseTres(codigo) {
    if (!salas.has(codigo)) return;

    const sala = salas.get(codigo);
    sala.estado = 'resultados';

    const resultadosRonda = sala.jugadores.map((j) => {
        const guess = sala.guesses[j.id] || { h: 0, s: 0, l: 0 };
        const puntajeRonda = calcularPuntaje(sala.colorActual, guess);
        sala.puntajes[j.id] += puntajeRonda;

        return {
            id: j.id,
            nombre: j.nombre,
            colorGuess: guess,
            puntajeRonda,
            puntajeTotal: sala.puntajes[j.id],
        };
    });

    resultadosRonda.sort((a, b) => b.puntajeTotal - a.puntajeTotal);

    io.to(codigo).emit('faseResultados', {
        colorReal: sala.colorActual,
        resultados: resultadosRonda,
        duracion: sala.config.tiempoResultados,
        rondaActual: sala.rondaActual,
        cantidadRondas: sala.config.cantidadRondas,
    });

    console.log(`Sala ${codigo} - ronda ${sala.rondaActual} - resultados enviados`);

    setTimeout(() => {
        if (sala.rondaActual < sala.config.cantidadRondas) {
            sala.rondaActual++;
            iniciarFaseUno(codigo);
        } else {
            iniciarFaseFinal(codigo);
        }
    }, sala.config.tiempoResultados * 1000);
}

function iniciarFaseFinal(codigo) {
    if (!salas.has(codigo)) return;

    const sala = salas.get(codigo);
    sala.estado = 'finalizado';

    const resultadosFinales = sala.jugadores
        .map((j) => ({
            id: j.id,
            nombre: j.nombre,
            puntajeTotal: sala.puntajes[j.id],
        }))
        .sort((a, b) => b.puntajeTotal - a.puntajeTotal);

    io.to(codigo).emit('partidaFinalizada', {
        resultados: resultadosFinales,
    });

    console.log(`Sala ${codigo} finalizada`);
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
                clearTimeout(timeouts.get(codigo));
                timeouts.delete(codigo);
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
            config: {
                cantidadRondas: config.ronda.cantidadRondas,
                tiempoMostrarColor: config.ronda.tiempoMostrarColor,
                tiempoSeleccion: config.ronda.tiempoSeleccion,
                tiempoResultados: config.ronda.tiempoResultados,
            },
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

    socket.on('iniciarPartida', ({ codigo, config: configPersonalizada }) => {
        if (!salas.has(codigo)) return;

        const sala = salas.get(codigo);

        if (sala.jugadores.length < config.sala.minimoJugadores) {
            socket.emit('error', { mensaje: `Necesitas al menos ${config.sala.minimoJugadores} jugadores` });
            return;
        }

        sala.config = {
            cantidadRondas: configPersonalizada?.cantidadRondas ?? config.ronda.cantidadRondas,
            tiempoMostrarColor: configPersonalizada?.tiempoMostrarColor ?? config.ronda.tiempoMostrarColor,
            tiempoSeleccion: configPersonalizada?.tiempoSeleccion ?? config.ronda.tiempoSeleccion,
            tiempoResultados: configPersonalizada?.tiempoResultados ?? config.ronda.tiempoResultados,
        };

        sala.estado = 'jugando';
        sala.rondaActual = 1;
        sala.puntajes = {};
        sala.jugadores.forEach((j) => (sala.puntajes[j.id] = 0));

        io.to(codigo).emit('partidaIniciada', {
            cantidadRondas: sala.config.cantidadRondas,
            rondaActual: sala.rondaActual,
        });

        console.log(`Sala ${codigo} inició partida`);
        iniciarFaseUno(codigo);
    });

    socket.on('enviarGuess', (colorGuess) => {
        const codigo = socket.data.sala;
        if (!codigo || !salas.has(codigo)) return;

        const sala = salas.get(codigo);
        if (sala.estado !== 'seleccion') return;

        sala.guesses[socket.id] = colorGuess;
        console.log(`Guess recibido de ${socket.id}: hsl(${colorGuess.h}, ${colorGuess.s}%, ${colorGuess.l}%)`);

        const todosRespondieron = sala.jugadores.every((j) => sala.guesses[j.id]);
        if (todosRespondieron) {
            clearTimeout(timeouts.get(codigo));
            timeouts.delete(codigo);
            iniciarFaseTres(codigo);
        }
    });

    socket.on('jugarDeNuevo', (codigo) => {
        if (!salas.has(codigo)) return;

        const sala = salas.get(codigo);
        sala.estado = 'esperando';
        sala.rondaActual = 0;
        sala.colorActual = null;
        sala.guesses = {};
        sala.puntajes = {};
        sala.jugadores.forEach((j) => (sala.puntajes[j.id] = 0));

        io.to(codigo).emit('volverAlLobby', {
            codigo,
            jugadores: sala.jugadores,
        });

        console.log(`Sala ${codigo} volvió al lobby`);
    });

});

server.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});