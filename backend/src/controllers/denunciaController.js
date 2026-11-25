import mongoose from 'mongoose';
import Denuncia from '../models/Denuncia.js';

const denunciasMemoria = [];
let contadorMemoriaId = 1;
const TIPOS_VALIDOS = ['Perro', 'Gato', 'Otro'];

export const registrarDenuncia = async (req, res) => {
    try {
        const titulo = typeof req.body?.titulo === 'string' ? req.body.titulo.trim() : '';
        const tipoAnimal = typeof req.body?.tipoAnimal === 'string' ? req.body.tipoAnimal.trim() : '';
        const ubicacion = typeof req.body?.ubicacion === 'string' ? req.body.ubicacion.trim() : '';
        const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';
        const denuncianteId =
            typeof req.body?.denuncianteId === 'string' && req.body.denuncianteId.trim()
                ? req.body.denuncianteId.trim()
                : 'usuario_sesion';

        // #58 Validar campos obligatorios
        if (!titulo || !tipoAnimal || !ubicacion || !descripcion) {
            return res.status(400).json({ error: 'Todos los campos obligatorios deben completarse.' });
        }

        if (!TIPOS_VALIDOS.includes(tipoAnimal)) {
            return res.status(400).json({ error: 'El tipo de animal debe ser Perro, Gato u Otro.' });
        }

        const ahora = new Date();

        // Si MongoDB está conectado, guarda en base de datos
        if (mongoose.connection.readyState === 1) {
            const ultima = await Denuncia.findOne().sort({ id: -1 }).lean();
            const nuevoId = (ultima?.id || 0) + 1;

            const nuevaDenuncia = new Denuncia({
                id: nuevoId,
                titulo,
                tipoAnimal,
                ubicacion,
                descripcion,
                estado: 'Ingresada',
                fechaRegistro: ahora,
                denuncianteId
            });

            const denunciaGuardada = await nuevaDenuncia.save();
            return res.status(201).json({
                mensaje: 'Denuncia registrada con éxito',
                denuncia: denunciaGuardada
            });
        }

        // Respaldo en memoria si .env no tiene MONGODB_URI
        const denunciaTemporal = {
            id: contadorMemoriaId++,
            titulo,
            tipoAnimal,
            ubicacion,
            descripcion,
            estado: 'Ingresada',
            fechaRegistro: ahora.toISOString(),
            denuncianteId
        };
        denunciasMemoria.unshift(denunciaTemporal);

        return res.status(201).json({
            mensaje: 'Denuncia registrada con éxito',
            denuncia: denunciaTemporal
        });
    } catch (error) {
        console.error('Error al registrar denuncia:', error);
        return res.status(500).json({ error: 'Error al registrar la denuncia' });
    }
};

export const obtenerDenuncias = async (req, res) => {
    try {
        const { estado, tipo, q } = req.query;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const size = Math.min(Math.max(parseInt(req.query.size, 10) || 10, 1), 100);

        let lista = [];
        if (mongoose.connection.readyState === 1) {
            lista = await Denuncia.find().sort({ fechaRegistro: -1, id: -1 }).lean();
        } else {
            lista = [...denunciasMemoria];
        }

        if (estado) {
            lista = lista.filter((d) => d.estado?.toLowerCase() === String(estado).toLowerCase());
        }
        if (tipo) {
            lista = lista.filter((d) => d.tipoAnimal?.toLowerCase() === String(tipo).toLowerCase());
        }
        if (q) {
            const texto = String(q).toLowerCase();
            lista = lista.filter(
                (d) =>
                    d.titulo?.toLowerCase().includes(texto) ||
                    d.ubicacion?.toLowerCase().includes(texto) ||
                    d.descripcion?.toLowerCase().includes(texto)
            );
        }

        const inicio = (page - 1) * size;
        return res.json({
            data: lista.slice(inicio, inicio + size),
            page,
            size,
            total: lista.length
        });
    } catch (error) {
        console.error('Error al obtener denuncias:', error);
        return res.status(500).json({ error: 'Error al obtener las denuncias' });
    }
};