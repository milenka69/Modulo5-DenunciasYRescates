import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatearRut, rutValido } from './rut.js'

test('formatea RUT escritos o pegados, con guion manual y dígito K', () => {
  for (const [input, expected] of [
    ['', ''], ['1', '1'], ['123456789', '12345678-9'],
    ['12345678-9', '12345678-9'], ['12.345.678-9', '12345678-9'],
    ['1234567k', '1234567-K'], ['12345678-', '12345678-'],
  ]) assert.equal(formatearRut(input), expected)
})

test('valida dígito verificador antes de comprobar la clave', () => {
  for (const rut of ['11111111-1', '17777777-3', '13333333-9', '12345670-K']) assert.equal(rutValido(rut), true, rut)
  for (const rut of ['', '123', '11111111-2', '12345678-9', '11111111-', '12.345.678-5']) assert.equal(rutValido(rut), false, rut)
})

test('permite escribir todos los dígitos de forma continua', () => {
  let value = ''
  for (const digit of '123456789') value = formatearRut(value + digit)
  assert.equal(value, '12345678-9')
  while (value) value = formatearRut(value.slice(0, -1).replace(/-$/, ''))
  assert.equal(value, '')
})
