import { FastifyInstance } from 'fastify'
import { AIConfig } from '../../models/index.js'

export default async function aiConfigRoutes(fastify: FastifyInstance) {
  fastify.get('/api/aiconfig/get-all', {
    schema: { tags: ['AIConfig'], summary: 'Get all AI configurations' },
    preHandler: [fastify.authenticate],
  }, async () => {
    const configs = await AIConfig.find().lean()
    return { success: true, payload: configs.map(c => ({ ...c, id: (c as any)._id.toString() })) }
  })

  fastify.post('/api/aiconfig/create', {
    schema: { tags: ['AIConfig'], summary: 'Create an AI configuration' },
    preHandler: [fastify.requireRole('Admin')],
  }, async (request: any) => {
    const { name, contexts = [] } = request.body as any
    const created = await AIConfig.create({ name, contexts })
    return { success: true, payload: { ...created.toObject(), id: created._id.toString() } }
  })

  fastify.put('/api/aiconfig/update', {
    schema: { tags: ['AIConfig'], summary: 'Update an AI configuration' },
    preHandler: [fastify.requireRole('Admin')],
  }, async (request: any) => {
    const { id, name } = request.body as any
    const updated = await AIConfig.findByIdAndUpdate(id, { $set: { name } }, { new: true }).lean()
    if (!updated) return { success: false, error: 'Config not found' }
    return { success: true, payload: { ...updated, id: (updated as any)._id.toString() } }
  })
}
