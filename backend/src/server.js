import 'dotenv/config'
import mongoose from 'mongoose'
import app from './app.js'
import { assertContactLookupSecret } from './utils/contactVerification.js'

const port = Number(process.env.PORT || 3000)
const mongoUri = process.env.MONGODB_URI

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT debe ser un número entero entre 1 y 65535.')
}
if (!mongoUri) {
  throw new Error('Configura MONGODB_URI antes de iniciar la API.')
}
assertContactLookupSecret()

await mongoose.connect(mongoUri)
app.listen(port, () => {
  console.log(`API disponible en http://localhost:${port}`)
})
