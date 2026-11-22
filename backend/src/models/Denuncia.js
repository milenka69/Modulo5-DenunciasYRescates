import mongoose from 'mongoose';

const denunciaSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    tipoAnimal: { type: String, required: true, enum: ['Perro', 'Gato', 'Otro'] },
    ubicacion: { type: String, required: true },
    descripcion: { type: String, required: true },
    estado: { type: String, default: 'Ingresada' },
    fechaRegistro: { type: Date, default: Date.now },
    denuncianteId: { type: String, required: true } 
});

export default mongoose.model('Denuncia', denunciaSchema);