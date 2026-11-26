import assert from 'node:assert/strict'
import { test } from 'node:test'
import { solicitarSesion } from './auth.js'

const session = { rut: '11111111-1', nombre: 'Usuario de prueba', perfil: 'vecino', expira: '2099-01-01T00:00:00Z' }

for (const [name, response, message, status] of [
  ['proxy sin respuesta', () => new Response('', { status: 502 }), /no está disponible/, 502],
  ['respuesta HTML', () => new Response('<html>Error</html>', { status: 503 }), /no está disponible/, 503],
  ['JSON truncado', () => new Response('{', { status: 200 }), /respuesta inválida/, 502],
  ['sesión incompleta', () => Response.json({ perfil: 'vecino' }), /sesión inválida/, 502],
  ['credenciales rechazadas', () => Response.json({ error: { mensaje: 'Credenciales inválidas' } }, { status: 401 }), /Credenciales inválidas/, 401],
]) {
  test(name, async (t) => {
    t.mock.method(globalThis, 'fetch', async () => response())
    await assert.rejects(solicitarSesion({ rut: '11.111.111-1', clave: 'prueba' }), error => {
      assert.match(error.message, message)
      assert.equal(error.status, status)
      return true
    })
  })
}

test('inicio de sesión y normalización del RUT', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(JSON.parse(options.body).rut, '11111111-1')
    return Response.json(session, { status: 201 })
  })
  assert.deepEqual(await solicitarSesion({ rut: '11.111.111-1', clave: 'prueba' }), session)
})

test('validar sesión sin exigir un nuevo token', async (t) => {
  const user = session
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.match(url, /\/actual$/)
    assert.equal(options.headers.Authorization, undefined)
    assert.equal(options.credentials, 'include')
    return Response.json(user)
  })
  assert.deepEqual(await solicitarSesion({ actual: true }), user)
})

for (const [code, field] of [
  ['RUT_INVALIDO', 'rut'],
  ['CREDENCIALES_INVALIDAS', undefined],
  ['CLAVE_INCORRECTA', 'clave'],
]) {
  test(`ubica el error ${code} debajo del campo correspondiente`, async (t) => {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ error: { codigo: code, mensaje: 'Acceso rechazado' } }, { status: 401 }))
    await assert.rejects(solicitarSesion({ rut: '11111111-1', clave: 'prueba' }), error => {
      assert.equal(error.code, code)
      assert.equal(error.field, field)
      return true
    })
  })
}
