import mongoose from 'mongoose';

const rescateSchema = new mongoose.Schema({
  rescateId: {
    type: String,
    required: true,
    unique: true
  },
  estado: {
    type: String,
    required: true,
    enum: [
      'ingresada',
      'en_evaluacion',
      'asignada',
      'en_terreno',
      'resuelta',
      'cerrada',
      'descartada',
      'sin_ubicar'
    ]
  },
  actualizadoEn: {
    type: Date,
    default: Date.now
  }
});

const Rescate = mongoose.model('Rescate', rescateSchema, 'rescates');

export default Rescate;
