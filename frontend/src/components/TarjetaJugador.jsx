import "../styles/TarjetaJugador.css";

function TarjetaJugador({ jugador, esCreador }) {
  return (
    <div className="tarjeta-jugador">
      <Avatar nombre={jugador.nombre} />
      <div className="tarjeta-jugador__info">
        <span className="tarjeta-jugador__nombre">{jugador.nombre}</span>
        {esCreador && <span className="tarjeta-jugador__badge">Creador</span>}
      </div>
    </div>
  );
}

function Avatar({ nombre }) {
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
    "#f1c40f",
    "#2ecc71",
    "#1abc9c",
    "#3498db",
    "#9b59b6",
    "#e91e63",
  ];
  const indice =
    nombre.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colores.length;
  return colores[indice];
}

export default TarjetaJugador;
