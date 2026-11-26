// Reglas de negocio de HU-05 (asignar equipo de rescate). No conoce Express ni MongoDB:
// recibe "repositorios" (memoria o Mongo) con la misma interfaz asíncrona.

export const ESTADOS_RESCATE_ACTIVOS = ['pendiente', 'en_camino', 'rescatado']
export const ESTADOS_DENUNCIA_CERRADOS = ['descartada', 'resuelta', 'cerrada']
export const FORMATO_ID_ANIMAL = /^[A-Za-z0-9-]{3,40}$/

export const EQUIPOS = [
  { id: 1, nombre: 'Equipo Alfa', integrantes: 3 },
  { id: 2, nombre: 'Equipo Beta', integrantes: 2 },
]

const error = (status, codigo, mensaje) => ({ error: { status, codigo, mensaje } })

// #70 Equipos con su campo `disponible` (se calcula desde los rescates activos).
export async function listarEquipos(disponible, { rescates }) {
  const ocupados = new Set(await rescates.equiposOcupados())
  const todos = EQUIPOS.map((e) => ({ ...e, disponible: !ocupados.has(e.id) }))
  return disponible === undefined ? todos : todos.filter((e) => e.disponible === disponible)
}

// #71 a #74. Devuelve { rescate } o { error }.
// `token` es el token de la sesión del núcleo, solo para comprobar el animal.
export async function asignarEquipo(denunciaId, datos, { denuncias, rescates, animales }, token) {
  if (!Number.isInteger(denunciaId)) return error(404, 'DENUNCIA_NO_ENCONTRADA', 'La denuncia no existe.')
  const denuncia = await denuncias.buscar(denunciaId)
  if (!denuncia) return error(404, 'DENUNCIA_NO_ENCONTRADA', `No existe una denuncia con id ${denunciaId}.`)

  const { equipo_id, lugar, animal_id = null } = datos || {}
  if (!Number.isInteger(equipo_id)) return error(422, 'DATO_INVALIDO', "El campo 'equipo_id' es obligatorio y debe ser un número entero.")
  if (typeof lugar !== 'string' || lugar.trim().length < 3 || lugar.trim().length > 200) {
    return error(422, 'DATO_INVALIDO', "El campo 'lugar' es obligatorio y debe tener entre 3 y 200 caracteres.")
  }
  if (animal_id !== null && !(typeof animal_id === 'string' && FORMATO_ID_ANIMAL.test(animal_id))) {
    return error(422, 'DATO_INVALIDO', "El campo 'animal_id' debe tener el formato del registro de animales (por ejemplo, SIM-000001) o no enviarse.")
  }

  const equipo = EQUIPOS.find((e) => e.id === equipo_id)
  if (!equipo) return error(404, 'EQUIPO_NO_ENCONTRADO', `No existe un equipo con id ${equipo_id}.`)

  if (ESTADOS_DENUNCIA_CERRADOS.includes(denuncia.estado)) {
    return error(409, 'DENUNCIA_CERRADA', `La denuncia está '${denuncia.estado}' y no admite nuevos rescates.`)
  }

  // Comprobación temprana (mensajes claros). La garantía real contra carreras la da rescates.crear().
  if ((await rescates.equiposOcupados()).includes(equipo_id)) {
    return error(409, 'EQUIPO_NO_DISPONIBLE', `El ${equipo.nombre} no está disponible.`)
  }
  const activo = await rescates.activoDeDenuncia(denunciaId)
  if (activo) return error(409, 'DENUNCIA_CON_EQUIPO', `La denuncia ya tiene un equipo asignado (rescate ${activo.id}).`)

  // El animal debe existir en el registro del núcleo.
  const animal = animal_id === null ? null : animal_id.toUpperCase()
  if (animal !== null) {
    let existe
    try { existe = await animales.existe(animal, token) } catch {
      return error(503, 'NUCLEO_NO_DISPONIBLE', 'No se pudo comprobar el animal en el núcleo. Inténtalo nuevamente.')
    }
    if (!existe) return error(404, 'ANIMAL_NO_ENCONTRADO', `El animal ${animal} no existe en el registro de animales.`)
  }

  const resultado = await rescates.crear({
    denuncia_id: denunciaId, equipo_id, animal_id: animal, lugar: lugar.trim(),
    estado: 'pendiente', fecha_asignacion: new Date().toISOString(),
  })
  if (resultado.conflicto === 'equipo') return error(409, 'EQUIPO_NO_DISPONIBLE', `El ${equipo.nombre} no está disponible.`)
  if (resultado.conflicto === 'denuncia') return error(409, 'DENUNCIA_CON_EQUIPO', 'La denuncia ya tiene un equipo asignado.')

  try {
    await denuncias.cambiarEstado(denunciaId, 'asignada') // #74
  } catch {
    await rescates.eliminar(resultado.rescate.id) // no dejar un rescate sin que la denuncia lo refleje
    return error(503, 'DENUNCIAS_NO_DISPONIBLE', 'No se pudo actualizar la denuncia. Inténtalo nuevamente.')
  }
  return { rescate: resultado.rescate }
}
