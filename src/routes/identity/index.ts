import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { AuthService } from '../../services/identity/auth.service.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const refreshTokenSchema = z.object({
  userId: z.string(),
  refreshToken: z.string(),
})

const requestOtpSchema = z.object({
  mobile: z.string().min(8),
})

const verifyOtpSchema = z.object({
  userId: z.string(),
  otp: z.string(),
})

const archiTokenSchema = z.object({
  token: z.string(),
})

export default async function identityRoutes(fastify: FastifyInstance) {
  const svc = () => new AuthService(fastify)

  fastify.post('/api/identity/request-otp', {
    schema: {
      tags: ['Identity'],
      summary: 'Request OTP via SMS for mobile login',
      body: {
        type: 'object',
        required: ['mobile'],
        properties: {
          mobile: { type: 'string', description: 'Australian mobile number (with or without +61)' },
        },
      },
    },
    config: { auth: false },
  }, async (request, reply) => {
    const body = requestOtpSchema.parse(request.body)
    const result = await svc().requestOtp(body.mobile)
    if (!result.success) return reply.code(400).send(result)
    return result
  })

  fastify.post('/api/identity/login', {
    schema: {
      tags: ['Identity'],
      summary: 'Login with email and password',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    },
    config: { auth: false },
  }, async (request, reply) => {
    const body = loginSchema.parse(request.body)
    const result = await svc().login(body)
    if (!result.success) return reply.code(401).send(result)
    return result
  })

  fastify.post('/api/identity/validate-refreshtoken', {
    schema: {
      tags: ['Identity'],
      summary: 'Validate refresh token and issue new access token',
    },
    config: { auth: false },
  }, async (request, reply) => {
    const body = refreshTokenSchema.parse(request.body)
    const result = await svc().validateRefreshToken(body)
    if (!result.success) return reply.code(401).send(result)
    return result
  })

  fastify.post('/api/identity/verify-otp', {
    schema: { tags: ['Identity'], summary: 'Verify OTP passcode' },
    config: { auth: false },
  }, async (request: any, reply) => {
    const body = verifyOtpSchema.parse(request.body)
    const result = await svc().verifyOtp({ ...body, ipAddress: request.ip })
    if (!result.success) return reply.code(401).send(result)
    return result
  })

  fastify.post('/api/identity/archi-validate-token', {
    schema: { tags: ['Identity'], summary: 'Validate Archista token' },
    config: { auth: false },
  }, async (request, reply) => {
    const { token } = archiTokenSchema.parse(request.body)
    const result = await svc().validateArchistaToken(token)
    if (!result.success) return reply.code(401).send(result)
    return result
  })

  fastify.get('/api/identity/me', {
    schema: { tags: ['Identity'], summary: 'Get current user' },
    preHandler: [fastify.authenticate],
  }, async (request: any) => {
    return { success: true, payload: request.user }
  })
}
