import { useState } from "react";
import TarjetaJugador from "../components/TarjetaJugador";
import ConfigModal from "../components/configModal";
import "../styles/Lobby.css";

function Lobby({
  sala,
  jugadores,
  onIniciarPartida,
  esCreador,
  creadorId,
  configModal,
  onConfigChange,
  onSalir,
}) {
  const [copiado, setCopiado] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  const copiarCodigo = () => {
    navigator.clipboard.writeText(sala);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <main className="lobby">
      <div className="lobby__top">
        <h1 className="lobby__titulo">IroHunt</h1>
        <button className="lobby__boton lobby__boton--salir" onClick={onSalir}>
          Salir
        </button>
      </div>
      <div className="lobby__codigo-row">
        <div className="lobby__codigo">{sala}</div>
        <button className="lobby__boton" onClick={copiarCodigo}>
          {copiado ? "Copiado!" : "Copiar Codigo"}
        </button>
      </div>

      <div className="lobby__jugadores-header">
        <span className="lobby__jugadores-titulo">Jugadores</span>
        {esCreador && (
          <button
            className="lobby__boton"
            onClick={() => setModalAbierto(true)}
          >
            Configuracion
          </button>
        )}
      </div>

      <div className="lobby__grid">
        {jugadores.map((j) => (
          <TarjetaJugador
            key={j.id}
            jugador={j}
            esCreador={j.id === creadorId}
          />
        ))}
      </div>

      {esCreador && (
        <button
          className="lobby__boton lobby__boton--iniciar"
          onClick={onIniciarPartida}
        >
          Iniciar Partida
        </button>
      )}

      {!esCreador && (
        <p className="lobby__esperando">
          Esperando que el creador inicie la partida...
        </p>
      )}

      {modalAbierto && (
        <ConfigModal
          config={configModal}
          onConfigChange={onConfigChange}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </main>
  );
}

export default Lobby;
