import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const log = request.server.log

  if (error.validation) {
    return reply.code(400).send({
      success: false,
      error: 'Validation error',
      details: error.validation,
    })
  }

  if (error.statusCode === 401) {
    return reply.code(401).send({ success: false, error: 'Unauthorized' })
  }

  if (error.statusCode === 403) {
    return reply.code(403).send({ success: false, error: 'Forbidden' })
  }

  if (error.statusCode === 404) {
    return reply.code(404).send({ success: false, error: 'Not found' })
  }

  log.error({ err: error, req: { method: request.method, url: request.url } }, 'Unhandled error')

  return reply.code(500).send({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
  })
}
