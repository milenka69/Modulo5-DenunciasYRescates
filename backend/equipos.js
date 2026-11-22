// Un rescate está "activo" mientras no termina.
// Un equipo con un rescate activo no está disponible.
export const ESTADOS_RESCATE_ACTIVOS = ["pendiente", "en_camino", "rescatado"];

// Datos ficticios.
export const EQUIPOS = [
  { id: 1, nombre: "Equipo Alfa", integrantes: 3 },
  { id: 2, nombre: "Equipo Beta", integrantes: 2 },
];

// Aquí se guardarán los rescates cuando implementemos la asignación (#71).
export const RESCATES = [];

// Un equipo está disponible si no tiene ningún rescate activo.
// La disponibilidad se calcula desde los rescates y no se guarda aparte,
// así nunca queda desactualizada. También servirá para la tarea #72.
export function equipoDisponible(equipoId, rescates = RESCATES) {
  return !rescates.some(
    (r) => r.equipo_id === equipoId && ESTADOS_RESCATE_ACTIVOS.includes(r.estado)
  );
}

// Devuelve los equipos con su campo `disponible`.
// Si `disponible` es true o false, filtra por ese valor; si es undefined, devuelve todos.
export function listarEquipos(disponible, rescates = RESCATES) {
  const equipos = EQUIPOS.map((e) => ({
    ...e,
    disponible: equipoDisponible(e.id, rescates),
  }));
  return disponible === undefined
    ? equipos
    : equipos.filter((e) => e.disponible === disponible);
}

// Solo para pruebas: borra todos los rescates.
export function reiniciarRescates() {
  RESCATES.length = 0;
}
