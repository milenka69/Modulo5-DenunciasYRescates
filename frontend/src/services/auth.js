const apiUrl = (import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '')

export async function solicitarSesion({ rut, clave, actual = false, recordar = false, signal }) {
  const headers = { 'Content-Type': 'application/json' }
  headers['X-Requested-With'] = 'Modulo5'
  const response = await fetch(`${apiUrl}/auth/sesiones${actual ? '/actual' : ''}`, {
    method: actual ? 'GET' : 'POST',
    credentials: 'include',
    headers,
    body: actual ? undefined : JSON.stringify({ rut: rut.replace(/\./g, '').trim().toUpperCase(), clave, recordar }),
    signal: signal || AbortSignal.timeout(20000),
  })
  const body = await response.text()
  let data
  try {
    data = JSON.parse(body)
  } catch {
    const error = new Error(response.ok
      ? 'El servicio de acceso devolvió una respuesta inválida. Inténtalo nuevamente.'
      : 'El servicio de acceso no está disponible. Comprueba que el backend y el núcleo estén iniciados e inténtalo nuevamente.')
    error.status = response.ok ? 502 : response.status
    throw error
  }
  if (!response.ok) {
    const error = new Error(data?.error?.mensaje || 'No se pudo iniciar sesión.')
    error.status = response.status
    error.code = data?.error?.codigo
    error.field = ['RUT_INVALIDO'].includes(error.code)
      ? 'rut' : error.code === 'CLAVE_INCORRECTA' ? 'clave' : undefined
    throw error
  }
  if (!data || typeof data !== 'object' || typeof data.rut !== 'string' || typeof data.nombre !== 'string'
    || !Number.isFinite(Date.parse(data.expira))) {
    const error = new Error('El servicio de acceso devolvió una sesión inválida. Inténtalo nuevamente.')
    error.status = 502
    throw error
  }
  if (!['vecino', 'comunitario', 'funcionario'].includes(data.perfil)) {
    const error = new Error('Este módulo permite el acceso de vecinos, comunitarios y funcionarios.')
    error.status = 403
    throw error
  }
  return data
}

// Colocar API de denuncias y rescates aquí al tener el contrato listo.

export async function eliminarSesion() {
  const response = await fetch(apiUrl + '/auth/sesiones/actual', { method:'DELETE', signal: AbortSignal.timeout(20000), credentials:'include', headers:{'X-Requested-With':'Modulo5'} })
  if (!response.ok) throw new Error('No se pudo cerrar sesión. Inténtalo nuevamente.')
}
