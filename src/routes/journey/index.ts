import { FastifyInstance } from 'fastify'
import { Journey, User, generateJourneyRef } from '../../models/index.js'

const VALID_STAGES = new Set(['search', 'assessment', 'intent', 'terms', 'termsheet'])

export default async function journeyRoutes(fastify: FastifyInstance) {
  // POST /api/journey — create a new journey
  fastify.post('/api/journey', {
    config: { auth: false },
    schema: {
      tags: ['Journey'],
      summary: 'Create a new customer journey',
    },
  }, async (request: any, reply) => {
    const { sessionId, address, suburb, state, postcode, lat, lon } = request.body as any

    let customerId: any = undefined
    try {
      const authHeader = request.headers['authorization'] || ''
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        const decoded = fastify.jwt.verify(token) as any
        if (decoded?._id || decoded?.id) {
          customerId = decoded._id || decoded.id
        }
      }
    } catch {
      // Fail silently — anonymous journey
    }

    const now = new Date()
    const journeyRef = generateJourneyRef()

    const journey = await Journey.create({
      journeyRef,
      sessionId,
      customerId,
      isAnonymous: !customerId,
      address: address || '',
      suburb: suburb || '',
      state: state || '',
      postcode: postcode || '',
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined,
      stages: {
        search: {
          timestamp: now,
          data: { address, suburb, state, postcode, lat, lon },
        },
      },
      events: [
        {
          stage: 'search',
          action: 'address_selected',
          timestamp: now,
          data: request.body,
        },
      ],
    })

    return { success: true, payload: { journeyId: journey._id, journeyRef: journey.journeyRef } }
  })

  // PATCH /api/journey/:journeyId — update a stage
  fastify.patch('/api/journey/:journeyId', {
    config: { auth: false },
    schema: {
      tags: ['Journey'],
      summary: 'Update a journey stage',
    },
  }, async (request: any, reply) => {
    const { journeyId } = request.params as any
    const { stage, data } = request.body as any

    if (!VALID_STAGES.has(stage)) {
      return reply.status(400).send({ success: false, error: 'Invalid stage' })
    }

    const now = new Date()
    const update: Record<string, any> = {
      $set: {
        [`stages.${stage}`]: { timestamp: now, data: data || {} },
      },
      $push: {
        events: {
          stage,
          action: `${stage}_viewed`,
          timestamp: now,
          data: data || {},
        },
      },
    }

    // If auth token present, associate customer
    try {
      const authHeader = request.headers['authorization'] || ''
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        const decoded = fastify.jwt.verify(token) as any
        const cid = decoded?.userId || decoded?.sub
        if (cid) {
          update.$set.customerId = cid
          update.$set.isAnonymous = false
        }
      }
    } catch {
      // Fail silently
    }

    await Journey.findByIdAndUpdate(journeyId, update)
    return { success: true }
  })

  // GET /api/journey/analytics — funnel + hot leads (admin)
  fastify.get('/api/journey/analytics', {
    preHandler: [fastify.authenticate],
    schema: { tags: ['Journey'], summary: 'Journey analytics dashboard data' },
  }, async (request: any) => {
    const stages = ['search', 'assessment', 'intent', 'terms', 'termsheet']

    const [funnelRaw, recentRaw, totalAnon, totalRegistered] = await Promise.all([
      // Count journeys that have each stage
      Promise.all(stages.map(s =>
        Journey.countDocuments({ [`stages.${s}`]: { $exists: true } })
      )),
      // Last 200 journeys for table display
      Journey.find({}).sort({ createdAt: -1 }).limit(200).lean(),
      Journey.countDocuments({ isAnonymous: true }),
      Journey.countDocuments({ isAnonymous: false }),
    ])

    const funnel = Object.fromEntries(stages.map((s, i) => [s, funnelRaw[i]]))

    // Enrich journeys with user info where available
    const customerIds = recentRaw
      .filter(j => j.customerId)
      .map(j => j.customerId)

    const users = customerIds.length
      ? await User.find({ _id: { $in: customerIds } }).select('email profile mobile').lean()
      : []

    const userMap = Object.fromEntries(users.map((u: any) => [u._id.toString(), u]))

    const journeys = recentRaw.map(j => {
      const user = j.customerId ? userMap[j.customerId.toString()] : null
      const stagesReached = stages.filter(s => (j.stages as any)?.[s])
      const deepest = [...stagesReached].pop() || 'search'
      return {
        _id: j._id,
        journeyRef: j.journeyRef,
        isAnonymous: j.isAnonymous,
        address: j.address,
        suburb: j.suburb,
        state: j.state,
        stagesReached,
        deepest,
        completedTerms: !!(j.stages as any)?.terms,
        completedTermsheet: !!(j.stages as any)?.termsheet,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
        user: user ? {
          email: (user as any).email,
          name: [(user as any).profile?.firstName, (user as any).profile?.lastName].filter(Boolean).join(' '),
          mobile: (user as any).mobile,
        } : null,
        termsData: (j.stages as any)?.terms?.data || null,
        termsheetData: (j.stages as any)?.termsheet?.data || null,
      }
    })

    const hotLeads = journeys.filter(j => j.completedTerms)

    return {
      success: true,
      payload: {
        funnel,
        totals: { total: totalAnon + totalRegistered, anonymous: totalAnon, registered: totalRegistered },
        hotLeads,
        journeys,
      },
    }
  })

  // GET /api/journey — list journeys (admin, auth required)
  fastify.get('/api/journey', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Journey'],
      summary: 'List customer journeys (admin)',
    },
  }, async (request: any, reply) => {
    const { page = 1, limit = 20, customerId, isAnonymous } = request.query as any

    const filter: Record<string, any> = {}
    if (customerId) filter.customerId = customerId
    if (isAnonymous !== undefined) filter.isAnonymous = isAnonymous === 'true' || isAnonymous === true

    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const skip = (pageNum - 1) * limitNum

    const [journeys, total] = await Promise.all([
      Journey.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Journey.countDocuments(filter),
    ])

    return {
      success: true,
      payload: {
        journeys,
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    }
  })
}
