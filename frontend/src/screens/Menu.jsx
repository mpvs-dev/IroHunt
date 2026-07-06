import { useState } from "react";
import "../styles/Menu.css";

const NOMBRE_REGEX = /^[a-zA-ZÀ-ÿ0-9\s]+$/;
const CODIGO_REGEX = /^[A-Z0-9]{6}$/;

function validarNombre(nombre) {
  const limpio = nombre.trim();
  if (!limpio) return "Ingresa tu nombre";
  if (limpio.length < 2) return "Mínimo 2 caracteres";
  if (limpio.length > 20) return "Máximo 20 caracteres";
  if (!NOMBRE_REGEX.test(limpio)) return "Solo letras, números y espacios";
  return null;
}

function validarCodigo(codigo) {
  const limpio = codigo.trim().toUpperCase();
  if (!limpio) return "Ingresa el código";
  if (!CODIGO_REGEX.test(limpio))
    return "El código tiene 6 caracteres (letras y números)";
  return null;
}

function Menu({ onCrearSala, onUnirseSala }) {
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [tocado, setTocado] = useState({ nombre: false, codigo: false });

  const errorNombre = validarNombre(nombre);
  const errorCodigo = validarCodigo(codigo);

  const marcarTocado = (campo) =>
    setTocado((prev) => ({ ...prev, [campo]: true }));

  const handleCrear = () => {
    marcarTocado("nombre");
    if (errorNombre) return;
    onCrearSala(nombre.trim());
  };

  const handleUnirse = () => {
    setTocado({ nombre: true, codigo: true });
    if (errorNombre || errorCodigo) return;
    onUnirseSala(codigo.toUpperCase().trim(), nombre.trim());
  };

  return (
    <>
      <main className="menu">
        <div className="menu__hero">
          <h1 className="menu__titulo">IroHunt</h1>
          <span className="menu__titulo-rule" />
        </div>

        <div className="menu__formulario">
          <div className="menu__seccion">
            <span className="menu__seccion-label">Partida nueva</span>
            <input
              className="menu__input"
              placeholder="Ingrese su nombre"
              value={nombre}
              maxLength={20}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={() => marcarTocado("nombre")}
            />
            {tocado.nombre && errorNombre && (
              <span className="menu__error">{errorNombre}</span>
            )}
            <button
              className="menu__boton"
              onClick={handleCrear}
              disabled={!!errorNombre}
            >
              Crear Sala
            </button>
          </div>

          <div className="menu__divisor" />

          <div className="menu__seccion">
            <span className="menu__seccion-label">Ya tengo un código</span>
            <input
              className="menu__input"
              placeholder="Ingrese el codigo"
              value={codigo}
              maxLength={6}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              onBlur={() => marcarTocado("codigo")}
            />
            {tocado.codigo && errorCodigo && (
              <span className="menu__error">{errorCodigo}</span>
            )}
            <button
              className="menu__boton"
              onClick={handleUnirse}
              disabled={!!errorNombre || !!errorCodigo}
            >
              Unirse
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

export default Menu;
