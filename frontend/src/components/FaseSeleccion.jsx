import ColorBox from "./ColorBox";
import ColorSelector from "./ColorSelector";
import "../styles/FaseSeleccion.css";

function FaseSeleccion({ colorGuess, onColorChange, onEnviar, guessEnviado }) {
  return (
    <div className="fase-seleccion">
      <ColorBox h={colorGuess.h} s={colorGuess.s} l={colorGuess.l} />
      <ColorSelector colorGuess={colorGuess} onColorChange={onColorChange} />
      <button
        className="fase-seleccion__boton"
        onClick={onEnviar}
        disabled={guessEnviado}
      >
        {guessEnviado ? "Color enviado" : "Enviar Color"}
      </button>
    </div>
  );
}

export default FaseSeleccion;
