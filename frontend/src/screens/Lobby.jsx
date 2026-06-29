import { useState } from "react";
import ConfigModal from "../components/configModal";

function Lobby({
  sala,
  jugadores,
  onIniciarPartida,
  esCreador,
  configModal,
  onConfigChange,
}) {
  const [copiado, setCopiado] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  const copiarCodigo = () => {
    navigator.clipboard.writeText(sala);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div>
      <h1>Lobby</h1>

      <p>
        Código: <strong>{sala}</strong>
      </p>
      <button onClick={copiarCodigo}>
        {copiado ? "Copiado!" : "Copiar código"}
      </button>

      <h2>Jugadores ({jugadores.length})</h2>
      <ul>
        {jugadores.map((j) => (
          <li key={j.id}>{j.nombre}</li>
        ))}
      </ul>
      {esCreador && (
        <>
          <button onClick={() => setModalAbierto(true)}>Configuración</button>
          <button onClick={onIniciarPartida}>Iniciar partida</button>
        </>
      )}

      {!esCreador && <p>Esperando que el creador inicie la partida...</p>}

      {modalAbierto && (
        <ConfigModal
          config={configModal}
          onConfigChange={onConfigChange}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  );
}

export default Lobby;
