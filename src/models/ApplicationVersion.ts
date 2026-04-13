import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IApplicationVersion extends Document {
  applicationId: Types.ObjectId
  data?: Record<string, unknown>
  version: number
  userCreated?: Types.ObjectId
  userModified?: Types.ObjectId
  createdAt: Date
}

const ApplicationVersionSchema = new Schema<IApplicationVersion>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'LoanApplication', required: true },
    data: { type: Schema.Types.Mixed },
    version: { type: Number, required: true },
    userCreated: { type: Schema.Types.ObjectId, ref: 'User' },
    userModified: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

ApplicationVersionSchema.index({ applicationId: 1, version: 1 })

export const ApplicationVersion = mongoose.model<IApplicationVersion>('ApplicationVersion', ApplicationVersionSchema)
