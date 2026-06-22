import { useEffect, useState } from "react";

function Menu({ onCrearSala, onUnirseSala }) {
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");

  const handleCrear = () => {
    if (!nombre.trim()) return;
    onCrearSala(nombre.trim());
  };

  const handleUnirse = () => {
    if (!nombre.trim() || !codigo.trim()) return;
    onUnirseSala(codigo.toUpperCase().trim(), nombre.trim());
  };

  return (
    <div>
      <h1>IroHunt</h1>

      <input
        placeholder="Tu nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />

      <button onClick={handleCrear}>Crear sala</button>

      <input
        placeholder="Codigo de sala"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
      />

      <button onClick={handleUnirse}>Unirse</button>
    </div>
  );
}

export default Menu;
