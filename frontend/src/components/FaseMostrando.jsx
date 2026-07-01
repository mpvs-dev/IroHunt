import ColorBox from "./ColorBox";
import "../styles/FaseMostrando.css";

function FaseMostrando({ color }) {
  return (
    <div className="fase-mostrando">
      <ColorBox h={color.h} s={color.s} l={color.l} />
      <p className="fase-mostrando__texto">Memoriza este color</p>
    </div>
  );
}

export default FaseMostrando;