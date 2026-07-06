import "../styles/ConfigModal.css";

const PRESETS = [
  {
    nombre: "Fácil",
    tiempoMostrarColor: 10,
    tiempoSeleccion: 45,
    tiempoResultados: 10,
  },
  {
    nombre: "Normal",
    tiempoMostrarColor: 5,
    tiempoSeleccion: 30,
    tiempoResultados: 10,
  },
  {
    nombre: "Difícil",
    tiempoMostrarColor: 3,
    tiempoSeleccion: 15,
    tiempoResultados: 5,
  },
];

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
          <label className="config-modal__label">
            Cantidad de rondas
            <span className="config-modal__valor">{config.cantidadRondas}</span>
          </label>
          <input
            className="config-modal__slider"
            type="range"
            min="2"
            max="10"
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
            Tiempo mostrar color
            <span className="config-modal__valor">
              {config.tiempoMostrarColor}s
            </span>
          </label>
          <input
            className="config-modal__slider"
            type="range"
            min="3"
            max="15"
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
            min="10"
            max="60"
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
            min="5"
            max="20"
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
