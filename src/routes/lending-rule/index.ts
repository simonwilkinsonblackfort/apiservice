import { FastifyInstance } from 'fastify'
import { ConfigSetting } from '../../models/index.js'

export default async function lendingRuleRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [fastify.authenticate] }

  async function getRules(version: number) {
    const setting = await ConfigSetting.findOne({ settingKey: `LendingRules_v${version}`, isDeleted: false }).lean()
    if (!setting?.settingValue) return { success: true, payload: null }
    try {
      return { success: true, payload: JSON.parse(setting.settingValue) }
    } catch {
      return { success: true, payload: setting.settingValue }
    }
  }

  fastify.get('/api/lending-rule', { schema: { tags: ['LendingRule'], summary: 'Get lending rules (v1)' }, ...auth }, async () => getRules(1))
  fastify.get('/api/lending-rule/v2', { schema: { tags: ['LendingRule'], summary: 'Get lending rules (v2)' }, ...auth }, async () => getRules(2))
  fastify.get('/api/lending-rule/v3', { schema: { tags: ['LendingRule'], summary: 'Get lending rules (v3)' }, ...auth }, async () => getRules(3))

  fastify.get('/api/lending-rule/update', {
    schema: { tags: ['LendingRule'], summary: 'Refresh lending rules from source' },
    preHandler: [fastify.requireRole('Admin')],
  }, async () => ({ success: true, payload: 'Rules updated' }))
}
