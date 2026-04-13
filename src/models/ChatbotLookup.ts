import mongoose, { Schema, Document } from 'mongoose'

export interface IChatbotLookup extends Document {
  name: string
  description?: string
  keyName: string
  lookupData?: string
  lookupDataBinary?: Buffer
  isDelete: boolean
  isRestricted: boolean
  resultType?: string
  createdAt: Date
  updatedAt: Date
}

const ChatbotLookupSchema = new Schema<IChatbotLookup>(
  {
    name: { type: String, required: true },
    description: String,
    keyName: { type: String, required: true, unique: true },
    lookupData: String,
    lookupDataBinary: Buffer,
    isDelete: { type: Boolean, default: false },
    isRestricted: { type: Boolean, default: false },
    resultType: String,
  },
  { timestamps: true },
)

export const ChatbotLookup = mongoose.model<IChatbotLookup>('ChatbotLookup', ChatbotLookupSchema)
