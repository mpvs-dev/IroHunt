function ColorBox({ h, s, l, size = 200 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: `hsl(${h}, ${s}%, ${l}%)`,
      }}
    />
  );
}

export default ColorBox;
