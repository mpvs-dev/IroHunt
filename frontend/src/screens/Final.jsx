function Final({ resultados, onJugarDeNuevo }) {
  return (
    <div>
      <h1>Resultados finales</h1>

      {resultados.map((j, index) => (
        <div key={j.id}>
          <p>
            #{index + 1} {j.nombre}
          </p>
          <p>{j.puntajeTotal} pts</p>
        </div>
      ))}

      <button onClick={onJugarDeNuevo}>Jugar de nuevo</button>
    </div>
  );
}

export default Final;
