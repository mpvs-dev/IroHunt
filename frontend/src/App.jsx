import { useEffect, useState } from "react";
import { socket } from "./socket";
import Menu from "./screens/Menu";
import Lobby from "./screens/Lobby";

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

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      setConectado(true);
      socket.emit("hola", "Jugador");
    });

    socket.on("disconnect", () => {
      setConectado(false);
    });

    socket.on("salaCreada", (data) => {
      setSala(data.codigo);
      setJugadores(data.jugadores);
      setPantalla("lobby");
    });

    socket.on("salaUnida", (data) => {
      setSala(data.codigo);
      setJugadores(data.jugadores);
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
      console.log("faseMostrando data:", data);
      setFaseActual("mostrando");
      setDuracionFase(data.duracion);
      setColorActual(data.color);
      setRondaActual(data.rondaActual);
      setPantalla("juego");
    });

    socket.on("faseSeleccion", (data) => {
      setFaseActual("seleccion");
      setDuracionFase(data.duracion);
      setColorActual(null); // ← limpia el color para q no lo vean mientras adivinan
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
    socket.emit("iniciarPartida", sala);
  };

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      {pantalla === "menu" && (
        <Menu onCrearSala={crearSala} onUnirseSala={unirseSala} />
      )}
      {pantalla === "lobby" && (
        <Lobby
          sala={sala}
          jugadores={jugadores}
          onIniciarPartida={iniciarPartida}
        />
      )}
      {pantalla === "juego" && (
        <div>
          <p>
            Ronda {rondaActual} de {configPartida?.cantidadRondas}
          </p>

          {faseActual === "mostrando" && (
            <>
              <div
                style={{
                  width: 200,
                  height: 200,
                  backgroundColor: `rgb(${colorActual.r}, ${colorActual.g}, ${colorActual.b})`,
                }}
              />
              <p>Memoriza este color</p>
            </>
          )}

          {faseActual === "seleccion" && <p>Selecciona el color que viste</p>}
        </div>
      )}
    </div>
  );
}

export default App;
