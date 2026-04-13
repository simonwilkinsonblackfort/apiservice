import { FastifyInstance } from 'fastify'
import { ApplicationService } from '../../services/application/application.service.js'
import { RoleName } from '../../domain/common.js'

export default async function applicationRoutes(fastify: FastifyInstance) {
  const svc = () => new ApplicationService(fastify)
  const auth = { preHandler: [fastify.authenticate] }
  const customerOnly = { preHandler: [fastify.requireRole(RoleName.Customer)] }

  fastify.post('/api/application/create-application', {
    schema: { tags: ['Application'], summary: 'Create a new loan application' },
    ...customerOnly,
  }, async (request: any) => {
    return svc().createApplication(request.user.userId, request.body as any)
  })

  fastify.get('/api/application/download-termsheet', {
    schema: { tags: ['Application'], summary: 'Download term sheet PDF' },
    config: { auth: false },
  }, async (request: any, reply) => {
    const { fileId, fileName } = request.query
    const result = await svc().downloadTermSheet(fileId, fileName, false)
    if (!result.success) return reply.code(400).send(result)
    const { fileData, contentType, fileName: fn } = result.payload!
    return reply.header('Content-Type', contentType).header('Content-Disposition', `attachment; filename="${fn}.pdf"`).send(fileData)
  })

  fastify.get('/api/application/download-manual-termsheet', {
    schema: { tags: ['Application'], summary: 'Download manual term sheet PDF' },
    config: { auth: false },
  }, async (request: any, reply) => {
    const { fileId, fileName } = request.query
    const result = await svc().downloadTermSheet(fileId, fileName, true)
    if (!result.success) return reply.code(400).send(result)
    const { fileData, contentType, fileName: fn } = result.payload!
    return reply.header('Content-Type', contentType).header('Content-Disposition', `attachment; filename="${fn}.pdf"`).send(fileData)
  })

  fastify.get('/api/application/get-by-userid/:userId', {
    schema: { tags: ['Application'], summary: 'Get applications by user ID' }, ...auth,
  }, async (request: any) => svc().getApplicationsByUser(request.params.userId))

  fastify.get('/api/application/get-loan-calculator-data/:applicationId', {
    schema: { tags: ['Application'], summary: 'Get loan calculator data' }, ...auth,
  }, async (request: any) => svc().getLoanCalculatorData(request.params.applicationId))

  fastify.post('/api/application/update-application', {
    schema: { tags: ['Application'], summary: 'Update application' }, ...auth,
  }, async (request: any) => {
    const { id, ...data } = request.body as any
    return svc().updateApplication(id, data)
  })

  fastify.get('/api/application/application-status', {
    schema: { tags: ['Application'], summary: 'Get application status' }, ...auth,
  }, async (request: any) => svc().getApplicationStatus(request.query.applicationId))

  fastify.get('/api/application/get-application-count', {
    schema: { tags: ['Application'], summary: 'Get application count' }, ...auth,
  }, async (request: any) => svc().getApplicationCount(request.query.userId))

  fastify.post('/api/application/get-application-listing', {
    schema: { tags: ['Application'], summary: 'Get paginated application listing' }, ...auth,
  }, async (request: any) => svc().getListing(request.body as any))

  fastify.post('/api/application/get-applications-group-by-status', {
    schema: { tags: ['Application'], summary: 'Get applications grouped by status' }, ...auth,
  }, async (request: any) => svc().getGroupedByStatus((request.body as any)?.userId))

  fastify.post('/api/application/get-applications-by-customer', {
    schema: { tags: ['Application'], summary: 'Get applications by customer' }, ...auth,
  }, async (request: any) => svc().getApplicationsByCustomer((request.body as any).customerId))

  fastify.post('/api/application/get-applications-detail', {
    schema: { tags: ['Application'], summary: 'Get application detail' }, ...auth,
  }, async (request: any) => svc().getApplicationDetail((request.body as any).applicationId))

  fastify.post('/api/application/save-application-data', {
    schema: { tags: ['Application'], summary: 'Save application section data' }, ...auth,
  }, async (request: any) => svc().saveApplicationData(request.body as any))

  fastify.post('/api/application/get-application-data', {
    schema: { tags: ['Application'], summary: 'Get application data' }, ...auth,
  }, async (request: any) => {
    const { applicationId, sectionId } = request.body as any
    return svc().getApplicationData(applicationId, sectionId)
  })

  fastify.post('/api/application/create-audit-log', {
    schema: { tags: ['Application'], summary: 'Create audit log entry' }, ...auth,
  }, async (request: any) => {
    const userId = request.user.userId
    return svc().createAuditLog({ ...(request.body as any), userId })
  })

  fastify.post('/api/application/create-application-version', {
    schema: { tags: ['Application'], summary: 'Create application version snapshot' }, ...auth,
  }, async (request: any) => svc().createVersion({ ...(request.body as any), userId: request.user.userId }))

  fastify.post('/api/application/get-milestone', {
    schema: { tags: ['Application'], summary: 'Get application milestones' }, ...auth,
  }, async (request: any) => svc().getMilestone((request.body as any).applicationId))

  fastify.get('/api/application/get-all-sections', {
    schema: { tags: ['Application'], summary: 'Get all form sections' }, ...auth,
  }, async () => svc().getAllSections())

  fastify.get('/api/application/check-connection', {
    schema: { tags: ['Application'], summary: 'Health check' }, config: { auth: false },
  }, async () => ({ success: true, payload: 'OK' }))

  fastify.get('/api/application/internal-statuses', {
    schema: { tags: ['Application'], summary: 'Get internal statuses' }, ...auth,
  }, async () => svc().getAllStatuses())

  fastify.post('/api/application/update-internal-status', {
    schema: { tags: ['Application'], summary: 'Update internal status' }, ...auth,
  }, async (request: any) => {
    const { applicationId, statusId, statusName } = request.body as any
    return svc().updateInternalStatus(applicationId, statusId, statusName)
  })

  fastify.post('/api/application/support-callback-request', {
    schema: { tags: ['Application'], summary: 'Submit support callback request' }, ...auth,
  }, async (request: any) => svc().supportCallbackRequest(request.body as any))

  fastify.post('/api/application/submit-scenario', {
    schema: { tags: ['Application'], summary: 'Submit loan scenario' }, ...auth,
  }, async (request: any) => {
    const { applicationId, ...scenarioData } = request.body as any
    return svc().submitScenario({ applicationId, scenarioData })
  })

  fastify.post('/api/application/upsert-application', {
    schema: { tags: ['Application'], summary: 'Create or update application' }, ...auth,
  }, async (request: any) => {
    return svc().upsertApplication({ userId: request.user.userId, ...(request.body as any) })
  })

  fastify.post('/api/application/update-key-contact', {
    schema: { tags: ['Application'], summary: 'Update key contact' }, ...auth,
  }, async (request: any) => {
    const { applicationId, ...contactData } = request.body as any
    return svc().updateKeyContact({ applicationId, contactData })
  })

  fastify.post('/api/application/send-application-event-email', {
    schema: { tags: ['Application'], summary: 'Send application event email' }, ...auth,
  }, async (request: any) => svc().sendApplicationEventEmail(request.body as any))

  fastify.post('/api/application/ai-async-task-complete', {
    schema: { tags: ['Application'], summary: 'AI async task completion callback' }, config: { auth: false },
  }, async (request: any) => {
    const { applicationId, ...taskData } = request.body as any
    return svc().handleAiAsyncTaskComplete({ applicationId, taskData })
  })

  fastify.post('/api/application/credit-paper-async-complete', {
    schema: { tags: ['Application'], summary: 'Credit paper async completion callback' }, config: { auth: false },
  }, async (request: any) => {
    const { applicationId, ...result } = request.body as any
    return svc().handleCreditPaperAsyncComplete({ applicationId, result })
  })

  fastify.get('/api/application/can-generate-credit-paper', {
    schema: { tags: ['Application'], summary: 'Check if credit paper can be generated' }, ...auth,
  }, async (request: any) => svc().canGenerateCreditPaper(request.query.applicationId))

  fastify.post('/api/application/submit-assessment', {
    schema: { tags: ['Application'], summary: 'Submit application assessment' }, ...auth,
  }, async (request: any) => svc().submitAssessment({ userId: request.user.userId, ...(request.body as any) }))

  fastify.get('/api/application/get-assessment', {
    schema: { tags: ['Application'], summary: 'Get application assessment' }, ...auth,
  }, async (request: any) => svc().getAssessment(request.query.applicationId))

  fastify.post('/api/application/submit-form', {
    schema: { tags: ['Application'], summary: 'Submit application form' }, ...auth,
  }, async (request: any) => svc().submitForm({ userId: request.user.userId, ...(request.body as any) }))

  fastify.get('/api/application/get-form', {
    schema: { tags: ['Application'], summary: 'Get application form' }, ...auth,
  }, async (request: any) => svc().getForm(request.query.applicationId, request.user.userId))

  fastify.get('/api/application/screenshots', {
    schema: { tags: ['Application'], summary: 'List screenshots/files' }, ...auth,
  }, async (request: any) => svc().getFiles(request.query.applicationId, request.query.category))

  fastify.delete('/api/application/screenshot/:id', {
    schema: { tags: ['Application'], summary: 'Delete a file' }, ...auth,
  }, async (request: any) => svc().deleteFile(request.params.id))

  fastify.get('/api/application/screenshots/categories', {
    schema: { tags: ['Application'], summary: 'Get file categories' }, ...auth,
  }, async (request: any) => svc().getFileCategories(request.query.applicationId))

  fastify.get('/api/application/deal-detail', {
    schema: { tags: ['Application'], summary: 'Get deal detail' }, ...auth,
  }, async (request: any) => svc().getDealDetail(request.query.applicationId))

  fastify.post('/api/application/deal-detail', {
    schema: { tags: ['Application'], summary: 'Save deal detail' }, ...auth,
  }, async (request: any) => {
    const { applicationId, ...dealData } = request.body as any
    return svc().saveDealDetail(applicationId, dealData)
  })

  fastify.get('/api/application/download-cp-file/:fileId', {
    schema: { tags: ['Application'], summary: 'Download credit paper file' }, ...auth,
  }, async (request: any, reply) => {
    const result = await svc().downloadCreditPaperFile(request.params.fileId)
    if (!result.success) return reply.code(404).send(result)
    const { fileData, contentType, fileName } = result.payload!
    return reply.header('Content-Type', contentType).header('Content-Disposition', `attachment; filename="${fileName}"`).send(fileData)
  })

  fastify.post('/api/application/cp-generation-async', {
    schema: { tags: ['Application'], summary: 'Trigger async credit paper generation' }, ...auth,
  }, async (request: any) => svc().triggerCreditPaperGeneration((request.body as any).applicationId, request.user.userId))

  fastify.post('/api/application/cp-regeneration-async', {
    schema: { tags: ['Application'], summary: 'Trigger async credit paper regeneration' }, ...auth,
  }, async (request: any) => svc().triggerCreditPaperGeneration((request.body as any).applicationId, request.user.userId))

  fastify.get('/api/application/get-external-data', {
    schema: { tags: ['Application'], summary: 'Get external data' }, ...auth,
  }, async (request: any) => svc().getApplicationDetail(request.query.applicationId))

  fastify.get('/api/application/generate-application-form', {
    schema: { tags: ['Application'], summary: 'Generate application form' }, ...auth,
  }, async (request: any) => svc().getForm(request.query.applicationId, request.user.userId))

  fastify.get('/api/application/agent-extracted-data', {
    schema: { tags: ['Application'], summary: 'Get agent extracted data' }, ...auth,
  }, async (request: any) => svc().getApplicationData(request.query.applicationId))

  fastify.post('/api/application/agent-extracted-data', {
    schema: { tags: ['Application'], summary: 'Save agent extracted data' }, ...auth,
  }, async (request: any) => svc().saveApplicationData(request.body as any))

  fastify.get('/api/application/combine-agent-extracted-data', {
    schema: { tags: ['Application'], summary: 'Combine agent extracted data' }, ...auth,
  }, async (request: any) => svc().getApplicationData(request.query.applicationId))

  fastify.get('/api/application/categories', {
    schema: { tags: ['Application'], summary: 'Get application categories' }, ...auth,
  }, async () => svc().getAllSections())

  fastify.get('/api/application/categories/:categoryId/slots', {
    schema: { tags: ['Application'], summary: 'Get slots for a category' }, ...auth,
  }, async () => ({ success: true, payload: [] }))

  fastify.post('/api/application/credit-paper-screenshots', {
    schema: { tags: ['Application'], summary: 'Create credit paper screenshots' }, ...auth,
  }, async (request: any) => {
    const { applicationId, fileId, documentKey, fileName } = request.body as any
    return svc().createFile({ applicationId, userId: request.user.userId, fileId, documentKey, fileName, category: 'credit-paper' })
  })

  fastify.get('/api/application/credit-paper-screenshots/:applicationId', {
    schema: { tags: ['Application'], summary: 'Get credit paper screenshots' }, ...auth,
  }, async (request: any) => svc().getFiles(request.params.applicationId, 'credit-paper'))

  fastify.delete('/api/application/credit-paper-screenshots', {
    schema: { tags: ['Application'], summary: 'Delete credit paper screenshots' }, ...auth,
  }, async (request: any) => svc().deleteFile((request.body as any).id))

  fastify.post('/api/application/update-credit-paper-screenshots', {
    schema: { tags: ['Application'], summary: 'Update credit paper screenshots' }, ...auth,
  }, async () => ({ success: true, payload: true }))

  fastify.post('/api/application/delete-agent-status-document', {
    schema: { tags: ['Application'], summary: 'Delete agent status document' }, ...auth,
  }, async (request: any) => svc().deleteFile((request.body as any).id))

  fastify.post('/api/application/rerun-agent-extraction', {
    schema: { tags: ['Application'], summary: 'Rerun agent extraction' }, ...auth,
  }, async (request: any) => svc().triggerCreditPaperGeneration((request.body as any).applicationId, request.user.userId))

  fastify.get('/api/application/credit-paper-webhook-response/:applicationId', {
    schema: { tags: ['Application'], summary: 'Get credit paper webhook response' }, ...auth,
  }, async () => ({ success: true, payload: null }))

  fastify.post('/api/application/update-agent-status-to-failed', {
    schema: { tags: ['Application'], summary: 'Mark agent status as failed' }, ...auth,
  }, async () => ({ success: true, payload: true }))

  fastify.post('/api/application/get-credit', {
    schema: { tags: ['Application'], summary: 'Get credit information' }, ...auth,
  }, async (request: any) => svc().getApplicationData((request.body as any).applicationId))

  fastify.post('/api/application/save-credit', {
    schema: { tags: ['Application'], summary: 'Save credit information' }, ...auth,
  }, async (request: any) => {
    const { applicationId, sectionId, creditData } = request.body as any
    return svc().saveApplicationData({ applicationId, sectionId: sectionId ?? 99, sectionData: creditData })
  })

  fastify.get('/api/application/get-market-intelligence', {
    schema: { tags: ['Application'], summary: 'Get market intelligence data' }, ...auth,
  }, async () => ({ success: true, payload: null }))

  fastify.post('/api/application/get-agent-section-mapping', {
    schema: { tags: ['Application'], summary: 'Get agent section mapping' }, ...auth,
  }, async () => ({ success: true, payload: [] }))

  fastify.get('/api/application/credit-check-results', {
    schema: { tags: ['Application'], summary: 'Get credit check results' }, ...auth,
  }, async () => ({ success: true, payload: null }))
}
