import express from 'express'
import { asignarEquipo, listarEquipos } from './dominio.js'

const fail = (res, status, codigo, mensaje) => res.status(status).json({ error: { codigo, mensaje } })

// `proteger` es requiereSesion de server.js; `origen` el control anti-CSRF de las rutas que modifican datos.
export function routerRescates({ proteger, origen, repos }) {
  const router = express.Router()
  const soloFuncionario = proteger('funcionario')

  router.get('/equipos', soloFuncionario, async (req, res, next) => {
    try {
      const { disponible } = req.query
      if (disponible !== undefined && disponible !== 'true' && disponible !== 'false') {
        return fail(res, 422, 'PARAMETRO_INVALIDO', "El parámetro 'disponible' debe ser true o false.")
      }
      const equipos = await listarEquipos(disponible === undefined ? undefined : disponible === 'true', repos)
      res.json({ data: equipos, total: equipos.length })
    } catch (e) { next(e) }
  })

  router.post('/denuncias/:id/rescates', origen, soloFuncionario, async (req, res, next) => {
    try {
      const r = await asignarEquipo(Number(req.params.id), req.body, repos, req.tokenNucleo)
      if (r.error) return fail(res, r.error.status, r.error.codigo, r.error.mensaje)
      res.status(201).json(r.rescate)
    } catch (e) { next(e) }
  })
  return router
}
