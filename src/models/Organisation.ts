import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IOrganisation extends Document {
  name: string
  description?: string
  orgUrl?: string
  orgRef?: string
  status: number
  orgType: number
  parentOrgId?: Types.ObjectId
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

const OrganisationSchema = new Schema<IOrganisation>(
  {
    name: { type: String, required: true },
    description: String,
    orgUrl: String,
    orgRef: String,
    status: { type: Number, default: 1 },
    orgType: { type: Number, default: 1 },
    parentOrgId: { type: Schema.Types.ObjectId, ref: 'Organisation' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const Organisation = mongoose.model<IOrganisation>('Organisation', OrganisationSchema)
