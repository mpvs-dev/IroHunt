require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const config = require("./config.js");
const { availableMemory } = require('process');

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_URL }));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: CLIENT_URL },
});

const salas = new Map();
const timeoutsReconexion = new Map();

const NOMBRE_REGEX = /^[a-zA-ZÀ-ÿ0-9\s]+$/;
const CODIGO_REGEX = /^[A-Z0-9]{6}$/;

function validarNombreServidor(nombre) {
    if (typeof nombre !== 'string') return null;
    const limpio = nombre.trim();
    if (!limpio) return null;
    if (limpio.length < 2 || limpio.length > 20) return null;
    if (!NOMBRE_REGEX.test(limpio)) return null;
    return limpio;
}

function validarCodigoServidor(codigo) {
    if (typeof codigo !== 'string') return null;
    const limpio = codigo.trim().toUpperCase();
    if (!CODIGO_REGEX.test(limpio)) return null;
    return limpio;
}

function clamp(valor, min, max, valorPorDefecto) {
    const num = Number(valor);
    if (!Number.isFinite(num)) return valorPorDefecto;
    return Math.min(max, Math.max(min, Math.round(num)));
}

function validarConfig(configPersonalizada, configBase) {
    const l = config.limites;
    return {
        cantidadRondas: clamp(
            configPersonalizada?.cantidadRondas,
            l.cantidadRondas.min, l.cantidadRondas.max,
            configBase.cantidadRondas
        ),
        tiempoMostrarColor: clamp(
            configPersonalizada?.tiempoMostrarColor,
            l.tiempoMostrarColor.min, l.tiempoMostrarColor.max,
            configBase.tiempoMostrarColor
        ),
        tiempoSeleccion: clamp(
            configPersonalizada?.tiempoSeleccion,
            l.tiempoSeleccion.min, l.tiempoSeleccion.max,
            configBase.tiempoSeleccion
        ),
        tiempoResultados: clamp(
            configPersonalizada?.tiempoResultados,
            l.tiempoResultados.min, l.tiempoResultados.max,
            configBase.tiempoResultados
        ),
        cantidadColores: clamp(
            configPersonalizada?.cantidadColores,
            l.cantidadColores.min, l.cantidadColores.max,
            configBase.cantidadColores
        ),
        distracciones: {
            movimiento: !!(configPersonalizada?.distracciones?.movimiento ?? configBase.distracciones.movimiento),
            forma: !!(configPersonalizada?.distracciones?.forma ?? configBase.distracciones.forma),
            parpadeo: !!(configPersonalizada?.distracciones?.parpadeo ?? configBase.distracciones.parpadeo),
            atenuarFondo: !!(configPersonalizada?.distracciones?.atenuarFondo ?? configBase.distracciones.atenuarFondo),
        },
    };
}

function clampNum(valor, min, max, porDefecto) {
    const num = Number(valor);
    if (!Number.isFinite(num)) return porDefecto;
    return Math.min(max, Math.max(min, num));
}

function validarColorGuess(color) {
    if (typeof color !== 'object' || color === null) {
        return { h: 0, s: 0, l: 50 };
    }
    return {
        h: clampNum(color.h, 0, 360, 0),
        s: clampNum(color.s, 0, 100, 0),
        l: clampNum(color.l, 0, 100, 50),
    };
}

function validarGuessArray(guessArray, cantidadColores) {
    const lista = Array.isArray(guessArray) ? guessArray : [];
    return Array.from({ length: cantidadColores }, (_, i) =>
        validarColorGuess(lista[i])
    );
}

const contadoresEventos = new Map();

const LIMITES_EVENTOS = {
    crearSala: { maximo: 5, ventanaMs: 60_000 },
    unirseSala: { maximo: 10, ventanaMs: 60_000 },
    actualizarConfig: { maximo: 30, ventanaMs: 10_000 },
    cambiarAvatar: { maximo: 15, ventanaMs: 10_000 },
    enviarGuess: { maximo: 20, ventanaMs: 10_000 },
    expulsarJugador: { maximo: 20, ventanaMs: 10_000 },
};

function excedeLimite(socketId, evento) {
    const limite = LIMITES_EVENTOS[evento];
    if (!limite) return false;

    const clave = `${socketId}:${evento}`;
    const ahora = Date.now();
    const registro = contadoresEventos.get(clave);

    if (!registro || ahora - registro.inicioVentana > limite.ventanaMs) {
        contadoresEventos.set(clave, { conteo: 1, inicioVentana: ahora });
        return false;
    }

    registro.conteo++;
    return registro.conteo > limite.maximo;
}

