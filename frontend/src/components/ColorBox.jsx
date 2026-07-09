import { memo } from "react";
import "../styles/ColorBox.css";

const FIGURAS_VALIDAS = [
  "blob",
  "circulo",
  "cuadrado",
  "triangulo",
  "diamante",
  "estrella",
];

function ColorBox({ h, s, l, size = 200, className = "", figura = "blob" }) {
  const figuraValida = FIGURAS_VALIDAS.includes(figura) ? figura : "blob";
  const claseFigura =
    figuraValida !== "blob" ? ` color-box--${figuraValida}` : "";

  return (
    <div
      className={`color-box${claseFigura} ${className}`.trim()}
      style={{
        "--color-box-size": `${size}px`,
        backgroundColor: `hsl(${h}, ${s}%, ${l}%)`,
      }}
    />
  );
}

export default memo(ColorBox);
