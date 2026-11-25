import { useState } from 'react';

const RegistroDenuncia = () => {
    // 1. Estado para guardar los datos del formulario
    const [formData, setFormData] = useState({
        titulo: '', 
        tipoAnimal: 'Perro', 
        ubicacion: '', 
        descripcion: '', 
        denuncianteId: 'vecino_123' // ID temporal hasta que se una con el inicio de sesión
    });
    
    // 2. Estado para mostrar mensajes al usuario (éxito o error)
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    // 3. Función para actualizar los datos mientras el usuario escribe
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 4. Función que se ejecuta al presionar "Guardar Denuncia"
    const handleSubmit = async (e) => {
        e.preventDefault(); // Evita que la página se recargue
        setMensaje({ texto: 'Registrando denuncia...', tipo: 'loading' });

        try {
            // Conecta con tu backend
            const respuesta = await fetch('http://localhost:4000/api/denuncias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            
            const data = await respuesta.json();
            
            if (respuesta.ok) {
                // Muestra éxito y limpia el formulario
                setMensaje({ texto: `¡Éxito! ${data.mensaje}. Estado inicial: Ingresada.`, tipo: 'exito' });
                setFormData({ titulo: '', tipoAnimal: 'Perro', ubicacion: '', descripcion: '', denuncianteId: 'vecino_123' });
            } else {
                // Muestra error de validación
                setMensaje({ texto: `Error: ${data.error}`, tipo: 'error' });
            }
        } catch (error) {
            setMensaje({ texto: 'Error de conexión con el servidor. Verifica que el backend esté encendido.', tipo: 'error' });
        }
    };

    return (
        <div style={{ padding: '40px', backgroundColor: '#f0f4f8', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 51, 102, 0.1)', width: '100%', maxWidth: '500px' }}>
                <h2 style={{ color: '#003366', textAlign: 'center', marginBottom: '20px' }}>Registrar Denuncia</h2>
                
                {/* Mensaje de resultado para el usuario */}
                {mensaje.texto && (
                    <div style={{ 
                        padding: '10px', marginBottom: '15px', borderRadius: '4px', textAlign: 'center',
                        backgroundColor: mensaje.tipo === 'exito' ? '#d4edda' : (mensaje.tipo === 'error' ? '#f8d7da' : '#e2e3e5'),
                        color: mensaje.tipo === 'exito' ? '#155724' : (mensaje.tipo === 'error' ? '#721c24' : '#383d41')
                    }}>
                        {mensaje.texto}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    <label style={{ color: '#003366', fontWeight: 'bold' }}>Título breve:
                        <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} required placeholder="Ej: Perro abandonado en la plaza" 
                            style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} />
                    </label>

                    <label style={{ color: '#003366', fontWeight: 'bold' }}>Tipo de Animal:
                        <select name="tipoAnimal" value={formData.tipoAnimal} onChange={handleChange} required
                            style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}>
                            <option value="Perro">Perro</option>
                            <option value="Gato">Gato</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </label>

                    <label style={{ color: '#003366', fontWeight: 'bold' }}>Ubicación exacta:
                        <input type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} required placeholder="Calle, número, ciudad" 
                            style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} />
                    </label>

                    <label style={{ color: '#003366', fontWeight: 'bold' }}>Descripción detallada:
                        <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} required placeholder="Describe la situación y el estado del animal" rows="4" 
                            style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', resize: 'vertical' }}></textarea>
                    </label>

                    <button type="submit" style={{ backgroundColor: '#00509e', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', marginTop: '10px', transition: 'background 0.3s' }}>
                        Guardar Denuncia
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegistroDenuncia;