// Cliente de la API de asignación de equipos (HU-05).
const apiUrl = (import.meta.env?.VITE_API_URL || "/api").replace(/\/$/, "");

// Error que lanza la API cuando responde con un código de error.
// Guarda el código (por ejemplo "equipo_no_disponible") y el status HTTP.
export class ErrorApi extends Error {
  constructor(mensaje, { codigo, status } = {}) {
    super(mensaje);
    this.name = "ErrorApi";
    this.codigo = codigo;
    this.status = status;
  }
}

// Lee el código y el mensaje de un error de la API. Acepta los dos formatos:
//   { error: { codigo, mensaje } }      (servidor principal)
//   { error: "codigo", mensaje, status } (contrato original del módulo)
export function leerError(datos) {
  if (datos && typeof datos.error === "object" && datos.error !== null) {
    return { codigo: datos.error.codigo, mensaje: datos.error.mensaje };
  }
  return { codigo: datos?.error, mensaje: datos?.mensaje };
}

// Llama a POST /api/denuncias/{id}/rescates.
// Si no hay conexión, fetch lanza un error normal (sin status).
export async function asignarEquipo(denunciaId, { equipo_id, lugar, animal_id }) {
  const respuesta = await fetch(`${apiUrl}/denuncias/${denunciaId}/rescates`, {
    method: "POST",
    credentials: "include", // la sesión va en una cookie
    headers: { "Content-Type": "application/json", "X-Requested-With": "Modulo5" }, // el servidor exige esta cabecera
    body: JSON.stringify({ equipo_id, lugar, animal_id }),
  });

  // Si el servidor responde algo que no es JSON (por ejemplo, un error 500), seguimos igual.
  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    const { codigo, mensaje } = leerError(datos);
    throw new ErrorApi(mensaje, { codigo, status: respuesta.status });
  }
  return datos;
}
