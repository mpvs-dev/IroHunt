import ColorBox from "../components/ColorBox";
import "../styles/Final.css";

function Final({
  resultados,
  coloresRondas,
  cantidadRondas,
  onVolverMenu,
  onJugarDeNuevo,
  sala,
}) {
  return (
    <main className="final">
      <div className="final__header">
        <h1 className="final__titulo">IroHunt</h1>
        {sala && <span className="final__codigo">({sala})</span>}
      </div>
      <h2 className="final__subtitulo">Resultados</h2>

      <div className="final__tabla-wrapper">
        <table className="final__tabla">
          <thead>
            <tr>
              <th className="final__celda final__celda--header" />
              {Array.from({ length: cantidadRondas }, (_, i) => (
                <th key={i} className="final__celda final__celda--header">
                  Ronda {i + 1}
                </th>
              ))}
              <th className="final__celda final__celda--header" />
            </tr>
          </thead>
          <tbody>
            <FilaColores colores={coloresRondas} />
            {resultados.map((j) => (
              <FilaJugador key={j.id} jugador={j} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="final__acciones">
        <button
          className="final__boton final__boton--outline"
          onClick={onVolverMenu}
        >
          Volver al menu
        </button>
        <button className="final__boton" onClick={onJugarDeNuevo}>
          Volver al Jugar
        </button>
      </div>
    </main>
  );
}

function FilaColores({ colores }) {
  return (
    <tr>
      <td className="final__celda final__celda--label">Original</td>
      {colores.map((c, i) => (
        <td key={i} className="final__celda">
          <div className="final__celda-contenido">
            <ColorBox
              h={c.h}
              s={c.s}
              l={c.l}
              size={60}
              className="final__swatch"
            />
          </div>
        </td>
      ))}
      <td className="final__celda final__celda--puntaje-header" />
    </tr>
  );
}

function FilaJugador({ jugador }) {
  return (
    <tr>
      <td className="final__celda final__celda--label">{jugador.nombre}</td>
      {jugador.guessesRondas.map((g, i) => (
        <td key={i} className="final__celda">
          <div className="final__celda-contenido">
            <ColorBox
              h={g.h}
              s={g.s}
              l={g.l}
              size={60}
              className="final__swatch"
            />
            <span className="final__puntaje-ronda">
              {jugador.puntajesRondas?.[i] ?? 0} pts
            </span>
          </div>
        </td>
      ))}
      <td className="final__celda final__celda--puntaje">
        {jugador.puntajeTotal} pts
      </td>
    </tr>
  );
}

export default Final;
