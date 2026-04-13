import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IApplicationForm {
  applicationId: Types.ObjectId
  userId: Types.ObjectId
  formData?: Record<string, unknown>
  version: number
  isInit: boolean
  createdAt: Date
}

const ApplicationFormSchema = new Schema<IApplicationForm>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'LoanApplication', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    formData: { type: Schema.Types.Mixed },
    version: { type: Number, required: true },
    isInit: { type: Boolean, default: false },
  },
  { timestamps: true },
)

ApplicationFormSchema.index({ applicationId: 1, userId: 1, createdAt: -1 })

export const ApplicationForm = mongoose.model<IApplicationForm>('ApplicationForm', ApplicationFormSchema)
