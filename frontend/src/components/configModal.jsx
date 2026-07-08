import "../styles/ConfigModal.css";
import {
  LIMITES_CONFIG,
  PRESETS,
  TOGGLES_DISTRACCION,
} from "../constants/configJuego";

function esPresetActivo(config, preset) {
  return (
    config.tiempoMostrarColor === preset.tiempoMostrarColor &&
    config.tiempoSeleccion === preset.tiempoSeleccion &&
    config.tiempoResultados === preset.tiempoResultados
  );
}

function ConfigModal({ config, onConfigChange, onCerrar }) {
  const aplicarPreset = (preset) => {
    onConfigChange({
      ...config,
      tiempoMostrarColor: preset.tiempoMostrarColor,
      tiempoSeleccion: preset.tiempoSeleccion,
      tiempoResultados: preset.tiempoResultados,
    });
  };

  return (
    <div className="config-modal__overlay">
      <div className="config-modal">
        <h2 className="config-modal__titulo">Configuración</h2>

        <div className="config-modal__presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.nombre}
              className={`config-modal__preset${
                esPresetActivo(config, preset)
                  ? " config-modal__preset--activo"
                  : ""
              }`}
              onClick={() => aplicarPreset(preset)}
            >
              {preset.nombre}
            </button>
          ))}
        </div>

        <div className="config-modal__campo">
          <label className="config-modal__label">Distracciones</label>
          <div className="config-modal__toggles">
            {TOGGLES_DISTRACCION.map(({ key, label }) => (
              <div key={key} className="config-modal__toggle-fila">
                <span className="config-modal__toggle-label">{label}</span>
                <button
                  type="button"
                  className={`config-modal__toggle${
                    config.distracciones?.[key]
                      ? " config-modal__toggle--activo"
                      : ""
                  }`}
                  aria-pressed={!!config.distracciones?.[key]}
                  onClick={() =>
                    onConfigChange({
                      ...config,
                      distracciones: {
                        ...config.distracciones,
                        [key]: !config.distracciones?.[key],
                      },
                    })
                  }
                >
                  <span className="config-modal__toggle-thumb" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="config-modal__campo">
          <label className="config-modal__label">
            Cantidad de rondas
            <span className="config-modal__valor">{config.cantidadRondas}</span>
          </label>
          <input
            className="config-modal__slider"
            type="range"
            min={LIMITES_CONFIG.cantidadRondas.min}
            max={LIMITES_CONFIG.cantidadRondas.max}
            value={config.cantidadRondas}
            onChange={(e) =>
              onConfigChange({
                ...config,
                cantidadRondas: Number(e.target.value),
              })
            }
          />
        </div>

        <div className="config-modal__campo">
          <label className="config-modal__label">
            Colores a memorizar
            <span className="config-modal__valor">
              {config.cantidadColores}
            </span>
          </label>
          <input
            className="config-modal__slider"
            type="range"
            min={LIMITES_CONFIG.cantidadColores.min}
            max={LIMITES_CONFIG.cantidadColores.max}
            value={config.cantidadColores}
            onChange={(e) =>
              onConfigChange({
                ...config,
                cantidadColores: Number(e.target.value),
              })
            }
          />
        </div>

        <div className="config-modal__campo">
          <label className="config-modal__label">
            Tiempo mostrar color
            <span className="config-modal__valor">
              {config.tiempoMostrarColor}s
            </span>
          </label>
          <input
            className="config-modal__slider"
            type="range"
            min={LIMITES_CONFIG.tiempoMostrarColor.min}
            max={LIMITES_CONFIG.tiempoMostrarColor.max}
            value={config.tiempoMostrarColor}
            onChange={(e) =>
              onConfigChange({
                ...config,
                tiempoMostrarColor: Number(e.target.value),
              })
            }
          />
        </div>

        <div className="config-modal__campo">
          <label className="config-modal__label">
            Tiempo selección
            <span className="config-modal__valor">
              {config.tiempoSeleccion}s
            </span>
          </label>
          <input
            className="config-modal__slider"
            type="range"
            min={LIMITES_CONFIG.tiempoSeleccion.min}
            max={LIMITES_CONFIG.tiempoSeleccion.max}
            value={config.tiempoSeleccion}
            onChange={(e) =>
              onConfigChange({
                ...config,
                tiempoSeleccion: Number(e.target.value),
              })
            }
          />
        </div>

        <div className="config-modal__campo">
          <label className="config-modal__label">
            Tiempo resultados
            <span className="config-modal__valor">
              {config.tiempoResultados}s
            </span>
          </label>
          <input
            className="config-modal__slider"
            type="range"
            min={LIMITES_CONFIG.tiempoResultados.min}
            max={LIMITES_CONFIG.tiempoResultados.max}
            value={config.tiempoResultados}
            onChange={(e) =>
              onConfigChange({
                ...config,
                tiempoResultados: Number(e.target.value),
              })
            }
          />
        </div>

        <button className="config-modal__cerrar" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default ConfigModal;
