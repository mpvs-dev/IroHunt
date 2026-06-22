import { useState } from 'react';

function Lobby({ sala, jugadores, onIniciarPartida }) {
  const [copiado, setCopiado] = useState(false);

  const copiarCodigo = () => {
    navigator.clipboard.writeText(sala);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div>
      <h1>Lobby</h1>

      <p>Código de sala: <strong>{sala}</strong></p>
      <button onClick={copiarCodigo}>
        {copiado ? 'Copiado!' : 'Copiar código'}
      </button>

      <h2>Jugadores ({jugadores.length})</h2>
      <ul>
        {jugadores.map((j) => (
          <li key={j.id}>{j.nombre}</li>
        ))}
      </ul>

      <button onClick={onIniciarPartida}>Iniciar partida</button>
    </div>
  );
}

export default Lobby;