import mongoose from 'mongoose';

const denunciaSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    titulo: { type: String, required: true, trim: true },
    tipoAnimal: { type: String, required: true, enum: ['Perro', 'Gato', 'Otro'] },
    ubicacion: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    estado: { type: String, default: 'Ingresada' },
    fechaRegistro: { type: Date, default: Date.now },
    denuncianteId: { type: String, required: true }
});

export default mongoose.model('Denuncia', denunciaSchema);