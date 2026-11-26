export function formatearRut(value) {
  const clean = value.toUpperCase().replace(/[^0-9K]/g, '').replace(/K(?=.)/g, '').slice(0, 9)
  if (value.endsWith('-')) return clean.replace(/K/g, '').slice(0, 8) + '-'
  return clean.length > 1 ? clean.slice(0, -1) + '-' + clean.slice(-1) : clean
}

export function rutValido(rut) {
  const match = /^(\d{7,8})-([0-9K])$/.exec(rut.toUpperCase())
  if (!match) return false
  let sum = 0
  let factor = 2
  for (const digit of [...match[1]].reverse()) {
    sum += Number(digit) * factor
    factor = factor === 7 ? 2 : factor + 1
  }
  const remainder = 11 - (sum % 11)
  return match[2] === (remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder))
}
