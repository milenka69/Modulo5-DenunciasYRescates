import {
  ContactVerificationError,
  hashContact,
} from '../utils/contactVerification.js'

const reportIdPattern = /^(?:DEN|RES)-\d{4}-\d{4}$/i

export function normalizeReportId(value) {
  if (typeof value !== 'string') {
    throw new ContactVerificationError('Ingresa un identificador de denuncia válido.')
  }

  const id = value.trim().toUpperCase()
  if (!reportIdPattern.test(id)) {
    throw new ContactVerificationError(
      'El ID debe tener el formato DEN-AAAA-NNNN o RES-AAAA-NNNN.',
    )
  }

  return id
}

export function buildStatusLookup(id, body) {
  const normalizedId = normalizeReportId(id)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ContactVerificationError('Proporciona un correo electrónico o un teléfono registrado.')
  }

  const { email, phone } = body
  if (email === undefined && phone === undefined) {
    throw new ContactVerificationError('Proporciona un correo electrónico o un teléfono registrado.')
  }
  if ((email !== undefined && typeof email !== 'string') ||
      (phone !== undefined && typeof phone !== 'string')) {
    throw new ContactVerificationError('Los datos de contacto deben ser textos válidos.')
  }

  return {
    id: normalizedId,
    ...(email !== undefined && { contactEmailHash: hashContact('email', email) }),
    ...(phone !== undefined && { contactPhoneHash: hashContact('phone', phone) }),
  }
}
