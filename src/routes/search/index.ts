import { FastifyInstance } from 'fastify'
import axios from 'axios'
import { config } from '../../config/index.js'

export default async function searchRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [fastify.authenticate] }

  // POST /api/search/search-address
  fastify.post('/api/search/search-address', {
    schema: {
      tags: ['Search'],
      summary: 'Search for an address',
      body: { type: 'object', properties: { query: { type: 'string' } } },
    },
    ...auth,
  }, async (request: any, reply) => {
    const { query } = request.body as any
    if (!config.ARCHISTAR_URL || !config.ARCHISTAR_API_KEY) {
      return { success: false, error: 'Archistar not configured' }
    }
    try {
      const res = await axios.get(`${config.ARCHISTAR_URL}/address/search`, {
        params: { q: query },
        headers: { Authorization: `Bearer ${config.ARCHISTAR_API_KEY}` },
      })
      return { success: true, payload: res.data }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // POST /api/search/search-company-detail
  fastify.post('/api/search/search-company-detail', {
    schema: {
      tags: ['Search'],
      summary: 'Search for company details',
      body: { type: 'object', properties: { query: { type: 'string' } } },
    },
    ...auth,
  }, async (request: any) => {
    const { query } = request.body as any
    // CoreLogic company lookup
    if (!config.CORELOGIC_URL) return { success: false, error: 'CoreLogic not configured' }
    try {
      const res = await axios.get(`${config.CORELOGIC_URL}/company/search`, {
        params: { q: query },
        headers: {
          'x-account-key': config.CORELOGIC_ACCOUNT_KEY,
          'x-account-secret': config.CORELOGIC_ACCOUNT_SECRET,
        },
      })
      return { success: true, payload: res.data }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // POST /api/search/search-property-sale
  fastify.post('/api/search/search-property-sale', {
    schema: {
      tags: ['Search'],
      summary: 'Search property sale history',
      body: {
        type: 'object',
        properties: {
          address: { type: 'string' },
          suburb: { type: 'string' },
          postcode: { type: 'string' },
        },
      },
    },
    ...auth,
  }, async (request: any) => {
    if (!config.CORELOGIC_URL) return { success: false, error: 'CoreLogic not configured' }
    try {
      const res = await axios.post(`${config.CORELOGIC_URL}/property/sales`, request.body, {
        headers: {
          'x-account-key': config.CORELOGIC_ACCOUNT_KEY,
          'x-account-secret': config.CORELOGIC_ACCOUNT_SECRET,
        },
      })
      return { success: true, payload: res.data }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // POST /api/search/get-suburb-report
  fastify.post('/api/search/get-suburb-report', {
    schema: {
      tags: ['Search'],
      summary: 'Get suburb analytics report',
      body: {
        type: 'object',
        properties: {
          suburb: { type: 'string' },
          postcode: { type: 'string' },
          state: { type: 'string' },
        },
      },
    },
    ...auth,
  }, async (request: any) => {
    if (!config.CORELOGIC_URL) return { success: false, error: 'CoreLogic not configured' }
    try {
      const res = await axios.post(`${config.CORELOGIC_URL}/suburb/report`, request.body, {
        headers: {
          'x-account-key': config.CORELOGIC_ACCOUNT_KEY,
          'x-account-secret': config.CORELOGIC_ACCOUNT_SECRET,
        },
      })
      return { success: true, payload: res.data }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
