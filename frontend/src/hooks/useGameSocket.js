import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";

const COLOR_GUESS_INICIAL = { h: 180, s: 50, l: 50 };

export function useGameSocket() {
    const [conectado, setConectado] = useState(false);
    const [sala, setSala] = useState(null);
    const [jugadores, setJugadores] = useState([]);
    const [pantalla, setPantalla] = useState("menu");
    const [faseActual, setFaseActual] = useState(null);
    const [duracionFase, setDuracionFase] = useState(null);
    const [configPartida, setConfigPartida] = useState(null);
    const [rondaActual, setRondaActual] = useState(null);
    const [resultados, setResultados] = useState([]);
    const [guessEnviado, setGuessEnviado] = useState(false);
    const [resultadosFinales, setResultadosFinales] = useState([]);
    const [coloresRondas, setColoresRondas] = useState([]);
    const [configModal, setConfigModal] = useState(null);
    const [miId, setMiId] = useState(null);
    const [creadorId, setCreadorId] = useState(null);
    const [mensajeSistema, setMensajeSistema] = useState(null);
    const [cantidadRondas, setCantidadRondas] = useState(null);
    const [segundosRestantes, setSegundosRestantes] = useState(null);
    const [cuentaAtras, setCuentaAtras] = useState(null);

    const [coloresActuales, setColoresActuales] = useState([]);
    const [coloresGuess, setColoresGuess] = useState([COLOR_GUESS_INICIAL]);
    const [coloresReales, setColoresReales] = useState([]);

    const esCreador = miId === creadorId;

    const guessEnviadoRef = useRef(false);
    const coloresGuessRef = useRef(coloresGuess);
    const faseActualRef = useRef(faseActual);

    useEffect(() => {
        faseActualRef.current = faseActual;
    }, [faseActual]);

    useEffect(() => {
        coloresGuessRef.current = coloresGuess;
    }, [coloresGuess]);

    useEffect(() => {
        socket.connect();

        const handlers = {
            connect: () => {
                setMiId(socket.id);
                setConectado(true);
            },
            disconnect: () => setConectado(false),

            salaCreada: (data) => {
                setSala(data.codigo);
                setJugadores(data.jugadores);
                setConfigModal(data.config);
                setPantalla("lobby");
                setCreadorId(data.creador);
            },

            salaUnida: (data) => {
                setSala(data.codigo);
                setJugadores(data.jugadores);
                setCreadorId(data.creador);
                setConfigModal(data.config);
                setPantalla("lobby");
            },

            jugadorUnido: (data) => setJugadores(data.jugadores),
            jugadorSalió: (data) => setJugadores(data.jugadores),

            partidaIniciada: (data) => {
                setConfigPartida({
                    cantidadRondas: data.cantidadRondas,
                    tiempoMostrarColor: data.tiempoMostrarColor,
                    tiempoSeleccion: data.tiempoSeleccion,
                    tiempoResultados: data.tiempoResultados,
                    cantidadColores: data.cantidadColores,
                    distracciones: data.distracciones,
                });
            },

            cuentaAtras: (data) => {
                setCuentaAtras(data.segundosRestantes);
                setPantalla("cuentaAtras");
            },

            faseMostrando: (data) => {
                setFaseActual("mostrando");
                setDuracionFase(data.duracion);
                setSegundosRestantes(data.segundosRestantes);
                setColoresActuales(data.colores ?? []);
                setRondaActual(data.rondaActual);
                setColoresGuess(
                    (data.colores ?? []).map(() => ({ ...COLOR_GUESS_INICIAL })),
                );
                setPantalla("juego");
                setGuessEnviado(false);
                guessEnviadoRef.current = false;
            },

            faseSeleccion: (data) => {
                setFaseActual("seleccion");
                setDuracionFase(data.duracion);
                setSegundosRestantes(data.segundosRestantes);
                setColoresActuales([]);
            },

            faseResultados: (data) => {
                setFaseActual("resultados");
                setResultados(data.resultados);
                setColoresReales(data.coloresReales ?? []);
                setDuracionFase(data.duracion);
                setSegundosRestantes(data.segundosRestantes);
            },

            tick: (data) => {
                setSegundosRestantes(data.segundosRestantes);

                if (
                    faseActualRef.current === "seleccion" &&
                    data.segundosRestantes === 0 &&
                    !guessEnviadoRef.current
                ) {
                    socket.emit("enviarGuess", coloresGuessRef.current);
                    setGuessEnviado(true);
                    guessEnviadoRef.current = true;
                }
            },

            partidaFinalizada: (data) => {
                setResultadosFinales(data.resultados);
                setColoresRondas(data.coloresRondas);
                setCantidadRondas(data.cantidadRondas);
                setPantalla("final");
            },

            volverAlLobby: (data) => {
                setJugadores(data.jugadores);
                setFaseActual(null);
                setRondaActual(null);
                setColoresActuales([]);
                setColoresReales([]);
                setResultados([]);
                setResultadosFinales([]);
                setConfigPartida(null);
                setGuessEnviado(false);
                guessEnviadoRef.current = false;
                setColoresGuess([COLOR_GUESS_INICIAL]);
                setCuentaAtras(null);
                setPantalla("lobby");
                setCreadorId(data.creador);
            },

            creadorDesconectado: (data) => setMensajeSistema(data.mensaje),

            creadorReconectado: (data) => {
                setJugadores(data.jugadores);
                setCreadorId(data.creador);
                setMensajeSistema(null);
            },

            partidaCancelada: (data) => {
                setMensajeSistema(data.mensaje);
                setTimeout(() => {
                    setSala(null);
                    setJugadores([]);
                    setFaseActual(null);
                    setRondaActual(null);
                    setColoresActuales([]);
                    setColoresReales([]);
                    setResultados([]);
                    setResultadosFinales([]);
                    setConfigPartida(null);
                    setCuentaAtras(null);
                    setMensajeSistema(null);
                    setPantalla("menu");
                }, 3000);
            },

            jugadorExpulsado: (data) => setJugadores(data.jugadores),

            fuisteExpulsado: () => {
                setMensajeSistema("Fuiste expulsado de la sala");
                setTimeout(() => {
                    setSala(null);
                    setJugadores([]);
                    setPantalla("menu");
                    setMensajeSistema(null);
                    socket.disconnect();
                    socket.connect();
                }, 2500);
            },

            avatarActualizado: (data) => setJugadores(data.jugadores),

            error: (data) => {
                setMensajeSistema(data.mensaje);
                setTimeout(() => setMensajeSistema(null), 2500);
            },

            configActualizada: (data) => setConfigModal(data.config),
        };

        Object.entries(handlers).forEach(([evento, fn]) => socket.on(evento, fn));

        return () => {
            Object.entries(handlers).forEach(([evento, fn]) => socket.off(evento, fn));
        };
    }, []);

    const acciones = {
        crearSala: (nombre) => socket.emit("crearSala", nombre),

        unirseSala: (codigo, nombre) => socket.emit("unirseSala", { codigo, nombre }),

        iniciarPartida: () =>
            socket.emit("iniciarPartida", { codigo: sala, config: configModal }),

        cambiarColorGuess: (nuevosColores) => setColoresGuess(nuevosColores),

        enviarGuess: () => {
            socket.emit("enviarGuess", coloresGuess);
            setGuessEnviado(true);
            guessEnviadoRef.current = true;
        },

        editarGuess: () => {
            setGuessEnviado(false);
            guessEnviadoRef.current = false;
        },

        jugarDeNuevo: () => socket.emit("jugarDeNuevo", sala),

        salirPartida: () => {
            setPantalla("menu");
            setSala(null);
            socket.disconnect();
            socket.connect();
        },

        volverAlMenu: () => {
            socket.disconnect();
            socket.connect();
            setSala(null);
            setJugadores([]);
            setResultadosFinales([]);
            setColoresRondas([]);
            setCantidadRondas(null);
            setPantalla("menu");
        },

        expulsarJugador: (jugadorId) =>
            socket.emit("expulsarJugador", { codigo: sala, jugadorId }),

        cambiarAvatar: (avatarId) =>
            socket.emit("cambiarAvatar", { codigo: sala, avatarId }),

        actualizarConfig: (nuevaConfig) => {
            setConfigModal(nuevaConfig);
            socket.emit("actualizarConfig", { codigo: sala, config: nuevaConfig });
        },
    };

    return {
        estado: {
            conectado,
            sala,
            jugadores,
            pantalla,
            faseActual,
            duracionFase,
            configPartida,
            rondaActual,
            resultados,
            guessEnviado,
            resultadosFinales,
            coloresRondas,
            configModal,
            miId,
            creadorId,
            esCreador,
            mensajeSistema,
            cantidadRondas,
            segundosRestantes,
            cuentaAtras,
            coloresActuales,
            coloresGuess,
            coloresReales,
        },
        acciones,
    };
}