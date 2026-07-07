import "../styles/Timer.css";

function Timer({ duracion, segundosRestantes }) {
  if (!duracion) return null;

  const porcentaje = Math.min(
    100,
    Math.max(0, (segundosRestantes / duracion) * 100),
  );
  const enUrgencia = segundosRestantes <= 3;

  return (
    <div className={`timer ${enUrgencia ? "timer--urgente" : ""}`}>
      <span className="timer__segundos">{segundosRestantes}s</span>
      <div className="timer__barra">
        <div className="timer__progreso" style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  );
}

export default Timer;
