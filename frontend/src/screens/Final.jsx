import { useState } from "react";
import ColorBox from "../components/ColorBox";
import "../styles/Final.css";

function Final({
  resultados,
  coloresRondas,
  cantidadRondas,
  onVolverMenu,
  onJugarDeNuevo,
  sala,
  esCreador,
}) {
  const [indiceJugador, setIndiceJugador] = useState(0);

  const cantidadJugadores = resultados.length;
  const jugador = resultados[indiceJugador];

  const anterior = () =>
    setIndiceJugador((i) => (i - 1 + cantidadJugadores) % cantidadJugadores);

  const siguiente = () => setIndiceJugador((i) => (i + 1) % cantidadJugadores);

  return (
    <main className="final">
      <div className="final__header">
        <h1 className="final__titulo">IroHunt</h1>
        {sala && <span className="final__codigo">({sala})</span>}
      </div>
      <h2 className="final__subtitulo">Resultados</h2>

      <section className="final__seccion">
        <h3 className="final__seccion-titulo">Colores originales</h3>
        <div className="final__rondas-grid">
          {coloresRondas.map((coloresRonda, i) => (
            <div key={i} className="final__ronda-item">
              <span className="final__ronda-label">Ronda {i + 1}</span>
              <div className="final__fila-colores">
                {coloresRonda.map((c, j) => (
                  <ColorBox
                    key={j}
                    h={c.h}
                    s={c.s}
                    l={c.l}
                    size={50}
                    className="final__swatch"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {jugador && (
        <section className="final__seccion">
          <div className="final__carrusel-nav">
            {cantidadJugadores > 1 && (
              <button
                className="final__color-flecha"
                onClick={anterior}
                aria-label="Jugador anterior"
              >
                ‹
              </button>
            )}

            <div className="final__carrusel-info">
              <span className="final__carrusel-nombre">{jugador.nombre}</span>
              {cantidadJugadores > 1 && (
                <span className="final__carrusel-indice">
                  Jugador {indiceJugador + 1}/{cantidadJugadores}
                </span>
              )}
              <span className="final__carrusel-total">
                {jugador.puntajeTotal} pts totales
              </span>
            </div>

            {cantidadJugadores > 1 && (
              <button
                className="final__color-flecha"
                onClick={siguiente}
                aria-label="Jugador siguiente"
              >
                ›
              </button>
            )}
          </div>

          <div className="final__rondas-grid">
            {jugador.guessesRondas.map((guessesRonda, i) => (
              <div key={i} className="final__ronda-item">
                <span className="final__ronda-label">Ronda {i + 1}</span>
                <div className="final__fila-colores">
                  {guessesRonda.map((g, j) => (
                    <ColorBox
                      key={j}
                      h={g.h}
                      s={g.s}
                      l={g.l}
                      size={50}
                      className="final__swatch"
                    />
                  ))}
                </div>
                <span className="final__puntaje-ronda">
                  {jugador.puntajesRondas?.[i] ?? 0} pts
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="final__acciones">
        <button
          className="final__boton final__boton--outline"
          onClick={onVolverMenu}
        >
          Volver al menu
        </button>
        {esCreador ? (
          <button className="final__boton" onClick={onJugarDeNuevo}>
            Volver al Jugar
          </button>
        ) : (
          <p className="final__esperando">
            Esperando una nueva partida...
          </p>
        )}
      </div>
    </main>
  );
}

export default Final;
