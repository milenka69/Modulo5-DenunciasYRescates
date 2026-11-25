import { createHmac } from 'node:crypto'

const exampleSecret = 'replace-this-with-a-random-secret-of-at-least-32-chars'

export class ContactVerificationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ContactVerificationError'
    this.statusCode = 400
  }
}

export function assertContactLookupSecret() {
  const secret = process.env.CONTACT_LOOKUP_SECRET
  if (!secret || secret.length < 32 || secret === exampleSecret) {
    throw new Error('Configura CONTACT_LOOKUP_SECRET con una clave aleatoria de al menos 32 caracteres.')
  }
  return secret
}

export function normalizeContact(type, value) {
  if (typeof value !== 'string') {
    throw new ContactVerificationError(`El ${type} debe ser un texto válido.`)
  }

  if (type === 'email') {
    const email = value.trim().toLocaleLowerCase('es')
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ContactVerificationError('Ingresa un correo electrónico válido.')
    }
    return email
  }

  const phone = value.trim().replace(/[\s().-]/g, '')
  if (!/^\+?[1-9]\d{7,14}$/.test(phone)) {
    throw new ContactVerificationError('Ingresa un teléfono válido con código de país.')
  }
  return phone
}

export function hashContact(type, value) {
  const secret = assertContactLookupSecret()
  const normalized = normalizeContact(type, value)
  return createHmac('sha256', secret)
    .update(`${type}:${normalized}`)
    .digest('hex')
}
