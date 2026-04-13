import { FastifyInstance } from 'fastify'
import { S3Client } from '../../integrations/s3/s3.client.js'
import { AppDocument } from '../../models/index.js'

export default async function workspaceRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [fastify.authenticate] }

  fastify.post('/api/workspace/upload-file', {
    schema: { tags: ['Workspace'], summary: 'Upload a file to the workspace' },
    ...auth,
  }, async (request: any) => {
    const userId = request.user.userId
    const s3 = new S3Client()

    const parts = request.parts()
    const uploaded: { fileId: string; fileName: string }[] = []

    for await (const part of parts) {
      if (part.type === 'file') {
        const key = `workspace/${userId}/${Date.now()}-${part.filename}`
        const chunks: Buffer[] = []
        for await (const chunk of part.file) chunks.push(chunk)
        await s3.putFile(s3.getDefaultBucket(), key, Buffer.concat(chunks), part.mimetype)
        uploaded.push({ fileId: key, fileName: part.filename })
      }
    }

    return { success: true, payload: uploaded }
  })

  fastify.get('/api/workspace/get-document', {
    schema: { tags: ['Workspace'], summary: 'Get a workspace document' },
    ...auth,
  }, async (request: any, reply) => {
    const { documentKey } = request.query as any

    const doc = await AppDocument.findOne({ documentKey, isDeleted: false }).lean()
    if (!doc) return reply.code(404).send({ success: false, error: 'Document not found' })

    const s3 = new S3Client()
    try {
      const fileData = await s3.getFile(s3.getDefaultBucket(), (doc as any).documentPath ?? doc.documentKey)
      return reply
        .header('Content-Type', 'application/octet-stream')
        .header('Content-Disposition', `attachment; filename="${(doc as any).documentFileName}"`)
        .send(fileData)
    } catch {
      return reply.code(404).send({ success: false, error: 'File not found in storage' })
    }
  })

  fastify.delete('/api/workspace/delete-document', {
    schema: { tags: ['Workspace'], summary: 'Delete a workspace document' },
    ...auth,
  }, async (request: any, reply) => {
    const { documentKey } = request.query as any

    const doc = await AppDocument.findOneAndUpdate(
      { documentKey, isDeleted: false },
      { $set: { isDeleted: true, dateModified: new Date() } },
      { new: true },
    ).lean()

    if (!doc) return reply.code(404).send({ success: false, error: 'Document not found' })
    return { success: true, payload: true }
  })

  fastify.post('/api/workspace/export-documents', {
    schema: { tags: ['Workspace'], summary: 'Export workspace documents as zip' },
    ...auth,
  }, async () => ({ success: true, payload: { message: 'Export initiated' } }))
}
