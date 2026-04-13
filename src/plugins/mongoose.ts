import fp from 'fastify-plugin'
import mongoose from 'mongoose'
import type { FastifyInstance } from 'fastify'
import { config } from '../config/index.js'

export default fp(async function mongoosePlugin(fastify: FastifyInstance) {
  mongoose.set('strictQuery', false)

  await mongoose.connect(config.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })

  fastify.log.info(`MongoDB connected: ${mongoose.connection.host}`)

  fastify.addHook('onClose', async () => {
    await mongoose.disconnect()
    fastify.log.info('MongoDB disconnected')
  })
})
