import "../styles/CuentaAtras.css";

function CuentaAtras({ numero, sala }) {
  return (
    <div className="cuenta-atras">
      {sala && <span className="cuenta-atras__codigo">({sala})</span>}
      <span className="cuenta-atras__numero" key={numero}>
        {numero}
      </span>
      <p className="cuenta-atras__texto">Preparate para memorizar...</p>
    </div>
  );
}

export default CuentaAtras;
