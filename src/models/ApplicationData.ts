import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IApplicationData extends Document {
  applicationId: Types.ObjectId
  sectionId: number
  sectionData?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const ApplicationDataSchema = new Schema<IApplicationData>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'LoanApplication', required: true },
    sectionId: { type: Number, required: true },
    sectionData: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
)

ApplicationDataSchema.index({ applicationId: 1, sectionId: 1 }, { unique: true })

export const ApplicationData = mongoose.model<IApplicationData>('ApplicationData', ApplicationDataSchema)
