import { FastifyInstance } from 'fastify'
import axios from 'axios'
import { config } from '../../config/index.js'

function headers() {
  return { 'x-api-key': config.ARCHISTAR_API_KEY, 'Content-Type': 'application/json' }
}

export default async function propertyRoutes(fastify: FastifyInstance) {

  // POST /api/property/get-property
  // Resolves address → propertyID → planning data + zoning image in one call
  fastify.post('/api/property/get-property', {
    schema: {
      tags: ['Property'],
      summary: 'Get property planning details and aerial image from Archistar',
      body: {
        type: 'object',
        properties: {
          address:   { type: 'string' },
          suburb:    { type: 'string' },
          postcode:  { type: 'string' },
          state:     { type: 'string' },
        },
      },
    },
    config: { auth: false },
  }, async (request: any) => {
    if (!config.ARCHISTAR_URL || !config.ARCHISTAR_API_KEY) {
      return { success: false, error: 'Archistar not configured' }
    }

    const body = request.body as any

    try {
      // Step 1: resolve propertyID from address
      const suggestRes = await axios.post(`${config.ARCHISTAR_URL}/property/suggest`, {
        streetAddress: body.address,
        suburb:        body.suburb,
        postCode:      body.postcode ? parseInt(body.postcode) : undefined,
        state:         body.state,
      }, { headers: headers() })

      const suggested = suggestRes.data?.result
      if (!suggested || typeof suggested === 'string') {
        return { success: false, error: typeof suggested === 'string' ? suggested : 'Address not found' }
      }

      const propertyID = suggested.propertyID

      // Step 2: fetch planning data + image in parallel
      const [planningRes, imageRes] = await Promise.all([
        axios.post(`${config.ARCHISTAR_URL}/property/planning-essentials`,
          { propertyID }, { headers: headers() }),
        axios.post(`${config.ARCHISTAR_URL}/property/image`, {
          propertyID,
          overlay:   'zoning',
          addLegend: true,
          width:     660,
          height:    500,
        }, { headers: headers() }),
      ])

      const property = planningRes.data?.result?.Property
      if (!property) {
        return { success: false, error: 'No planning data found' }
      }

      const imageResult = imageRes.data?.result
      const imageUrl = (imageResult && typeof imageResult !== 'string') ? imageResult.url : null

      return {
        success: true,
        payload: {
          ...property,
          imageUrl,
          listingAddress: suggested.listingAddress,
          matchedAddress: suggested.matchedAddress,
        },
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // POST /api/property/get-lot-image (kept for backwards compat)
  fastify.post('/api/property/get-lot-image', {
    schema: {
      tags: ['Property'],
      summary: 'Get aerial lot image from Archistar by propertyID or lat/lon',
      body: {
        type: 'object',
        properties: {
          propertyID: { type: 'string' },
          latitude:   { type: 'number' },
          longitude:  { type: 'number' },
          overlay:    { type: 'string', default: 'zoning' },
          addLegend:  { type: 'boolean', default: true },
          width:      { type: 'number', default: 660 },
          height:     { type: 'number', default: 500 },
        },
      },
    },
    config: { auth: false },
  }, async (request: any) => {
    if (!config.ARCHISTAR_URL || !config.ARCHISTAR_API_KEY) {
      return { success: false, error: 'Archistar not configured' }
    }
    const body = request.body as any
    try {
      const payload: any = {
        overlay:   body.overlay   ?? 'zoning',
        addLegend: body.addLegend ?? true,
        width:     body.width     ?? 660,
        height:    body.height    ?? 500,
      }
      if (body.propertyID)       payload.propertyID = body.propertyID
      else if (body.latitude)    { payload.latitude = body.latitude; payload.longitude = body.longitude }

      const res = await axios.post(`${config.ARCHISTAR_URL}/property/image`, payload, { headers: headers() })
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
