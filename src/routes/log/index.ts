import { FastifyInstance } from 'fastify'
import { Types } from 'mongoose'
import { AuditLog } from '../../models/index.js'

export default async function logRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [fastify.authenticate] }

  fastify.post('/api/log/get-logs', {
    schema: { tags: ['Log'], summary: 'Get audit logs' }, ...auth,
  }, async (request: any) => {
    const { applicationId, pageIndex = 0, pageSize = 20 } = request.body as any
    const filter = applicationId ? { applicationId: new Types.ObjectId(applicationId) } : {}

    const [items, totalCount] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(pageIndex * pageSize).limit(pageSize).lean(),
      AuditLog.countDocuments(filter),
    ])

    return {
      success: true,
      payload: {
        items: items.map(i => ({ ...i, id: (i as any)._id?.toString(), applicationId: i.applicationId?.toString() })),
        totalCount,
        pageIndex,
        pageSize,
      },
    }
  })

  fastify.get('/api/log/get-event-action-type', {
    schema: { tags: ['Log'], summary: 'Get event action types' }, ...auth,
  }, async () => ({
    success: true,
    payload: [
      { id: 1, name: 'Created' },
      { id: 2, name: 'Updated' },
      { id: 3, name: 'Deleted' },
      { id: 4, name: 'StatusChanged' },
      { id: 5, name: 'DocumentUploaded' },
      { id: 6, name: 'CreditPaperGenerated' },
      { id: 7, name: 'AssessmentSubmitted' },
    ],
  }))
}
