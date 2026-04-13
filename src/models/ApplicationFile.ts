import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IApplicationFile extends Document {
  applicationId: Types.ObjectId
  userId: Types.ObjectId
  fileId: string
  documentKey: string
  fileName?: string
  location?: string
  category?: string
  jsonData?: Record<string, unknown>
  createdAt: Date
}

const ApplicationFileSchema = new Schema<IApplicationFile>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'LoanApplication', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileId: { type: String, required: true },
    documentKey: { type: String, required: true },
    fileName: String,
    location: String,
    category: String,
    jsonData: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
)

ApplicationFileSchema.index({ applicationId: 1, category: 1 })

export const ApplicationFile = mongoose.model<IApplicationFile>('ApplicationFile', ApplicationFileSchema)
