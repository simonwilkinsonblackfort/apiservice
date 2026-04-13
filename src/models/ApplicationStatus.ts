import mongoose, { Schema, Document } from 'mongoose'

export interface IApplicationStatus extends Document {
  name: string
  isDeleted: boolean
}

const ApplicationStatusSchema = new Schema<IApplicationStatus>({
  name: { type: String, required: true },
  isDeleted: { type: Boolean, default: false },
})

export const ApplicationStatus = mongoose.model<IApplicationStatus>('ApplicationStatus', ApplicationStatusSchema)
