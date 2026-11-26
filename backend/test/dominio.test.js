import test from 'node:test'
import assert from 'node:assert/strict'
import { asignarEquipo, listarEquipos } from '../src/rescates/dominio.js'
import { rescatesEnMemoria, denunciasEnMemoria, animalesEnMemoria } from '../src/rescates/memoria.js'

// Denuncias de prueba (las reales son del módulo de denuncias).
function entorno(extra = {}) {
  return {
    denuncias: denunciasEnMemoria([
      { id: 1, estado: 'ingresada' }, { id: 2, estado: 'ingresada' },
      { id: 3, estado: 'cerrada' }, { id: 4, estado: 'sin_ubicar' },
    ]),
    rescates: rescatesEnMemoria(),
    animales: animalesEnMemoria(['SIM-000001']),
    ...extra,
  }
}
const datos = (equipo_id = 1, resto = {}) => ({ equipo_id, lugar: 'Calle Ejemplo 123', ...resto })

test('CP-01 asigna un equipo disponible: rescate pendiente', async () => {
  const e = entorno()
  const { rescate } = await asignarEquipo(1, datos(1), e)
  assert.equal(rescate.id, 1); assert.equal(rescate.estado, 'pendiente'); assert.equal(rescate.animal_id, null)
})
test('CP-02 una denuncia no admite dos equipos', async () => {
  const e = entorno(); await asignarEquipo(1, datos(1), e)
  const { error } = await asignarEquipo(1, datos(2), e)
  assert.equal(error.status, 409); assert.equal(error.codigo, 'DENUNCIA_CON_EQUIPO')
  assert.equal((await listarEquipos(true, e)).length, 1)
})
test('CP-03 al asignar, la denuncia pasa a asignada', async () => {
  const e = entorno(); await asignarEquipo(1, datos(1), e)
  assert.equal((await e.denuncias.buscar(1)).estado, 'asignada')
})
test('CP-04 si falla, la denuncia conserva su estado', async () => {
  const e = entorno(); await asignarEquipo(1, datos(1), e)
  await asignarEquipo(2, datos(1), e)
  assert.equal((await e.denuncias.buscar(2)).estado, 'ingresada')
})
test('CP-05 equipo ocupado: 409', async () => {
  const e = entorno(); await asignarEquipo(1, datos(1), e)
  const { error } = await asignarEquipo(2, datos(1), e)
  assert.equal(error.status, 409); assert.equal(error.codigo, 'EQUIPO_NO_DISPONIBLE')
  assert.equal(error.mensaje, 'El Equipo Alfa no está disponible.')
})
test('CP-06 dos denuncias, dos equipos', async () => {
  const e = entorno()
  assert.ok((await asignarEquipo(1, datos(1), e)).rescate); assert.ok((await asignarEquipo(2, datos(2), e)).rescate)
  assert.equal((await listarEquipos(true, e)).length, 0)
})
test('CP-07 denuncia inexistente: 404', async () => {
  const { error } = await asignarEquipo(999, datos(), entorno()); assert.equal(error.codigo, 'DENUNCIA_NO_ENCONTRADA')
})
test('CP-08 equipo inexistente: 404', async () => {
  const { error } = await asignarEquipo(1, datos(999), entorno()); assert.equal(error.codigo, 'EQUIPO_NO_ENCONTRADO')
})
for (const malo of [{ equipo_id: 'uno', lugar: 'Calle X' }, { equipo_id: 1, lugar: '  ' }, { equipo_id: 1, lugar: 'ab' },
  { equipo_id: 1, lugar: 'Calle X', animal_id: 5521 }, { equipo_id: 1, lugar: 'Calle X', animal_id: 'SIM 01' }, undefined]) {
  test(`CP-09 datos inválidos ${JSON.stringify(malo)}: 422 y sin rescate`, async () => {
    const e = entorno(); const { error } = await asignarEquipo(1, malo, e)
    assert.equal(error.status, 422); assert.equal(error.codigo, 'DATO_INVALIDO'); assert.equal(e.rescates.lista.length, 0)
  })
}
test('CP-12/13 solicitudes simultáneas: solo una gana', async () => {
  const a = entorno()
  const r1 = await Promise.all([asignarEquipo(1, datos(1), a), asignarEquipo(1, datos(2), a)])
  assert.deepEqual(r1.map((r) => (r.rescate ? 201 : r.error.status)).sort(), [201, 409])
  const b = entorno()
  const r2 = await Promise.all([asignarEquipo(1, datos(1), b), asignarEquipo(2, datos(1), b)])
  assert.deepEqual(r2.map((r) => (r.rescate ? 201 : r.error.status)).sort(), [201, 409])
})
test('CP-14 denuncia cerrada: 409 y no cambia', async () => {
  const e = entorno(); const { error } = await asignarEquipo(3, datos(1), e)
  assert.equal(error.codigo, 'DENUNCIA_CERRADA'); assert.equal((await e.denuncias.buscar(3)).estado, 'cerrada')
})
test('CP-15 reintento tras rescate fallido en denuncia sin_ubicar', async () => {
  const e = entorno()
  e.rescates.lista.push({ id: 1, denuncia_id: 4, equipo_id: 1, estado: 'fallido' })
  const { rescate } = await asignarEquipo(4, datos(1), e)
  assert.equal(rescate.id, 2); assert.equal((await e.denuncias.buscar(4)).estado, 'asignada'); assert.equal(e.rescates.lista.length, 2)
})
test('animal que existe en el núcleo: se guarda en mayúsculas', async () => {
  const { rescate } = await asignarEquipo(1, datos(1, { animal_id: 'sim-000001' }), entorno())
  assert.equal(rescate.animal_id, 'SIM-000001')
})
test('animal que no existe en el núcleo: 404 y no se crea nada', async () => {
  const e = entorno(); const { error } = await asignarEquipo(1, datos(1, { animal_id: 'SIM-999999' }), e)
  assert.equal(error.status, 404); assert.equal(error.codigo, 'ANIMAL_NO_ENCONTRADO'); assert.equal(e.rescates.lista.length, 0)
})
test('núcleo caído al comprobar el animal: 503', async () => {
  const e = entorno({ animales: { async existe() { throw new Error('caído') } } })
  const { error } = await asignarEquipo(1, datos(1, { animal_id: 'SIM-000001' }), e)
  assert.equal(error.status, 503); assert.equal(error.codigo, 'NUCLEO_NO_DISPONIBLE')
})
test('si no se puede actualizar la denuncia, se deshace el rescate', async () => {
  const e = entorno(); e.denuncias.cambiarEstado = async () => { throw new Error('x') }
  const { error } = await asignarEquipo(1, datos(1), e)
  assert.equal(error.status, 503); assert.equal(e.rescates.lista.length, 0)
})
