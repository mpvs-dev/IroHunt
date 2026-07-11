import { useGameSocket } from "./hooks/useGameSocket";
import Menu from "./screens/Menu";
import Lobby from "./screens/Lobby";
import Final from "./screens/Final";
import Game from "./screens/Game";
import CuentaAtras from "./components/CuentaAtras";
import Creditos from "./components/Creditos";
import Fondo from "./components/Fondo";
import ToastContainer from "./components/ToastContainer";

function App() {
  const { estado, acciones } = useGameSocket();

  const atenuarFondo =
    estado.pantalla === "juego" &&
    (estado.configPartida?.distracciones?.atenuarFondo ?? true);

  return (
    <div style={{ padding: 40, paddingBottom: 90, fontFamily: "sans-serif" }}>
      <Fondo atenuado={atenuarFondo} />

      <ToastContainer toasts={estado.toasts} onCerrar={acciones.cerrarToast} />

      {estado.pantalla === "menu" && (
        <Menu
          onCrearSala={acciones.crearSala}
          onUnirseSala={acciones.unirseSala}
        />
      )}

      {estado.pantalla === "lobby" && (
        <Lobby
          sala={estado.sala}
          jugadores={estado.jugadores}
          onIniciarPartida={acciones.iniciarPartida}
          esCreador={estado.esCreador}
          configModal={estado.configModal}
          onConfigChange={acciones.actualizarConfig}
          isCreador={estado.esCreador}
          creadorId={estado.creadorId}
          onSalir={acciones.salirPartida}
          miId={estado.miId}
          onExpulsarJugador={acciones.expulsarJugador}
          onCambiarAvatar={acciones.cambiarAvatar}
        />
      )}

      {estado.pantalla === "cuentaAtras" && (
        <CuentaAtras numero={estado.cuentaAtras} sala={estado.sala} />
      )}

      {estado.pantalla === "juego" && (
        <Game
          faseActual={estado.faseActual}
          rondaActual={estado.rondaActual}
          cantidadRondas={estado.configPartida?.cantidadRondas}
          coloresActuales={estado.coloresActuales}
          coloresGuess={estado.coloresGuess}
          onColorChange={acciones.cambiarColorGuess}
          onEnviarGuess={acciones.enviarGuess}
          onEditarGuess={acciones.editarGuess}
          guessEnviado={estado.guessEnviado}
          resultados={estado.resultados}
          coloresReales={estado.coloresReales}
          duracionFase={estado.duracionFase}
          segundosRestantes={estado.segundosRestantes}
          onSalir={acciones.salirPartida}
          sala={estado.sala}
          distracciones={estado.configPartida?.distracciones}
        />
      )}

      {estado.pantalla === "final" && (
        <Final
          resultados={estado.resultadosFinales}
          coloresRondas={estado.coloresRondas}
          cantidadRondas={estado.cantidadRondas}
          onVolverMenu={acciones.volverAlMenu}
          onJugarDeNuevo={acciones.jugarDeNuevo}
          sala={estado.sala}
          esCreador={estado.esCreador}
        />
      )}

      <Creditos />
    </div>
  );
}

export default App;
