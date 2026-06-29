import ColorBox from "./ColorBox";

function FaseMostrando({ color }) {
  return (
    <div>
      <ColorBox h={color.h} s={color.s} l={color.l} />
      <p>Memoriza este color</p>
    </div>
  );
}

export default FaseMostrando;
