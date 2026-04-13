import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { config } from '../config/index.js'
import { JwtPayload } from '../domain/common.js'

export default fp(async function jwtPlugin(fastify: FastifyInstance) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fastifyJwt = require('@fastify/jwt')
  await fastify.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    sign: {
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE,
      expiresIn: `${config.JWT_EXPIRY_MINUTES}m`,
    },
    verify: {
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE,
    },
  })

  fastify.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.code(401).send({ success: false, error: 'Unauthorized' })
    }
  })

  fastify.decorate('requireRole', function (...roles: string[]) {
    return async function (request: any, reply: any) {
      try {
        await request.jwtVerify()
        const payload = request.user as JwtPayload
        const hasRole = roles.some(r => payload.roles?.includes(r))
        if (!hasRole) {
          reply.code(403).send({ success: false, error: 'Forbidden' })
        }
      } catch {
        reply.code(401).send({ success: false, error: 'Unauthorized' })
      }
    }
  })
})

// Augment Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>
    requireRole: (...roles: string[]) => (request: any, reply: any) => Promise<void>
    jwt: {
      sign: (payload: object, options?: object) => string
      verify: (token: string, options?: object) => any
    }
  }
}
