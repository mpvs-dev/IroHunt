import "../styles/Creditos.css";

function Creditos() {
  return (
    <footer className="creditos">
      <a
        className="creditos__kofi"
        href="https://ko-fi.com/A5N820C8X8"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          height="28"
          style={{
            border: "0px",
            height: "28px",
            borderRadius: 6,
            display: "block",
          }}
          src="https://storage.ko-fi.com/cdn/kofi3.png?v=6"
          alt="Buy Me a Coffee at ko-fi.com"
        />
      </a>

      <span className="creditos__separador" />
      <a
        className="creditos__mpvs"
        href="https://www.mpvs.online/"
        target="_blank"
        rel="noreferrer"
      >
        © 2026 MPVs
      </a>
    </footer>
  );
}

export default Creditos;
