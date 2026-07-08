import "../styles/CuentaAtras.css";

function CuentaAtras({ numero, sala }) {
  return (
    <div className="cuenta-atras">
      <header className="cuenta-atras__header">
        <h1 className="cuenta-atras__titulo">IroHunt</h1>
        {sala && <span className="cuenta-atras__codigo">({sala})</span>}
      </header>

      <div className="cuenta-atras__contenido">
        <span className="cuenta-atras__numero" key={numero}>
          {numero}
        </span>
        <p className="cuenta-atras__texto">Preparate para memorizar...</p>
      </div>
    </div>
  );
}

export default CuentaAtras;
