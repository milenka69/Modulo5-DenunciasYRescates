// #75 Textos de confirmación y de error para el usuario.
// Son funciones puras (sin React) para poder probarlas fácilmente.

const TEXTOS_DE_ERROR = {
  equipo_no_disponible: "Ese equipo está ocupado en otro rescate. Elige otro equipo.",
  denuncia_con_equipo: "Esta denuncia ya tiene un equipo asignado.",
  denuncia_cerrada: "Esta denuncia ya está cerrada y no admite nuevos rescates.",
  denuncia_no_encontrada: "La denuncia seleccionada no existe.",
  equipo_no_encontrado: "El equipo seleccionado no existe.",
};

// Convierte el error lanzado por asignarEquipo() en un texto para mostrar.
export function mensajeDeError(error) {
  // Sin status: la petición ni siquiera llegó al servidor (API apagada, sin red, etc.)
  if (!error || error.status === undefined) {
    return "No se pudo conectar con el servidor. Intenta nuevamente.";
  }
  // Un texto conocido del contrato; si no, el mensaje que envió la API; si no, uno genérico.
  return (
    TEXTOS_DE_ERROR[error.codigo] ||
    error.message ||
    `No se pudo asignar el equipo (error ${error.status}).`
  );
}

// Texto de éxito cuando la API crea el rescate (201).
export function mensajeDeConfirmacion({ rescate, equipo }) {
  const quien = equipo ? equipo.nombre : `El equipo ${rescate.equipo_id}`;
  return `${quien} fue asignado a la denuncia #${rescate.denuncia_id}. Se creó el rescate N° ${rescate.id} en estado "${rescate.estado}".`;
}
