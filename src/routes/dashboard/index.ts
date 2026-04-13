import { FastifyInstance } from 'fastify'
import { Types } from 'mongoose'
import { LoanApplication, ApplicationStatus } from '../../models/index.js'

export default async function dashboardRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [fastify.authenticate] }

  fastify.get('/api/dashboard', {
    schema: { tags: ['Dashboard'], summary: 'Get dashboard summary data' }, ...auth,
  }, async (request: any) => {
    const userId = request.user.userId
    const isAdmin = request.user.roles?.includes('Admin')
    const filter = isAdmin ? {} : { userId: new Types.ObjectId(userId) }

    const [totalApplications, statuses, byStatus] = await Promise.all([
      LoanApplication.countDocuments(filter),
      ApplicationStatus.find({ isDeleted: false }).lean(),
      LoanApplication.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ])

    return {
      success: true,
      payload: {
        totalApplications,
        byStatus: byStatus.map(g => ({ status: g._id ?? 'Unknown', count: g.count })),
      },
    }
  })

  fastify.get('/api/dashboard/export', {
    schema: { tags: ['Dashboard'], summary: 'Export dashboard data as CSV' }, ...auth,
  }, async (request: any, reply) => {
    const isAdmin = request.user.roles?.includes('Admin')
    const filter = isAdmin ? {} : { userId: new Types.ObjectId(request.user.userId) }

    const apps = await LoanApplication.find(filter).sort({ createdAt: -1 }).lean()
    const header = 'Application ID,Key,Status,Created Date\n'
    const rows = apps.map(a => `${a._id},${a.key ?? ''},${a.status ?? ''},${(a as any).createdAt?.toISOString()}`).join('\n')

    return reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename="applications.csv"')
      .send(header + rows)
  })

  fastify.get('/api/dashboard/export-commission', {
    schema: { tags: ['Dashboard'], summary: 'Export commission data as CSV' }, ...auth,
  }, async (request: any, reply) => {
    return reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename="commissions.csv"')
      .send('Application ID,Commission\n')
  })
}
