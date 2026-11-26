// Comprueba en el núcleo que un animal (p. ej. SIM-000001) exista.
// SUPUESTO: GET {NUCLEO_URL}{NUCLEO_ANIMALES_PATH}/{id} con el token de la sesión -> 200 existe, 404 no existe.
// Ajusta NUCLEO_ANIMALES_PATH (por defecto /api/registro/animales) al contrato real del núcleo.
export function animalesDesdeNucleo(nucleoUrl, ruta = '/api/registro/animales') {
  return {
    async existe(id, token) {
      const r = await fetch(`${nucleoUrl}${ruta}/${encodeURIComponent(id)}`, {
        headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(15000), redirect: 'error',
      })
      if (r.status === 404) return false
      if (!r.ok) throw new Error('núcleo ' + r.status)
      return true
    },
  }
}
