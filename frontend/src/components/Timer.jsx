import useCountdown from "../hooks/useCountdown";
import "../styles/Timer.css";

/**
 * @param {number} duracion - Duración total en segundos.
 * @param {string|number} resetKey - Clave que reinicia el timer al cambiar.
 */
function Timer({ duracion, resetKey }) {
  const segundosRestantes = useCountdown(duracion, resetKey);

  if (!duracion) return null;

  const porcentaje = (segundosRestantes / duracion) * 100;
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
