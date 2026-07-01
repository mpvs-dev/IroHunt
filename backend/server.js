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
const timeoutsReconexion = new Map();

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

    sala.historialColores.push(colorSecreto);
    sala.colorActual = colorSecreto;
    sala.estado = 'mostrando';
    sala.guesses = {};

    io.to(codigo).emit('faseMostrando', {
        rondaActual: sala.rondaActual,
        cantidadRondas: sala.config.cantidadRondas,
        duracion: sala.config.tiempoMostrarColor,
        color: colorSecreto,
    });

    console.log(`Sala ${codigo} - ronda ${sala.rondaActual} - color: hsl(${colorSecreto.h}, ${colorSecreto.s}%, ${colorSecreto.l}%)`);

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

    sala.jugadores.forEach((j) => {
        if (!sala.historialGuesses[j.id]) sala.historialGuesses[j.id] = [];
        sala.historialGuesses[j.id].push(sala.guesses[j.id] || { h: 0, s: 0, l: 0 });
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
        resultados: resultadosFinales.map((j) => ({
            ...j,
            guessesRondas: sala.historialGuesses[j.id] || [],
        })),
        coloresRondas: sala.historialColores,
        cantidadRondas: sala.config.cantidadRondas,
    });
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
                return;
            }

            io.to(codigo).emit('jugadorSalió', {
                jugadores: sala.jugadores,
            });

            if (sala.creador === socket.id && sala.estado !== 'esperando') {
                io.to(codigo).emit('creadorDesconectado', {
                    mensaje: 'El creador se desconectó, esperando reconexión...',
                });

                const timeoutReconexion = setTimeout(() => {
                    if (!salas.has(codigo)) return;
                    clearTimeout(timeouts.get(codigo));
                    timeouts.delete(codigo);
                    io.to(codigo).emit('partidaCancelada', {
                        mensaje: 'El creador no reconectó a tiempo',
                    });
                    salas.delete(codigo);
                    console.log(`Sala ${codigo} cancelada, creador no reconectó`);
                }, config.reconexion.tiempoEsperaCreador * 1000);

                timeoutsReconexion.set(codigo, timeoutReconexion);
            }
        }
    });

    socket.on('crearSala', (nombre) => {
        const codigo = generarCodigo();

        salas.set(codigo, {
            jugadores: [{ id: socket.id, nombre }],
            creador: socket.id,
            colorActual: null,
            estado: 'esperando',
            puntajes: {},
            rondaActual: 0,
            guesses: {},
            historialColores: [],
            historialGuesses: {},
        });

        socket.join(codigo);
        socket.data.sala = codigo;
        socket.data.nombre = nombre;

        socket.emit('salaCreada', {
            codigo,
            jugadores: salas.get(codigo).jugadores,
            config: {
                cantidadRondas: config.ronda.cantidadRondas,
                tiempoMostrarColor: config.ronda.tiempoMostrarColor,
                tiempoSeleccion: config.ronda.tiempoSeleccion,
                tiempoResultados: config.ronda.tiempoResultados,
            },
            creador: socket.id,
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

        if (sala.jugadores.length >= config.sala.maximoJugadores) {
            socket.emit('error', { mensaje: 'La sala está llena' });
            return;
        }

        const nombreDuplicado = sala.jugadores.some((j) => j.nombre === nombre);
        if (nombreDuplicado) {
            socket.emit('error', { mensaje: 'Ya hay un jugador con ese nombre en la sala' });
            return;
        }

        sala.jugadores.push({ id: socket.id, nombre });
        socket.join(codigo);
        socket.data.sala = codigo;
        socket.data.nombre = nombre;

        socket.emit('salaUnida', {
            codigo,
            jugadores: sala.jugadores,
            creador: sala.creador,
        });

        socket.to(codigo).emit('jugadorUnido', {
            jugadores: sala.jugadores,
        });

        console.log(`${nombre} se unió a la sala ${codigo}`);
    });

    socket.on('iniciarPartida', ({ codigo, config: configPersonalizada }) => {
        if (!salas.has(codigo)) return;

        const sala = salas.get(codigo);

        if (sala.creador !== socket.id) {
            socket.emit('error', { mensaje: 'Solo el creador puede iniciar la partida' });
            return;
        }

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

        if (sala.guesses[socket.id]) {
            socket.emit('error', { mensaje: 'Ya enviaste tu color' });
            return;
        }

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
        sala.historialColores = [];
        sala.historialGuesses = {};
        sala.jugadores.forEach((j) => (sala.puntajes[j.id] = 0));

        io.to(codigo).emit('volverAlLobby', {
            codigo,
            jugadores: sala.jugadores,
            creador: sala.creador,
        });

        console.log(`Sala ${codigo} volvió al lobby`);
    });

    socket.on('reconectar', (codigo) => {
        if (!salas.has(codigo)) {
            socket.emit('error', { mensaje: 'La sala ya no existe' });
            return;
        }

        const sala = salas.get(codigo);
        const jugadorExistente = sala.jugadores.find((j) => j.nombre === socket.data.nombre);

        if (!jugadorExistente) {
            socket.emit('error', { mensaje: 'No se encontró tu sesión en esta sala' });
            return;
        }

        const idAnterior = jugadorExistente.id;
        jugadorExistente.id = socket.id;
        socket.join(codigo);
        socket.data.sala = codigo;

        const puntajeAnterior = sala.puntajes[idAnterior] || 0;
        delete sala.puntajes[idAnterior];
        sala.puntajes[socket.id] = puntajeAnterior;

        if (sala.creador === idAnterior) {
            sala.creador = socket.id;
            clearTimeout(timeoutsReconexion.get(codigo));
            timeoutsReconexion.delete(codigo);

            io.to(codigo).emit('creadorReconectado', {
                jugadores: sala.jugadores,
                creador: socket.id,
            });
        }

        socket.emit('reconectado', {
            codigo,
            estado: sala.estado,
            jugadores: sala.jugadores,
            rondaActual: sala.rondaActual,
            creador: sala.creador,
        });

        console.log(`${jugadorExistente.nombre} reconectado a sala ${codigo}`);
    });

});

server.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});