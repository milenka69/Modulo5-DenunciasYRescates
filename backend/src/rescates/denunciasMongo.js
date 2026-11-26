// Adaptador de SOLO el acceso que necesita HU-05 al módulo de denuncias (que es de otra persona).
// SUPUESTO: colección "denuncias" con un campo numérico `id` y un campo `estado`.
// Si el módulo de denuncias usa otro esquema, solo hay que cambiar este archivo.
import mongoose from 'mongoose'

const col = () => mongoose.connection.collection('denuncias')
export const denunciasDesdeMongo = {
  async buscar(id) { return col().findOne({ id }, { projection: { _id: 0, id: 1, estado: 1 } }) },
  async cambiarEstado(id, estado) { await col().updateOne({ id }, { $set: { estado } }) },
}
