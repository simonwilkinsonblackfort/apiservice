import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { UserService } from '../../services/identity/user.service.js'
import { config } from '../../config/index.js'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  mobile: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export default async function userRoutes(fastify: FastifyInstance) {
  const svc = () => new UserService(fastify)

  fastify.post('/api/user/register-user', {
    schema: { tags: ['User'], summary: 'Register a new customer user' },
    config: { auth: false },
  }, async (request, reply) => {
    const body = registerSchema.parse(request.body)
    const result = await svc().registerUser(body)
    if (!result.success) return reply.code(400).send(result)
    return result
  })

  fastify.post('/api/user/user-signup', {
    schema: { tags: ['User'], summary: 'Blackfort internal user signup (requires secretKey header)' },
    config: { auth: false },
  }, async (request: any, reply) => {
    const secretKey = request.headers['secretkey']
    if (!secretKey || secretKey !== config.SECRET_KEY) {
      return reply.code(401).send({ success: false, error: 'Unauthorized: Invalid Secret Key' })
    }
    const body = registerSchema.parse(request.body)
    const result = await svc().blackfortRegisterUser(body)
    if (!result.success) return reply.code(400).send(result)
    return result
  })

  fastify.get('/api/user/get-profile', {
    schema: { tags: ['User'], summary: 'Get current user profile' },
    preHandler: [fastify.authenticate],
  }, async (request: any, reply) => {
    const result = await svc().getProfile(request.user.userId)
    if (!result.success) return reply.code(404).send(result)
    return result
  })

  fastify.post('/api/user/update-user-infor', {
    schema: { tags: ['User'], summary: 'Update user information' },
    preHandler: [fastify.authenticate],
  }, async (request: any, reply) => {
    const result = await svc().updateUser(request.user.userId, request.body as any)
    if (!result.success) return reply.code(400).send(result)
    return result
  })
}
