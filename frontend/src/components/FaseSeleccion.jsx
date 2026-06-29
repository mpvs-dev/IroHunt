import ColorBox from "./ColorBox";

function FaseSeleccion({ colorGuess, onColorChange, onEnviar, guessEnviado }) {
  return (
    <div>
      <p>Selecciona el color que viste</p>

      <ColorBox h={colorGuess.h} s={colorGuess.s} l={colorGuess.l} />

      <div>
        <label>Tono: {colorGuess.h}°</label>
        <input
          type="range"
          min="0"
          max="360"
          value={colorGuess.h}
          onChange={(e) =>
            onColorChange({ ...colorGuess, h: Number(e.target.value) })
          }
        />
      </div>
      <div>
        <label>Saturación: {colorGuess.s}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={colorGuess.s}
          onChange={(e) =>
            onColorChange({ ...colorGuess, s: Number(e.target.value) })
          }
        />
      </div>
      <div>
        <label>Luminosidad: {colorGuess.l}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={colorGuess.l}
          onChange={(e) =>
            onColorChange({ ...colorGuess, l: Number(e.target.value) })
          }
        />
      </div>

      <button onClick={onEnviar} disabled={guessEnviado}>
        {guessEnviado ? "Color enviado" : "Enviar color"}
      </button>
    </div>
  );
}

export default FaseSeleccion;