function limpiarContadoresDeSocket(socketId) {
    Object.keys(LIMITES_EVENTOS).forEach((evento) => {
        contadoresEventos.delete(`${socketId}:${evento}`);
    });
}

function asignarAvatarDisponible(sala) {
    const usados = new Set(sala.jugadores.map((j) => j.avatarId).filter(Boolean));
    return config.avatares.idsDisponibles.find((id) => !usados.has(id)) ?? null;
}

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

function snapshotFaseParaEspectador(sala, codigo) {
    const cron = cronometros.get(codigo);
    if (sala.estado === 'jugando') {
        return { tipo: 'cuentaAtras', segundosRestantes: cron ? cron.restante : 3 };
    }
    if (sala.estado === 'mostrando') {
        return {
            tipo: 'mostrando',
            rondaActual: sala.rondaActual,
            cantidadRondas: sala.config.cantidadRondas,
            colores: sala.coloresActuales,
            duracion: sala.config.tiempoMostrarColor,
            segundosRestantes: cron ? cron.restante : sala.config.tiempoMostrarColor,
        };
    }
    if (sala.estado === 'seleccion') {
        return {
            tipo: 'seleccion',
            duracion: sala.config.tiempoSeleccion,
            segundosRestantes: cron ? cron.restante : sala.config.tiempoSeleccion,
        };
    }
    if (sala.estado === 'resultados') {
        return {
            tipo: 'resultados',
            duracion: sala.config.tiempoResultados,
            segundosRestantes: cron ? cron.restante : sala.config.tiempoResultados,
            rondaActual: sala.rondaActual,
        };
    }
    return { tipo: null };
}

function snapshotFaseActual(sala, codigo) {
    const cron = cronometros.get(codigo);
    if (sala.estado === 'jugando') {
        return { tipo: 'cuentaAtras', segundosRestantes: cron ? cron.restante : 3 };
    }
    if (sala.estado === 'mostrando') {
        return {
            tipo: 'mostrando',
            colores: sala.coloresActuales,
            duracion: sala.config.tiempoMostrarColor,
            segundosRestantes: cron ? cron.restante : sala.config.tiempoMostrarColor,
        };
    }
    if (sala.estado === 'seleccion') {
        return {
            tipo: 'seleccion',
            duracion: sala.config.tiempoSeleccion,
            segundosRestantes: cron ? cron.restante : sala.config.tiempoSeleccion,
        };
    }
    if (sala.estado === 'resultados') {
        return {
            tipo: 'resultados',
            duracion: sala.config.tiempoResultados,
            segundosRestantes: cron ? cron.restante : sala.config.tiempoResultados,
        };
    }
    return { tipo: null };
}

const MARGEN_FIN_FASE = 700;

function finalizarFaseConGracia(codigo, alFinalizar) {
    if (!salas.has(codigo)) return;
    io.to(codigo).emit('tick', { segundosRestantes: 0 });
    setTimeout(() => {
        if (salas.has(codigo)) alFinalizar(codigo);
    }, MARGEN_FIN_FASE);
}

const cronometros = new Map();
let intervaloGlobal = null;

function asegurarIntervaloGlobal() {
    if (intervaloGlobal) return;
    intervaloGlobal = setInterval(tickGlobal, 1000);
}

function detenerIntervaloGlobalSiVacio() {
    if (cronometros.size === 0 && intervaloGlobal) {
        clearInterval(intervaloGlobal);
        intervaloGlobal = null;
    }
}

function tickGlobal() {
    for (const [codigo, cron] of cronometros) {
        if (!salas.has(codigo)) {
            cronometros.delete(codigo);
            continue;
        }

        cron.restante--;

        if (cron.restante > 0) {
            const evento = cron.tipo === 'fase' ? 'tick' : 'cuentaAtras';
            io.to(codigo).emit(evento, { segundosRestantes: cron.restante });
            continue;
        }

        cronometros.delete(codigo);

        if (cron.tipo === 'fase') {
            finalizarFaseConGracia(codigo, cron.alFinalizar);
        } else {
            cron.alFinalizar(codigo);
        }
    }
    detenerIntervaloGlobalSiVacio();
}

