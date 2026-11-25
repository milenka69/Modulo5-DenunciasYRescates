import { useState } from 'react';

export default function RegistroDenuncia({ usuario, onDenunciaCreada }) {
  const [titulo, setTitulo] = useState('');
  const [tipoAnimal, setTipoAnimal] = useState('Perro');
  const [ubicacion, setUbicacion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    // #58 Validación de campos obligatorios
    if (!titulo.trim() || !tipoAnimal.trim() || !ubicacion.trim() || !descripcion.trim()) {
      setError('Por favor completa todos los campos obligatorios antes de guardar.');
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await fetch('/api/denuncias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          titulo: titulo.trim(),
          tipoAnimal,
          ubicacion: ubicacion.trim(),
          descripcion: descripcion.trim(),
          denuncianteId: usuario?.rut || usuario?.nombre || 'vecino_sesion'
        })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.error || 'No se pudo registrar la denuncia.');
        return;
      }

      const d = datos.denuncia;
      const fechaFormateada = d?.fechaRegistro
        ? new Date(d.fechaRegistro).toLocaleString('es-CL')
        : new Date().toLocaleString('es-CL');

      // #60 Mostrar resultado del registro con ID, fecha/hora y estado inicial
      setMensaje(
        `¡Éxito! Denuncia #${d.id} registrada el ${fechaFormateada}. Estado inicial: ${d.estado}.`
      );

      setTitulo('');
      setTipoAnimal('Perro');
      setUbicacion('');
      setDescripcion('');

      if (onDenunciaCreada) {
        onDenunciaCreada(d);
      }
    } catch {
      setError('Error de conexión con el servidor al guardar la denuncia.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '1.5rem', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Registrar Denuncia</h2>

      {mensaje && (
        <div role="status" style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px', background: '#d1fae5', color: '#065f46', textAlign: 'center' }}>
          {mensaje}
        </div>
      )}

      {error && (
        <div role="alert" style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <form onSubmit={manejarEnvio} noValidate>
        <div style={{ marginBottom: '0.85rem' }}>
          <label htmlFor="titulo" style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem' }}>Título breve:</label>
          <input
            id="titulo"
            type="text"
            placeholder="Ej: Perro abandonado en la plaza"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ marginBottom: '0.85rem' }}>
          <label htmlFor="tipoAnimal" style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem' }}>Tipo de Animal:</label>
          <select
            id="tipoAnimal"
            value={tipoAnimal}
            onChange={(e) => setTipoAnimal(e.target.value)}
            required
            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="Perro">Perro</option>
            <option value="Gato">Gato</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div style={{ marginBottom: '0.85rem' }}>
          <label htmlFor="ubicacion" style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem' }}>Ubicación exacta:</label>
          <input
            id="ubicacion"
            type="text"
            placeholder="Calle, número, ciudad"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            required
            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="descripcion" style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem' }}>Descripción detallada:</label>
          <textarea
            id="descripcion"
            rows="3"
            placeholder="Describe la situación y el estado del animal"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <button
          type="submit"
          disabled={enviando}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#0369a1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
        >
          {enviando ? 'Guardando...' : 'Guardar Denuncia'}
        </button>
      </form>
    </div>
  );
}