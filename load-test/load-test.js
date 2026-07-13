const { io } = require("socket.io-client");

// ---------- Argumentos ----------
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    args[key] = value;
  });
  return args;
}

const argv = parseArgs();
const SERVER_URL = argv.url || "http://localhost:3001";
const NUM_SALAS = parseInt(argv.salas || "10", 10);
const JUGADORES_POR_SALA = parseInt(argv.jugadores || "4", 10);
const JUEGOS_A_COMPLETAR = parseInt(argv.juegos || "1", 10);

// Config rápida para acelerar el ciclo de pruebas (usa los mínimos válidos
// que el backend ya clampea, ver validarConfig en server.js)
const CONFIG_RAPIDA = {
  cantidadRondas: 2,
  tiempoMostrarColor: 1,
  tiempoSeleccion: 5,
  tiempoResultados: 5,
  cantidadColores: 1,
  distracciones: {
    movimiento: false,
    forma: false,
    parpadeo: false,
    atenuarFondo: false,
  },
};

// ---------- Métricas globales ----------
const metricas = {
  salasCreadas: 0,
  salasFallidas: 0,
  jugadoresConectados: 0,
  errores: [],
  rtts: [],
  ticksRecibidos: 0,
  ticksConJitterAlto: 0,
  partidasFinalizadas: 0,
};

const UMBRAL_JITTER_MS = 200; // desvío del 1000ms esperado que consideramos "problema"

function registrarError(contexto, err) {
  metricas.errores.push({ contexto, err: String(err), ts: Date.now() });
}

// ---------- Un jugador simulado ----------
function crearJugador({ esCreador, nombre, codigoSala, onListo }) {
  const socket = io(SERVER_URL, {
    reconnection: false,
  });

  let ultimoTickTs = null;

  socket.on("connect", () => {
    metricas.jugadoresConectados++;
    if (esCreador) {
      socket.emit("crearSala", nombre);
    } else {
      socket.emit("unirseSala", { codigo: codigoSala, nombre });
    }
  });

  socket.on("connect_error", (err) => {
    registrarError(`connect_error (${nombre})`, err.message);
    console.error(`❌ [${nombre}] No se pudo conectar: ${err.message}`);
  });
  socket.on("error", (data) => {
    registrarError(`error-servidor (${nombre})`, data?.mensaje);
    console.error(`❌ [${nombre}] Error del servidor: ${data?.mensaje}`);
  });

  // RTT real usando el endpoint que ya expone el servidor
  const intervaloRtt = setInterval(() => {
    if (!socket.connected) return;
    const t0 = Date.now();
    socket.emit("sincronizarReloj", t0, () => {
      metricas.rtts.push(Date.now() - t0);
    });
  }, 5000);

  function medirJitterTick() {
    const ahora = Date.now();
    metricas.ticksRecibidos++;
    if (ultimoTickTs !== null) {
      const delta = ahora - ultimoTickTs;
      const jitter = Math.abs(delta - 1000);
      if (jitter > UMBRAL_JITTER_MS) metricas.ticksConJitterAlto++;
    }
    ultimoTickTs = ahora;
  }

  socket.on("tick", medirJitterTick);
  socket.on("cuentaAtras", medirJitterTick);

  // Al arrancar una fase nueva hay un salto intencional (MARGEN_FIN_FASE = 700ms
  // de gracia en el servidor) que no refleja un problema de rendimiento.
  // Reseteamos la referencia acá para medir jitter solo DENTRO de cada fase,
  // no en la transición entre fases.
  const resetearReferenciaTick = () => {
    ultimoTickTs = null;
  };
  socket.on("faseMostrando", resetearReferenciaTick);
  socket.on("faseSeleccion", resetearReferenciaTick);
  socket.on("faseResultados", resetearReferenciaTick);

  socket.on("salaCreada", (data) => {
    console.log(`✅ Sala creada: ${data.codigo} (por ${nombre})`);
    onListo?.(data.codigo, socket);
  });
  socket.on("salaUnida", (data) => {
    console.log(`✅ ${nombre} se unió a la sala ${data.codigo}`);
    onListo?.(data.codigo, socket);
  });

  // Durante selección, simula un jugador real: espera un poco y manda un guess
  socket.on("faseSeleccion", () => {
    const demora = 500 + Math.random() * 2000;
    setTimeout(() => {
      if (!socket.connected) return;
      socket.emit("enviarGuess", [{ h: Math.random() * 360, s: 50, l: 50 }]);
    }, demora);
  });

  socket.on("partidaFinalizada", () => {
    metricas.partidasFinalizadas++;
  });

  socket.on("disconnect", () => clearInterval(intervaloRtt));

  return socket;
}

// ---------- Orquestación de una sala completa ----------
function crearSalaDePrueba(indiceSala) {
  return new Promise((resolve) => {
    const sockets = [];
    const nombreCreador = `bot${indiceSala}p0`;

    const creador = crearJugador({
      esCreador: true,
      nombre: nombreCreador,
      onListo: (codigo) => {
        metricas.salasCreadas++;
        sockets.push(creador);

        const totalInvitados = JUGADORES_POR_SALA - 1;

        if (totalInvitados <= 0) {
          iniciarPartidaDePrueba(creador, codigo);
          resolve(sockets);
          return;
        }

        let unidos = 0;
        for (let i = 1; i < JUGADORES_POR_SALA; i++) {
          const jugador = crearJugador({
            esCreador: false,
            nombre: `bot${indiceSala}p${i}`,
            codigoSala: codigo,
            onListo: () => {
              unidos++;
              if (unidos === totalInvitados) {
                iniciarPartidaDePrueba(creador, codigo);
                resolve(sockets);
              }
            },
          });
          sockets.push(jugador);
        }
      },
    });

    // Timeout de seguridad: si la sala no se arma en 10s, se marca como fallida
    setTimeout(() => {
      if (metricas.salasCreadas <= indiceSala) {
        metricas.salasFallidas++;
      }
    }, 10000);
  });
}

