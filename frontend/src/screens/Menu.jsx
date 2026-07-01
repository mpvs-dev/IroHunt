// src/screens/Menu.jsx
import { useState } from "react";
import "../styles/Menu.css";

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
    <main className="menu">
      <h1 className="menu__titulo">IroHunt</h1>

      <div className="menu__formulario">
        <div className="menu__seccion">
          <input
            className="menu__input"
            placeholder="Ingrese su nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <button className="menu__boton" onClick={handleCrear}>
            Crear Sala
          </button>
        </div>

        <div className="menu__divisor" />

        <div className="menu__seccion">
          <input
            className="menu__input"
            placeholder="Ingrese el codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
          <button className="menu__boton" onClick={handleUnirse}>
            Unirse
          </button>
        </div>
      </div>
    </main>
  );
}

export default Menu;
