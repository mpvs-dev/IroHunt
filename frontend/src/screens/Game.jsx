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
  colorActual,
  colorGuess,
  onColorChange,
  onEnviarGuess,
  guessEnviado,
  resultados,
  colorReal,
  onSalir,
  sala,
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

      <Timer
        duracion={duracionFase}
        resetKey={`${faseActual}-${rondaActual}`}
      />

      <div className="game__contenido">
        {faseActual === "mostrando" && <FaseMostrando color={colorActual} />}
        {faseActual === "seleccion" && (
          <FaseSeleccion
            colorGuess={colorGuess}
            onColorChange={onColorChange}
            onEnviar={onEnviarGuess}
            guessEnviado={guessEnviado}
          />
        )}
        {faseActual === "resultados" && (
          <FaseResultados
            colorReal={colorReal}
            resultados={resultados}
            rondaActual={rondaActual}
          />
        )}
      </div>
    </div>
  );
}

export default Game;
