import { useState, useEffect } from "react";
import ColorBox from "./ColorBox";
import "../styles/FaseMostrando.css";
import {
  INTERVALO_CAMBIO_FORMA,
  INTERVALO_PARPADEO,
  INTERVALO_JITTER,
  RANGO_JITTER_PX,
  FIGURAS_DISTRACCION,
  EFECTOS_MOVIMIENTO,
  DURACION_ROTACION,
  DURACION_PULSO,
} from "../constants/distracciones";

function FaseMostrando({ color, distracciones, rondaActual }) {
  const [figura, setFigura] = useState("blob");
  const [colorVisible, setColorVisible] = useState(true);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const movimientoActivo = !!distracciones?.movimiento;
  const formaActiva = !!distracciones?.forma;
  const parpadeoActivo = !!distracciones?.parpadeo;

  const efectoRonda =
    EFECTOS_MOVIMIENTO[((rondaActual ?? 1) - 1) % EFECTOS_MOVIMIENTO.length];

  useEffect(() => {
    if (!formaActiva) {
      setFigura("blob");
      return;
    }
    const i = setInterval(() => {
      setFigura(
        FIGURAS_DISTRACCION[
          Math.floor(Math.random() * FIGURAS_DISTRACCION.length)
        ],
      );
    }, INTERVALO_CAMBIO_FORMA);
    return () => clearInterval(i);
  }, [formaActiva]);

  useEffect(() => {
    if (!parpadeoActivo) {
      setColorVisible(true);
      return;
    }
    const i = setInterval(() => setColorVisible((v) => !v), INTERVALO_PARPADEO);
    return () => clearInterval(i);
  }, [parpadeoActivo]);

  useEffect(() => {
    if (!movimientoActivo || efectoRonda !== "jitter") {
      setOffset({ x: 0, y: 0 });
      return;
    }
    const i = setInterval(() => {
      setOffset({
        x: (Math.random() - 0.5) * RANGO_JITTER_PX,
        y: (Math.random() - 0.5) * RANGO_JITTER_PX,
      });
    }, INTERVALO_JITTER);
    return () => clearInterval(i);
  }, [movimientoActivo, efectoRonda]);

  const colorMostrado =
    parpadeoActivo && !colorVisible ? { h: 0, s: 0, l: 0 } : color;

  const claseMovimiento =
    movimientoActivo && efectoRonda !== "jitter"
      ? ` fase-mostrando__caja--${efectoRonda}`
      : "";

  return (
    <div className="fase-mostrando">
      <div
        className={`fase-mostrando__caja${claseMovimiento}`}
        style={{
          ...(movimientoActivo && efectoRonda === "jitter"
            ? { transform: `translate(${offset.x}px, ${offset.y}px)` }
            : {}),
          "--duracion-rotacion": `${DURACION_ROTACION}ms`,
          "--duracion-pulso": `${DURACION_PULSO}ms`,
        }}
      >
        <ColorBox
          h={colorMostrado.h}
          s={colorMostrado.s}
          l={colorMostrado.l}
          figura={formaActiva ? figura : "blob"}
        />
      </div>
      <p className="fase-mostrando__texto">Memoriza este color</p>
    </div>
  );
}

export default FaseMostrando;
