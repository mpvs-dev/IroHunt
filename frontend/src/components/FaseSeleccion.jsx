import ColorBox from "./ColorBox";
import ColorSelector from "./ColorSelector";
import "../styles/FaseSeleccion.css";

function FaseSeleccion({
  coloresGuess,
  onColorChange,
  onEnviar,
  onEditar,
  guessEnviado,
  esEspectador,
}) {
  const lista = coloresGuess ?? [];

  if (esEspectador) {
    return (
      <div className="fase-seleccion">
        <p className="lobby__esperando">
          Estas espectando esta partida. Vas a poder jugar en la proxima ronda.
        </p>
      </div>
    );
  }

  if (lista.length === 0) return null;

  const actualizarColor = (indice, nuevoColor) => {
    const copia = [...lista];
    copia[indice] = nuevoColor;
    onColorChange(copia);
  };

  return (
    <div className="fase-seleccion">
      <div className="fase-seleccion__lista">
        {lista.map((guess, i) => (
          <div key={i} className="fase-seleccion__item">
            {lista.length > 1 && (
              <span className="fase-seleccion__numero">Color {i + 1}</span>
            )}

            <ColorBox h={guess.h} s={guess.s} l={guess.l} size={120} />

            <div
              className={`fase-seleccion__selector${
                guessEnviado ? " fase-seleccion__selector--bloqueado" : ""
              }`}
            >
              <ColorSelector
                colorGuess={guess}
                onColorChange={(nuevoColor) => actualizarColor(i, nuevoColor)}
              />
            </div>
          </div>
        ))}
      </div>

      {guessEnviado ? (
        <button
          className="fase-seleccion__boton fase-seleccion__boton--enviado"
          onClick={onEditar}
        >
          {lista.length > 1
            ? "Colores enviados · Editar"
            : "Color enviado · Editar"}
        </button>
      ) : (
        <button className="fase-seleccion__boton" onClick={onEnviar}>
          {lista.length > 1 ? "Enviar Colores" : "Enviar Color"}
        </button>
      )}
    </div>
  );
}

export default FaseSeleccion;
