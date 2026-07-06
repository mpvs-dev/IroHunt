import { useEffect, useState, useRef } from "react";
import { socket } from "./socket";
import Menu from "./screens/Menu";
import Lobby from "./screens/Lobby";
import Final from "./screens/Final";
import Game from "./screens/Game";
import Creditos from "./components/Creditos";
import Fondo from "./components/Fondo";

function App() {
  const [conectado, setConectado] = useState(false);
  const [sala, setSala] = useState(null);
  const [codigoInput, setCodigoInput] = useState("");
  const [jugadores, setJugadores] = useState([]);
  const [pantalla, setPantalla] = useState("menu");
  const [faseActual, setFaseActual] = useState(null);
  const [duracionFase, setDuracionFase] = useState(null);
  const [colorActual, setColorActual] = useState(null);
  const [configPartida, setConfigPartida] = useState(null);
  const [rondaActual, setRondaActual] = useState(null);
  const [colorGuess, setColorGuess] = useState({ h: 180, s: 50, l: 50 });
  const [resultados, setResultados] = useState([]);
  const [colorReal, setColorReal] = useState(null);
  const [guessEnviado, setGuessEnviado] = useState(false);
  const [resultadosFinales, setResultadosFinales] = useState([]);
  const [configModal, setConfigModal] = useState(null);
  const [miId, setMiId] = useState(null);
  const [creadorId, setCreadorId] = useState(null);
  const esCreador = miId === creadorId;
  const [mensajeSistema, setMensajeSistema] = useState(null);
  const [coloresRondas, setColoresRondas] = useState([]);
  const [cantidadRondas, setCantidadRondas] = useState(null);
  const guessEnviadoRef = useState(false);
  const colorGuessRef = useRef(colorGuess);
  const atenuarFondo = pantalla === "juego";

  useEffect(() => {
    colorGuessRef.current = colorGuess;
  }, [colorGuess]);

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

    socket.on("partidaIniciada", (data) => {
      setConfigPartida({
        cantidadRondas: data.cantidadRondas,
        tiempoMostrarColor: data.tiempoMostrarColor,
        tiempoSeleccion: data.tiempoSeleccion,
        tiempoResultados: data.tiempoResultados,
      });
      setPantalla("juego");
    });

    socket.on("faseMostrando", (data) => {
      setFaseActual("mostrando");
      setDuracionFase(data.duracion);
      setColorActual(data.color);
      setRondaActual(data.rondaActual);
      setColorGuess({ h: 180, s: 50, l: 50 });
      setPantalla("juego");
      setGuessEnviado(false);
      guessEnviadoRef.current = false;
    });

    socket.on("faseSeleccion", (data) => {
      setFaseActual("seleccion");
      setDuracionFase(data.duracion);
      setColorActual(null);

      setTimeout(
        () => {
          if (!guessEnviadoRef.current) {
            socket.emit("enviarGuess", colorGuessRef.current);
            setGuessEnviado(true);
            guessEnviadoRef.current = true;
          }
        },
        (data.duracion - 1) * 1000,
      );
    });

    socket.on("faseResultados", (data) => {
      setFaseActual("resultados");
      setResultados(data.resultados);
      setColorReal(data.colorReal);
      setDuracionFase(data.duracion);
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
      setColorActual(null);
      setResultados([]);
      setResultadosFinales([]);
      setConfigPartida(null);
      setGuessEnviado(false);
      guessEnviadoRef.current = false;
      setColorGuess({ h: 180, s: 50, l: 50 });
      setPantalla("lobby");
      setCreadorId(data.creador);
    });

    socket.on("creadorDesconectado", (data) => {
      // mostrar aviso en pantalla de que el creador se desconectó
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
        setColorActual(null);
        setResultados([]);
        setResultadosFinales([]);
        setConfigPartida(null);
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

  const enviarGuess = () => {
    if (guessEnviadoRef.current) return;
    socket.emit("enviarGuess", colorGuess);
    setGuessEnviado(true);
    guessEnviadoRef.current = true;
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
      {pantalla === "juego" && (
        <Game
          faseActual={faseActual}
          rondaActual={rondaActual}
          cantidadRondas={configPartida?.cantidadRondas}
          colorActual={colorActual}
          colorGuess={colorGuess}
          onColorChange={setColorGuess}
          onEnviarGuess={enviarGuess}
          guessEnviado={guessEnviado}
          resultados={resultados}
          colorReal={colorReal}
          duracionFase={duracionFase}
          onSalir={salirPartida}
          sala={sala}
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
