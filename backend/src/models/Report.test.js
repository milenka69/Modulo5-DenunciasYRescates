import assert from 'node:assert/strict'
import test from 'node:test'
import Report from './Report.js'

test('public search tokens exclude case description, location, and responsible', async () => {
  for (const field of ['description', 'location', 'responsible']) {
    assert.equal(Report.schema.path(field).options.select, false)
  }

  const report = new Report({
    id: 'DEN-2025-0842',
    type: 'Denuncia',
    animal: 'Perro',
    title: 'Animal herido',
    description: 'palabra privada',
    location: 'direccion privada',
    sector: 'Ñuñoa',
    date: new Date('2025-10-12T00:00:00.000Z'),
    responsible: 'equipo privado',
    status: 'Ingresada',
    contactEmailHash: 'stored-hash',
    visibility: 'public',
  })

  await report.validate()

  assert.deepEqual(report.publicSearchTerms, [
    'den',
    '2025',
    '0842',
    'denuncia',
    'perro',
    'animal',
    'herido',
    'nunoa',
    'ingresada',
  ])
  assert.equal(report.publicSearchTerms.includes('privada'), false)
  assert.equal(report.publicSearchTerms.includes('direccion'), false)
  assert.equal(report.publicSearchTerms.includes('equipo'), false)
})
