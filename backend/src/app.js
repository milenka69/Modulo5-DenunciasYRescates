import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import reportsRouter from './routes/reports.js'
import { ContactVerificationError } from './utils/contactVerification.js'
import { SearchParameterError } from './services/reportSearch.js'

const app = express()

app.disable('x-powered-by')
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use('/api', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  })
  next()
})
app.use(express.json({ limit: '16kb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 })
})

app.use('/api/denuncias', reportsRouter)

app.use((req, res) => {
  res.status(404).json({ error: 'No se encontró el recurso solicitado.' })
})

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  if (error instanceof SearchParameterError) {
    return res.status(error.statusCode).json({ error: error.message })
  }
  if (error instanceof ContactVerificationError) {
    return res.status(error.statusCode).json({ error: error.message })
  }

  console.error(error)
  return res.status(500).json({ error: 'No se pudo completar la consulta.' })
})

export default app
