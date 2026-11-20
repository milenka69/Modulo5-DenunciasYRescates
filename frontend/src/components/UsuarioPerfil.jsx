import { useState } from 'react'
import './UsuarioPerfil.css'

function UsuarioPerfil({ usuario, alCerrarSesion }) {
  const [open, setOpen] = useState(false)

  function cerrarAlSalir(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }

  return (
    <div
      className="profile-menu"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={cerrarAlSalir}
      onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }}
    >
      <button
        className="profile-trigger"
        type="button"
        aria-label="Menú de cuenta"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen(!open)}
      >
        <span className="profile-avatar" aria-hidden="true"><span /></span>
      </button>
      {open && (
        <div className="profile-dropdown" id="account-menu">
          <div className="profile-summary">
            <strong>{usuario.nombre}</strong>
            <span>{usuario.perfil === 'funcionario' ? 'Funcionario' : 'Vecino / Comunitario'}</span>
          </div>
          <button type="button" disabled>Mi perfil</button>
          <button type="button" disabled>Configuración de cuenta</button>
          <button type="button" className="logout-button" onClick={alCerrarSesion}>Cerrar sesión</button>
        </div>
      )}
    </div>
  )
}

export default UsuarioPerfil
