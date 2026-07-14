import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { useToasts } from "./useToasts";

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
    const { toasts, mostrarToast, eliminarToast } = useToasts();
    const [cantidadRondas, setCantidadRondas] = useState(null);
    const [segundosRestantes, setSegundosRestantes] = useState(null);
    const [cuentaAtras, setCuentaAtras] = useState(null);

    const [coloresActuales, setColoresActuales] = useState([]);
    const [coloresGuess, setColoresGuess] = useState([COLOR_GUESS_INICIAL]);
    const [coloresReales, setColoresReales] = useState([]);

    const esCreador = miId === creadorId;
    const [esEspectador, setEsEspectador] = useState(false);
    const [cantidadEspectadores, setCantidadEspectadores] = useState(0);

    const guessEnviadoRef = useRef(false);
    const coloresGuessRef = useRef(coloresGuess);
    const faseActualRef = useRef(faseActual);
    const salaRef = useRef(null);
    const salidaIntencionalRef = useRef(false);

    useEffect(() => {
        salaRef.current = sala;
    }, [sala]);

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
                setConectado(true);
                if (salaRef.current && !salidaIntencionalRef.current) {
                    socket.emit('reconectar', salaRef.current);
                } else {
                    setMiId(socket.id);
                }
                salidaIntencionalRef.current = false;
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
                setEsEspectador((prev) => prev && !data.jugadores.some((j) => j.id === socket.id));
                setPantalla("lobby");
                setCreadorId(data.creador);
            },

            creadorDesconectado: (data) => { mostrarToast(data.mensaje, { tipo: "warning", duracion: 3000 }) },

            creadorReconectado: (data) => {
                setJugadores(data.jugadores);
                setCreadorId(data.creador);
            },

            partidaCancelada: (data) => {
                mostrarToast(data.mensaje, { tipo: "warning", duracion: 3000 });
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
                    setPantalla("menu");
                }, 3000);
            },

            jugadorExpulsado: (data) => setJugadores(data.jugadores),

            fuisteExpulsado: () => {
                mostrarToast("Fuiste expulsado de la sala", { tipo: "error", duracion: 2500 });
                setTimeout(() => {
                    setSala(null);
                    setJugadores([]);
                    setPantalla("menu");
                    salidaIntencionalRef.current = true;
                    socket.disconnect();
                    socket.connect();
                }, 2500);
            },

            avatarActualizado: (data) => setJugadores(data.jugadores),

            error: (data) => {
                mostrarToast(data.mensaje, { tipo: "error" });
                if (data.mensaje === "la sala ya no existe" || data.mensaje === "No se encontro tu sesión en esta sala") {
                    salaRef.current = null;
                    setSala(null);
                    setPantalla("menu");
                }
            },

            configActualizada: (data) => setConfigModal(data.config),

            unidoComoEspectador: (data) => {
                setEsEspectador(true);
                setSala(data.codigo);
                setJugadores(data.jugadores);
                setCreadorId(data.creador);
                setConfigModal(data.config);

                const f = data.fase;
                if (f.tipo === 'cuentaAtras') {
                    setCuentaAtras(f.segundosRestantes);
                    setPantalla('cuentaAtras');
                } else if (f.tipo === 'mostrando') {
                    setFaseActual('mostrando');
                    setDuracionFase(f.duracion);
                    setSegundosRestantes(f.segundosRestantes);
                    setColoresActuales(f.colores ?? []);
                    setRondaActual(f.rondaActual);
                    setPantalla('juego');
                } else if (f.tipo === 'seleccion' || f.tipo === 'resultados') {
                    setFaseActual(f.tipo);
                    setDuracionFase(f.duracion);
                    setSegundosRestantes(f.segundosRestantes);
                    setRondaActual(f.rondaActual);
                    setColoresActuales([]);
                    setPantalla('juego');
                } else {
                    setPantalla('lobby');
                }
            },

            espectadorUnido: (data) => setCantidadEspectadores(data.cantidadEspectadores),

            reconectado: (data) => {
                setMiId(socket.id);
                setSala(data.codigo);
                setJugadores(data.jugadores);
                setCreadorId(data.creador);
                setConfigModal(data.config);
                setRondaActual(data.rondaActual);

                const f = data.fase;
                if (!f || f.tipo === null) {
                    setPantalla("lobby");
                } else if (f.tipo === "cuentaAtras") {
                    setCuentaAtras(f.segundosRestantes);
                    setPantalla("cuentaAtras");
                } else if (f.tipo === "mostrando") {
                    setFaseActual("mostrando");
                    setDuracionFase(f.duracion);
                    setSegundosRestantes(f.segundosRestantes);
                    setColoresActuales(f.colores ?? []);
                    setColoresGuess((f.colores ?? []).map(() => ({ ...COLOR_GUESS_INICIAL })));
                    setPantalla("juego");
                } else if (f.tipo === "seleccion" || f.tipo === "resultados") {
                    setFaseActual(f.tipo);
                    setDuracionFase(f.duracion);
                    setSegundosRestantes(f.segundosRestantes);
                    setColoresActuales([]);
                    setPantalla("juego");
                }

                mostrarToast("Te reconectaste a la sala", { tipo: "info", duracion: 2000 });
            },
            siguesComoEspectador: (data) => {
                mostrarToast(data.mensaje, { tipo: "warning", duracion: 3500 });
            },
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
            salidaIntencionalRef.current = true;
            setPantalla("menu");
            setSala(null);
            socket.disconnect();
            socket.connect();
        },

        volverAlMenu: () => {
            salidaIntencionalRef.current = true;
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
            cantidadRondas,
            segundosRestantes,
            cuentaAtras,
            coloresActuales,
            coloresGuess,
            coloresReales,
            toasts,
            esEspectador,
            cantidadEspectadores,
        },
        acciones: {
            ...acciones,
            cerrarToast: eliminarToast,
        },
    };
}