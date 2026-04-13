import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IUserToken extends Document {
  userId: Types.ObjectId
  tokenType: number   // matches TokenType enum
  token: string
  deviceToken?: string
  hasActioned: boolean
  attempt: number
  expiryDate: Date
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

const UserTokenSchema = new Schema<IUserToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenType: { type: Number, required: true },
    token: { type: String, required: true },
    deviceToken: { type: String },
    hasActioned: { type: Boolean, default: false },
    attempt: { type: Number, default: 0 },
    expiryDate: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
)

UserTokenSchema.index({ userId: 1, tokenType: 1, isDeleted: 1 })
UserTokenSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 })

export const UserToken = mongoose.model<IUserToken>('UserToken', UserTokenSchema)
