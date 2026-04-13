import axios, { AxiosInstance } from 'axios'
import { config } from '../../config/index.js'

export class ChatAIClient {
  private http: AxiosInstance

  constructor() {
    this.http = axios.create({
      baseURL: config.CHAT_AI_URL,
      headers: {
        'Authorization': `Bearer ${config.CHAT_AI_API_KEY}`,
        'Content-Type': 'application/json',
        'Origin': config.CHAT_AI_ORIGIN,
        'x-secret-key': config.CHAT_AI_SECRET_KEY,
      },
      timeout: 120_000, // AI calls can be slow
    })
  }

  async generate(params: {
    messages: Array<{ role: string; content: string }>
    utilityType?: string
    modelId?: string
    applicationId?: string
    userId?: string
  }) {
    const response = await this.http.post('/generate', {
      messages: params.messages,
      utilityType: params.utilityType ?? config.CHAT_AI_UTILITY_TYPE,
      modelId: params.modelId ?? config.CHAT_AI_MODEL_ID,
      applicationId: params.applicationId,
      userId: params.userId,
    })
    return response.data
  }

  async generateTermSheet(params: { applicationData: object; templateName?: string }) {
    const response = await this.http.post('/generate-termsheet', {
      applicationData: params.applicationData,
      templateName: params.templateName ?? config.CHAT_AI_TEMPLATE_NAME,
    })
    return response.data
  }

  async extractTermSheetData(params: { fileContent: Buffer; fileName: string }) {
    const form = new FormData()
    form.append('file', new Blob([params.fileContent.buffer as ArrayBuffer]), params.fileName)

    const response = await this.http.post('/termsheet-extraction', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }

  async compareOption(params: { options: object[] }) {
    const response = await this.http.post('/compare-option', params)
    return response.data
  }

  async renderTemplate(templateName: string, data: object) {
    const response = await this.http.post('/render-template', { templateName, data })
    return response.data
  }
}
