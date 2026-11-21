
import express from 'express';
import Intervencion from '../models/intervencion.js';
import validarToken from '../middleware/validarToken.js';

const router = express.Router();

// Consultar historial de una denuncia
router.get('/:denunciaId', async (req, res) => {
  try {
    const intervenciones = await Intervencion
      .find({ denunciaId: req.params.denunciaId })
      .sort({ fechaIntervencion: -1 });

    res.status(200).json(intervenciones);

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al consultar las intervenciones',
      error: error.message
    });
  }
});

// Registrar una intervención
router.post('/', validarToken, async (req, res) => {
  try {
    const { denunciaId, fechaIntervencion, resultado, observaciones } = req.body;

    // Validar campos obligatorios
    if (!denunciaId || !fechaIntervencion || !resultado) {
      return res.status(400).json({
        mensaje: 'Debes completar los campos obligatorios'
      });
    }

    // Crear intervención
    const nuevaIntervencion = new Intervencion({
      denunciaId,
      fechaIntervencion,
      resultado,
      observaciones
    });

    // Guardar en MongoDB
    await nuevaIntervencion.save();

    res.status(201).json({
      mensaje: 'Intervención registrada correctamente',
      intervencion: nuevaIntervencion
    });

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al registrar la intervención',
      error: error.message
    });
  }
});

export default router;
