// Muestra un mensaje de confirmación (tipo="exito") o de error (tipo="error").
// role="alert" hace que los lectores de pantalla avisen de los errores de inmediato.
const ESTILOS = {
  exito: { background: "#dff6e0", color: "#17481c", border: "1px solid #9fd3a4" },
  error: { background: "#fde2e2", color: "#7a1010", border: "1px solid #e4a0a0" },
};

export default function Mensaje({ tipo, texto, onCerrar }) {
  if (!texto) return null;

  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      style={{
        ...ESTILOS[tipo],
        padding: "0.75rem 1rem",
        borderRadius: 6,
        marginTop: "1rem",
        display: "flex",
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      <span>{texto}</span>
      {onCerrar && (
        <button type="button" onClick={onCerrar} aria-label="Cerrar mensaje">
          ×
        </button>
      )}
    </div>
  );
}
