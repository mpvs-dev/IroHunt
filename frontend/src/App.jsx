import { useEffect, useState } from "react";
import { socket } from "./socket";

function App() {
  const [conectado, setConectado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [sala, setSala] = useState(null);

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      setConectado(true);
      socket.emit("hola", "Jugador");
    });

    socket.on("salaCreada", (data) => {
      setSala(data.codigo);
    });

    socket.on("bienvenida", (data) => {
      setMensaje(data.mensaje);
    });

    socket.on("disconnect", () => {
      setConectado(false);
    });

    return () => {
      socket.disconnect();
      socket.off();
    };
  }, []);

  const crearSala = () => {
    socket.emit('crearSala', 'Jugador');
  }
  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>IroHunt</h1>
      <p>Estado: {conectado ? "Conectado" : "Desconectado"}</p>
      {mensaje && <p>{mensaje}</p>}

      <button onClick={crearSala}>Crear sala</button>

      {sala && <p>Codigo de sala: {sala}</p>}
    </div>
  );
}

export default App;
