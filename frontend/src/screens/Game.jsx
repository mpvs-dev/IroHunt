import FaseMostrando from "../components/FaseMostrando";
import FaseSeleccion from "../components/FaseSeleccion";
import FaseResultados from "../components/FaseResultados";

function Game({
  faseActual,
  rondaActual,
  cantidadRondas,
  colorActual,
  colorGuess,
  onColorChange,
  onEnviarGuess,
  guessEnviado,
  resultados,
  colorReal,
}) {
  return (
    <div>
      <p>
        Ronda {rondaActual} de {cantidadRondas}
      </p>

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
  );
}

export default Game;
