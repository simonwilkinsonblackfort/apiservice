import fp from 'fastify-plugin'
import fastifyCors from '@fastify/cors'
import { FastifyInstance } from 'fastify'
import { config } from '../config/index.js'

export default fp(async function corsPlugin(fastify: FastifyInstance) {
  const allowedOrigins = config.ALLOWED_ORIGINS
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)

  await fastify.register(fastifyCors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'secretKey'],
    exposedHeaders: ['X-Request-ID'],
    credentials: true,
  })
})
