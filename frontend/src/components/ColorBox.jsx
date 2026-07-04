function ColorBox({ h, s, l, size = 200 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: `hsl(${h}, ${s}%, ${l}%)`,
        borderRadius: "45% 55% 60% 40% / 50% 45% 55% 50%",
        border: "2px solid rgba(0,0,0,0.15)",
      }}
    />
  );
}

export default ColorBox;
