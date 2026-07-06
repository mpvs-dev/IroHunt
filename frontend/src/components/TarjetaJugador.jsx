import "../styles/TarjetaJugador.css";
import "../styles/AvatarVisual.css";
import AvatarVisual from "./AvatarVisual";

function TarjetaJugador({
  jugador,
  esCreador,
  esUno,
  puedeExpulsar,
  onExpulsar,
  onEditarAvatar,
}) {
  return (
    <div className="tarjeta-jugador">
      {puedeExpulsar && (
        <button
          className="tarjeta-jugador__expulsar"
          onClick={() => onExpulsar(jugador.id)}
          aria-label={`Expulsar a ${jugador.nombre}`}
          title="Expulsar jugador"
        >
          ×
        </button>
      )}

      <div className="tarjeta-jugador__avatar-wrap">
        <Avatar
          nombre={jugador.nombre}
          avatarUrl={jugador.avatarUrl}
          avatarId={jugador.avatarId}
        />
        {esUno && (
          <button
            className="tarjeta-jugador__editar-avatar"
            onClick={onEditarAvatar}
            aria-label="Cambiar avatar"
            title="Cambiar avatar"
          >
            ✎
          </button>
        )}
      </div>

      <span className="tarjeta-jugador__nombre">{jugador.nombre}</span>
      {esCreador && <span className="tarjeta-jugador__badge">Creador</span>}
    </div>
  );
}

function Avatar({ nombre, avatarId }) {
  const color = colorDesdeNombre(nombre);

  if (avatarId) {
    return (
      <div className="avatar" style={{ backgroundColor: color }}>
        <AvatarVisual avatarId={avatarId} size={24} color="#fff" />
      </div>
    );
  }

  const inicial = nombre?.charAt(0).toUpperCase() ?? "?";
  return (
    <div className="avatar" style={{ backgroundColor: color }}>
      {inicial}
    </div>
  );
}

function colorDesdeNombre(nombre) {
  const colores = [
    "#e74c3c",
    "#e67e22",
    "#c9a227",
    "#2ecc71",
    "#1abc9c",
    "#3498db",
    "#9b59b6",
    "#b76e79",
  ];
  const indice =
    nombre.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colores.length;
  return colores[indice];
}

export default TarjetaJugador;
