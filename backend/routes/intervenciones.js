
import express from 'express';
import Intervencion from '../models/intervencion.js';

const router = express.Router();

const resultadosPermitidos = [
  'Rescatado',
  'No encontrado',
  'Fallecido',
  'Derivado a veterinario'
];

// Consultar historial de una denuncia
router.get('/:denunciaId', async (req, res) => {
  try {
    const { denunciaId } = req.params;

    if (!denunciaId || !denunciaId.trim()) {
      return res.status(400).json({
        mensaje: 'Debes indicar el identificador de la denuncia.'
      });
    }

    const intervenciones = await Intervencion
      .find({ denunciaId: denunciaId.trim() })
      .sort({ fechaIntervencion: -1 });

    return res.status(200).json({
      mensaje: 'Historial consultado correctamente.',
      total: intervenciones.length,
      intervenciones
    });

  } catch (error) {
    console.error('Error al consultar intervenciones:', error);

    return res.status(500).json({
      mensaje: 'Ocurrió un error al consultar el historial.'
    });
  }
});

// Registrar una intervención
router.post('/', async (req, res) => {
  try {
    const {
      denunciaId,
      fechaIntervencion,
      resultado,
      observaciones
    } = req.body;

    // Validar campos obligatorios
    if (
      typeof denunciaId !== 'string' ||
      !denunciaId.trim() ||
      !fechaIntervencion ||
      !resultado
    ) {
      return res.status(400).json({
        mensaje: 'Debes completar los campos obligatorios.'
      });
    }

    // Validar fecha
    const fecha = new Date(fechaIntervencion);

    if (Number.isNaN(fecha.getTime())) {
      return res.status(400).json({
        mensaje: 'La fecha de intervención no es válida.'
      });
    }

    // Validar resultado
    if (!resultadosPermitidos.includes(resultado)) {
      return res.status(400).json({
        mensaje: 'El resultado seleccionado no es válido.',
        resultadosPermitidos
      });
    }

    // Validar observaciones
    if (
      observaciones !== undefined &&
      typeof observaciones !== 'string'
    ) {
      return res.status(400).json({
        mensaje: 'Las observaciones deben ser texto.'
      });
    }

    // Crear intervención
    const nuevaIntervencion = new Intervencion({
      denunciaId: denunciaId.trim(),
      fechaIntervencion: fecha,
      resultado,
      observaciones: observaciones?.trim() || ''
    });

    await nuevaIntervencion.save();

    return res.status(201).json({
      mensaje: 'Intervención registrada correctamente.',
      intervencion: nuevaIntervencion
    });

  } catch (error) {
    console.error('Error al registrar intervención:', error);

    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        mensaje: 'Los datos enviados no son válidos.'
      });
    }

    return res.status(500).json({
      mensaje: 'Ocurrió un error al registrar la intervención.'
    });
  }
});

export default router;
