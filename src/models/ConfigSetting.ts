import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IConfigSetting extends Document {
  orgId?: Types.ObjectId
  groupKey?: string
  settingKey: string
  settingValue?: string
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

const ConfigSettingSchema = new Schema<IConfigSetting>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organisation' },
    groupKey: String,
    settingKey: { type: String, required: true },
    settingValue: String,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
)

ConfigSettingSchema.index({ settingKey: 1, orgId: 1 })

export const ConfigSetting = mongoose.model<IConfigSetting>('ConfigSetting', ConfigSettingSchema)
