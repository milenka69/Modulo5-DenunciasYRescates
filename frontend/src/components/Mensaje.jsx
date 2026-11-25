// Muestra un mensaje de confirmación (tipo="exito") o de error (tipo="error").
// Los estilos están en FormularioRescate.css y siguen el modo claro y oscuro de la app.
// role="alert" hace que los lectores de pantalla avisen de los errores de inmediato.
export default function Mensaje({ tipo, texto, onCerrar }) {
  if (!texto) return null;

  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      className={`mensaje-rescate mensaje-rescate--${tipo}`}
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
