import { Router } from 'express'
import Report from '../models/Report.js'
import { buildReportSearch } from '../services/reportSearch.js'
import { buildStatusLookup } from '../services/statusLookup.js'

const router = Router()
const publicFields = 'id type animal title sector date status'

router.get('/', async (req, res) => {
  const { filter, page, limit } = buildReportSearch(req.query)
  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    Report.find(filter)
      .select(`${publicFields} -_id`)
      .sort({ date: -1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Report.countDocuments(filter),
  ])

  res.json({
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  })
})

router.post('/:id/estado', async (req, res) => {
  const filter = buildStatusLookup(req.params.id, req.body)
  const report = await Report.findOne(filter)
    .select('id status statusHistory updatedAt')
    .lean()

  if (!report) {
    return res.status(404).json({
      error: 'No encontramos una denuncia con ese ID y los datos de contacto ingresados. Verifícalos e inténtalo nuevamente.',
    })
  }

  return res.json({
    id: report.id,
    status: report.status,
    statusHistory: report.statusHistory?.length
      ? report.statusHistory
      : [{ status: report.status, changedAt: report.updatedAt }],
  })
})

router.get('/:id', async (req, res) => {
  const report = await Report.findOne({
    id: req.params.id,
    visibility: 'public',
  })
    .select(`${publicFields} -_id`)
    .lean()

  if (!report) {
    return res.status(404).json({ error: 'No se encontró el reporte solicitado.' })
  }
  return res.json(report)
})

export default router
