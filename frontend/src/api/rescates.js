// Error que lanza la API cuando responde con un código de error.
// Guarda el código del contrato (por ejemplo "equipo_no_disponible") y el status HTTP.
export class ErrorApi extends Error {
  constructor(mensaje, { codigo, status } = {}) {
    super(mensaje);
    this.name = "ErrorApi";
    this.codigo = codigo;
    this.status = status;
  }
}

// Llama a POST /api/denuncias/{id}/rescates (tarea #71).
// Si no hay conexión, fetch lanza un error normal (sin status).
export async function asignarEquipo(denunciaId, { equipo_id, lugar, animal_id }) {
  const respuesta = await fetch(`/api/denuncias/${denunciaId}/rescates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ equipo_id, lugar, animal_id }),
  });

  // Si el servidor responde algo que no es JSON (por ejemplo, un error 500), seguimos igual.
  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new ErrorApi(datos.mensaje, { codigo: datos.error, status: respuesta.status });
  }
  return datos;
}
