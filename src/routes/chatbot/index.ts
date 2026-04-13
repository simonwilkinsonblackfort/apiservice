import { FastifyInstance } from 'fastify'
import { Types } from 'mongoose'
import { ChatAIClient } from '../../integrations/chatai/chatai.client.js'
import { S3Client } from '../../integrations/s3/s3.client.js'
import { ChatbotLookup, AIResponseLog, ConstructionPostCode, AcceptablePostCode, AppDocument } from '../../models/index.js'

export default async function chatbotRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [fastify.authenticate] }

  fastify.post('/api/chatbot/generate', {
    schema: { tags: ['ChatBot'], summary: 'Generate AI response' }, ...auth,
  }, async (request: any) => {
    const client = new ChatAIClient()
    const body = request.body as any
    try {
      const result = await client.generate({ messages: body.messages, utilityType: body.utilityType, modelId: body.modelId, applicationId: body.applicationId, userId: request.user.userId })
      return { success: true, payload: result }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  fastify.post('/api/chatbot/upload-files', {
    schema: { tags: ['ChatBot'], summary: 'Upload files for AI processing' }, ...auth,
  }, async (request: any) => {
    const s3 = new S3Client()
    const parts = request.parts()
    const uploaded: string[] = []
    for await (const part of parts) {
      if (part.type === 'file') {
        const key = `chatbot/${Date.now()}-${part.filename}`
        const chunks: Buffer[] = []
        for await (const chunk of part.file) chunks.push(chunk)
        await s3.putFile(s3.getDefaultBucket(), key, Buffer.concat(chunks), part.mimetype)
        uploaded.push(key)
      }
    }
    return { success: true, payload: { fileIds: uploaded } }
  })

  fastify.post('/api/chatbot/get-lookup-by-keyname', {
    schema: { tags: ['ChatBot'], summary: 'Get lookup data by key name' }, ...auth,
  }, async (request: any) => {
    const lookup = await ChatbotLookup.findOne({ keyName: (request.body as any).keyName, isDelete: false }).lean()
    return { success: true, payload: lookup }
  })

  fastify.post('/api/chatbot/get-file', {
    schema: { tags: ['ChatBot'], summary: 'Retrieve a file' }, ...auth,
  }, async (request: any, reply) => {
    const { fileId, bucket } = request.body as any
    const s3 = new S3Client()
    try {
      const fileData = await s3.getFile(bucket ?? s3.getDefaultBucket(), fileId)
      return reply.send(fileData)
    } catch {
      return reply.code(404).send({ success: false, error: 'File not found' })
    }
  })

  fastify.get('/api/chatbot/render-template', {
    schema: { tags: ['ChatBot'], summary: 'Render a template' }, ...auth,
  }, async (request: any) => {
    const { templateName, ...data } = request.query as any
    const client = new ChatAIClient()
    try {
      const result = await client.renderTemplate(templateName, data)
      return { success: true, payload: result }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  fastify.post('/api/chatbot/create-ai-response-log', {
    schema: { tags: ['ChatBot'], summary: 'Log an AI response' }, ...auth,
  }, async (request: any) => {
    const { applicationId, chatTypeId, request: req, status } = request.body as any
    const log = await AIResponseLog.create({
      userId: new Types.ObjectId(request.user.userId),
      applicationId: applicationId ? new Types.ObjectId(applicationId) : undefined,
      chatTypeId: chatTypeId ?? 1,
      request: req,
      status,
    })
    return { success: true, payload: { id: log._id.toString() } }
  })

  fastify.post('/api/chatbot/termsheet-data-extraction', {
    schema: { tags: ['ChatBot'], summary: 'Extract data from a term sheet' }, ...auth,
  }, async (request: any) => {
    const { fileId, fileName } = request.body as any
    const s3 = new S3Client()
    const client = new ChatAIClient()
    try {
      const fileContent = await s3.getFile(s3.getDefaultBucket(), fileId)
      const result = await client.extractTermSheetData({ fileContent, fileName })
      return { success: true, payload: result }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  fastify.post('/api/chatbot/compare-option', {
    schema: { tags: ['ChatBot'], summary: 'Compare loan options' }, ...auth,
  }, async (request: any) => {
    const client = new ChatAIClient()
    try {
      const result = await client.compareOption(request.body as any)
      return { success: true, payload: result }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  fastify.post('/api/chatbot/generate-termsheet', {
    schema: { tags: ['ChatBot'], summary: 'Generate a term sheet' }, ...auth,
  }, async (request: any) => {
    const client = new ChatAIClient()
    try {
      const result = await client.generateTermSheet(request.body as any)
      return { success: true, payload: result }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  fastify.post('/api/chatbot/notify-to-admin', {
    schema: { tags: ['ChatBot'], summary: 'Send admin notification' }, ...auth,
  }, async () => ({ success: true, payload: true }))

  fastify.post('/api/chatbot/get-construction-postcode', {
    schema: { tags: ['ChatBot'], summary: 'Get construction postcodes', body: { type: 'object', properties: { postcode: { type: 'string' } } } },
    config: { auth: false },
  }, async (request: any) => {
    const postcode = (request.body as any)?.postcode
    const query = postcode ? { postcode: { $regex: postcode } } : {}
    const results = await ConstructionPostCode.find(query).limit(200).lean()
    return { success: true, payload: results }
  })

  fastify.post('/api/chatbot/get-acceptable-postcode', {
    schema: { tags: ['ChatBot'], summary: 'Returns true if the postcode is in the acceptable list', body: { type: 'object', properties: { postcode: { type: 'string' } } } },
    config: { auth: false },
  }, async (request: any) => {
    const postcode = (request.body as any)?.postcode
    if (!postcode) return { success: true, payload: false }
    const exists = await AcceptablePostCode.exists({ postcode })
    return { success: true, payload: !!exists }
  })

  fastify.post('/api/chatbot/set-acceptable-postcodes', {
    schema: {
      tags: ['ChatBot'],
      summary: 'Set acceptable postcodes (replaces existing list)',
      body: {
        type: 'object',
        required: ['postcodes'],
        properties: {
          postcodes: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    ...auth,
  }, async (request: any) => {
    const postcodes: string[] = (request.body as any).postcodes
    // Replace entire list
    await AcceptablePostCode.deleteMany({})
    if (postcodes.length > 0) {
      await AcceptablePostCode.insertMany(postcodes.map(p => ({ postcode: p.trim() })))
    }
    return { success: true, payload: { count: postcodes.length } }
  })

  fastify.post('/api/chatbot/get-document', {
    schema: { tags: ['ChatBot'], summary: 'Get a document' }, ...auth,
  }, async (request: any, reply) => {
    const doc = await AppDocument.findOne({ documentKey: (request.body as any).documentKey, isDeleted: false }).lean()
    if (!doc) return reply.code(404).send({ success: false, error: 'Document not found' })
    return { success: true, payload: doc }
  })
}
