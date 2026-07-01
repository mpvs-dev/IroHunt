import "../styles/ColorSelector.css";

function ColorSelector({ colorGuess, onColorChange }) {
  const { h, s, l } = colorGuess;

  const fondoTono = `linear-gradient(to right,
    hsl(0,100%,50%), hsl(30,100%,50%), hsl(60,100%,50%),
    hsl(90,100%,50%), hsl(120,100%,50%), hsl(150,100%,50%),
    hsl(180,100%,50%), hsl(210,100%,50%), hsl(240,100%,50%),
    hsl(270,100%,50%), hsl(300,100%,50%), hsl(330,100%,50%),
    hsl(360,100%,50%))`;

  const fondoSaturacion = `linear-gradient(to right,
    hsl(${h},0%,${l}%),
    hsl(${h},100%,${l}%))`;

  const fondoLuminosidad = `linear-gradient(to right,
    hsl(${h},${s}%,0%),
    hsl(${h},${s}%,50%),
    hsl(${h},${s}%,100%))`;

  return (
    <div className="color-selector">
      <SliderColor
        label="Tono"
        valor={h}
        min={0}
        max={360}
        fondo={fondoTono}
        onChange={(v) => onColorChange({ ...colorGuess, h: v })}
      />
      <SliderColor
        label="Saturación"
        valor={s}
        min={0}
        max={100}
        fondo={fondoSaturacion}
        onChange={(v) => onColorChange({ ...colorGuess, s: v })}
      />
      <SliderColor
        label="Luminosidad"
        valor={l}
        min={0}
        max={100}
        fondo={fondoLuminosidad}
        onChange={(v) => onColorChange({ ...colorGuess, l: v })}
      />
    </div>
  );
}

function SliderColor({ valor, min, max, fondo, onChange }) {
  return (
    <div className="slider-color">
      <div className="slider-color__pista" style={{ background: fondo }}>
        <input
          className="slider-color__input"
          type="range"
          min={min}
          max={max}
          value={valor}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

export default ColorSelector;
