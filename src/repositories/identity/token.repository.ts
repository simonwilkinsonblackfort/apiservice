import { Types } from 'mongoose'
import { UserToken } from '../../models/index.js'
import { TokenType } from '../../domain/common.js'

export class TokenRepository {
  async generateToken(params: {
    userId: Types.ObjectId
    tokenType: TokenType
    expiryMinutes?: number
  }) {
    const expiryMinutes = params.expiryMinutes ?? 60
    const token = generateOTPCode()
    const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000)

    await UserToken.create({
      userId: params.userId,
      tokenType: params.tokenType,
      token,
      hasActioned: false,
      attempt: 0,
      expiryDate,
      isDeleted: false,
    })

    return token
  }

  async validateToken(params: {
    userId: Types.ObjectId
    tokenType: TokenType
    token: string
  }) {
    const record = await UserToken.findOneAndUpdate(
      {
        userId: params.userId,
        tokenType: params.tokenType,
        token: params.token,
        hasActioned: false,
        isDeleted: false,
        expiryDate: { $gte: new Date() },
      },
      { $set: { hasActioned: true } },
      { new: true },
    )

    return !!record
  }

  async invalidateUserTokens(userId: Types.ObjectId, tokenType: TokenType) {
    await UserToken.updateMany(
      { userId, tokenType, hasActioned: false, isDeleted: false },
      { $set: { isDeleted: true } },
    )
  }
}

function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
