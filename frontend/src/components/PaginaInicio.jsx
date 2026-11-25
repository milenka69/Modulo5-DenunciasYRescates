import { useState, useEffect, useCallback } from 'react'
import './PaginaInicio.css'
import RegistroDenuncia from './RegistroDenuncia.jsx'

export default function PaginaInicio({ usuario, error }) {
  const esFuncionario = usuario.perfil === 'funcionario'
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [denuncias, setDenuncias] = useState([])

  const cargarDenuncias = useCallback(async () => {
    try {
      const respuesta = await fetch('/api/denuncias', { credentials: 'include' })
      if (!respuesta.ok) return
      const datos = await respuesta.json()
      const lista = Array.isArray(datos) ? datos : (datos.data || [])
      setDenuncias(lista)
    } catch {
      // Si falla la carga inicial, mantiene el estado vacío sin romper la vista
    }
  }, [])

  useEffect(() => {
    cargarDenuncias()
  }, [cargarDenuncias])

  const manejarDenunciaCreada = () => {
    cargarDenuncias()
  }

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
          <RegistroDenuncia usuario={usuario} onDenunciaCreada={manejarDenunciaCreada} />
        </section>
      )}

      <section className="inicio-contenido" aria-labelledby="titulo-actividad">
        <div className="inicio-seccion-titulo">
          <h2 id="titulo-actividad">{esFuncionario ? 'Panel de gestión' : 'Mis solicitudes'}</h2>
          <span>Denuncias y rescates ({denuncias.length})</span>
        </div>

        {denuncias.length > 0 ? (
          <div style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}>
            {denuncias.map((d) => (
              <article
                key={d.id || d._id}
                style={{ padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}
              >
                <div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                    Denuncia #{d.id} · {d.tipoAnimal} · {d.fechaRegistro ? new Date(d.fechaRegistro).toLocaleString('es-CL') : ''}
                  </p>
                  <h3 style={{ margin: '0.25rem 0', fontSize: '1.05rem' }}>{d.titulo}</h3>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#334155' }}>
                    <strong>Ubicación:</strong> {d.ubicacion}
                  </p>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#475569' }}>{d.descripcion}</p>
                </div>
                <span style={{ padding: '0.3rem 0.7rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, background: '#e0f2fe', color: '#0369a1', whiteSpace: 'nowrap' }}>
                  {d.estado}
                </span>
              </article>
            ))}
          </div>
        ) : (
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
        )}
      </section>
    </main>
  )
}