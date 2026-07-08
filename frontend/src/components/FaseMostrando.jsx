import { useState, useEffect } from "react";
import ColorBox from "./ColorBox";
import "../styles/FaseMostrando.css";
import {
  INTERVALO_CAMBIO_FORMA,
  INTERVALO_PARPADEO,
  INTERVALO_JITTER,
  RANGO_JITTER_PX,
  DURACION_ROTACION,
  DURACION_PULSO,
  FIGURAS_DISTRACCION,
  EFECTOS_MOVIMIENTO,
} from "../constants/distracciones";

function FaseMostrando({ colores, distracciones, rondaActual }) {
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
    const intervalo = setInterval(() => {
      setFigura(
        FIGURAS_DISTRACCION[
          Math.floor(Math.random() * FIGURAS_DISTRACCION.length)
        ],
      );
    }, INTERVALO_CAMBIO_FORMA);
    return () => clearInterval(intervalo);
  }, [formaActiva]);

  useEffect(() => {
    if (!parpadeoActivo) {
      setColorVisible(true);
      return;
    }
    const intervalo = setInterval(
      () => setColorVisible((v) => !v),
      INTERVALO_PARPADEO,
    );
    return () => clearInterval(intervalo);
  }, [parpadeoActivo]);

  useEffect(() => {
    if (!movimientoActivo || efectoRonda !== "jitter") {
      setOffset({ x: 0, y: 0 });
      return;
    }
    const intervalo = setInterval(() => {
      setOffset({
        x: (Math.random() - 0.5) * RANGO_JITTER_PX,
        y: (Math.random() - 0.5) * RANGO_JITTER_PX,
      });
    }, INTERVALO_JITTER);
    return () => clearInterval(intervalo);
  }, [movimientoActivo, efectoRonda]);

  const claseMovimiento =
    movimientoActivo && efectoRonda !== "jitter"
      ? ` fase-mostrando__caja--${efectoRonda}`
      : "";

  const estiloMovimiento = {
    ...(movimientoActivo && efectoRonda === "jitter"
      ? { transform: `translate(${offset.x}px, ${offset.y}px)` }
      : {}),
    "--duracion-rotacion": `${DURACION_ROTACION}ms`,
    "--duracion-pulso": `${DURACION_PULSO}ms`,
  };

  const listaColores = colores ?? [];
  const cantidadColores = listaColores.length;

  if (cantidadColores === 0) return null;

  return (
    <div className="fase-mostrando">
      <div className="fase-mostrando__grid">
        {listaColores.map((color, i) => {
          const colorMostrado =
            parpadeoActivo && !colorVisible ? { h: 0, s: 0, l: 0 } : color;

          return (
            <div key={i} className="fase-mostrando__item">
              {cantidadColores > 1 && (
                <span className="fase-mostrando__numero">{i + 1}</span>
              )}
              <div
                className={`fase-mostrando__caja${claseMovimiento}`}
                style={estiloMovimiento}
              >
                <ColorBox
                  h={colorMostrado.h}
                  s={colorMostrado.s}
                  l={colorMostrado.l}
                  size={cantidadColores > 1 ? 130 : 200}
                  figura={formaActiva ? figura : "blob"}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="fase-mostrando__texto">
        {cantidadColores > 1
          ? `Memoriza estos ${cantidadColores} colores`
          : "Memoriza este color"}
      </p>
    </div>
  );
}

export default FaseMostrando;
