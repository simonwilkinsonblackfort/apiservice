import 'dotenv/config'
import { buildApp } from './app.js'
import { config } from './config/index.js'

// Optionally load secrets from AWS SSM before starting
// Uncomment if running on AWS with SSM parameter store:
// import { loadSecretsFromSSM } from './integrations/ssm/ssm.client.js'
// await loadSecretsFromSSM('/blackfort/prod/')

async function start() {
  const app = await buildApp()

  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' })
    app.log.info(`Server running at http://0.0.0.0:${config.PORT}`)
    app.log.info(`Swagger UI available at http://0.0.0.0:${config.PORT}/swagger`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\nShutting down...')
  process.exit(0)
})

start()
