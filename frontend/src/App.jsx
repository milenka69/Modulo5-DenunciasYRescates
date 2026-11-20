
import { useState } from 'react';
import './App.css';

function App() {
  // Estado de la denuncia
  const [estado, setEstado] = useState('asignada');

  // Datos de la intervención
  const [fecha, setFecha] = useState('');
  const [resultado, setResultado] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Historial de intervenciones
  const [historial, setHistorial] = useState([]);

  // Control del menú lateral
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Mensajes
  const [mensaje, setMensaje] = useState('');

  const nombresEstados = {
  ingresada: 'Ingresada',
  en_evaluacion: 'En evaluación',
  asignada: 'Asignada',
  en_terreno: 'En terreno',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada',
  descartada: 'Descartada',
  sin_ubicar: 'Sin ubicar'
};

  // Iniciar intervención
  const iniciarIntervencion = () => {
    setEstado('en_terreno');
    setMensaje('La intervención ha comenzado correctamente.');
  };

  // Guardar intervención
  const guardarIntervencion = (event) => {
    event.preventDefault();

    if (estado !== 'en_terreno') {
      setMensaje('Primero debes iniciar la intervención.');
      return;
    }

    if (!fecha || !resultado) {
      setMensaje('Completa la fecha y el resultado de la misión.');
      return;
    }

    const nuevaIntervencion = {
      id: Date.now(),
      fecha,
      resultado,
      observaciones
    };

    setHistorial([nuevaIntervencion, ...historial]);

    setMensaje('La intervención se ha guardado correctamente.');

    setFecha('');
    setResultado('');
    setObservaciones('');
  };

  return (
    <>
      <main className="contenedor">
        <header className="encabezado">
          <div>
            <p className="subtitulo">MÓDULO DE RESCATES</p>
            <h1>Registrar resultado del rescate</h1>
            <p className="descripcion">
              Registra la información correspondiente a la intervención realizada.
            </p>
          </div>
        </header>

        {/* Estado de la denuncia */}
        <section className="tarjeta estado-tarjeta">
          <div>
            <h2>Estado de la denuncia</h2>
            <span className={`estado ${
              estado === 'en_terreno' ? 'estado-rescate' : 'estado-pendiente'
            }`}>
              {nombresEstados[estado] || estado}
            </span>
          </div>
          {estado === 'asignada' && (
            <button
              type="button"
              className="boton-iniciar"
              onClick={iniciarIntervencion}
            >
              ▶ Iniciar
            </button>
          )}
        </section>

        {/* Formulario de intervención */}
        <section className="tarjeta">
          <h2>Datos de la intervención</h2>

          <form onSubmit={guardarIntervencion}>
            <div className="campo">
              <label htmlFor="fecha">Fecha de intervención</label>
              <input
                type="date"
                id="fecha"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="resultado">Resultado de la misión</label>
              <select
                id="resultado"
                value={resultado}
                onChange={(event) => setResultado(event.target.value)}
                required
              >
                <option value="">Selecciona un resultado</option>
                <option value="Rescatado">Rescatado</option>
                <option value="No encontrado">No encontrado</option>
                <option value="Fallecido">Fallecido</option>
                <option value="Derivado a veterinario">
                  Derivado a veterinario
                </option>
              </select>
            </div>

            <div className="campo">
              <label htmlFor="observaciones">Observaciones</label>
              <textarea
                id="observaciones"
                rows="4"
                placeholder="Escribe las observaciones de la intervención..."
                value={observaciones}
                onChange={(event) => setObservaciones(event.target.value)}
              />
            </div>

            <button type="submit" className="boton-guardar">
              Guardar intervención
            </button>
          </form>

          {mensaje && (
            <p className="mensaje" role="status">
              {mensaje}
            </p>
          )}
        </section>

        {/* Historial */}
        <section className="tarjeta">
          <h2>Historial de intervenciones</h2>

          {historial.length === 0 ? (
            <p className="sin-registros">
              Todavía no hay intervenciones registradas.
            </p>
          ) : (
            <div className="historial">
              {historial.map((intervencion) => (
                <article className="registro" key={intervencion.id}>
                  <div className="registro-encabezado">
                    <strong>{intervencion.resultado}</strong>
                    <span>{intervencion.fecha}</span>
                  </div>

                  <p>
                    {intervencion.observaciones || 'Sin observaciones.'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Botón lateral para abrir el menú */}
      {!menuAbierto && (
        <button
          type="button"
          className="abrir-menu"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir información de la denuncia"
          title="Ver información"
        >
          ❮
        </button>
      )}

      {/* Fondo oscuro detrás del menú */}
      {menuAbierto && (
        <div
          className="fondo-menu"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* Cajón lateral derecho */}
      <aside className={`menu-lateral ${menuAbierto ? 'menu-visible' : ''}`}>
        <div className="menu-encabezado">
          <h2>Información de la denuncia</h2>

          <button
            type="button"
            className="cerrar-menu"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
          >
            ×
          </button>
        </div>

        <div className="menu-contenido">
          {/* Equipo asignado */}
          <section className="informacion-seccion">
            <div className="informacion-titulo">
              <span className="icono-informacion">👥</span>
              <h3>Equipo asignado</h3>
            </div>

            <div className="informacion-dato">
              <span>Nombre del equipo</span>
              <strong>Equipo de rescate N° 01</strong>
            </div>

            <div className="informacion-dato">
              <span>Responsable</span>
              <strong>Nombre del responsable</strong>
            </div>

            <div className="informacion-dato">
              <span>Integrantes</span>
              <ul className="lista-integrantes">
                <li>Integrante 1</li>
                <li>Integrante 2</li>
                <li>Integrante 3</li>
              </ul>
            </div>
          </section>

          {/* Detalles de la denuncia */}
          <section className="informacion-seccion">
            <div className="informacion-titulo">
              <span className="icono-informacion">📋</span>
              <h3>Detalles de la denuncia</h3>
            </div>

            <div className="informacion-dato">
              <span>Código de denuncia</span>
              <strong>DEN-001</strong>
            </div>

            <div className="informacion-dato">
              <span>Animal</span>
              <strong>Perro</strong>
            </div>

            <div className="informacion-dato">
              <span>Ubicación</span>
              <strong>Dirección de ejemplo</strong>
            </div>

            <div className="informacion-dato">
              <span>Descripción</span>
              <strong>
                Animal reportado en situación de abandono.
              </strong>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}

export default App;
