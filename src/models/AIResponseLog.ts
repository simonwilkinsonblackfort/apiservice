import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IAIResponseLog extends Document {
  userId: Types.ObjectId
  applicationId?: Types.ObjectId
  chatTypeId: number
  request?: Record<string, unknown>
  response?: Buffer
  documentId?: string
  status?: string
  sendResponse?: string
  applicationAgentStatusId?: Types.ObjectId
  createdAt: Date
}

const AIResponseLogSchema = new Schema<IAIResponseLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'LoanApplication' },
    chatTypeId: { type: Number, required: true },
    request: { type: Schema.Types.Mixed },
    response: Buffer,
    documentId: String,
    status: String,
    sendResponse: String,
    applicationAgentStatusId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true },
)

AIResponseLogSchema.index({ userId: 1, createdAt: -1 })
AIResponseLogSchema.index({ applicationId: 1 })

export const AIResponseLog = mongoose.model<IAIResponseLog>('AIResponseLog', AIResponseLogSchema)
