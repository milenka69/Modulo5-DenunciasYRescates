import assert from 'node:assert/strict'
import test from 'node:test'
import { buildReportSearch, SearchParameterError } from './reportSearch.js'

test('builds a MongoDB filter from the report search criteria', () => {
  const { filter, page, limit } = buildReportSearch({
    q: 'perro Santiago',
    type: 'Denuncia',
    status: 'En terreno',
    date: '2025-10-12',
    sector: 'Barrio Italia',
    page: '2',
    limit: '10',
  })

  assert.equal(filter.visibility, 'public')
  assert.deepEqual(filter.publicSearchTerms, { $all: ['perro', 'santiago'] })
  assert.deepEqual(filter.sectorTokens, { $all: ['barrio', 'italia'] })
  assert.equal(filter.type, 'Denuncia')
  assert.equal(filter.status, 'En terreno')
  assert.equal(filter.date.$gte.toISOString(), '2025-10-12T00:00:00.000Z')
  assert.equal(filter.date.$lt.toISOString(), '2025-10-13T00:00:00.000Z')
  assert.equal(page, 2)
  assert.equal(limit, 10)
})

test('normalizes accents and punctuation in text searches', () => {
  const { filter } = buildReportSearch({ q: 'Ñuñoa, maltrato!' })

  assert.deepEqual(filter.publicSearchTerms, { $all: ['nunoa', 'maltrato'] })
})

test('rejects filtering by a private responsible name in the public search', () => {
  assert.throws(
    () => buildReportSearch({ responsible: 'Equipo Norte' }),
    SearchParameterError,
  )
})

test('rejects invalid status, dates, and pagination values', () => {
  assert.throws(
    () => buildReportSearch({ status: 'Urgente' }),
    SearchParameterError,
  )
  assert.throws(
    () => buildReportSearch({ date: '2025-02-30' }),
    SearchParameterError,
  )
  assert.throws(
    () => buildReportSearch({ limit: '101' }),
    SearchParameterError,
  )
})
