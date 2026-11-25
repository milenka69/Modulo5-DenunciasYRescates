import 'dotenv/config'
import mongoose from 'mongoose'
import Report from '../models/Report.js'
import { tokenizeSearchText } from '../utils/searchTokens.js'

const mongoUri = process.env.MONGODB_URI

if (!mongoUri) {
  throw new Error('Configura MONGODB_URI antes de ejecutar la migración.')
}

async function migratePublicSearch() {
  await mongoose.connect(mongoUri)
  await Report.init()

  let operations = []
  let migratedCount = 0
  const reports = Report.find({})
    .select('+description +location +responsible')
    .cursor()

  for await (const report of reports) {
    operations.push({
      updateOne: {
        filter: { _id: report._id },
        update: {
          $set: {
            publicSearchTerms: tokenizeSearchText([
              report.id,
              report.type,
              report.animal,
              report.title,
              report.sector,
              report.status,
            ].join(' ')),
            sectorTokens: tokenizeSearchText(report.sector),
          },
          $unset: {
            searchTerms: '',
            responsibleTokens: '',
          },
        },
      },
    })

    if (operations.length === 500) {
      await Report.collection.bulkWrite(operations, { ordered: false })
      migratedCount += operations.length
      operations = []
    }
  }

  if (operations.length) {
    await Report.collection.bulkWrite(operations, { ordered: false })
    migratedCount += operations.length
  }

  const indexes = await Report.collection.indexes()
  for (const index of indexes) {
    const indexedFields = Object.keys(index.key)
    if (indexedFields.some((field) => ['searchTerms', 'responsibleTokens'].includes(field))) {
      await Report.collection.dropIndex(index.name)
    }
  }

  console.log(`Búsqueda pública protegida en ${migratedCount} registros.`)
}

try {
  await migratePublicSearch()
} finally {
  await mongoose.disconnect()
}
