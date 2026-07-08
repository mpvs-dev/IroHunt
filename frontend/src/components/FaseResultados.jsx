import ColorBox from "./ColorBox";
import "../styles/FaseResultados.css";

function FaseResultados({ coloresReales, resultados, rondaActual }) {
  const listaColoresReales = coloresReales ?? [];
  const listaResultados = resultados ?? [];

  if (listaColoresReales.length === 0) return null;

  return (
    <div className="fase-resultados">
      <h2 className="fase-resultados__titulo">Puntajes</h2>

      <div className="fase-resultados__original">
        <div className="fase-resultados__fila-colores">
          {listaColoresReales.map((c, i) => (
            <div key={i} className="fase-resultados__item">
              {listaColoresReales.length > 1 && (
                <span className="fase-resultados__numero">{i + 1}</span>
              )}
              <ColorBox
                h={c.h}
                s={c.s}
                l={c.l}
                size={listaColoresReales.length > 1 ? 80 : 120}
              />
            </div>
          ))}
        </div>
        <p className="fase-resultados__label">
          {listaColoresReales.length > 1
            ? "Colores originales"
            : "Color original"}
        </p>
      </div>

      <div className="fase-resultados__grid">
        {listaResultados.map((j) => (
          <TarjetaResultado key={j.id} jugador={j} />
        ))}
      </div>
    </div>
  );
}

function TarjetaResultado({ jugador }) {
  const guesses = jugador.coloresGuess ?? [];

  return (
    <div className="tarjeta-resultado">
      <span className="tarjeta-resultado__nombre">{jugador.nombre}</span>
      <div className="tarjeta-resultado__fila-colores">
        {guesses.map((g, i) => (
          <div key={i} className="tarjeta-resultado__item">
            {guesses.length > 1 && (
              <span className="tarjeta-resultado__numero">{i + 1}</span>
            )}
            <ColorBox
              h={g.h}
              s={g.s}
              l={g.l}
              size={guesses.length > 1 ? 60 : 100}
            />
          </div>
        ))}
      </div>
      <span className="tarjeta-resultado__puntos">
        +{jugador.puntajeRonda} pts
      </span>
      <span className="tarjeta-resultado__total">
        {jugador.puntajeTotal} pts totales
      </span>
    </div>
  );
}

export default FaseResultados;
