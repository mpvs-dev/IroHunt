import "../styles/Fondo.css";

function Fondo({ atenuado = false }) {
  return (
    <div
      className={`fondo${atenuado ? " fondo--atenuado" : ""}`}
      aria-hidden="true"
    >
      <span className="fondo__blob fondo__blob--1" />
      <span className="fondo__blob fondo__blob--2" />
      <span className="fondo__blob fondo__blob--3" />
      <span className="fondo__blob fondo__blob--4" />
      <span className="fondo__blob fondo__blob--5" />
      <span className="fondo__blob fondo__blob--6" />
    </div>
  );
}

export default Fondo;
