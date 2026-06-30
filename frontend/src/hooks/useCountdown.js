import { useEffect, useState } from "react";

/**
 * @param {number} duracion - Duración total en segundos.
 * @param {string|number} resetKey - Valor que, al cambiar, reinicia el timer (ej: fase + ronda).
 * @returns {number} segundosRestantes
 */
function useCountdown(duracion, resetKey) {
    const [segundosRestantes, setSegundosRestantes] = useState(duracion);

    useEffect(() => {
        setSegundosRestantes(duracion);

        if (!duracion) return;

        const intervalo = setInterval(() => {
            setSegundosRestantes((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(intervalo);
    }, [duracion, resetKey]);

    return segundosRestantes;
}

export default useCountdown;