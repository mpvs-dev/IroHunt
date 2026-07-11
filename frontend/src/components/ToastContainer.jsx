import "../styles/Toast.css";

function ToastContainer({ toasts, onCerrar }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tipo}`} role="alert">
          <span className="toast__mensaje">{t.mensaje}</span>
          <button
            className="toast__cerrar"
            onClick={() => onCerrar(t.id)}
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
