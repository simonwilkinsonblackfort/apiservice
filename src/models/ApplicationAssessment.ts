import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IApplicationAssessment extends Document {
  applicationId: Types.ObjectId
  userId: Types.ObjectId
  isApplicationReview: boolean
  isCreditAssessment: boolean
  isPolicyCompliance: boolean
  conditionsStatement?: string
  fullConditionsStatement?: string
  isInitialAssessment: boolean
  isFullAssessment: boolean
  createdAt: Date
}

const ApplicationAssessmentSchema = new Schema<IApplicationAssessment>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'LoanApplication', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isApplicationReview: { type: Boolean, default: false },
    isCreditAssessment: { type: Boolean, default: false },
    isPolicyCompliance: { type: Boolean, default: false },
    conditionsStatement: String,
    fullConditionsStatement: String,
    isInitialAssessment: { type: Boolean, default: false },
    isFullAssessment: { type: Boolean, default: false },
  },
  { timestamps: true },
)

ApplicationAssessmentSchema.index({ applicationId: 1, createdAt: -1 })

export const ApplicationAssessment = mongoose.model<IApplicationAssessment>('ApplicationAssessment', ApplicationAssessmentSchema)
