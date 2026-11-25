import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'
import app from '../app.js'
import Report from '../models/Report.js'
import { hashContact } from '../utils/contactVerification.js'

async function startApi(t) {
  const server = app.listen(0)
  await once(server, 'listening')
  t.after(async () => {
    server.closeAllConnections()
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve())
    })
  })

  return `http://127.0.0.1:${server.address().port}`
}

function createQuery(result, {
  onSelect = () => {},
  onSort = () => {},
  onSkip = () => {},
  onLimit = () => {},
} = {}) {
  return {
    select(fields) {
      onSelect(fields)
      return this
    },
    sort(sort) {
      onSort(sort)
      return this
    },
    skip(value) {
      onSkip(value)
      return this
    },
    limit(value) {
      onLimit(value)
      return this
    },
    lean() {
      return Promise.resolve(result)
    },
  }
}

test('GET /api/denuncias applies public filters and selects only public fields', async (t) => {
  const baseUrl = await startApi(t)
  let actualFilter
  let actualProjection
  let actualSort
  let actualSkip
  let actualLimit
  const items = [{
    id: 'DEN-2025-0842',
    type: 'Denuncia',
    animal: 'Gato',
    title: 'Animal extraviado',
    sector: 'Ñuñoa',
    date: '2025-10-12T00:00:00.000Z',
    status: 'En terreno',
  }]

  t.mock.method(Report, 'find', (filter) => {
    actualFilter = filter
    return createQuery(items, {
      onSelect: (projection) => {
        actualProjection = projection
      },
      onSort: (sort) => {
        actualSort = sort
      },
      onSkip: (skip) => {
        actualSkip = skip
      },
      onLimit: (limit) => {
        actualLimit = limit
      },
    })
  })
  t.mock.method(Report, 'countDocuments', (filter) => {
    assert.deepEqual(filter, actualFilter)
    return Promise.resolve(25)
  })

  const params = new URLSearchParams({
    q: 'Ñuñoa gato',
    type: 'Denuncia',
    status: 'En terreno',
    date: '2025-10-12',
    sector: 'Ñuñoa',
    page: '2',
    limit: '10',
  })
  const response = await fetch(`${baseUrl}/api/denuncias?${params}`)
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(actualFilter, {
    visibility: 'public',
    publicSearchTerms: { $all: ['nunoa', 'gato'] },
    type: 'Denuncia',
    status: 'En terreno',
    date: {
      $gte: new Date('2025-10-12T00:00:00.000Z'),
      $lt: new Date('2025-10-13T00:00:00.000Z'),
    },
    sectorTokens: { $all: ['nunoa'] },
  })
  assert.equal(actualProjection, 'id type animal title sector date status -_id')
  assert.deepEqual(actualSort, { date: -1, _id: 1 })
  assert.equal(actualSkip, 10)
  assert.equal(actualLimit, 10)
  assert.equal(payload.total, 25)
  assert.equal(payload.page, 2)
  assert.equal(payload.pages, 3)
  assert.equal(payload.items[0].id, 'DEN-2025-0842')
  assert.equal('description' in payload.items[0], false)
  assert.equal('location' in payload.items[0], false)
  assert.equal('responsible' in payload.items[0], false)
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('GET /api/denuncias rejects invalid filters without querying MongoDB', async (t) => {
  const baseUrl = await startApi(t)
  t.mock.method(Report, 'find', () => {
    assert.fail('La API no debe consultar MongoDB para filtros inválidos.')
  })

  const response = await fetch(`${baseUrl}/api/denuncias?status=Desconocido`)
  const payload = await response.json()

  assert.equal(response.status, 400)
  assert.match(payload.error, /no es válido/)
})

test('GET /api/denuncias/:id returns a not-found response for non-public reports', async (t) => {
  const baseUrl = await startApi(t)
  let actualFilter
  let actualProjection
  t.mock.method(Report, 'findOne', (filter) => {
    actualFilter = filter
    return createQuery(null, {
      onSelect: (projection) => {
        actualProjection = projection
      },
    })
  })

  const response = await fetch(`${baseUrl}/api/denuncias/DEN-2025-0842`)
  const payload = await response.json()

  assert.equal(response.status, 404)
  assert.equal(payload.error, 'No se encontró el reporte solicitado.')
  assert.deepEqual(actualFilter, { id: 'DEN-2025-0842', visibility: 'public' })
  assert.equal(actualProjection, 'id type animal title sector date status -_id')
})

test('POST /api/denuncias/:id/estado verifies contact and returns only status data', async (t) => {
  const baseUrl = await startApi(t)
  const originalSecret = process.env.CONTACT_LOOKUP_SECRET
  process.env.CONTACT_LOOKUP_SECRET = 'test-secret-with-at-least-32-characters'
  t.after(() => {
    if (originalSecret === undefined) delete process.env.CONTACT_LOOKUP_SECRET
    else process.env.CONTACT_LOOKUP_SECRET = originalSecret
  })

  let actualFilter
  let actualProjection
  const changedAt = '2025-10-12T00:00:00.000Z'
  t.mock.method(Report, 'findOne', (filter) => {
    actualFilter = filter
    return createQuery({
      id: 'DEN-2025-0842',
      status: 'En terreno',
      statusHistory: [{ status: 'En terreno', changedAt }],
      contactEmailHash: 'not-returned',
      description: 'not-returned',
    }, {
      onSelect: (projection) => {
        actualProjection = projection
      },
    })
  })

  const response = await fetch(`${baseUrl}/api/denuncias/den-2025-0842/estado`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'VECINO@example.test' }),
  })
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(actualFilter, {
    id: 'DEN-2025-0842',
    contactEmailHash: hashContact('email', 'vecino@example.test'),
  })
  assert.equal(actualProjection, 'id status statusHistory updatedAt')
  assert.deepEqual(payload, {
    id: 'DEN-2025-0842',
    status: 'En terreno',
    statusHistory: [{ status: 'En terreno', changedAt }],
  })
  assert.equal('contactEmailHash' in payload, false)
  assert.equal('description' in payload, false)
})

test('POST /api/denuncias/:id/estado reports no match without exposing which value failed', async (t) => {
  const baseUrl = await startApi(t)
  const originalSecret = process.env.CONTACT_LOOKUP_SECRET
  process.env.CONTACT_LOOKUP_SECRET = 'test-secret-with-at-least-32-characters'
  t.after(() => {
    if (originalSecret === undefined) delete process.env.CONTACT_LOOKUP_SECRET
    else process.env.CONTACT_LOOKUP_SECRET = originalSecret
  })
  t.mock.method(Report, 'findOne', () => createQuery(null))

  const response = await fetch(`${baseUrl}/api/denuncias/DEN-2025-0842/estado`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'vecino@example.test' }),
  })
  const payload = await response.json()

  assert.equal(response.status, 404)
  assert.match(payload.error, /ID y los datos de contacto/)
  assert.equal(response.headers.get('cache-control'), 'no-store')
})
