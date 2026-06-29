function ConfigModal({ config, onConfigChange, onCerrar }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ background: "white", padding: 32, borderRadius: 8 }}>
        <h2>Configuración</h2>

        <div>
          <label>Cantidad de rondas: {config.cantidadRondas}</label>
          <input
            type="range"
            min="1"
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

        <div>
          <label>Tiempo mostrar color: {config.tiempoMostrarColor}s</label>
          <input
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

        <div>
          <label>Tiempo selección: {config.tiempoSeleccion}s</label>
          <input
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

        <div>
          <label>Tiempo resultados: {config.tiempoResultados}s</label>
          <input
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

        <button onClick={onCerrar}>Cerrar</button>
      </div>
    </div>
  );
}

export default ConfigModal;
