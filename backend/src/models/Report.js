import mongoose from 'mongoose'
import { hashContact } from '../utils/contactVerification.js'
import { tokenizeSearchText } from '../utils/searchTokens.js'

const reportSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      immutable: true,
    },
    type: {
      type: String,
      enum: ['Denuncia', 'Rescate'],
      required: true,
      index: true,
    },
    animal: { type: String, required: true, trim: true, maxlength: 80 },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 5000, select: false },
    location: { type: String, required: true, trim: true, maxlength: 200, select: false },
    sector: { type: String, required: true, trim: true, maxlength: 120 },
    date: { type: Date, required: true, index: true },
    responsible: { type: String, required: true, trim: true, maxlength: 120, select: false },
    contactEmailHash: { type: String, select: false },
    contactPhoneHash: { type: String, select: false },
    status: {
      type: String,
      enum: ['Ingresada', 'Asignada', 'En terreno', 'Resuelta', 'Cerrada'],
      required: true,
      index: true,
    },
    statusHistory: {
      type: [{
        status: {
          type: String,
          enum: ['Ingresada', 'Asignada', 'En terreno', 'Resuelta', 'Cerrada'],
          required: true,
        },
        changedAt: { type: Date, required: true },
      }],
      default: [],
    },
    visibility: {
      type: String,
      enum: ['private', 'public'],
      default: 'private',
      required: true,
      index: true,
    },
    publicSearchTerms: { type: [String], default: [], select: false },
    sectorTokens: { type: [String], default: [], select: false },
  },
  { timestamps: true, collection: 'denuncias' },
)

reportSchema.virtual('ownerEmail').set(function setOwnerEmail(value) {
  this.$locals.ownerEmail = value
})

reportSchema.virtual('ownerPhone').set(function setOwnerPhone(value) {
  this.$locals.ownerPhone = value
})

reportSchema.pre('validate', function updateSearchTokens() {
  if (this.$locals.ownerEmail) {
    this.contactEmailHash = hashContact('email', this.$locals.ownerEmail)
  }
  if (this.$locals.ownerPhone) {
    this.contactPhoneHash = hashContact('phone', this.$locals.ownerPhone)
  }
  if (this.isNew && !this.contactEmailHash && !this.contactPhoneHash) {
    this.invalidate('ownerEmail', 'Debe registrar un correo electrónico o un teléfono para consultar el estado.')
  }

  this.publicSearchTerms = tokenizeSearchText([
    this.id,
    this.type,
    this.animal,
    this.title,
    this.sector,
    this.status,
  ].join(' '))
  this.sectorTokens = tokenizeSearchText(this.sector)
})

reportSchema.pre('save', function trackStatusChange() {
  if (this.isNew || this.isModified('status')) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() })
  }
})

reportSchema.index({ publicSearchTerms: 1 })
reportSchema.index({ sectorTokens: 1, date: -1 })
reportSchema.index({ visibility: 1, type: 1, status: 1, date: -1 })

const Report = mongoose.model('Report', reportSchema)

export default Report