function iniciarTemporizadorFase(codigo, evento, duracion, datosExtra, alFinalizar) {
    if (!salas.has(codigo)) return;

    io.to(codigo).emit(evento, { ...datosExtra, duracion, segundosRestantes: duracion });

    cronometros.set(codigo, { restante: duracion, tipo: 'fase', alFinalizar });
    asegurarIntervaloGlobal();
}

function iniciarCuentaAtras(codigo, duracion = 3) {
    if (!salas.has(codigo)) return;

    io.to(codigo).emit('cuentaAtras', { segundosRestantes: duracion });

    cronometros.set(codigo, { restante: duracion, tipo: 'cuentaAtras', alFinalizar: iniciarFaseUno });
    asegurarIntervaloGlobal();
}

function generarColorSecreto() {
    const { saturacionMin, saturacionMax, luminosidadMin, luminosidadMax } = config.color;
    return {
        h: Math.floor(Math.random() * 361),
        s: Math.floor(saturacionMin + Math.random() * (saturacionMax - saturacionMin + 1)),
        l: Math.floor(luminosidadMin + Math.random() * (luminosidadMax - luminosidadMin + 1)),
    };
}

function calcularPuntajeMultiple(coloresReales, guessesArray) {
    if (!Array.isArray(guessesArray) || guessesArray.length === 0) return 0;
    const puntajes = coloresReales.map((real, i) =>
        calcularPuntaje(real, guessesArray[i] || { h: 0, s: 0, l: 0 })
    );
    return Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length);
}

function iniciarFaseUno(codigo) {
    if (!salas.has(codigo)) return;
    const sala = salas.get(codigo);

    const coloresSecretos = Array.from(
        { length: sala.config.cantidadColores },
        () => generarColorSecreto()
    );

    sala.historialColores.push(coloresSecretos);
    sala.coloresActuales = coloresSecretos;
    sala.estado = 'mostrando';
    sala.guesses = {};

    console.log(`Sala ${codigo} - ronda ${sala.rondaActual} - ${coloresSecretos.length} color(es)`);

    iniciarTemporizadorFase(
        codigo,
        'faseMostrando',
        sala.config.tiempoMostrarColor,
        {
            rondaActual: sala.rondaActual,
            cantidadRondas: sala.config.cantidadRondas,
            colores: coloresSecretos,
        },
        iniciarFaseDos
    );
}

function iniciarFaseDos(codigo) {
    if (!salas.has(codigo)) return;
    const sala = salas.get(codigo);
    sala.estado = 'seleccion';

    console.log(`Sala ${codigo} - ronda ${sala.rondaActual} - fase seleccion`);

    iniciarTemporizadorFase(
        codigo,
        'faseSeleccion',
        sala.config.tiempoSeleccion,
        {},
        iniciarFaseTres
    );
}

function iniciarFaseTres(codigo) {
    if (!salas.has(codigo)) return;
    const sala = salas.get(codigo);
    sala.estado = 'resultados';

    const resultadosRonda = sala.jugadores.map((j) => {
        const guesses = sala.guesses[j.id] || sala.coloresActuales.map(() => ({ h: 0, s: 0, l: 0 }));
        const puntajeRonda = calcularPuntajeMultiple(sala.coloresActuales, guesses);
        sala.puntajes[j.id] += puntajeRonda;

        return {
            id: j.id,
            nombre: j.nombre,
            coloresGuess: guesses,
            puntajeRonda,
            puntajeTotal: sala.puntajes[j.id],
        };
    });

    sala.jugadores.forEach((j) => {
        if (!sala.historialGuesses[j.id]) sala.historialGuesses[j.id] = [];
        sala.historialGuesses[j.id].push(
            sala.guesses[j.id] || sala.coloresActuales.map(() => ({ h: 0, s: 0, l: 0 }))
        );

        if (!sala.historialPuntajes[j.id]) sala.historialPuntajes[j.id] = [];
        const puntajeRondaJugador = resultadosRonda.find((r) => r.id === j.id)?.puntajeRonda ?? 0;
        sala.historialPuntajes[j.id].push(puntajeRondaJugador);
    });

    resultadosRonda.sort((a, b) => b.puntajeTotal - a.puntajeTotal);

    iniciarTemporizadorFase(
        codigo,
        'faseResultados',
        sala.config.tiempoResultados,
        {
            coloresReales: sala.coloresActuales,
            resultados: resultadosRonda,
            rondaActual: sala.rondaActual,
            cantidadRondas: sala.config.cantidadRondas,
        },
        (cod) => {
            if (sala.rondaActual < sala.config.cantidadRondas) {
                sala.rondaActual++;
                iniciarFaseUno(cod);
            } else {
                iniciarFaseFinal(cod);
            }
        }
    );
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
            puntajesRondas: sala.historialPuntajes[j.id] || [],
        })),
        coloresRondas: sala.historialColores,
        cantidadRondas: sala.config.cantidadRondas,
    });
}

