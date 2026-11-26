// Repositorios en memoria: para pruebas y para desarrollo sin MONGODB_URI.
import { ESTADOS_RESCATE_ACTIVOS } from './dominio.js'

const activo = (r) => ESTADOS_RESCATE_ACTIVOS.includes(r.estado)

export function rescatesEnMemoria(lista = []) {
  return {
    lista,
    async equiposOcupados() { return lista.filter(activo).map((r) => r.equipo_id) },
    async activoDeDenuncia(id) { return lista.find((r) => r.denuncia_id === id && activo(r)) ?? null },
    // Síncrono dentro: la comprobación y el guardado no se pueden intercalar (equivale al índice único de Mongo).
    async crear(datos) {
      if (lista.some((r) => r.equipo_id === datos.equipo_id && activo(r))) return { conflicto: 'equipo' }
      if (lista.some((r) => r.denuncia_id === datos.denuncia_id && activo(r))) return { conflicto: 'denuncia' }
      const rescate = { id: Math.max(0, ...lista.map((r) => r.id)) + 1, ...datos }
      lista.push(rescate)
      return { rescate }
    },
    async eliminar(id) { const i = lista.findIndex((r) => r.id === id); if (i >= 0) lista.splice(i, 1) },
  }
}

// Denuncias de prueba. En producción las provee el módulo de denuncias (ver denunciasMongo.js).
export function denunciasEnMemoria(lista) {
  return {
    lista,
    async buscar(id) { return lista.find((d) => d.id === id) ?? null },
    async cambiarEstado(id, estado) { const d = lista.find((x) => x.id === id); if (d) d.estado = estado },
  }
}

export const animalesEnMemoria = (ids = []) => ({ async existe(id) { return ids.includes(id) } })
