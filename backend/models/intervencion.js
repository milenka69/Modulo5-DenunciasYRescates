
import mongoose from 'mongoose';

const intervencionSchema = new mongoose.Schema({
  denunciaId: {
    type: String,
    required: true
  },

  fechaIntervencion: {
    type: Date,
    required: true
  },

  resultado: {
    type: String,
    required: true,
    enum: [
      'Rescatado',
      'No encontrado',
      'Fallecido',
      'Derivado a veterinario'
    ]
  },

  observaciones: {
    type: String,
    default: ''
  },

  registradoEn: {
    type: Date,
    default: Date.now
  }
});

const Intervencion = mongoose.model(
  'Intervencion',
  intervencionSchema,
  'intervenciones'
);

export default Intervencion;
