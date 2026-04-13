import { FastifyInstance } from 'fastify'
import { Types } from 'mongoose'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import { UserRepository } from '../../repositories/identity/user.repository.js'
import { TokenRepository } from '../../repositories/identity/token.repository.js'
import { TokenType, ok, fail } from '../../domain/common.js'
import { config } from '../../config/index.js'
import jwt from 'jsonwebtoken'

const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'ap-southeast-2' })

async function sendOtpSms(mobile: string, otp: string): Promise<void> {
  // Normalise to E.164 (+61...)
  const stripped = mobile.replace(/^\+?61/, '').replace(/^0/, '').replace(/[\s\-]/g, '')
  const e164 = `+61${stripped}`

  await snsClient.send(new PublishCommand({
    PhoneNumber: e164,
    Message: `Your Blackfort verification code is: ${otp}. Valid for 5 minutes.`,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' },
      'AWS.SNS.SMS.SenderID': { DataType: 'String', StringValue: 'Blackfort' },
    },
  }))
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  userId: string
  email: string
  roles: string[]
  expiresIn: number
}

export class AuthService {
  private userRepo = new UserRepository()
  private tokenRepo = new TokenRepository()

  constructor(private fastify: FastifyInstance) {}

  async login(request: LoginRequest) {
    const user = await this.userRepo.findByEmail(request.email)
    if (!user) return fail('Invalid email or password')

    const valid = await this.userRepo.verifyPassword(user, request.password)
    if (!valid) {
      await this.userRepo.incrementAccessFail(user._id)
      return fail('Invalid email or password')
    }

    if (user.status !== 1) return fail('Account is inactive')

    await this.userRepo.resetAccessFail(user._id)

    const accessToken = this.fastify.jwt.sign({
      sub: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
    })

    const refreshToken = await this.tokenRepo.generateToken({
      userId: user._id,
      tokenType: TokenType.RenewToken,
      expiryMinutes: config.JWT_EXPIRY_MINUTES * 2,
    })

    return ok<LoginResult>({
      accessToken,
      refreshToken,
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
      expiresIn: config.JWT_EXPIRY_MINUTES * 60,
    })
  }

  async validateRefreshToken(params: { userId: string; refreshToken: string }) {
    const objectId = new Types.ObjectId(params.userId)

    const isValid = await this.tokenRepo.validateToken({
      userId: objectId,
      tokenType: TokenType.RenewToken,
      token: params.refreshToken,
    })
    if (!isValid) return fail('Invalid or expired refresh token')

    const user = await this.userRepo.findById(objectId)
    if (!user) return fail('User not found')

    const accessToken = this.fastify.jwt.sign({
      sub: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
    })

    const newRefreshToken = await this.tokenRepo.generateToken({
      userId: user._id,
      tokenType: TokenType.RenewToken,
      expiryMinutes: config.JWT_EXPIRY_MINUTES * 2,
    })

    return ok({ accessToken, refreshToken: newRefreshToken })
  }

  async requestOtp(mobile: string) {
    const user = await this.userRepo.findByMobile(mobile)
    if (!user) return fail('No account found for that mobile number')

    const otp = await this.tokenRepo.generateToken({
      userId: user._id,
      tokenType: TokenType.PassCode,
      expiryMinutes: 5,
    })

    if (process.env.AWS_ACCESS_KEY_ID) {
      await sendOtpSms(mobile, otp)
    }

    return ok({
      userId: user._id.toString(),
      ...(config.SHOW_OTP_IN_RESPONSE ? { otpPreview: otp } : {}),
    })
  }

  async generateOtp(userId: string) {
    const objectId = new Types.ObjectId(userId)
    const token = await this.tokenRepo.generateToken({
      userId: objectId,
      tokenType: TokenType.PassCode,
      expiryMinutes: 5,
    })
    return ok({ token, ...(config.SHOW_OTP_IN_RESPONSE ? { otpPreview: token } : {}) })
  }

  async verifyOtp(params: { userId: string; otp: string; ipAddress?: string }) {
    const objectId = new Types.ObjectId(params.userId)

    const valid = await this.tokenRepo.validateToken({
      userId: objectId,
      tokenType: TokenType.PassCode,
      token: params.otp,
    })
    if (!valid) return fail('Invalid or expired OTP')

    const user = await this.userRepo.findById(objectId)
    if (!user) return fail('User not found')

    const accessToken = this.fastify.jwt.sign({
      sub: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
    })

    return ok({ accessToken, userId: user._id.toString() })
  }

  async validateArchistaToken(token: string) {
    try {
      const payload = jwt.verify(token, config.ARCHISTA_JWT_SECRET) as {
        email?: string
        sub?: string
      }
      const email = payload.email ?? payload.sub ?? ''
      if (!email) return fail('Invalid token')

      const user = await this.userRepo.findByEmail(email)
      if (!user) return fail('User not found')

      const accessToken = this.fastify.jwt.sign({
        sub: user._id.toString(),
        userId: user._id.toString(),
        email: user.email,
        roles: user.roles,
      })

      return ok({ accessToken, userId: user._id.toString() })
    } catch {
      return fail('Invalid Archista token')
    }
  }
}
