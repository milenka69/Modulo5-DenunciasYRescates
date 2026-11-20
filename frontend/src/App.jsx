import { useEffect, useState } from 'react'
import InicioSesion from './components/InicioSesion.jsx'
import PaginaInicio from './components/PaginaInicio.jsx'
import EstructuraAplicacion from './components/EstructuraAplicacion.jsx'
import { solicitarSesion, eliminarSesion } from './services/auth.js'

const sessionKey = 'modulo5.sesion'

function borrarSesionGuardada() {
  for (const storage of [localStorage, sessionStorage]) {
    try { storage.removeItem(sessionKey) } catch { /* Almacenamiento no disponible. */ }
  }
}

function App() {
  const [session, setSession] = useState({})
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState(null)
  const [retry, setRetry] = useState(0)

  async function cerrarSesion() {
    try { await eliminarSesion() } catch (failure) { setError(failure.message); return }
    borrarSesionGuardada()
    setSession(null)
    setUser(null)
    setError('')
  }

  useEffect(() => {
    if (!session) return
    borrarSesionGuardada()
    const controller = new AbortController()
    solicitarSesion({ actual: true, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) })
      .then(data => { setUser(data); setSession(previous => previous?.expira === data.expira ? previous : { expira: data.expira }) })
      .catch((failure) => {
        if (controller.signal.aborted) return
        if ([401, 403].includes(failure.status)) {
          borrarSesionGuardada()
          setSession(null)
          setUser(null)
        }
        if (failure.status === 401) { setError(''); return }
        setError(failure.message || 'No se pudo verificar la sesión. Comprueba la conexión.')
      })
    return () => controller.abort()
  }, [session, retry])

  useEffect(() => {
    if (!session?.expira) return
    const timer = setTimeout(() => {
      borrarSesionGuardada()
      setSession(null)
      setUser(null)
      setError('La sesión expiró. Ingresa nuevamente.')
    }, Math.max(0, Date.parse(session.expira) - Date.now()))
    return () => clearTimeout(timer)
  }, [session])

  async function iniciarSesion(event) {
    event.preventDefault()
    if (loading) return
    const fields = new FormData(event.currentTarget)
    setLoading(true)
    setError('')
    setErrorField(null)
    try {
      const data = await solicitarSesion({ rut: fields.get('rut'), clave: fields.get('clave'), recordar: fields.has('recordar') })
      borrarSesionGuardada()
      setSession({ expira: data.expira })
      setUser(data)
    } catch (failure) {
      setErrorField(failure.field || null)
      setError(failure.message || 'No se pudo iniciar sesión. Comprueba la conexión e inténtalo nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return <EstructuraAplicacion usuario={user} alCerrarSesion={cerrarSesion}>
    {user ? <PaginaInicio usuario={user} error={error} /> : <InicioSesion checking={Boolean(session && !user)} loading={loading} error={error} errorField={errorField} onClearError={() => { setError(''); setErrorField(null) }} onLogin={iniciarSesion} onLogout={cerrarSesion} onRetry={() => { setError(''); setRetry(retry + 1) }} />}
  </EstructuraAplicacion>
}

export default App
