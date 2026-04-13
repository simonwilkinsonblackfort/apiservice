import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IUser extends Document {
  _id: Types.ObjectId
  email: string
  normalizedEmail: string
  userName: string
  passwordHash: string
  mobile?: string
  status: number          // 1=Active, 2=Inactive, 3=Pending, 4=Locked
  roles: string[]         // ['Admin'] | ['Customer']
  orgId?: Types.ObjectId
  accessFailCount: number
  lockoutTill?: Date
  lastLogin?: Date
  emailConfirmed: boolean
  securityStamp: string
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
  // Profile fields (embedded for read simplicity)
  profile?: {
    firstName?: string
    lastName?: string
    middleName?: string
    title?: string
    gender?: number
    dob?: Date
    avatar?: string
    timezoneId?: string
  }
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    normalizedEmail: { type: String, required: true, uppercase: true, trim: true },
    userName: { type: String, required: true },
    passwordHash: { type: String, required: true },
    mobile: { type: String },
    status: { type: Number, default: 1 },
    roles: [{ type: String }],
    orgId: { type: Schema.Types.ObjectId, ref: 'Organisation' },
    accessFailCount: { type: Number, default: 0 },
    lockoutTill: { type: Date },
    lastLogin: { type: Date },
    emailConfirmed: { type: Boolean, default: false },
    securityStamp: { type: String, default: () => new Types.ObjectId().toString() },
    isDeleted: { type: Boolean, default: false },
    profile: {
      firstName: String,
      lastName: String,
      middleName: String,
      title: String,
      gender: Number,
      dob: Date,
      avatar: String,
      timezoneId: String,
    },
  },
  { timestamps: true },
)

UserSchema.index({ normalizedEmail: 1 }, { unique: true })
UserSchema.index({ isDeleted: 1, status: 1 })

export const User = mongoose.model<IUser>('User', UserSchema)
