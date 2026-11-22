import Denuncia from '../models/Denuncia.js';

export const registrarDenuncia = async (req, res) => {
    try {
        const { titulo, tipoAnimal, ubicacion, descripcion, denuncianteId } = req.body;
        
        if (!titulo || !tipoAnimal || !ubicacion || !descripcion) {
            return res.status(400).json({ error: 'Faltan datos obligatorios.' });
        }

        const nuevaDenuncia = new Denuncia({ titulo, tipoAnimal, ubicacion, descripcion, denuncianteId });
        const denunciaGuardada = await nuevaDenuncia.save();

        res.status(201).json({ mensaje: 'Denuncia registrada con éxito', denuncia: denunciaGuardada });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar la denuncia' });
    }
};