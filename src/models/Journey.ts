import { Schema, model, Document, Types } from 'mongoose'

export interface IJourney extends Document {
  journeyRef: string
  sessionId: string
  customerId?: Types.ObjectId
  isAnonymous: boolean
  address: string
  suburb: string
  state: string
  postcode: string
  lat?: number
  lon?: number
  stages: {
    search?: { timestamp: Date; data: Record<string, any> }
    assessment?: { timestamp: Date; data: Record<string, any> }
    intent?: { timestamp: Date; data: Record<string, any> }
    terms?: { timestamp: Date; data: Record<string, any> }
    termsheet?: { timestamp: Date; data: Record<string, any> }
  }
  events: Array<{
    stage: string
    action: string
    timestamp: Date
    data: Record<string, any>
  }>
  createdAt: Date
  updatedAt: Date
}

const stageSchema = {
  timestamp: { type: Date },
  data: { type: Schema.Types.Mixed, default: {} },
}

const journeySchema = new Schema<IJourney>(
  {
    journeyRef:  { type: String, required: true, unique: true, index: true },
    sessionId:   { type: String, required: true, index: true },
    customerId:  { type: Schema.Types.ObjectId, ref: 'User', index: true, sparse: true },
    isAnonymous: { type: Boolean, default: true },
    address:     { type: String, default: '' },
    suburb:      { type: String, default: '' },
    state:       { type: String, default: '' },
    postcode:    { type: String, default: '' },
    lat:         { type: Number },
    lon:         { type: Number },
    stages: {
      search:     { type: stageSchema, default: undefined },
      assessment: { type: stageSchema, default: undefined },
      intent:     { type: stageSchema, default: undefined },
      terms:      { type: stageSchema, default: undefined },
      termsheet:  { type: stageSchema, default: undefined },
    },
    events: [
      {
        stage:     { type: String },
        action:    { type: String },
        timestamp: { type: Date },
        data:      { type: Schema.Types.Mixed, default: {} },
      },
    ],
  },
  { timestamps: true }
)

export function generateJourneyRef(): string {
  const now = new Date()
  const YYYYMMDD =
    String(now.getFullYear()) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0')
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let suffix = ''
  for (let i = 0; i < 5; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `BF-${YYYYMMDD}-${suffix}`
}

export const Journey = model<IJourney>('Journey', journeySchema)
