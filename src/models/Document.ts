import mongoose, { Schema, Document as MongoDoc, Types } from 'mongoose'

export interface IDocument extends MongoDoc {
  orgId?: Types.ObjectId
  documentKey: string
  parentDocumentId?: Types.ObjectId
  documentType: number
  documentAttribute: number
  documentTitle: string
  documentFileName: string
  documentSize?: number
  documentIcon?: string
  documentPath?: string
  documentRef?: string
  documentUrl?: string
  externalRef?: string
  isDeleted: boolean
  orgUserId?: Types.ObjectId
  identityRef?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

const DocumentSchema = new Schema<IDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organisation' },
    documentKey: { type: String, required: true, unique: true },
    parentDocumentId: { type: Schema.Types.ObjectId, ref: 'Document' },
    documentType: { type: Number, required: true },
    documentAttribute: { type: Number, required: true },
    documentTitle: { type: String, required: true },
    documentFileName: { type: String, required: true },
    documentSize: Number,
    documentIcon: String,
    documentPath: String,
    documentRef: String,
    documentUrl: String,
    externalRef: String,
    isDeleted: { type: Boolean, default: false },
    orgUserId: { type: Schema.Types.ObjectId },
    identityRef: String,
    tags: [String],
  },
  { timestamps: true },
)

DocumentSchema.index({ isDeleted: 1 })

export const AppDocument = mongoose.model<IDocument>('Document', DocumentSchema)
