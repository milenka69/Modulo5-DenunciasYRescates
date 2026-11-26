// #77 Reglas del formulario de registro de rescate.
// Son funciones puras (sin React) para poder probarlas fácilmente.

export const LONGITUD_LUGAR = { min: 3, max: 200 };

// Denuncias a las que se les puede asignar un equipo (según el diagrama de estados).
export const ESTADOS_ASIGNABLES = ["ingresada", "en_evaluacion", "sin_ubicar"];

// Devuelve un objeto con un mensaje por cada campo inválido. Si no hay errores, queda vacío.
export function validarFormulario({ denunciaId, equipoId, lugar, animalId }) {
  const errores = {};

  if (!denunciaId) errores.denunciaId = "Selecciona una denuncia.";
  if (!equipoId) errores.equipoId = "Selecciona un equipo.";

  const largo = lugar.trim().length;
  if (largo === 0) {
    errores.lugar = "Indica el lugar del rescate.";
  } else if (largo < LONGITUD_LUGAR.min || largo > LONGITUD_LUGAR.max) {
    errores.lugar = `El lugar debe tener entre ${LONGITUD_LUGAR.min} y ${LONGITUD_LUGAR.max} caracteres.`;
  }

  const animal = String(animalId).trim();
  if (animal !== "") {
    const numero = Number(animal);
    if (!Number.isInteger(numero) || numero < 1) {
      errores.animalId = "El ID del animal debe ser un número entero positivo.";
    }
  }

  return errores;
}

// Convierte los valores del formulario (todos texto) en lo que espera la API.
export function armarSolicitud({ denunciaId, equipoId, lugar, animalId }) {
  const animal = String(animalId).trim();
  return {
    denunciaId: Number(denunciaId),
    cuerpo: {
      equipo_id: Number(equipoId),
      lugar: lugar.trim(),
      animal_id: animal === "" ? undefined : Number(animal), // undefined: no se envía
    },
  };
}
