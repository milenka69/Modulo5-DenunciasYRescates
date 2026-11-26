import { useState } from 'react'
import './InicioSesion.css'
import { formatearRut, rutValido } from '../services/rut.js'

function InicioSesion({ checking, loading, error, errorField, onClearError, onLogin, onLogout, onRetry }) {
  const [rut, setRut] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const rutError = fieldErrors.rut || (errorField === 'rut' ? error : '')
  const claveError = fieldErrors.clave || (errorField === 'clave' ? error : '')

  function submit(event) {
    event.preventDefault()
    onClearError()
    if (!rutValido(rut)) {
      setFieldErrors({ rut: 'Ingresa un RUT válido, con su dígito verificador correcto.' })
      event.currentTarget.elements.rut.focus()
      return
    }
    if (!event.currentTarget.elements.clave.value) {
      setFieldErrors({ clave: 'Ingresa tu clave.' })
      event.currentTarget.elements.clave.focus()
      return
    }
    setFieldErrors({})
    onLogin(event)
  }

  return (
      <main id="inicio" className="login-layout">
        <section className="login-card" aria-labelledby="login-title">
          {checking ? (
            <div className="session-confirmation">
              <h2 id="login-title">Verificando sesión</h2>
              {error ? (
                <>
                  <p className="auth-message auth-error" role="alert">{error}</p>
                  <button type="button" className="login-button" onClick={onRetry}>Reintentar</button>
                  <button type="button" className="session-reset" onClick={onLogout}>Volver al inicio de sesión</button>
                </>
              ) : (
                <p className="auth-message" role="status">Comprobando tu acceso con el núcleo…</p>
              )}
            </div>
          ) : (
            <>
          <h1 id="login-title">Iniciar sesión</h1>
          <p className="card-description">Accede con tu RUT y clave para gestionar tus solicitudes.</p>
          <form noValidate onSubmit={submit} onChange={() => { setFieldErrors({}); onClearError() }}>
            <div className="field-group">
              <label htmlFor="rut">RUT</label>
              <input id="rut" name="rut" type="text" placeholder="12345678-9" value={rut} onChange={event => setRut(formatearRut(event.nativeEvent.inputType?.startsWith('delete') ? event.target.value.replace(/-$/, '') : event.target.value))} maxLength={12} aria-invalid={Boolean(rutError)} aria-describedby={rutError ? 'rut-error' : undefined} autoComplete="username" spellCheck="false" required />
              {rutError && <p id="rut-error" className="field-error" role="alert">{rutError}</p>}
            </div>
            <div className="field-group password-group">
              <div className="password-heading">
                <label htmlFor="password">Clave</label>
                <button type="button" className="forgot-password">¿Olvidó su contraseña?</button>
              </div>
              <div className="password-input">
                <input id="password" name="clave" type={showPassword ? 'text' : 'password'} placeholder="Ingresa tu clave" maxLength={128} autoComplete="current-password" aria-invalid={Boolean(claveError)} aria-describedby={claveError ? 'clave-error' : undefined} required />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar clave' : 'Mostrar clave'} aria-pressed={showPassword} aria-controls="password">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
                    {showPassword && <path d="m3 3 18 18" />}
                  </svg>
                </button>
              </div>
              {claveError && <p id="clave-error" className="field-error" role="alert">{claveError}</p>}
            </div>
            <label className="remember-session"><input type="checkbox" name="recordar" /><span>Recordar sesión</span></label>
            <button className={`login-button${loading ? ' is-loading' : ''}`} type="submit" disabled={loading} aria-busy={loading}>
              <span className="button-label">{loading ? 'Ingresando…' : 'Iniciar sesión'}</span>
              {loading && <span className="button-bubbles" aria-hidden="true"><i /><i /><i /><i /><i /></span>}
            </button>
            {error && !errorField && <p className="auth-message auth-error" role="alert">{error}</p>}
          </form>
            </>
          )}
        </section>
      </main>
  )
}

export default InicioSesion





