import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IAIConfigContext {
  _id?: Types.ObjectId
  roleType: string
  name: string
  data: string
  sort: number
  isPreContext: boolean
  isDeleted: boolean
}

export interface IAIConfig extends Document {
  name: string
  contexts: IAIConfigContext[]
  createdAt: Date
  updatedAt: Date
}

const AIConfigContextSchema = new Schema<IAIConfigContext>({
  roleType: { type: String, required: true },
  name: { type: String, required: true },
  data: { type: String, required: true },
  sort: { type: Number, default: 0 },
  isPreContext: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
})

const AIConfigSchema = new Schema<IAIConfig>(
  {
    name: { type: String, required: true },
    contexts: [AIConfigContextSchema],
  },
  { timestamps: true },
)

export const AIConfig = mongoose.model<IAIConfig>('AIConfig', AIConfigSchema)
