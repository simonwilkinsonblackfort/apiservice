import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IAuditLog extends Document {
  applicationId: Types.ObjectId
  userId?: Types.ObjectId
  sectionId?: number
  action?: string
  dataChanged?: Record<string, unknown>
  createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'LoanApplication', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    sectionId: Number,
    action: String,
    dataChanged: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
)

AuditLogSchema.index({ applicationId: 1, createdAt: -1 })

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)
