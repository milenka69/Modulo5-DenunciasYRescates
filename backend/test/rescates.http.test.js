// Integración: servidor real (server.js) + núcleo falso con 3 perfiles. Cubre funcionario, vecino, comunitario y sin sesión.
import test, { before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

const USUARIOS = {
  '11111111-1': { rut: '11111111-1', nombre: 'Fun', perfil: 'funcionario', token: 'tok-fun' },
  '22222222-2': { rut: '22222222-2', nombre: 'Vec', perfil: 'vecino', token: 'tok-vec' },
  '33333333-3': { rut: '33333333-3', nombre: 'Com', perfil: 'comunitario', token: 'tok-com' },
}
const ORIGEN = 'http://localhost:5173'
let nucleo, servidor, base, repos, memoria
let animalesNucleo = ['SIM-000001']

before(async () => {
  nucleo = http.createServer((req, res) => {
    const json = (s, o) => { res.writeHead(s, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)) }
    const token = (req.headers.authorization || '').replace('Bearer ', '')
    const u = Object.values(USUARIOS).find((x) => x.token === token)
    if (req.method === 'POST' && req.url === '/api/nucleo/sesiones') {
      let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => {
        const { rut, clave } = JSON.parse(b), x = USUARIOS[rut]
        if (!x || clave !== 'ok') return json(401, {})
        json(201, { ...x, expira: new Date(Date.now() + 3600e3).toISOString() })
      }); return
    }
    if (req.method === 'GET' && req.url === '/api/nucleo/sesiones/actual') return u ? json(200, u) : json(401, {})
    const m = req.url.match(/^\/api\/registro\/animales\/(.+)$/)
    if (m) return !u ? json(401, {}) : animalesNucleo.includes(decodeURIComponent(m[1])) ? json(200, { id: m[1] }) : json(404, {})
    json(404, {})
  })
  await new Promise((r) => nucleo.listen(0, r))
  process.env.NUCLEO_URL = `http://localhost:${nucleo.address().port}`
  process.env.FRONTEND_URL = ORIGEN
  delete process.env.MONGODB_URI
  const mod = await import('../src/server.js')
  memoria = await import('../src/rescates/memoria.js')
  repos = mod.repos
  servidor = mod.app.listen(0); await new Promise((r) => servidor.once('listening', r))
  base = `http://localhost:${servidor.address().port}`
})
after(() => { servidor.closeAllConnections?.(); servidor.close(); nucleo.closeAllConnections?.(); nucleo.close() })
beforeEach(() => {
  repos.rescates = memoria.rescatesEnMemoria()
  repos.denuncias = memoria.denunciasEnMemoria([{ id: 1, estado: 'ingresada' }, { id: 2, estado: 'ingresada' }])
})

const cab = (cookie) => ({ 'Content-Type': 'application/json', Origin: ORIGEN, 'X-Requested-With': 'Modulo5', ...(cookie ? { Cookie: cookie } : {}) })
async function login(rut) {
  const r = await fetch(`${base}/api/auth/sesiones`, { method: 'POST', headers: cab(), body: JSON.stringify({ rut, clave: 'ok' }) })
  assert.equal(r.status, 201)
  return r.headers.get('set-cookie').split(';')[0]
}
const asignar = (cookie, id, cuerpo, headers) =>
  fetch(`${base}/api/denuncias/${id}/rescates`, { method: 'POST', headers: headers ?? cab(cookie), body: JSON.stringify(cuerpo) })
const cuerpo = (extra = {}) => ({ equipo_id: 1, lugar: 'Calle Ejemplo 123', ...extra })

test('sin sesión: 401 en equipos y en asignar', async () => {
  assert.equal((await fetch(`${base}/api/equipos`)).status, 401)
  const r = await asignar(null, 1, cuerpo())
  assert.equal(r.status, 401); assert.equal((await r.json()).error.codigo, 'SESION_INVALIDA')
})
for (const rut of ['22222222-2', '33333333-3']) {
  test(`${USUARIOS[rut].perfil}: 403 y no se crea nada`, async () => {
    const c = await login(rut)
    assert.equal((await fetch(`${base}/api/equipos`, { headers: { Cookie: c } })).status, 403)
    const r = await asignar(c, 1, cuerpo())
    assert.equal(r.status, 403); assert.equal((await r.json()).error.codigo, 'PERFIL_NO_AUTORIZADO')
    assert.equal(repos.rescates.lista.length, 0)
  })
}
test('funcionario: lista equipos y asigna (201)', async () => {
  const c = await login('11111111-1')
  const eq = await (await fetch(`${base}/api/equipos?disponible=true`, { headers: { Cookie: c } })).json()
  assert.equal(eq.total, 2)
  const r = await asignar(c, 1, cuerpo())
  assert.equal(r.status, 201); assert.equal((await r.json()).estado, 'pendiente')
  assert.equal((await fetch(`${base}/api/equipos?disponible=true`, { headers: { Cookie: c } }).then((x) => x.json())).total, 1)
  assert.equal((await repos.denuncias.buscar(1)).estado, 'asignada')
})
test('funcionario: errores con el formato único { error: { codigo, mensaje } }', async () => {
  const c = await login('11111111-1')
  await asignar(c, 1, cuerpo())
  for (const [r, status, codigo] of [
    [await asignar(c, 2, cuerpo()), 409, 'EQUIPO_NO_DISPONIBLE'],
    [await asignar(c, 999, cuerpo()), 404, 'DENUNCIA_NO_ENCONTRADA'],
    [await asignar(c, 2, cuerpo({ equipo_id: 99 })), 404, 'EQUIPO_NO_ENCONTRADO'],
    [await asignar(c, 2, { equipo_id: 2, lugar: '' }), 422, 'DATO_INVALIDO'],
  ]) {
    assert.equal(r.status, status)
    const b = await r.json(); assert.deepEqual(Object.keys(b), ['error']); assert.equal(b.error.codigo, codigo); assert.ok(b.error.mensaje)
  }
})
test('funcionario: JSON mal escrito -> 400 JSON_INVALIDO', async () => {
  const c = await login('11111111-1')
  const r = await fetch(`${base}/api/denuncias/1/rescates`, { method: 'POST', headers: cab(c), body: '{ no es json' })
  assert.equal(r.status, 400); assert.equal((await r.json()).error.codigo, 'JSON_INVALIDO')
})
test('animal: existe en el núcleo -> 201; no existe -> 404', async () => {
  const c = await login('11111111-1')
  const mal = await asignar(c, 1, cuerpo({ animal_id: 'SIM-999999' }))
  assert.equal(mal.status, 404); assert.equal((await mal.json()).error.codigo, 'ANIMAL_NO_ENCONTRADO')
  const ok = await asignar(c, 1, cuerpo({ animal_id: 'sim-000001' }))
  assert.equal(ok.status, 201); assert.equal((await ok.json()).animal_id, 'SIM-000001')
})
test('anti-CSRF: asignar sin Origin / X-Requested-With -> 403 ORIGEN_INVALIDO', async () => {
  const c = await login('11111111-1')
  const r = await asignar(c, 1, cuerpo(), { 'Content-Type': 'application/json', Cookie: c })
  assert.equal(r.status, 403); assert.equal((await r.json()).error.codigo, 'ORIGEN_INVALIDO')
})
test('simultáneas: dos asignaciones al mismo equipo -> 201 y 409', async () => {
  const c = await login('11111111-1')
  const rs = await Promise.all([asignar(c, 1, cuerpo()), asignar(c, 2, cuerpo())])
  assert.deepEqual(rs.map((r) => r.status).sort(), [201, 409])
})