io.on('connection', (socket) => {
    console.log(`Jugador conectado: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`Jugador desconectado: ${socket.id}`);

        limpiarContadoresDeSocket(socket.id);

        const codigo = socket.data.sala;
        if (codigo && salas.has(codigo)) {
            const sala = salas.get(codigo);

            if (socket.data.espectador) {
                sala.espectadores = (sala.espectadores || []).filter((e) => e.id !== socket.id);
                io.to(codigo).emit('espectadorUnido', {
                    cantidadEspectadores: sala.espectadores.length,
                });
                return;
            }

            sala.jugadores = sala.jugadores.filter((j) => j.id !== socket.id);

            if (sala.jugadores.length === 0) {
                cronometros.delete(codigo);
                detenerIntervaloGlobalSiVacio();
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
                    cronometros.delete(codigo);
                    detenerIntervaloGlobalSiVacio();
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
        if (excedeLimite(socket.id, 'crearSala')) return;

        const nombreValido = validarNombreServidor(nombre);
        if (!nombreValido) {
            socket.emit('error', { mensaje: 'Nombre inválido' });
            return;
        }

        const codigo = generarCodigo();

        salas.set(codigo, {
            jugadores: [{ id: socket.id, nombre: nombreValido, avatarId: config.avatares.idsDisponibles[0] }],
            espectadores: [],
            creador: socket.id,
            colorActual: null,
            estado: 'esperando',
            puntajes: {},
            rondaActual: 0,
            guesses: {},
            historialColores: [],
            historialGuesses: {},
            historialPuntajes: {},
            config: {
                cantidadRondas: config.ronda.cantidadRondas,
                tiempoMostrarColor: config.ronda.tiempoMostrarColor,
                tiempoSeleccion: config.ronda.tiempoSeleccion,
                tiempoResultados: config.ronda.tiempoResultados,
                cantidadColores: config.ronda.cantidadColores,
                distracciones: { ...config.distracciones },
            },
        });

        socket.join(codigo);
        socket.data.sala = codigo;
        socket.data.nombre = nombreValido;

        socket.emit('salaCreada', {
            codigo,
            jugadores: salas.get(codigo).jugadores,
            config: {
                cantidadRondas: config.ronda.cantidadRondas,
                tiempoMostrarColor: config.ronda.tiempoMostrarColor,
                tiempoSeleccion: config.ronda.tiempoSeleccion,
                tiempoResultados: config.ronda.tiempoResultados,
                cantidadColores: config.ronda.cantidadColores,
                distracciones: { ...config.distracciones },
            },
            creador: socket.id,
        });

        console.log(`Sala ${codigo} creada por ${nombreValido} (${socket.id})`);
    });

    socket.on('unirseSala', ({ codigo, nombre }) => {
        if (excedeLimite(socket.id, 'unirseSala')) return;

        const nombreValido = validarNombreServidor(nombre);
        if (!nombreValido) {
            socket.emit('error', { mensaje: 'Nombre inválido' });
            return;
        }

        const codigoValido = validarCodigoServidor(codigo);
        if (!codigoValido) {
            socket.emit('error', { mensaje: 'Código de sala inválido' });
            return;
        }

        if (!salas.has(codigoValido)) {
            socket.emit('error', { mensaje: 'La sala no existe' });
            return;
        }

        const sala = salas.get(codigoValido);

        if (sala.estado !== 'esperando') {
            const totalActual = sala.jugadores.length + (sala.espectadores || []).length;
            if (totalActual >= config.sala.maximoTotal) {
                socket.emit('error', { mensaje: 'La sala esta llena (jugadores + espectadores)' });
                return;
            }
            const nombreDuplicado =
                sala.jugadores.some((j) => j.nombre === nombreValido) ||
                (sala.espectadores || []).some((e) => e.nombre === nombreValido);
            if (nombreDuplicado) {
                socket.emit('error', { mensaje: 'Ya hay alguien con ese nombre en la sala' });
                return;
            }

            sala.espectadores = sala.espectadores || [];
            sala.espectadores.push({ id: socket.id, nombre: nombreValido });

            socket.join(codigoValido);
            socket.data.sala = codigoValido;
            socket.data.nombre = nombreValido;
            socket.data.espectador = true;

            socket.emit('unidoComoEspectador', {
                codigo: codigoValido,
                jugadores: sala.jugadores,
                creador: sala.creador,
                config: sala.config,
                fase: snapshotFaseParaEspectador(sala, codigoValido),
            });

            socket.to(codigoValido).emit('espectadorUnido', {
                cantidadEspectadores: sala.espectadores.length,
            });

            console.log(`${nombreValido} entró como espectador a la sala ${codigoValido}`);
            return;
        }

        if (sala.jugadores.length >= config.sala.maximoJugadores) {
            socket.emit('error', { mensaje: 'La sala está llena' });
            return;
        }

        const nombreDuplicado = sala.jugadores.some((j) => j.nombre === nombreValido);
        if (nombreDuplicado) {
            socket.emit('error', { mensaje: 'Ya hay un jugador con ese nombre en la sala' });
            return;
        }

        const avatarAsignado = asignarAvatarDisponible(sala);
        sala.jugadores.push({ id: socket.id, nombre: nombreValido, avatarId: avatarAsignado });
        socket.join(codigoValido);
        socket.data.sala = codigoValido;
        socket.data.nombre = nombreValido;

        socket.emit('salaUnida', {
            codigo: codigoValido,
            jugadores: sala.jugadores,
            creador: sala.creador,
            config: sala.config,
        });

        socket.to(codigoValido).emit('jugadorUnido', {
            jugadores: sala.jugadores,
        });

        console.log(`${nombreValido} se unió a la sala ${codigoValido}`);
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

        sala.config = validarConfig(configPersonalizada, {
            ...config.ronda,
            distracciones: config.distracciones,
        });

        sala.estado = 'jugando';
        sala.rondaActual = 1;
        sala.puntajes = {};
        sala.jugadores.forEach((j) => (sala.puntajes[j.id] = 0));

        io.to(codigo).emit('partidaIniciada', {
            cantidadRondas: sala.config.cantidadRondas,
            rondaActual: sala.rondaActual,
            distracciones: sala.config.distracciones
        });

        console.log(`Sala ${codigo} inició partida`);
        iniciarCuentaAtras(codigo);
    });

    socket.on('enviarGuess', (colorGuess) => {
        if (socket.data.espectador) return;
        if (excedeLimite(socket.id, 'enviarGuess')) return;

        const codigo = socket.data.sala;
        if (!codigo || !salas.has(codigo)) return;

        const sala = salas.get(codigo);
        if (sala.estado !== 'seleccion') return;

        sala.guesses[socket.id] = validarGuessArray(
            colorGuess,
            sala.config.cantidadColores
        );

        const todosRespondieron = sala.jugadores.every((j) => sala.guesses[j.id]);

        if (todosRespondieron && cronometros.has(codigo)) {
            cronometros.delete(codigo);
            detenerIntervaloGlobalSiVacio();
            finalizarFaseConGracia(codigo, iniciarFaseTres);
        }
    });

    socket.on('jugarDeNuevo', (codigo) => {
        if (!salas.has(codigo)) return;

        const sala = salas.get(codigo);

        if (sala.creador !== socket.id) {
            socket.emit('error', { mensaje: 'Solo el creador puede iniciar una nueva partida' });
            return;
        }

        sala.estado = 'esperando';
        sala.rondaActual = 0;
        sala.colorActual = null;
        sala.guesses = {};
        sala.puntajes = {};
        sala.historialColores = [];
        sala.historialGuesses = {};
        sala.historialPuntajes = {};

        const espectadoresActuales = sala.espectadores || [];
        const cuposDisponibles = Math.max(0, config.sala.maximoJugadores - sala.jugadores.length);

        const aPromover = espectadoresActuales.slice(0, cuposDisponibles);
        const siguenComoEspectadores = espectadoresActuales.slice(cuposDisponibles);

        aPromover.forEach((esp) => {
            sala.jugadores.push({
                id: esp.id,
                nombre: esp.nombre,
                avatarId: asignarAvatarDisponible(sala),
            });
            const socketEsp = io.sockets.sockets.get(esp.id);
            if (socketEsp) socketEsp.data.espectador = false;
        });

        sala.espectadores = siguenComoEspectadores;
        sala.jugadores.forEach((j) => (sala.puntajes[j.id] = 0));

        io.to(codigo).emit('volverAlLobby', {
            codigo,
            jugadores: sala.jugadores,
            creador: sala.creador,
        });

        if (siguenComoEspectadores.length > 0) {
            siguenComoEspectadores.forEach((esp) => {
                io.to(esp.id).emit('siguesComoEspectador', {
                    mensaje: 'La sala llegó al máximo de jugadores, seguís como espectador',
                });
            });
        }

        console.log(`Sala ${codigo} volvió al lobby (${aPromover.length} espectadores promovidos, ${siguenComoEspectadores.length} siguen espectando)`);
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

        // Trasladar guess de la ronda en curso si ya lo había mandado antes de caerse
        if (sala.guesses[idAnterior]) {
            sala.guesses[socket.id] = sala.guesses[idAnterior];
            delete sala.guesses[idAnterior];
        }

        let eraCreador = false;
        if (sala.creador === idAnterior) {
            sala.creador = socket.id;
            eraCreador = true;
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
            cantidadRondas: sala.config.cantidadRondas,
            creador: sala.creador,
            config: sala.config,
            eraCreador,
            fase: snapshotFaseActual(sala, codigo),
        });

        console.log(`${jugadorExistente.nombre} reconectado a sala ${codigo}`);
    });
    socket.on('expulsarJugador', ({ codigo, jugadorId }) => {
        if (excedeLimite(socket.id, 'expulsarJugador')) return;

        if (!salas.has(codigo)) return;
        const sala = salas.get(codigo);

        if (sala.creador !== socket.id) {
            socket.emit('error', { mensaje: 'Solo el creador puede expulsar jugadores' });
            return;
        }

        if (sala.estado !== 'esperando') {
            socket.emit('error', { mensaje: 'No se puede expulsar durante la partida' });
            return;
        }

        if (jugadorId === socket.id) return;

        const jugador = sala.jugadores.find((j) => j.id === jugadorId);
        if (!jugador) return;

        sala.jugadores = sala.jugadores.filter((j) => j.id !== jugadorId);

        io.to(jugadorId).emit('fuisteExpulsado');
        const socketExpulsado = io.sockets.sockets.get(jugadorId);
        if (socketExpulsado) socketExpulsado.leave(codigo);

        io.to(codigo).emit('jugadorExpulsado', { jugadores: sala.jugadores });

        console.log(`${jugador.nombre} fue expulsado de la sala ${codigo}`);
    });

    socket.on('cambiarAvatar', ({ codigo, avatarId }) => {
        if (excedeLimite(socket.id, 'cambiarAvatar')) return;

        if (!salas.has(codigo)) return;
        const sala = salas.get(codigo);

        const jugador = sala.jugadores.find((j) => j.id === socket.id);
        if (!jugador) return;

        if (!config.avatares.idsDisponibles.includes(avatarId)) {
            socket.emit('error', { mensaje: 'Avatar inválido' });
            return;
        }

        const enUso = sala.jugadores.some(
            (j) => j.id !== socket.id && j.avatarId === avatarId
        );
        if (enUso) {
            socket.emit('error', { mensaje: 'Ese avatar ya está en uso' });
            return;
        }

        jugador.avatarId = avatarId;
        io.to(codigo).emit('avatarActualizado', { jugadores: sala.jugadores });
    });

    socket.on('actualizarConfig', ({ codigo, config: nuevaConfig }) => {
        if (excedeLimite(socket.id, 'actualizarConfig')) return;

        if (!salas.has(codigo)) return;
        const sala = salas.get(codigo);

        if (sala.creador !== socket.id) return;
        if (sala.estado !== 'esperando') return;

        sala.config = validarConfig(nuevaConfig, sala.config);
        io.to(codigo).emit('configActualizada', { config: sala.config });
    });

    socket.on('sincronizarReloj', (tiempoCliente, callback) => {
        callback({ tiempoServidor: Date.now(), tiempoCliente });
    });
});

server.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});