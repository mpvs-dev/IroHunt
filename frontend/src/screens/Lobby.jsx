import { useState, useCallback } from "react";
import TarjetaJugador from "../components/TarjetaJugador";
import ConfigModal from "../components/configModal";
import AvatarModal from "../components/AvatarModal";
import "../styles/Lobby.css";

function formatDuracion(segundos) {
  const minutos = Math.floor(segundos / 60);
  const segs = segundos % 60;
  if (minutos === 0) return `${segs}s`;
  if (segs === 0) return `${minutos} min`;
  return `${minutos} min ${segs}s`;
}

function Lobby({
  sala,
  jugadores,
  onIniciarPartida,
  esCreador,
  creadorId,
  miId,
  configModal,
  onConfigChange,
  onSalir,
  onExpulsarJugador,
  onCambiarAvatar,
}) {
  const [copiado, setCopiado] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [avatarModalAbierto, setAvatarModalAbierto] = useState(false);

  const abrirModalAvatar = useCallback(() => setAvatarModalAbierto(true), []);

  const copiarCodigo = () => {
    navigator.clipboard.writeText(sala);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const segundosTotales = configModal
    ? (configModal.tiempoMostrarColor +
        configModal.tiempoSeleccion +
        configModal.tiempoResultados) *
      configModal.cantidadRondas
    : 0;

  const miJugador = jugadores.find((j) => j.id === miId);

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
        <button
          className="lobby__boton lobby__boton--outline"
          onClick={copiarCodigo}
        >
          {copiado ? "Copiado!" : "Copiar Codigo"}
        </button>
      </div>

      <div className="lobby__jugadores-header">
        <span className="lobby__jugadores-titulo">Jugadores</span>
        {configModal && (
          <span
            className="lobby__duracion"
            title="Duración estimada de la partida"
          >
            ⏱ ~{formatDuracion(segundosTotales)}
          </span>
        )}
        {esCreador && (
          <button
            className="lobby__boton-icono"
            onClick={() => setModalAbierto(true)}
            aria-label="Configuración"
            title="Configuración"
          >
            ⚙
          </button>
        )}
      </div>

      <div className="lobby__grid">
        {jugadores.map((j) => (
          <TarjetaJugador
            key={j.id}
            jugador={j}
            esCreador={j.id === creadorId}
            esUno={j.id === miId}
            puedeExpulsar={esCreador && j.id !== miId}
            onExpulsar={onExpulsarJugador}
            onEditarAvatar={abrirModalAvatar}
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
          {esEspectador
            ? "La sala está llena, vas a esperar la próxima partida como espectador."
            : "Esperando que el creador inicie la partida..."}
        </p>
      )}

      {modalAbierto && (
        <ConfigModal
          config={configModal}
          onConfigChange={onConfigChange}
          onCerrar={() => setModalAbierto(false)}
        />
      )}

      {avatarModalAbierto && (
        <AvatarModal
          avatarActual={miJugador?.avatarId}
          jugadores={jugadores}
          miId={miId}
          onSeleccionar={onCambiarAvatar}
          onCerrar={() => setAvatarModalAbierto(false)}
        />
      )}
    </main>
  );
}

export default Lobby;
