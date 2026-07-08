import FaseMostrando from "../components/FaseMostrando";
import FaseSeleccion from "../components/FaseSeleccion";
import FaseResultados from "../components/FaseResultados";
import Timer from "../components/Timer";
import "../styles/Game.css";

function Game({
  faseActual,
  rondaActual,
  cantidadRondas,
  duracionFase,
  segundosRestantes,
  coloresActuales,
  coloresGuess,
  onColorChange,
  onEnviarGuess,
  onEditarGuess,
  guessEnviado,
  resultados,
  coloresReales,
  onSalir,
  sala,
  distracciones,
}) {
  return (
    <div className="game">
      <header className="game__header">
        <span className="game__rondas">
          Rondas {rondaActual}/{cantidadRondas}
        </span>
        <div className="game__header-centro">
          <h1 className="game__titulo">IroHunt</h1>
          {sala && <span className="game__codigo">({sala})</span>}
        </div>
        <button className="game__salir" onClick={onSalir}>
          Salir
        </button>
      </header>

      <Timer duracion={duracionFase} segundosRestantes={segundosRestantes} />

      <div className="game__contenido">
        {faseActual === "mostrando" && (
          <FaseMostrando
            colores={coloresActuales}
            distracciones={distracciones}
            rondaActual={rondaActual}
          />
        )}
        {faseActual === "seleccion" && (
          <FaseSeleccion
            coloresGuess={coloresGuess}
            onColorChange={onColorChange}
            onEnviar={onEnviarGuess}
            onEditar={onEditarGuess}
            guessEnviado={guessEnviado}
          />
        )}
        {faseActual === "resultados" && (
          <FaseResultados
            coloresReales={coloresReales}
            resultados={resultados}
            rondaActual={rondaActual}
          />
        )}
      </div>
    </div>
  );
}

export default Game;
