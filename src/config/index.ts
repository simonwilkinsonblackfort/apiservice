import { z } from 'zod'

const envSchema = z.object({
  MONGODB_URI: z.string().default('mongodb://localhost:27017/blackfort'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().default('blackfort-dev'),
  JWT_AUDIENCE: z.string().default('blackfort-dev'),
  JWT_EXPIRY_MINUTES: z.coerce.number().default(4320),

  ARCHISTA_JWT_SECRET: z.string().default(''),
  ARCHISTA_TOKEN_EXPIRY_MINUTES: z.coerce.number().default(60),

  TOKEN_EXCHANGE_KEY: z.string().default(''),
  TOKEN_EXCHANGE_SALT: z.string().default(''),
  REFRESH_KEY: z.string().default(''),

  SECRET_KEY: z.string().default(''),

  APP_ID: z.coerce.number().default(1),
  ENV_TAG: z.string().default('dev'),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

  // AWS
  AWS_REGION: z.string().default('ap-southeast-2'),
  AWS_ACCESS_KEY_ID: z.string().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().default(''),
  S3_BUCKET_NAME: z.string().default('blackfort-documents'),
  S3_BUCKET_MANUAL_TERMSHEET: z.string().default('blackfort-manual-termsheets'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // ChatAI
  CHAT_AI_API_KEY: z.string().default(''),
  CHAT_AI_URL: z.string().default(''),
  CHAT_AI_UTILITY_TYPE: z.string().default(''),
  CHAT_AI_MODEL_ID: z.string().default(''),
  CHAT_AI_ORIGIN: z.string().default(''),
  CHAT_AI_SECRET_KEY: z.string().default(''),
  CHAT_AI_TEMPLATE_NAME: z.string().default(''),
  CHAT_AI_APPLICATION_FEE: z.string().default(''),
  CHAT_AI_PUBLIC_UTILITY_TYPE: z.string().default(''),
  CHAT_AI_PRIVATE_UTILITY_TYPE: z.string().default(''),
  CHAT_AI_COMPARE_OPTION: z.string().default(''),
  CHAT_AI_TERM_SHEET_EXTRACTION: z.string().default(''),
  CHAT_AI_GENERATE_TERM_SHEET: z.string().default(''),
  CHAT_AI_MANUAL_TERM_SHEET_API_KEY: z.string().default(''),
  CHAT_AI_MANUAL_TERM_SHEET_TEMPLATE_NAME: z.string().default(''),
  CHAT_AI_RETRY_COUNT: z.coerce.number().default(3),

  // Webhook
  WEBHOOK_URL: z.string().default(''),

  // Admin emails
  ADMIN_EMAIL: z.string().default('admin@example.com'),
  ADMIN_EMAIL_SUPPORT_CALLBACK: z.string().default('admin@example.com'),
  ADMIN_EMAIL_SUBSCRIPTION: z.string().default('admin@example.com'),
  ADMIN_EMAIL_CALLBACK_FORM: z.string().default('admin@example.com'),
  TERM_SHEET_CC_EMAIL: z.string().default('admin@example.com'),

  // App URLs
  BLACKFORT_API_URL: z.string().default('http://localhost:3000'),
  BLACKFORT_UI_URL: z.string().default('http://localhost:3000'),

  // ElasticSearch
  ELASTICSEARCH_URL: z.string().default(''),
  ELASTICSEARCH_INDEX: z.string().default(''),
  ELASTICSEARCH_USERNAME: z.string().default(''),
  ELASTICSEARCH_PASSWORD: z.string().default(''),

  // SharePoint
  SHAREPOINT_TENANT_ID: z.string().default(''),
  SHAREPOINT_CLIENT_ID: z.string().default(''),
  SHAREPOINT_CLIENT_SECRET: z.string().default(''),
  SHAREPOINT_SITE_ID: z.string().default(''),
  SHAREPOINT_FILE_ID: z.string().default(''),
  SHAREPOINT_SHEET_NAME: z.string().default(''),

  // Email (SMTP / nodemailer)
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('noreply@blackfort.com.au'),

  // Archistar
  ARCHISTAR_URL: z.string().default(''),
  ARCHISTAR_API_KEY: z.string().default(''),

  // CoreLogic
  CORELOGIC_URL: z.string().default(''),
  CORELOGIC_ACCOUNT_KEY: z.string().default(''),
  CORELOGIC_ACCOUNT_SECRET: z.string().default(''),
  CORELOGIC_HEADER_TOKEN: z.string().default(''),

  // Equifax
  EQUIFAX_URL: z.string().default(''),
  EQUIFAX_ACCOUNT_KEY: z.string().default(''),
  EQUIFAX_ACCOUNT_SECRET: z.string().default(''),
  EQUIFAX_HEADER_TOKEN: z.string().default(''),

  // Security
  NONCE_VALIDATION_ENABLED: z.coerce.boolean().default(false),
  NONCE_VALIDATION_SECRET: z.string().default(''),
  SHOW_OTP_IN_RESPONSE: z.coerce.boolean().default(true),
  ENABLE_DATABASE_LOGGING: z.coerce.boolean().default(false),
  ENABLE_APPLICATION_CHECK: z.coerce.boolean().default(false),
})

function loadConfig() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format())
    process.exit(1)
  }
  return result.data
}

export const config = loadConfig()

export type Config = typeof config
