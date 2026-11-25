import { tokenizeSearchText } from '../utils/searchTokens.js'

const reportTypes = new Set(['Denuncia', 'Rescate'])
const reportStatuses = new Set([
  'Ingresada',
  'Asignada',
  'En terreno',
  'Resuelta',
  'Cerrada',
])

export class SearchParameterError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SearchParameterError'
    this.statusCode = 400
  }
}

function readStringParam(params, name, maxLength = 100) {
  const value = params[name]
  if (value === undefined) return ''
  if (typeof value !== 'string') {
    throw new SearchParameterError(`El parámetro "${name}" debe ser un texto único.`)
  }

  const trimmed = value.trim()
  if (trimmed.length > maxLength) {
    throw new SearchParameterError(`El parámetro "${name}" supera el máximo de ${maxLength} caracteres.`)
  }
  return trimmed
}

function readEnumParam(params, name, allowedValues) {
  const value = readStringParam(params, name)
  if (value && !allowedValues.has(value)) {
    throw new SearchParameterError(`El valor de "${name}" no es válido.`)
  }
  return value
}

function readDateParam(params) {
  const value = readStringParam(params, 'date', 10)
  if (!value) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new SearchParameterError('La fecha debe tener formato AAAA-MM-DD.')
  }

  const start = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== value) {
    throw new SearchParameterError('La fecha no existe.')
  }

  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { $gte: start, $lt: end }
}

function readPositiveInteger(params, name, defaultValue, maximum) {
  const value = readStringParam(params, name, 6)
  if (!value) return defaultValue
  if (!/^\d+$/.test(value)) {
    throw new SearchParameterError(`El parámetro "${name}" debe ser un entero positivo.`)
  }

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new SearchParameterError(`El parámetro "${name}" debe estar entre 1 y ${maximum}.`)
  }
  return parsed
}

export function buildReportSearch(params) {
  const query = readStringParam(params, 'q')
  const type = readEnumParam(params, 'type', reportTypes)
  const status = readEnumParam(params, 'status', reportStatuses)
  const date = readDateParam(params)
  const sector = readStringParam(params, 'sector')
  const page = readPositiveInteger(params, 'page', 1, 100000)
  const limit = readPositiveInteger(params, 'limit', 20, 100)
  const filter = { visibility: 'public' }

  if (params.responsible !== undefined) {
    throw new SearchParameterError('El filtro por responsable no está disponible en la búsqueda pública.')
  }

  if (query) {
    const terms = tokenizeSearchText(query)
    if (!terms.length) {
      throw new SearchParameterError('La búsqueda debe incluir al menos una palabra o número.')
    }
    filter.publicSearchTerms = { $all: terms }
  }
  if (type) filter.type = type
  if (status) filter.status = status
  if (date) filter.date = date
  if (sector) {
    const terms = tokenizeSearchText(sector)
    if (!terms.length) {
      throw new SearchParameterError('El sector debe incluir al menos una palabra o número.')
    }
    filter.sectorTokens = { $all: terms }
  }
  return { filter, page, limit }
}
