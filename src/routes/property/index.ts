import { FastifyInstance } from 'fastify'
import axios from 'axios'
import { config } from '../../config/index.js'

function archistarHeaders() {
  return { 'x-api-key': config.ARCHISTAR_API_KEY, 'Content-Type': 'application/json' }
}

export default async function propertyRoutes(fastify: FastifyInstance) {

  // POST /api/property/get-property
  fastify.post('/api/property/get-property', {
    schema: {
      tags: ['Property'],
      summary: 'Get property planning details from Archistar',
      body: {
        type: 'object',
        properties: {
          address:    { type: 'string' },
          propertyId: { type: 'string' },
          suburb:     { type: 'string' },
          postcode:   { type: 'string' },
          state:      { type: 'string' },
        },
      },
    },
    config: { auth: false },
  }, async (request: any) => {
    if (!config.ARCHISTAR_URL || !config.ARCHISTAR_API_KEY) {
      return { success: false, error: 'Archistar not configured' }
    }
    try {
      const res = await axios.post(`${config.ARCHISTAR_URL}/property`, request.body, {
        headers: archistarHeaders(),
      })
      return { success: true, payload: res.data }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // POST /api/property/get-lot-image
  fastify.post('/api/property/get-lot-image', {
    schema: {
      tags: ['Property'],
      summary: 'Get aerial lot image from Archistar using lat/lon',
      body: {
        type: 'object',
        required: ['latitude', 'longitude'],
        properties: {
          latitude:  { type: 'number' },
          longitude: { type: 'number' },
          overlay:   { type: 'string', default: 'zoning' },
          addLegend: { type: 'boolean', default: true },
          width:     { type: 'number', default: 660 },
          height:    { type: 'number', default: 500 },
        },
      },
    },
    config: { auth: false },
  }, async (request: any) => {
    if (!config.ARCHISTAR_URL || !config.ARCHISTAR_API_KEY) {
      return { success: false, error: 'Archistar not configured' }
    }
    try {
      const body = request.body as any
      const res = await axios.post(`${config.ARCHISTAR_URL}/property/image`, {
        latitude:  body.latitude,
        longitude: body.longitude,
        overlay:   body.overlay  ?? 'zoning',
        addLegend: body.addLegend ?? true,
        width:     body.width    ?? 660,
        height:    body.height   ?? 500,
      }, { headers: archistarHeaders() })

      const result = res.data?.result
      if (!result || typeof result === 'string') {
        return { success: false, error: result || 'No image returned' }
      }
      return { success: true, payload: { url: result.url, externalData: result.externalData } }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
