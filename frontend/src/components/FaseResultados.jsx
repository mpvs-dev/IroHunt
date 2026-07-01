import ColorBox from "./ColorBox";
import "../styles/FaseResultados.css";

function FaseResultados({ colorReal, resultados, rondaActual }) {
  return (
    <div className="fase-resultados">
      <h2 className="fase-resultados__titulo">Puntajes</h2>

      <div className="fase-resultados__original">
        <ColorBox h={colorReal.h} s={colorReal.s} l={colorReal.l} size={120} />
        <p className="fase-resultados__label">Color original</p>
      </div>

      <div className="fase-resultados__grid">
        {resultados.map((j) => (
          <TarjetaResultado key={j.id} jugador={j} />
        ))}
      </div>
    </div>
  );
}

function TarjetaResultado({ jugador }) {
  return (
    <div className="tarjeta-resultado">
      <span className="tarjeta-resultado__nombre">{jugador.nombre}</span>
      <ColorBox h={jugador.colorGuess.h} s={jugador.colorGuess.s} l={jugador.colorGuess.l} size={100} />
      <span className="tarjeta-resultado__puntos">+{jugador.puntajeRonda} pts</span>
      <span className="tarjeta-resultado__total">{jugador.puntajeTotal} pts totales</span>
    </div>
  );
}

export default FaseResultados;