import assert from 'node:assert/strict'
import test from 'node:test'
import { buildStatusLookup, normalizeReportId } from './statusLookup.js'
import {
  assertContactLookupSecret,
  ContactVerificationError,
  hashContact,
} from '../utils/contactVerification.js'

const originalSecret = process.env.CONTACT_LOOKUP_SECRET
process.env.CONTACT_LOOKUP_SECRET = 'test-secret-with-at-least-32-characters'

test('builds a status lookup using the identifier and registered email', () => {
  const filter = buildStatusLookup(' den-2025-0842 ', { email: 'VECINO@example.test' })

  assert.equal(filter.id, 'DEN-2025-0842')
  assert.match(filter.contactEmailHash, /^[a-f0-9]{64}$/)
  assert.equal('contactPhoneHash' in filter, false)
})

test('normalizes valid report IDs and rejects invalid formats', () => {
  assert.equal(normalizeReportId(' res-2025-0001 '), 'RES-2025-0001')
  assert.throws(() => normalizeReportId('2025-0842'), ContactVerificationError)
  assert.throws(() => normalizeReportId('DEN-25-842'), ContactVerificationError)
  assert.throws(() => normalizeReportId('DEN-2025-08420'), ContactVerificationError)
})

test('requires every supplied contact to match the report', () => {
  const filter = buildStatusLookup('DEN-2025-0842', {
    email: 'vecino@example.test',
    phone: '+56 9 1234 5678',
  })

  assert.match(filter.contactEmailHash, /^[a-f0-9]{64}$/)
  assert.match(filter.contactPhoneHash, /^[a-f0-9]{64}$/)
})

test('normalizes email casing and phone formatting before hashing', () => {
  assert.equal(
    hashContact('email', 'Vecino@example.test'),
    hashContact('email', 'vecino@example.test'),
  )
  assert.equal(
    hashContact('phone', '+56 9 1234-5678'),
    hashContact('phone', '+56912345678'),
  )
})

test('rejects the example HMAC secret', () => {
  process.env.CONTACT_LOOKUP_SECRET = 'replace-this-with-a-random-secret-of-at-least-32-chars'
  assert.throws(assertContactLookupSecret)
  process.env.CONTACT_LOOKUP_SECRET = 'test-secret-with-at-least-32-characters'
})

test('rejects missing or malformed lookup data', () => {
  assert.throws(
    () => buildStatusLookup('DEN-2025-0842', {}),
    ContactVerificationError,
  )
  assert.throws(
    () => buildStatusLookup('DEN-2025-0842', { email: 'no-es-un-correo' }),
    ContactVerificationError,
  )
  assert.throws(
    () => buildStatusLookup('', { phone: '+56912345678' }),
    ContactVerificationError,
  )
  assert.throws(
    () => buildStatusLookup('DEN-2025-0842', { phone: '123' }),
    ContactVerificationError,
  )
})

test.after(() => {
  if (originalSecret === undefined) delete process.env.CONTACT_LOOKUP_SECRET
  else process.env.CONTACT_LOOKUP_SECRET = originalSecret
})
