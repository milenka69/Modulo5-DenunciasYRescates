import { randomBytes } from 'node:crypto'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import denunciasRoutes from './routes/denuncias.js'


dotenv.config()
const app = express()
const port = process.env.PORT || 4000
const nucleoUrl = (process.env.NUCLEO_URL || 'https://nucleo-tr.onrender.com').replace(/\/$/, '')
app.disable('x-powered-by')
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '10kb' }))

app.get('/api/denuncias/salud', (req, res) => {
  res.json({ estado: 'activo', modulo: 'Denuncias y Rescate', mongodb: mongoose.connection.readyState === 1 ? 'conectado' : 'sin conexión' })
})


const production = process.env.NODE_ENV === 'production'
const origin = process.env.FRONTEND_URL || 'http://localhost:5173'
if (production && (!origin.startsWith('https://') || !nucleoUrl.startsWith('https://'))) throw new Error('Producción requiere HTTPS en FRONTEND_URL y NUCLEO_URL')
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1)
const name = production ? '__Host-m5' : 'm5'
const sessions = new Map(), attempts = new Map()
const fail = (res, status, codigo, mensaje) => res.status(status).json({ error: { codigo, mensaje } })
const idOf = req => (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(name + '='))?.slice(name.length + 1)
function cookie(res, id = '', maxAge) { res.cookie(name, id, { httpOnly: true, secure: production, sameSite: 'strict', path: '/', ...(maxAge !== undefined ? { maxAge } : {}) }) }
setInterval(() => {
  for (const [k,v] of sessions) if (v.expires <= Date.now()) sessions.delete(k)
  for (const [k,v] of attempts) if (v.reset <= Date.now()) attempts.delete(k)
}, 60000).unref()
app.use('/api/auth', (req,res,next) => {
  res.set('Cache-Control','no-store'); res.set('X-Content-Type-Options','nosniff')
  if (production) {
    res.set('Strict-Transport-Security','max-age=31536000')
    if (!req.secure) return fail(res,400,'HTTPS_REQUERIDO','Se requiere HTTPS.')
  }
  if (!['GET','HEAD'].includes(req.method) && (req.headers.origin !== origin || req.headers['x-requested-with'] !== 'Modulo5')) return fail(res,403,'ORIGEN_INVALIDO','Petición no autorizada.')
  next()
})
async function nucleus(method,token,body) {
  const response = await fetch(nucleoUrl + '/api/nucleo/sesiones' + (method === 'GET' ? '/actual' : ''), {
    method, headers: { 'Content-Type':'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000), redirect:'error'
  })
  return { response, data: await response.json() }
}
app.post('/api/auth/sesiones', async (req,res) => {
  // El limite IP se aplica incluso a peticiones con datos invalidos.
  const {rut,clave,recordar} = req.body || {}
  for (const [key,limit] of [['ip:'+req.ip,30], ['rut:'+(typeof rut === 'string' ? rut.slice(0,12).toUpperCase() : ''),10]]) {
    let entry = attempts.get(key)
    if (!entry || entry.reset <= Date.now()) {
      if (attempts.size >= 10000) return fail(res,429,'LIMITE_INTENTOS','Inténtalo más tarde.')
      entry = { count:0, reset:Date.now()+900000 }; attempts.set(key,entry)
    }
    if (++entry.count > limit) { res.set('Retry-After',String(Math.ceil((entry.reset-Date.now())/1000))); return fail(res,429,'LIMITE_INTENTOS','Demasiados intentos. Inténtalo más tarde.') }
  }
  if (typeof rut !== 'string' || !/^\d{7,8}-[\dkK]$/.test(rut) || typeof clave !== 'string' || !clave.length || clave.length > 128 || (recordar !== undefined && typeof recordar !== 'boolean')) return fail(res,400,'DATOS_INVALIDOS','Revisa el RUT y la clave (máximo 128 caracteres).')
  try {
    const {response,data} = await nucleus('POST',null,{rut,clave})
    if ([400,401,404].includes(response.status)) return fail(res,401,'CREDENCIALES_INVALIDAS','RUT o clave incorrectos.')
    if (!response.ok) return fail(res,503,'NUCLEO_NO_DISPONIBLE','No se pudo iniciar sesión.')
    const expires = Date.parse(data.expira)
    if (typeof data.token !== 'string' || !Number.isFinite(expires) || expires <= Date.now() || typeof data.rut !== 'string' || typeof data.nombre !== 'string') throw new Error('Sesión inválida')
    if (!['vecino','comunitario','funcionario'].includes(data.perfil)) return fail(res,403,'PERFIL_NO_AUTORIZADO','Perfil no autorizado.')
    if (sessions.size >= 10000) return fail(res,503,'CAPACIDAD','Inténtalo más tarde.')
    sessions.delete(idOf(req))
    const id = randomBytes(32).toString('hex'); sessions.set(id,{token:data.token,expires})
    cookie(res,id,recordar ? expires-Date.now() : undefined)
    res.status(201).json({rut:data.rut,nombre:data.nombre,perfil:data.perfil,expira:data.expira})
  } catch { fail(res,503,'NUCLEO_NO_DISPONIBLE','No se pudo contactar al núcleo.') }
})
// Aplicar a cada futura ruta protegida; verificar además propiedad del recurso.
export function requiereSesion(...perfiles) {
  return async (req,res,next) => {
    const id = idOf(req), session = sessions.get(id)
    if (!session || session.expires <= Date.now()) { sessions.delete(id); cookie(res,'',0); return fail(res,401,'SESION_INVALIDA','La sesión expiró. Ingresa nuevamente.') }
    try {
      const {response,data} = await nucleus('GET',session.token)
      if (!response.ok) {
        if (response.status === 401) { sessions.delete(id); cookie(res,'',0) }
        return fail(res,response.status === 401 ? 401 : 503,'SESION_INVALIDA','No se pudo validar la sesión.')
      }
      if (!perfiles.includes(data.perfil)) return fail(res,403,'PERFIL_NO_AUTORIZADO','Perfil no autorizado.')
      req.usuario = data; req.expira = new Date(session.expires).toISOString(); next()
    } catch { fail(res,503,'NUCLEO_NO_DISPONIBLE','No se pudo validar la sesión.') }
  }
}
app.get('/api/auth/sesiones/actual',requiereSesion('vecino','comunitario','funcionario'),(req,res) => res.json({rut:req.usuario.rut,nombre:req.usuario.nombre,perfil:req.usuario.perfil,expira:req.expira}))
app.delete('/api/auth/sesiones/actual',(req,res) => { sessions.delete(idOf(req)); cookie(res,'',0); res.status(204).end() })

// Colocar API de denuncias y rescates aquí al tener el contrato listo.
app.use('/api/denuncias', denunciasRoutes)
app.use((req, res) => res.status(404).json({ error: { codigo: 'RUTA_NO_ENCONTRADA', mensaje: 'La ruta solicitada no existe.' } }))
app.use((err, req, res, next) => {
  const status = err.status === 400 ? 400 : 500
  res.status(status).json({ error: { codigo: status === 400 ? 'JSON_INVALIDO' : 'ERROR_INTERNO', mensaje: status === 400 ? 'El cuerpo de la petición no es válido.' : 'Ocurrió un error interno.' } })
})

async function iniciar() {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    console.log('MongoDB conectado')
  }
  app.listen(port, () => console.log(`API del módulo 5 en http://localhost:${port}`))
}
iniciar().catch(() => {
  console.error('No se pudo iniciar la API. Revisa MONGODB_URI y la disponibilidad de MongoDB.')
  process.exitCode = 1
})
