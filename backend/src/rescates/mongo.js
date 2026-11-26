// Repositorio de rescates en MongoDB. La unicidad la garantizan índices únicos parciales:
// a lo más un rescate ACTIVO por equipo y uno por denuncia, aunque lleguen peticiones simultáneas.
import mongoose from 'mongoose'
import { ESTADOS_RESCATE_ACTIVOS } from './dominio.js'

const esquema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  denuncia_id: { type: Number, required: true },
  equipo_id: { type: Number, required: true },
  animal_id: { type: String, default: null },
  lugar: { type: String, required: true },
  estado: { type: String, required: true, enum: ['pendiente', 'en_camino', 'rescatado', 'fallido', 'cancelado', 'completado'] },
  activo: { type: Boolean, required: true }, // true mientras el estado está en ESTADOS_RESCATE_ACTIVOS
  fecha_asignacion: { type: String, required: true },
}, { versionKey: false })
esquema.index({ equipo_id: 1 }, { unique: true, partialFilterExpression: { activo: true } })
esquema.index({ denuncia_id: 1 }, { unique: true, partialFilterExpression: { activo: true } })

const Rescate = mongoose.models.Rescate || mongoose.model('Rescate', esquema)
const Contador = mongoose.models.ContadorRescate || mongoose.model('ContadorRescate',
  new mongoose.Schema({ _id: String, n: Number }, { versionKey: false }))

const limpio = (d) => { const { _id, activo, ...r } = d.toObject(); return r }

export async function prepararMongo() { await Rescate.init() } // crea los índices antes de recibir tráfico

export function rescatesEnMongo() {
  return {
    async equiposOcupados() { return (await Rescate.find({ activo: true }, 'equipo_id').lean()).map((r) => r.equipo_id) },
    async activoDeDenuncia(id) { return Rescate.findOne({ denuncia_id: id, activo: true }, '-_id id').lean() },
    async crear(datos) {
      const { n } = await Contador.findOneAndUpdate({ _id: 'rescates' }, { $inc: { n: 1 } }, { upsert: true, new: true })
      try {
        const doc = await Rescate.create({ ...datos, id: n, activo: ESTADOS_RESCATE_ACTIVOS.includes(datos.estado) })
        return { rescate: limpio(doc) }
      } catch (e) {
        if (e?.code !== 11000) throw e
        return { conflicto: e.keyPattern?.denuncia_id ? 'denuncia' : 'equipo' }
      }
    },
    async eliminar(id) { await Rescate.deleteOne({ id }) },
  }
}
