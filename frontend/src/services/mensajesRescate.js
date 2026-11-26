// #75 Textos de confirmación y de error para el usuario.
// Son funciones puras (sin React) para poder probarlas fácilmente.

const TEXTOS_DE_ERROR = {
  EQUIPO_NO_DISPONIBLE: "Ese equipo está ocupado en otro rescate. Elige otro equipo.",
  DENUNCIA_CON_EQUIPO: "Esta denuncia ya tiene un equipo asignado.",
  DENUNCIA_CERRADA: "Esta denuncia ya está cerrada y no admite nuevos rescates.",
  DENUNCIA_NO_ENCONTRADA: "La denuncia seleccionada no existe.",
  EQUIPO_NO_ENCONTRADO: "El equipo seleccionado no existe.",
  ANIMAL_NO_ENCONTRADO: "El animal indicado no existe en el registro de animales.",
};

// Errores de la sesión del núcleo: se muestran igual sin importar la operación.
const TEXTOS_POR_STATUS = {
  401: "Tu sesión expiró. Ingresa nuevamente.",
  403: "No tienes permisos para realizar esta acción.",
};

// Convierte el error lanzado por la API en un texto para mostrar.
export function mensajeDeError(error) {
  // Sin status: la petición ni siquiera llegó al servidor (API apagada, sin red, etc.)
  if (!error || error.status === undefined) {
    return "No se pudo conectar con el servidor. Intenta nuevamente.";
  }
  // Un texto conocido del contrato; si no, el mensaje que envió la API; si no, uno genérico.
  return (
    TEXTOS_POR_STATUS[error.status] ||
    TEXTOS_DE_ERROR[error.codigo] ||
    error.message ||
    `No se pudo completar la operación (error ${error.status}).`
  );
}

// Texto de éxito cuando la API crea el rescate (201).
export function mensajeDeConfirmacion({ rescate, equipo }) {
  const quien = equipo ? equipo.nombre : `El equipo ${rescate.equipo_id}`;
  return `${quien} fue asignado a la denuncia #${rescate.denuncia_id}. Se creó el rescate N° ${rescate.id} en estado "${rescate.estado}".`;
}
