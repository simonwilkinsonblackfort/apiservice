import { FastifyInstance } from 'fastify'
import { Types } from 'mongoose'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import nodemailer from 'nodemailer'
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

async function sendOtpEmail(email: string, otp: string): Promise<void> {
  if (!config.SMTP_HOST) return // no SMTP configured — skip (OTP shown in response in dev)

  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
  })

  await transporter.sendMail({
    from: config.SMTP_FROM,
    to: email,
    subject: 'Your Blackfort verification code',
    text: `Your Blackfort verification code is: ${otp}\n\nThis code is valid for 5 minutes.\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1a1b1d;border-radius:12px;color:#fff">
        <img src="https://www.blackfort.com.au/logo.svg" alt="Blackfort" style="height:36px;margin-bottom:32px;filter:brightness(0) invert(1)" />
        <h2 style="margin:0 0 8px;font-size:22px">Your verification code</h2>
        <p style="color:#a0a8b8;margin:0 0 28px">Enter this code to complete your login.</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:12px;text-align:center;padding:20px;background:#111213;border-radius:10px;margin-bottom:24px">${otp}</div>
        <p style="color:#6b7280;font-size:13px;margin:0">This code expires in 5 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `,
  })
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
      try {
        await sendOtpSms(mobile, otp)
      } catch (err: any) {
        console.error('SMS OTP send failed:', err.message)
        // Don't block — OTP preview covers dev; fix AWS credentials for production
      }
    }

    return ok({
      userId: user._id.toString(),
      ...(config.SHOW_OTP_IN_RESPONSE ? { otpPreview: otp } : {}),
    })
  }

  async requestEmailOtp(email: string) {
    const user = await this.userRepo.findByEmail(email)
    if (!user) return fail('No account found for that email address')

    const otp = await this.tokenRepo.generateToken({
      userId: user._id,
      tokenType: TokenType.PassCode,
      expiryMinutes: 5,
    })

    try {
      await sendOtpEmail(email, otp)
    } catch (err: any) {
      console.error('Email OTP send failed:', err.message)
      // Don't block — OTP preview covers dev
    }

    return ok({
      userId: user._id.toString(),
      ...(config.SHOW_OTP_IN_RESPONSE ? { otpPreview: otp } : {}),
    })
  }

  async signup(params: {
    firstName: string
    lastName: string
    email: string
    mobile: string
  }) {
    // Check if account already exists
    const existing = await this.userRepo.findByEmail(params.email)
    if (existing) return fail('An account with that email already exists')

    // Create user (no password — OTP-only login)
    const user = await this.userRepo.createUser({
      email: params.email,
      password: Math.random().toString(36) + Math.random().toString(36), // random unusable password
      mobile: params.mobile,
      firstName: params.firstName,
      lastName: params.lastName,
      roles: ['Customer'],
    })

    return ok({
      userId: user._id.toString(),
      email: user.email,
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
