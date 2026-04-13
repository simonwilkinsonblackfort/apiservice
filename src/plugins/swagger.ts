import fp from 'fastify-plugin'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { FastifyInstance } from 'fastify'

export default fp(async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Blackfort Lender API',
        description: 'Blackfort Lender Platform API',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: [
        { name: 'Identity', description: 'Authentication and token management' },
        { name: 'User', description: 'User management' },
        { name: 'Application', description: 'Loan application management' },
        { name: 'ChatBot', description: 'AI chatbot and document processing' },
        { name: 'Dashboard', description: 'Reporting and exports' },
        { name: 'LendingRule', description: 'Lending rules management' },
        { name: 'Search', description: 'Address, property and company search' },
        { name: 'Log', description: 'Audit logs' },
        { name: 'Workspace', description: 'Document workspace' },
        { name: 'Property', description: 'Property data' },
        { name: 'AIConfig', description: 'AI configuration management' },
        { name: 'Version', description: 'API version' },
      ],
    },
  })

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/swagger',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  })
})
