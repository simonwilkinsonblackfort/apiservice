import Fastify, { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import jwtPlugin from './plugins/jwt.js'
import corsPlugin from './plugins/cors.js'
import swaggerPlugin from './plugins/swagger.js'
import mongoosePlugin from './plugins/mongoose.js'
import { errorHandler } from './middleware/error.js'

import identityRoutes from './routes/identity/index.js'
import userRoutes from './routes/user/index.js'
import applicationRoutes from './routes/application/index.js'
import chatbotRoutes from './routes/chatbot/index.js'
import dashboardRoutes from './routes/dashboard/index.js'
import lendingRuleRoutes from './routes/lending-rule/index.js'
import logRoutes from './routes/log/index.js'
import searchRoutes from './routes/search/index.js'
import workspaceRoutes from './routes/workspace/index.js'
import propertyRoutes from './routes/property/index.js'
import versionRoutes from './routes/version/index.js'
import aiConfigRoutes from './routes/ai-config/index.js'
import journeyRoutes from './routes/journey/index.js'

export async function buildApp(opts: { logger?: boolean | object } = {}) {
  const fastify = Fastify({
    logger: opts.logger ?? {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
    trustProxy: true,
  })

  // ── Global error handler ──
  fastify.setErrorHandler(errorHandler)

  // ── Plugins ──
  await fastify.register(corsPlugin)
  await fastify.register(swaggerPlugin)
  await fastify.register(mongoosePlugin)
  await fastify.register(jwtPlugin)

  // Multipart support for file uploads
  await fastify.register(import('@fastify/multipart'), {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  })

  // Compression
  await fastify.register(import('@fastify/compress'), {
    global: true,
  })

  // ── Health check ──
  fastify.get('/health', { schema: { hide: true } }, async () => ({ status: 'ok' }))

  // ── Routes ──
  await fastify.register(fp(identityRoutes))
  await fastify.register(fp(userRoutes))
  await fastify.register(fp(applicationRoutes))
  await fastify.register(fp(chatbotRoutes))
  await fastify.register(fp(dashboardRoutes))
  await fastify.register(fp(lendingRuleRoutes))
  await fastify.register(fp(logRoutes))
  await fastify.register(fp(searchRoutes))
  await fastify.register(fp(workspaceRoutes))
  await fastify.register(fp(propertyRoutes))
  await fastify.register(fp(versionRoutes))
  await fastify.register(fp(aiConfigRoutes))
  await fastify.register(fp(journeyRoutes))

  return fastify
}
