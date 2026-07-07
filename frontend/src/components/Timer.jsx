// Timer.jsx
import { useEffect, useRef, useState } from "react";
import "../styles/Timer.css";

function Timer({ duracion, segundosRestantes }) {
  const [porcentajeSuave, setPorcentajeSuave] = useState(100);
  const referenciaRef = useRef({
    inicio: Date.now(),
    restanteInicial: segundosRestantes,
  });
  const rafRef = useRef(null);

  // Cada vez que llega un tick del servidor, resincronizamos el punto de referencia
  useEffect(() => {
    referenciaRef.current = {
      inicio: Date.now(),
      restanteInicial: segundosRestantes,
    };
  }, [segundosRestantes]);

  useEffect(() => {
    if (!duracion) return;

    const animar = () => {
      const { inicio, restanteInicial } = referenciaRef.current;
      const transcurridoMs = Date.now() - inicio;
      const restanteSuave = Math.max(
        0,
        restanteInicial - transcurridoMs / 1000,
      );
      const pct = Math.min(100, Math.max(0, (restanteSuave / duracion) * 100));
      setPorcentajeSuave(pct);
      rafRef.current = requestAnimationFrame(animar);
    };

    rafRef.current = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(rafRef.current);
  }, [duracion]);

  if (!duracion) return null;

  const enUrgencia = segundosRestantes <= 3;

  return (
    <div className={`timer ${enUrgencia ? "timer--urgente" : ""}`}>
      <span className="timer__segundos">{segundosRestantes}s</span>
      <div className="timer__barra">
        <div
          className="timer__progreso"
          style={{ width: `${porcentajeSuave}%` }}
        />
      </div>
    </div>
  );
}

export default Timer;
