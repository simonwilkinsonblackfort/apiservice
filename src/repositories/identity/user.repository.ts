import bcrypt from 'bcrypt'
import { Types } from 'mongoose'
import { User, UserToken } from '../../models/index.js'
import type { IUser } from '../../models/index.js'

export class UserRepository {
  async findByEmail(email: string) {
    return User.findOne({
      normalizedEmail: email.toUpperCase(),
      isDeleted: false,
    })
  }

  async findByMobile(mobile: string) {
    // Normalise: strip leading 0, spaces, dashes, allow +61 prefix
    const stripped = mobile.replace(/^\+?61/, '').replace(/^0/, '').replace(/[\s\-]/g, '')
    return User.findOne({
      mobile: { $regex: stripped + '$' },
      isDeleted: false,
      status: 1,
    })
  }

  async findById(id: string | Types.ObjectId) {
    return User.findOne({ _id: id, isDeleted: false })
  }

  async verifyPassword(user: IUser, plainPassword: string) {
    return bcrypt.compare(plainPassword, user.passwordHash)
  }

  async incrementAccessFail(userId: Types.ObjectId) {
    await User.updateOne(
      { _id: userId },
      { $inc: { accessFailCount: 1 } },
    )
  }

  async resetAccessFail(userId: Types.ObjectId) {
    await User.updateOne(
      { _id: userId },
      { $set: { accessFailCount: 0, lastLogin: new Date() } },
    )
  }

  async updateUser(
    userId: Types.ObjectId,
    data: { userName?: string; email?: string; mobile?: string },
  ) {
    const update: Record<string, unknown> = {}
    if (data.userName) update.userName = data.userName
    if (data.mobile) update.mobile = data.mobile
    if (data.email) {
      update.email = data.email.toLowerCase()
      update.normalizedEmail = data.email.toUpperCase()
      update.userName = data.email
    }
    return User.findByIdAndUpdate(userId, { $set: update }, { new: true })
  }

  async createUser(params: {
    email: string
    password: string
    mobile?: string
    roles?: string[]
    orgId?: Types.ObjectId
    firstName?: string
    lastName?: string
  }) {
    const passwordHash = await bcrypt.hash(params.password, 10)

    const user = await User.create({
      email: params.email.toLowerCase(),
      normalizedEmail: params.email.toUpperCase(),
      userName: params.email.toLowerCase(),
      passwordHash,
      mobile: params.mobile,
      roles: params.roles ?? ['Customer'],
      orgId: params.orgId,
      status: 1,
      emailConfirmed: false,
      accessFailCount: 0,
      isDeleted: false,
      profile: {
        firstName: params.firstName,
        lastName: params.lastName,
      },
    })

    return user
  }
}
