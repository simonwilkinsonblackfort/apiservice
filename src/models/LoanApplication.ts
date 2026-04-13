import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ILoanApplication extends Document {
  _id: Types.ObjectId
  key: string
  userId: Types.ObjectId
  type?: number
  status?: string           // status name string (denormalized for simplicity)
  statusId?: Types.ObjectId
  loanCalculatorData?: Record<string, unknown>
  propertyDetails?: Record<string, unknown>
  generatedTermSheetData?: Record<string, unknown>
  mileStone?: Record<string, unknown>
  dealData?: Record<string, unknown>
  agentJsonFileId?: string
  hasModifiedAgent?: boolean
  fileIds?: string[]
  internalStatus?: string
  keyContact?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const LoanApplicationSchema = new Schema<ILoanApplication>(
  {
    key: { type: String, default: () => new Types.ObjectId().toString() },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: Number,
    status: String,
    statusId: { type: Schema.Types.ObjectId, ref: 'ApplicationStatus' },
    loanCalculatorData: { type: Schema.Types.Mixed },
    propertyDetails: { type: Schema.Types.Mixed },
    generatedTermSheetData: { type: Schema.Types.Mixed },
    mileStone: { type: Schema.Types.Mixed },
    dealData: { type: Schema.Types.Mixed },
    agentJsonFileId: String,
    hasModifiedAgent: Boolean,
    fileIds: [String],
    internalStatus: String,
    keyContact: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
)

LoanApplicationSchema.index({ userId: 1, createdAt: -1 })
LoanApplicationSchema.index({ statusId: 1 })

export const LoanApplication = mongoose.model<ILoanApplication>('LoanApplication', LoanApplicationSchema)
