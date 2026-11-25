const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export async function fetchReports(filters, { signal } = {}) {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== '' && value !== undefined && value !== null) {
      searchParams.set(key, String(value))
    }
  }

  const response = await fetch(`${apiBaseUrl}/denuncias?${searchParams}`, {
    headers: { Accept: 'application/json' },
    signal,
  })

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error('La API devolvió una respuesta inválida.')
  }

  if (!response.ok) {
    const message = typeof payload?.error === 'string'
      ? payload.error
      : `La búsqueda falló (HTTP ${response.status}).`
    throw new Error(message)
  }
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray(payload.items) ||
    !Number.isInteger(payload.total) ||
    !Number.isInteger(payload.page) ||
    !Number.isInteger(payload.pages)
  ) {
    throw new Error('La API devolvió un formato de resultados inesperado.')
  }

  return payload
}

export async function fetchReportStatus(id, contacts, { signal } = {}) {
  const response = await fetch(
    `${apiBaseUrl}/denuncias/${encodeURIComponent(id)}/estado`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contacts),
      signal,
    },
  )

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error('La API devolvió una respuesta inválida.')
  }

  if (!response.ok) {
    const message = typeof payload?.error === 'string'
      ? payload.error
      : `La consulta falló (HTTP ${response.status}).`
    throw new Error(message)
  }
  if (
    !payload ||
    typeof payload.id !== 'string' ||
    typeof payload.status !== 'string' ||
    !Array.isArray(payload.statusHistory)
  ) {
    throw new Error('La API devolvió un estado con formato inesperado.')
  }

  return payload
}
