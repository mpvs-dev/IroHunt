import ColorBox from "./ColorBox";
import ColorSelector from "./ColorSelector";
import "../styles/FaseSeleccion.css";

function FaseSeleccion({
  colorGuess,
  onColorChange,
  onEnviar,
  onEditar,
  guessEnviado,
}) {
  return (
    <div className="fase-seleccion">
      <ColorBox h={colorGuess.h} s={colorGuess.s} l={colorGuess.l} />

      <div
        className={`fase-seleccion__selector${
          guessEnviado ? " fase-seleccion__selector--bloqueado" : ""
        }`}
      >
        <ColorSelector colorGuess={colorGuess} onColorChange={onColorChange} />
      </div>

      {guessEnviado ? (
        <button
          className="fase-seleccion__boton fase-seleccion__boton--enviado"
          onClick={onEditar}
        >
          Color enviado · Editar
        </button>
      ) : (
        <button className="fase-seleccion__boton" onClick={onEnviar}>
          Enviar Color
        </button>
      )}
    </div>
  );
}

export default FaseSeleccion;
