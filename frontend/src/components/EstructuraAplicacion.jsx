import { useState } from 'react'
import FondoAmbiental from './FondoAmbiental.jsx'
import UsuarioPerfil from './UsuarioPerfil.jsx'
import './EstructuraAplicacion.css'

// Mantiene el encabezado, tema y fondo al pasar del acceso al inicio.
export default function EstructuraAplicacion({ usuario, alCerrarSesion, children }) {
  const [temaOscuro, establecerTemaOscuro] = useState(false)

  return (
    <div className={`login-page${temaOscuro ? ' dark' : ''}`}>
      <FondoAmbiental />
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Denuncias y Rescates, inicio">
          <span className="brand-symbol" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 4.5 6v5.2c0 4.4 3 7.7 7.5 9.8 4.5-2.1 7.5-5.4 7.5-9.8V6L12 3Z" />
              <path d="M8 12h2.3l1.4-3.5 2.1 7 1.4-3.5H17" />
            </svg>
          </span>
          <span>Denuncias <span className="brand-secondary">y Rescates</span></span>
        </a>
        <div className="header-actions">
          <button className="theme-toggle" type="button" onClick={() => establecerTemaOscuro(!temaOscuro)} aria-label={temaOscuro ? 'Activar modo claro' : 'Activar modo oscuro'} aria-pressed={temaOscuro}>
            <span className={!temaOscuro ? 'theme-icon selected' : 'theme-icon'} aria-hidden="true">☀</span>
            <span className={temaOscuro ? 'theme-icon selected' : 'theme-icon'} aria-hidden="true">☾</span>
          </button>
          {usuario && <UsuarioPerfil usuario={usuario} alCerrarSesion={alCerrarSesion} />}
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <span>Denuncias y Rescates</span>
        <span>Por el bienestar animal</span>
      </footer>
    </div>
  )
}