function iniciarPartidaDePrueba(socketCreador, codigo) {
  setTimeout(() => {
    if (!socketCreador.connected) return;
    socketCreador.emit("iniciarPartida", { codigo, config: CONFIG_RAPIDA });
  }, 500);
}

// ---------- Reporte final ----------
function imprimirReporte(duracionTotalMs) {
  const rttOrdenados = [...metricas.rtts].sort((a, b) => a - b);
  const avgRtt = rttOrdenados.length
    ? rttOrdenados.reduce((a, b) => a + b, 0) / rttOrdenados.length
    : 0;
  const p95Rtt = rttOrdenados.length
    ? rttOrdenados[Math.floor(rttOrdenados.length * 0.95)]
    : 0;

  console.log("\n========== REPORTE DE CARGA ==========");
  console.log(`Servidor:                 ${SERVER_URL}`);
  console.log(`Salas objetivo:           ${NUM_SALAS}`);
  console.log(`Jugadores por sala:       ${JUGADORES_POR_SALA}`);
  console.log(`Duración del test:        ${(duracionTotalMs / 1000).toFixed(1)}s`);
  console.log("---------------------------------------");
  console.log(`Salas creadas OK:         ${metricas.salasCreadas}/${NUM_SALAS}`);
  console.log(`Salas fallidas:           ${metricas.salasFallidas}`);
  console.log(`Jugadores conectados:     ${metricas.jugadoresConectados}`);
  console.log(`Partidas finalizadas:     ${metricas.partidasFinalizadas}`);
  console.log("---------------------------------------");
  console.log(`RTT promedio:             ${avgRtt.toFixed(0)} ms`);
  console.log(`RTT p95:                  ${p95Rtt} ms`);
  console.log(`Ticks recibidos:          ${metricas.ticksRecibidos}`);
  console.log(
    `Ticks con jitter > ${UMBRAL_JITTER_MS}ms:  ${metricas.ticksConJitterAlto} ` +
      `(${((metricas.ticksConJitterAlto / Math.max(1, metricas.ticksRecibidos)) * 100).toFixed(1)}%)`
  );
  console.log(`Errores registrados:      ${metricas.errores.length}`);
  if (metricas.errores.length > 0) {
    console.log("Primeros 5 errores:");
    metricas.errores
      .slice(0, 5)
      .forEach((e) => console.log(`  - [${e.contexto}] ${e.err}`));
  }
  console.log("========================================\n");

  const jitterPct = metricas.ticksConJitterAlto / Math.max(1, metricas.ticksRecibidos);
  if (metricas.salasFallidas > 0 || jitterPct > 0.15 || p95Rtt > 1000) {
    console.log("⚠️  Señales de saturación detectadas con esta carga.");
  } else {
    console.log("✅ El servidor manejó esta carga sin señales claras de saturación.");
  }
}

// ---------- Main ----------
async function main() {
  console.log(
    `Iniciando prueba: ${NUM_SALAS} salas x ${JUGADORES_POR_SALA} jugadores en ${SERVER_URL}`
  );
  const inicio = Date.now();

  const promesas = [];
  for (let i = 0; i < NUM_SALAS; i++) {
    // Escalonado leve para no golpear el servidor con N "crearSala" en el mismo ms
    await new Promise((r) => setTimeout(r, 50));
    promesas.push(crearSalaDePrueba(i));
  }

  await Promise.all(promesas);
  console.log("Todas las salas fueron lanzadas. Esperando a que terminen las partidas...");

  const objetivoPartidasFinalizadas = NUM_SALAS * JUGADORES_POR_SALA * JUEGOS_A_COMPLETAR;
  const TIMEOUT_MAXIMO_MS = 5 * 60 * 1000; // 5 minutos de tope
  const inicioEspera = Date.now();
  let ultimoReporteProgreso = 0;

  while (
    metricas.partidasFinalizadas < objetivoPartidasFinalizadas &&
    Date.now() - inicioEspera < TIMEOUT_MAXIMO_MS
  ) {
    await new Promise((r) => setTimeout(r, 1000));

    // Progreso cada 10s para no quedar "a ciegas"
    if (Date.now() - ultimoReporteProgreso > 10000) {
      ultimoReporteProgreso = Date.now();
      console.log(
        `… progreso: ${metricas.salasCreadas}/${NUM_SALAS} salas creadas, ` +
          `${metricas.partidasFinalizadas}/${objetivoPartidasFinalizadas} confirmaciones de fin de partida, ` +
          `${metricas.errores.length} errores`
      );
    }
  }

  if (metricas.partidasFinalizadas < objetivoPartidasFinalizadas) {
    console.warn(
      "\n⚠️  Se alcanzó el timeout máximo de 5 minutos sin que todas las partidas terminaran."
    );
  }

  imprimirReporte(Date.now() - inicio);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error fatal en el script de carga:", err);
  process.exit(1);
});