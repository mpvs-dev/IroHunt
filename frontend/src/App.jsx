import { useEffect, useState } from "react";
import { socket } from "./socket";
import Menu from "./screens/Menu";
import Lobby from "./screens/Lobby";

function App() {
  const [conectado, setConectado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [sala, setSala] = useState(null);
  const [codigoInput, setCodigoInput] = useState("");
  const [jugadores, setJugadores] = useState([]);
  const [pantalla, setPantalla] = useState("menu");

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
    return () => {
      socket.disconnect();
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
    </div>
  );
}

export default App;
