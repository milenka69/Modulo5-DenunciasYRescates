export function tokenizeSearchText(value) {
  const normalized = String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')

  return [...new Set(normalized.match(/[\p{L}\p{N}]+/gu) ?? [])]
}
