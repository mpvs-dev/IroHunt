export const LIMITES_CONFIG = {
    cantidadRondas: { min: 2, max: 10 },
    tiempoMostrarColor: { min: 1, max: 10 },
    tiempoSeleccion: { min: 5, max: 60 },
    tiempoResultados: { min: 5, max: 20 },
    cantidadColores: { min: 1, max: 3 },
};

export const PRESETS = [
    { nombre: "Fácil", tiempoMostrarColor: 10, tiempoSeleccion: 45, tiempoResultados: 10 },
    { nombre: "Normal", tiempoMostrarColor: 5, tiempoSeleccion: 30, tiempoResultados: 10 },
    { nombre: "Difícil", tiempoMostrarColor: 3, tiempoSeleccion: 15, tiempoResultados: 5 },
];

export const TOGGLES_DISTRACCION = [
    { key: "movimiento", label: "Movimiento" },
    { key: "forma", label: "Formas" },
    { key: "parpadeo", label: "Parpadeo" },
    { key: "atenuarFondo", label: "Fondo" },
];