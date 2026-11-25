import { useState } from 'react'
import './PaginaInicio.css'
import RegistroDenuncia from './RegistroDenuncia.jsx'

export default function PaginaInicio({ usuario, error }) {
  const esFuncionario = usuario.perfil === 'funcionario'
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  return (
    <main id="inicio" className="pagina-inicio" tabIndex={-1}>
      <section className="inicio-bienvenida" aria-labelledby="titulo-inicio">
        <div>
          <p className="inicio-etiqueta">TU ESPACIO DE AYUDA</p>
          <h1 id="titulo-inicio">Hola, {usuario.nombre}</h1>
          <p className="inicio-descripcion">{esFuncionario
            ? 'Un espacio para acompañar cada denuncia y coordinar la ayuda que los animales necesitan.'
            : 'Ayudar comienza contigo. Desde aquí podrás informar situaciones y acompañar tus solicitudes.'}</p>
          <span className="inicio-perfil">{esFuncionario ? 'Funcionario' : usuario.perfil === 'comunitario' ? 'Comunitario' : 'Vecino'}</span>
        </div>
        <div className="inicio-accion">
          <button
            type="button"
            className="inicio-boton"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
          >
            <span aria-hidden="true">{mostrarFormulario ? '✕' : '＋'}</span>{' '}
            {mostrarFormulario ? 'Cerrar formulario' : 'Registrar denuncia'}
          </button>
        </div>
      </section>

      {error && <p className="inicio-error" role="alert">{error}</p>}

      {mostrarFormulario && (
        <section className="inicio-formulario" aria-label="Formulario de registro de denuncia">
          <RegistroDenuncia />
        </section>
      )}

      <section className="inicio-contenido" aria-labelledby="titulo-actividad">
        <div className="inicio-seccion-titulo">
          <h2 id="titulo-actividad">{esFuncionario ? 'Panel de gestión' : 'Mis solicitudes'}</h2>
          <span>Denuncias y rescates</span>
        </div>
        {/* Sustituir este estado informativo por las funciones y datos reales del módulo. */}
        <div className="inicio-estado">
          <span className="inicio-simbolo" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3h8l3 3v15H5V3h3ZM9 10h6M9 14h6M9 18h3" />
            </svg>
          </span>
          <h3>Todo comienza con una acción</h3>
          <p>{esFuncionario
            ? 'Aquí encontrarás las herramientas para revisar denuncias y organizar rescates cuando estén disponibles.'
            : 'Aquí podrás consultar tus denuncias y seguir su avance cuando el registro esté disponible.'}</p>
        </div>
      </section>
    </main>
  )
}