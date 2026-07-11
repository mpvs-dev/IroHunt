import { useCallback, useRef, useState } from "react";

let idCounter = 0;

export function useToasts() {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef({});

    const eliminarToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
    }, []);

    const mostrarToast = useCallback(
        (mensaje, { tipo = "info", duracion = 3500 } = {}) => {
            const id = ++idCounter;
            setToasts((prev) => [...prev, { id, mensaje, tipo }]);
            timersRef.current[id] = setTimeout(() => eliminarToast(id), duracion);
            return id;
        },
        [eliminarToast],
    );

    return { toasts, mostrarToast, eliminarToast };
}