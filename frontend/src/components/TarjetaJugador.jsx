import "../styles/TarjetaJugador.css";

function TarjetaJugador({ jugador, esCreador }) {
  return (
    <div className="tarjeta-jugador">
      <Avatar nombre={jugador.nombre} avatarUrl={jugador.avatarUrl} />
      <span className="tarjeta-jugador__nombre">{jugador.nombre}</span>
      {esCreador && <span className="tarjeta-jugador__badge">Creador</span>}
    </div>
  );
}

function Avatar({ nombre, avatarUrl }) {
  if (avatarUrl) {
    return (
      <img className="avatar avatar--imagen" src={avatarUrl} alt={nombre} />
    );
  }

  const inicial = nombre?.charAt(0).toUpperCase() ?? "?";
  const color = colorDesdeNombre(nombre);

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
