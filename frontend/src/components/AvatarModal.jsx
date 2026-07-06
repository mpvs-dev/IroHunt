import { AVATARES } from "../constants/avatares";
import AvatarVisual from "./AvatarVisual";
import "../styles/ConfigModal.css";
import "../styles/AvatarModal.css";

function AvatarModal({
  avatarActual,
  jugadores,
  miId,
  onSeleccionar,
  onCerrar,
}) {
  const avataresTomados = new Set(
    jugadores.filter((j) => j.id !== miId && j.avatarId).map((j) => j.avatarId),
  );

  return (
    <div className="config-modal__overlay" onClick={onCerrar}>
      <div className="config-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="config-modal__titulo">Elegí tu avatar</h2>

        <div className="avatar-modal__grid">
          {AVATARES.map(({ id }) => {
            const tomado = avataresTomados.has(id);
            const activo = avatarActual === id;
            return (
              <button
                key={id}
                className={`avatar-modal__opcion${
                  activo ? " avatar-modal__opcion--activo" : ""
                }${tomado ? " avatar-modal__opcion--tomado" : ""}`}
                disabled={tomado}
                onClick={() => {
                  if (tomado) return;
                  onSeleccionar(id);
                  onCerrar();
                }}
                aria-label={id}
                title={tomado ? "Este avatar ya está en uso" : id}
              >
                <AvatarVisual avatarId={id} size={22} color="var(--text-h)" />
              </button>
            );
          })}
        </div>

        <button className="config-modal__cerrar" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default AvatarModal;
