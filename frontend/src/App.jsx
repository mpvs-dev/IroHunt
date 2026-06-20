import { useEffect, useState } from 'react';
import { socket } from './socket';

function App() {
  const [conectado, setConectado] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setConectado(true);
      socket.emit('hola', 'Jugador');
    });

    socket.on('bienvenida', (data) => {
      setMensaje(data.mensaje);
    });

    socket.on('disconnect', () => {
      setConectado(false);
    });

    return () => {
      socket.disconnect();
      socket.off();
    };
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Color game</h1>
      <p>Estado: {conectado ? 'Conectado' : 'Desconectado'}</p>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
}

export default App;