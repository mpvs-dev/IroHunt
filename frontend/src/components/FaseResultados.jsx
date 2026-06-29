import ColorBox from "./ColorBox";

function FaseResultados({ colorReal, resultados, rondaActual }) {
  return (
    <div>
      <h2>Resultados ronda {rondaActual}</h2>

      <div>
        <p>Color original</p>
        <ColorBox h={colorReal.h} s={colorReal.s} l={colorReal.l} size={100} />
      </div>

      {resultados.map((j) => (
        <div key={j.id}>
          <p>{j.nombre}</p>
          <ColorBox
            h={j.colorGuess.h}
            s={j.colorGuess.s}
            l={j.colorGuess.l}
            size={100}
          />
          <p>Ronda: +{j.puntajeRonda} pts</p>
          <p>Total: {j.puntajeTotal} pts</p>
        </div>
      ))}
    </div>
  );
}

export default FaseResultados;
