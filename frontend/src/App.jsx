import { useEffect, useState, useRef } from "react";
import { socket } from "./socket";
import Menu from "./screens/Menu";
import Lobby from "./screens/Lobby";
import Final from "./screens/Final";
import Game from "./screens/Game";
import CuentaAtras from "./components/CuentaAtras";
import Creditos from "./components/Creditos";
import Fondo from "./components/Fondo";

const COLOR_GUESS_INICIAL = { h: 180, s: 50, l: 50 };

function App() {
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
  const esCreador = miId === creadorId;
  const [mensajeSistema, setMensajeSistema] = useState(null);
  const [cantidadRondas, setCantidadRondas] = useState(null);
  const [segundosRestantes, setSegundosRestantes] = useState(null);
  const [cuentaAtras, setCuentaAtras] = useState(null);

  // --- Colores (arrays, soporta multi-color por ronda) ---
  const [coloresActuales, setColoresActuales] = useState([]);
  const [coloresGuess, setColoresGuess] = useState([COLOR_GUESS_INICIAL]);
  const [coloresReales, setColoresReales] = useState([]);

  const guessEnviadoRef = useRef(false);
  const coloresGuessRef = useRef(coloresGuess);
  const faseActualRef = useRef(faseActual);

  const atenuarFondo =
    pantalla === "juego" &&
    (configPartida?.distracciones?.atenuarFondo ?? true);

  useEffect(() => {
    faseActualRef.current = faseActual;
  }, [faseActual]);

  useEffect(() => {
    coloresGuessRef.current = coloresGuess;
  }, [coloresGuess]);

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      setMiId(socket.id);
      setConectado(true);
    });

    socket.on("disconnect", () => {
      setConectado(false);
    });

    socket.on("salaCreada", (data) => {
      setSala(data.codigo);
      setJugadores(data.jugadores);
      setConfigModal(data.config);
      setPantalla("lobby");
      setCreadorId(data.creador);
    });

    socket.on("salaUnida", (data) => {
      setSala(data.codigo);
      setJugadores(data.jugadores);
      setCreadorId(data.creador);
      setConfigModal(data.config);
      setPantalla("lobby");
    });

    socket.on("jugadorUnido", (data) => {
      setJugadores(data.jugadores);
    });

    socket.on("jugadorSalió", (data) => {
      setJugadores(data.jugadores);
    });

    socket.on("partidaIniciada", (data) => {
      setConfigPartida({
        cantidadRondas: data.cantidadRondas,
        tiempoMostrarColor: data.tiempoMostrarColor,
        tiempoSeleccion: data.tiempoSeleccion,
        tiempoResultados: data.tiempoResultados,
        cantidadColores: data.cantidadColores,
        distracciones: data.distracciones,
      });
    });

    socket.on("cuentaAtras", (data) => {
      setCuentaAtras(data.segundosRestantes);
      setPantalla("cuentaAtras");
    });

    socket.on("faseMostrando", (data) => {
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
    });

    socket.on("faseSeleccion", (data) => {
      setFaseActual("seleccion");
      setDuracionFase(data.duracion);
      setSegundosRestantes(data.segundosRestantes);
      setColoresActuales([]);
    });

    socket.on("faseResultados", (data) => {
      setFaseActual("resultados");
      setResultados(data.resultados);
      setColoresReales(data.coloresReales ?? []);
      setDuracionFase(data.duracion);
      setSegundosRestantes(data.segundosRestantes);
    });

    socket.on("tick", (data) => {
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
    });

    socket.on("partidaFinalizada", (data) => {
      setResultadosFinales(data.resultados);
      setColoresRondas(data.coloresRondas);
      setCantidadRondas(data.cantidadRondas);
      setPantalla("final");
    });

    socket.on("volverAlLobby", (data) => {
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
    });

    socket.on("creadorDesconectado", (data) => {
      setMensajeSistema(data.mensaje);
    });

    socket.on("creadorReconectado", (data) => {
      setJugadores(data.jugadores);
      setCreadorId(data.creador);
      setMensajeSistema(null);
    });

    socket.on("partidaCancelada", (data) => {
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
    });

    socket.on("jugadorExpulsado", (data) => {
      setJugadores(data.jugadores);
    });

    socket.on("fuisteExpulsado", () => {
      setMensajeSistema("Fuiste expulsado de la sala");
      setTimeout(() => {
        setSala(null);
        setJugadores([]);
        setPantalla("menu");
        setMensajeSistema(null);
        socket.disconnect();
        socket.connect();
      }, 2500);
    });

    socket.on("avatarActualizado", (data) => {
      setJugadores(data.jugadores);
    });

    socket.on("error", (data) => {
      setMensajeSistema(data.mensaje);
      setTimeout(() => setMensajeSistema(null), 2500);
    });

    socket.on("configActualizada", (data) => {
      setConfigModal(data.config);
    });

    return () => {
      socket.off();
    };
  }, []);

  const crearSala = (nombre) => {
    socket.emit("crearSala", nombre);
  };

  const unirseSala = (codigo, nombre) => {
    socket.emit("unirseSala", { codigo, nombre });
  };

  const iniciarPartida = () => {
    socket.emit("iniciarPartida", {
      codigo: sala,
      config: configModal,
    });
  };

  const cambiarColorGuess = (nuevosColores) => {
    setColoresGuess(nuevosColores);
  };

  const enviarGuess = () => {
    socket.emit("enviarGuess", coloresGuess);
    setGuessEnviado(true);
    guessEnviadoRef.current = true;
  };

  const editarGuess = () => {
    setGuessEnviado(false);
    guessEnviadoRef.current = false;
  };

  const jugarDeNuevo = () => {
    socket.emit("jugarDeNuevo", sala);
  };

  const salirPartida = () => {
    setPantalla("menu");
    setSala(null);
    socket.disconnect();
    socket.connect();
  };

  const volverAlMenu = () => {
    socket.disconnect();
    socket.connect();
    setSala(null);
    setJugadores([]);
    setResultadosFinales([]);
    setColoresRondas([]);
    setCantidadRondas(null);
    setPantalla("menu");
  };

  const expulsarJugador = (jugadorId) => {
    socket.emit("expulsarJugador", { codigo: sala, jugadorId });
  };

  const cambiarAvatar = (avatarId) => {
    socket.emit("cambiarAvatar", { codigo: sala, avatarId });
  };

  const actualizarConfig = (nuevaConfig) => {
    setConfigModal(nuevaConfig);
    socket.emit("actualizarConfig", { codigo: sala, config: nuevaConfig });
  };

  return (
    <div style={{ padding: 40, paddingBottom: 90, fontFamily: "sans-serif" }}>
      <Fondo atenuado={atenuarFondo} />
      {mensajeSistema && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "12px 24px",
            borderRadius: 8,
          }}
        >
          {mensajeSistema}
        </div>
      )}
      {pantalla === "menu" && (
        <Menu onCrearSala={crearSala} onUnirseSala={unirseSala} />
      )}
      {pantalla === "lobby" && (
        <Lobby
          sala={sala}
          jugadores={jugadores}
          onIniciarPartida={iniciarPartida}
          esCreador={esCreador}
          configModal={configModal}
          onConfigChange={actualizarConfig}
          isCreador={esCreador}
          creadorId={creadorId}
          onSalir={salirPartida}
          miId={miId}
          onExpulsarJugador={expulsarJugador}
          onCambiarAvatar={cambiarAvatar}
        />
      )}
      {pantalla === "cuentaAtras" && (
        <CuentaAtras numero={cuentaAtras} sala={sala} />
      )}
      {pantalla === "juego" && (
        <Game
          faseActual={faseActual}
          rondaActual={rondaActual}
          cantidadRondas={configPartida?.cantidadRondas}
          coloresActuales={coloresActuales}
          coloresGuess={coloresGuess}
          onColorChange={cambiarColorGuess}
          onEnviarGuess={enviarGuess}
          onEditarGuess={editarGuess}
          guessEnviado={guessEnviado}
          resultados={resultados}
          coloresReales={coloresReales}
          duracionFase={duracionFase}
          segundosRestantes={segundosRestantes}
          onSalir={salirPartida}
          sala={sala}
          distracciones={configPartida?.distracciones}
        />
      )}
      {pantalla === "final" && (
        <Final
          resultados={resultadosFinales}
          coloresRondas={coloresRondas}
          cantidadRondas={cantidadRondas}
          onVolverMenu={volverAlMenu}
          onJugarDeNuevo={jugarDeNuevo}
          sala={sala}
        />
      )}
      <Creditos />
    </div>
  );
}

export default App;
