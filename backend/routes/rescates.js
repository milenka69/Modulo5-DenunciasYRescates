import express from 'express';
import Intervencion from '../models/intervencion.js';
import Rescate from '../models/rescate.js';

const router = express.Router();

const estadosPermitidos = [
  'ingresada',
  'en_evaluacion',
  'asignada',
  'en_terreno',
  'resuelta',
  'cerrada',
  'descartada',
  'sin_ubicar'
];

const resultadosPermitidos = [
  'Rescatado',
  'No encontrado',
  'Fallecido',
  'Derivado a veterinario'
];

router.patch('/:id/estado', async (req, res) => {
  try {
    const rescateId = req.params.id?.trim();
    const { estado, fechaIntervencion, resultado, observaciones } = req.body;

    if (!rescateId) {
      return res.status(400).json({ mensaje: 'Debes indicar el identificador del rescate.' });
    }

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        mensaje: 'El estado seleccionado no es válido.',
        estadosPermitidos
      });
    }

    let intervencion = null;

    if (fechaIntervencion || resultado || observaciones !== undefined) {
      if (!fechaIntervencion || !resultado) {
        return res.status(400).json({
          mensaje: 'Debes completar la fecha y el resultado de la intervención.'
        });
      }

      const fecha = new Date(fechaIntervencion);

      if (Number.isNaN(fecha.getTime())) {
        return res.status(400).json({ mensaje: 'La fecha de intervención no es válida.' });
      }

      if (!resultadosPermitidos.includes(resultado)) {
        return res.status(400).json({
          mensaje: 'El resultado seleccionado no es válido.',
          resultadosPermitidos
        });
      }

      if (observaciones !== undefined && typeof observaciones !== 'string') {
        return res.status(400).json({ mensaje: 'Las observaciones deben ser texto.' });
      }

      intervencion = await Intervencion.create({
        denunciaId: rescateId,
        fechaIntervencion: fecha,
        resultado,
        observaciones: observaciones?.trim() || ''
      });
    }

    const rescate = await Rescate.findOneAndUpdate(
      { rescateId },
      { rescateId, estado, actualizadoEn: new Date() },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      mensaje: 'Estado actualizado correctamente.',
      rescate,
      ...(intervencion ? { intervencion } : {})
    });
  } catch (error) {
    console.error('Error al actualizar el estado del rescate:', error);

    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'Los datos enviados no son válidos.' });
    }

    return res.status(500).json({
      mensaje: 'Ocurrió un error al actualizar el estado del rescate.'
    });
  }
});

export default router;
