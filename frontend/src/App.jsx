import { useEffect, useMemo, useState } from 'react'
import { fetchReportStatus, fetchReports } from './api/reports.js'
import './App.css'

const availableStatuses = [
  { name: 'Ingresada', description: 'La denuncia fue recibida.' },
  { name: 'Asignada', description: 'Se asignó un equipo responsable.' },
  { name: 'En terreno', description: 'El equipo está atendiendo el caso.' },
  { name: 'Resuelta', description: 'La atención del caso finalizó.' },
  { name: 'Cerrada', description: 'Se completó el cierre administrativo.' },
]
const statusOptions = ['Cualquier estado', ...availableStatuses.map(({ name }) => name)]
const pageSize = 20
const reportIdPattern = /^(?:DEN|RES)-\d{4}-\d{4}$/i

function formatReportDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}

function formatStatusDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function App() {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('Todos')
  const [statusFilter, setStatusFilter] = useState('Cualquier estado')
  const [dateFilter, setDateFilter] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [reports, setReports] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [expandedReportId, setExpandedReportId] = useState(null)
  const [statusReportId, setStatusReportId] = useState('')
  const [statusEmail, setStatusEmail] = useState('')
  const [statusPhone, setStatusPhone] = useState('')
  const [statusResult, setStatusResult] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState('')

  const filters = useMemo(() => ({
    q: query.trim(),
    type: typeFilter === 'Todos' ? '' : typeFilter,
    status: statusFilter === 'Cualquier estado' ? '' : statusFilter,
    date: dateFilter,
    sector: sectorFilter.trim(),
  }), [query, typeFilter, statusFilter, dateFilter, sectorFilter])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      setReports([])
      setTotal(0)

      try {
        const result = await fetchReports({ ...filters, page, limit: pageSize }, {
          signal: controller.signal,
        })
        setReports(result.items)
        setTotal(result.total)
        setPages(result.pages)
      } catch (requestError) {
        if (controller.signal.aborted) return
        setError(requestError instanceof Error ? requestError.message : 'No se pudo completar la búsqueda.')
        setPages(0)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 250)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [filters, page, retryCount])

  const clearFilters = () => {
    setQuery('')
    setTypeFilter('Todos')
    setStatusFilter('Cualquier estado')
    setDateFilter('')
    setSectorFilter('')
    setPage(1)
  }

  const handleStatusLookup = async (event) => {
    event.preventDefault()
    setStatusResult(null)
    setStatusError('')

    const reportId = statusReportId.trim().toUpperCase()
    if (!reportIdPattern.test(reportId)) {
      setStatusError('El ID debe tener el formato DEN-AAAA-NNNN o RES-AAAA-NNNN.')
      return
    }

    if (!statusEmail.trim() && !statusPhone.trim()) {
      setStatusError('Ingresa el correo o teléfono registrado en la denuncia.')
      return
    }

    setStatusLoading(true)
    try {
      const result = await fetchReportStatus(reportId, {
        ...(statusEmail.trim() && { email: statusEmail.trim() }),
        ...(statusPhone.trim() && { phone: statusPhone.trim() }),
      })
      setStatusResult(result)
      setStatusEmail('')
      setStatusPhone('')
    } catch (requestError) {
      setStatusError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo consultar el estado de la denuncia.',
      )
    } finally {
      setStatusLoading(false)
    }
  }

  const currentStatusIndex = availableStatuses.findIndex(
    ({ name }) => name === statusResult?.status,
  )
  const invalidStatusReportId =
    statusReportId.trim().length > 0 &&
    !reportIdPattern.test(statusReportId.trim())

  return (
    <main className="app-shell" id="inicio">
      <header className="page-heading">
        <p className="eyebrow">Denuncias y rescates de animales</p>
        <h1>Seguimiento de denuncias</h1>
      </header>
        <section className="search-section" id="reportes" aria-labelledby="search-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Encuentra y ayuda</p>
              <h2 id="search-title">Busca un reporte</h2>
            </div>
            <span className="demo-label"><i /> {error ? 'API no disponible' : loading ? 'Consultando MongoDB' : 'Datos desde MongoDB'}</span>
          </div>

          <div className="search-panel">
            <label className="search-box" htmlFor="report-search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
              <input
                id="report-search"
                type="search"
                value={query}
                onChange={(event) => {
                  setPage(1)
                  setQuery(event.target.value)
                }}
                placeholder="Busca por identificador, animal o título..."
              />
            </label>
            <div className="filter-row">
              <div className="type-filters" role="group" aria-label="Filtrar por tipo de reporte">
                {['Todos', 'Denuncia', 'Rescate'].map((type) => (
                  <button
                    className={typeFilter === type ? 'selected' : ''}
                    key={type}
                    type="button"
                    aria-pressed={typeFilter === type}
                    onClick={() => {
                      setPage(1)
                      setTypeFilter(type)
                    }}
                  >
                    {type === 'Todos' ? 'Todos' : `${type}s`}
                  </button>
                ))}
              </div>
              <label className="sr-only" htmlFor="status-filter">Filtrar por estado</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) => {
                  setPage(1)
                  setStatusFilter(event.target.value)
                }}
              >
                {statusOptions.map((status) => <option key={status}>{status}</option>)}
              </select>
              <label className="sr-only" htmlFor="date-filter">Filtrar por fecha</label>
              <input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(event) => {
                  setPage(1)
                  setDateFilter(event.target.value)
                }}
              />
              <label className="sr-only" htmlFor="sector-filter">Filtrar por sector</label>
              <input
                id="sector-filter"
                type="search"
                value={sectorFilter}
                onChange={(event) => {
                  setPage(1)
                  setSectorFilter(event.target.value)
                }}
                placeholder="Sector"
              />
            </div>
          </div>

          <section className="status-lookup" aria-labelledby="status-lookup-title">
            <div>
              <p className="eyebrow">Seguimiento privado</p>
              <h3 id="status-lookup-title">Consulta el estado de tu denuncia</h3>
              <p className="status-lookup-description">
                Ingresa el identificador y el correo o teléfono registrado. Si ingresas ambos, los dos deben coincidir.
              </p>
            </div>
            <form className="status-lookup-form" onSubmit={handleStatusLookup}>
              <label htmlFor="status-report-id">Identificador de la denuncia</label>
              <input
                id="status-report-id"
                type="text"
                autoComplete="off"
                maxLength={13}
                pattern="(?:DEN|RES)-[0-9]{4}-[0-9]{4}"
                title="Usa el formato DEN-AAAA-NNNN o RES-AAAA-NNNN."
                aria-describedby="status-report-id-hint"
                aria-invalid={invalidStatusReportId || undefined}
                required
                value={statusReportId}
                onChange={(event) => {
                  setStatusReportId(event.target.value.toUpperCase())
                  setStatusResult(null)
                  setStatusError('')
                }}
                placeholder="Ej.: DEN-2025-0842"
              />
              <small
                className={`status-lookup-hint${invalidStatusReportId ? ' is-invalid' : ''}`}
                id="status-report-id-hint"
                aria-live="polite"
              >
                {invalidStatusReportId
                  ? 'ID inválido. Usa el formato DEN-AAAA-NNNN o RES-AAAA-NNNN.'
                  : 'Formato: DEN-AAAA-NNNN o RES-AAAA-NNNN.'}
              </small>
              <div className="status-contact-fields">
                <div>
                  <label htmlFor="status-email">Correo registrado</label>
                  <input
                    id="status-email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    value={statusEmail}
                    onChange={(event) => {
                      setStatusEmail(event.target.value)
                      setStatusResult(null)
                      setStatusError('')
                    }}
                    placeholder="correo@ejemplo.cl"
                  />
                </div>
                <div>
                  <label htmlFor="status-phone">Teléfono registrado</label>
                  <input
                    id="status-phone"
                    type="tel"
                    autoComplete="tel"
                    maxLength={24}
                    value={statusPhone}
                    onChange={(event) => {
                      setStatusPhone(event.target.value)
                      setStatusResult(null)
                      setStatusError('')
                    }}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>
              <button type="submit" disabled={statusLoading}>
                {statusLoading ? 'Consultando...' : 'Consultar estado'}
              </button>
            </form>
            {statusError && <p className="status-lookup-error" role="alert">{statusError}</p>}
            {statusResult && (
              <div className="status-lookup-result" role="status" aria-live="polite">
                <p>
                  Estado actual de <strong>{statusResult.id}</strong>:{' '}
                  <strong>{statusResult.status}</strong>
                </p>
                {statusResult.statusHistory.length > 0 && (
                  <ol>
                    {statusResult.statusHistory.map((entry, index) => (
                      <li key={`${entry.status}-${entry.changedAt}-${index}`}>
                        <strong>{entry.status}</strong>
                        <time dateTime={entry.changedAt}>{formatStatusDate(entry.changedAt)}</time>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
            <p className="status-lookup-privacy">
              El correo y teléfono se usan solo para verificar la consulta y no se muestran en los resultados.
            </p>
          </section>

          <section className="available-statuses" aria-labelledby="available-statuses-title">
            <div className="available-statuses-heading">
              <p className="eyebrow">Seguimiento de denuncias</p>
              <h3 id="available-statuses-title">Estados disponibles</h3>
              <p>La denuncia avanza por estas etapas, en el orden indicado.</p>
            </div>
            <ol className="status-steps">
              {availableStatuses.map((status, index) => {
                const isCurrent = currentStatusIndex === index
                const isComplete = currentStatusIndex > index

                return (
                  <li
                    className={`status-step${isCurrent ? ' is-current' : ''}${isComplete ? ' is-complete' : ''}`}
                    key={status.name}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <span className="status-step-number" aria-hidden="true">{index + 1}</span>
                    <div>
                      <strong>{status.name}</strong>
                      <p>{status.description}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
            {statusResult && (
              <p className="status-step-current" role="status" aria-live="polite">
                Estado consultado: <strong>{statusResult.status}</strong>
              </p>
            )}
          </section>

          <div className="results-heading" aria-live="polite">
            <div>
              <h3>Reportes recientes</h3>
              <p>{loading ? 'Consultando...' : `${total} ${total === 1 ? 'resultado encontrado' : 'resultados encontrados'}`}</p>
            </div>
            <span className="sort-label">Más recientes ↓</span>
          </div>

          {error ? (
            <div className="empty-state error-state" role="alert">
              <span aria-hidden="true">!</span>
              <h3>No se pudo buscar</h3>
              <p>{error}</p>
              <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Reintentar</button>
            </div>
          ) : loading ? (
            <div className="loading-state" role="status">Consultando denuncias y rescates...</div>
          ) : reports.length ? (
            <div className="report-list">
              {reports.map((report) => (
                <article className="report-card" key={report.id}>
                  <div className={`report-avatar ${report.type.toLowerCase()}`} aria-hidden="true">
                    {report.animal === 'Perro' ? '🐕' : report.animal === 'Gato' ? '🐈' : '🕊'}
                  </div>
                  <div className="report-content">
                    <div className="report-tags">
                      <span className={`report-type ${report.type.toLowerCase()}`}>{report.type}</span>
                      <span className={`report-status ${report.status.toLowerCase().replace(/\s+/g, '-')}`}><i />{report.status}</span>
                    </div>
                    <h4>{report.title}</h4>
                    <div className="report-meta">
                      <span>▦ {formatReportDate(report.date)}</span>
                      <span>Sector: {report.sector}</span>
                    </div>
                  </div>
                  <div className="report-end">
                    <span className="report-id">{report.id}</span>
                    <button
                      type="button"
                      aria-expanded={expandedReportId === report.id}
                      aria-controls={`details-${report.id}`}
                      onClick={() => setExpandedReportId(expandedReportId === report.id ? null : report.id)}
                    >
                      {expandedReportId === report.id ? 'Ocultar detalles ↑' : 'Ver detalles ↓'}
                    </button>
                  </div>
                  {expandedReportId === report.id && (
                    <div className="report-expanded" id={`details-${report.id}`}>
                      <strong>Animal: {report.animal} · Estado: {report.status}</strong>
                      <p>La información detallada del caso se reserva para el equipo autorizado.</p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span aria-hidden="true">⌕</span>
              <h3>No encontramos denuncias o rescates</h3>
              <p>Prueba con otras palabras o quita algunos filtros para ver más resultados.</p>
              <button type="button" onClick={clearFilters}>Limpiar búsqueda</button>
            </div>
          )}

          {!loading && !error && pages > 1 && (
            <nav className="pagination" aria-label="Paginación de reportes">
              <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
                Anterior
              </button>
              <span>Página {page} de {pages}</span>
              <button type="button" disabled={page === pages} onClick={() => setPage((current) => current + 1)}>
                Siguiente
              </button>
            </nav>
          )}
        </section>

    </main>
  )
}

export default App
