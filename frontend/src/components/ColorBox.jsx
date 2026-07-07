import "../styles/ColorBox.css";

function ColorBox({ h, s, l, size = 200, className = "" }) {
  return (
    <div
      className={`color-box ${className}`.trim()}
      style={{
        "--color-box-size": `${size}px`,
        backgroundColor: `hsl(${h}, ${s}%, ${l}%)`,
      }}
    />
  );
}

export default ColorBox;
