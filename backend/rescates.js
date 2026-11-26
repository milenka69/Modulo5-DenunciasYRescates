import { DENUNCIAS } from "./denuncias.js";
import { EQUIPOS, ESTADOS_RESCATE_ACTIVOS, RESCATES, equipoDisponible } from "./equipos.js";

// Estados en que la denuncia ya terminó y no se le asignan equipos.
const ESTADOS_DENUNCIA_CERRADOS = ["descartada", "resuelta", "cerrada"];

const error = (status, codigo, mensaje) => ({ error: { status, error: codigo, mensaje } });

// #71 Implementar la asignación de equipos.
// #72 Valida que el equipo esté disponible antes de asignarlo.
// #73 Impide asignar más de un equipo a la misma denuncia.
// #74 Al asignar, la denuncia pasa a "asignada".
// Crea un rescate en estado "pendiente" que une una denuncia con un equipo.
// Devuelve { rescate } si todo sale bien, o { error } con el formato del contrato.
export function asignarEquipo(
  denunciaId,
  datos = {},
  { denuncias = DENUNCIAS, equipos = EQUIPOS, rescates = RESCATES } = {}
) {
  const denuncia = denuncias.find((d) => d.id === denunciaId);
  if (!denuncia) {
    return error(404, "denuncia_no_encontrada", `No existe una denuncia con id ${denunciaId}.`);
  }

  const { equipo_id, lugar, animal_id = null } = datos;

  if (!Number.isInteger(equipo_id)) {
    return error(422, "dato_invalido", "El campo 'equipo_id' es obligatorio y debe ser un número entero.");
  }
  if (typeof lugar !== "string" || lugar.trim().length < 3 || lugar.trim().length > 200) {
    return error(422, "dato_invalido", "El campo 'lugar' es obligatorio y debe tener entre 3 y 200 caracteres.");
  }
  if (animal_id !== null && !(Number.isInteger(animal_id) && animal_id > 0)) {
    return error(422, "dato_invalido", "El campo 'animal_id' debe ser un entero positivo o no enviarse.");
  }

  const equipo = equipos.find((e) => e.id === equipo_id);
  if (!equipo) {
    return error(404, "equipo_no_encontrado", `No existe un equipo con id ${equipo_id}.`);
  }

  // #72 Validar la disponibilidad del equipo seleccionado
  if (!equipoDisponible(equipo_id, rescates)) {
    return error(409, "equipo_no_disponible", `El ${equipo.nombre} no está disponible.`);
  }

  // Una denuncia terminada no admite rescates: así #74 nunca la reabre sin querer.
  if (ESTADOS_DENUNCIA_CERRADOS.includes(denuncia.estado)) {
    return error(
      409,
      "denuncia_cerrada",
      `La denuncia está '${denuncia.estado}' y no admite nuevos rescates.`
    );
  }

  // #73 Evitar la asignación de más de un equipo a la misma denuncia
  const rescateActivo = rescates.find(
    (r) => r.denuncia_id === denunciaId && ESTADOS_RESCATE_ACTIVOS.includes(r.estado)
  );
  if (rescateActivo) {
    return error(
      409,
      "denuncia_con_equipo",
      `La denuncia ya tiene un equipo asignado (rescate ${rescateActivo.id}).`
    );
  }

  const rescate = {
    id: Math.max(0, ...rescates.map((r) => r.id)) + 1,
    denuncia_id: denunciaId,
    equipo_id,
    animal_id,
    lugar: lugar.trim(),
    estado: "pendiente",
    fecha_asignacion: new Date().toISOString(),
  };
  rescates.push(rescate);

  // #74 Actualizar el estado de la denuncia (también cuando se reintenta desde "sin_ubicar")
  denuncia.estado = "asignada";

  return { rescate };
}
