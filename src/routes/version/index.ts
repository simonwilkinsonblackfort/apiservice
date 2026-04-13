import { FastifyInstance } from 'fastify'

const API_VERSION = '1.0.0'

export default async function versionRoutes(fastify: FastifyInstance) {
  fastify.get('/api/version', {
    schema: { tags: ['Version'], summary: 'Get API version' },
    config: { auth: false },
  }, async () => {
    return {
      success: true,
      payload: {
        version: API_VERSION,
        environment: process.env.NODE_ENV ?? 'development',
        timestamp: new Date().toISOString(),
      },
    }
  })
}
