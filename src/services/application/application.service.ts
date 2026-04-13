import { FastifyInstance } from 'fastify'
import { Types } from 'mongoose'
import { ApplicationRepository } from '../../repositories/application/application.repository.js'
import { S3Client } from '../../integrations/s3/s3.client.js'
import { ok, fail, PaginatedRequest } from '../../domain/common.js'
import { config } from '../../config/index.js'
import axios from 'axios'

export class ApplicationService {
  private repo = new ApplicationRepository()
  private s3 = new S3Client()

  constructor(private fastify: FastifyInstance) {}

  private id(v: string) {
    return new Types.ObjectId(v)
  }

  async createApplication(userId: string, data: {
    loanCalculatorData?: object
    propertyDetails?: object
    type?: number
  }) {
    const app = await this.repo.create({ userId: this.id(userId), ...data })
    return ok({ applicationId: app._id.toString(), key: app.key })
  }

  async getApplicationsByUser(userId: string) {
    const apps = await this.repo.findByUserId(this.id(userId))
    return ok(apps.map(serializeApp))
  }

  async getApplicationCount(userId?: string) {
    const count = await this.repo.getCount(userId ? this.id(userId) : undefined)
    return ok(count)
  }

  async getListing(params: PaginatedRequest & { userId?: string; statusId?: string }) {
    const result = await this.repo.getListing({
      ...params,
      userId: params.userId ? this.id(params.userId) : undefined,
      statusId: params.statusId ? this.id(params.statusId) : undefined,
    })
    return ok({ ...result, items: result.items.map(serializeApp) })
  }

  async getGroupedByStatus(userId?: string) {
    const grouped = await this.repo.getGroupedByStatus(userId ? this.id(userId) : undefined)
    const serialized: Record<string, any[]> = {}
    for (const [key, apps] of Object.entries(grouped)) {
      serialized[key] = apps.map(serializeApp)
    }
    return ok(serialized)
  }

  async getApplicationsByCustomer(customerId: string) {
    return this.getApplicationsByUser(customerId)
  }

  async getApplicationDetail(id: string) {
    const app = await this.repo.findById(id)
    if (!app) return fail('Application not found')
    return ok(serializeApp(app))
  }

  async updateApplication(id: string, data: {
    loanCalculatorData?: object
    propertyDetails?: object
    statusId?: string
    mileStone?: object
    dealData?: object
  }) {
    const update: any = { ...data }
    if (data.statusId) update.statusId = this.id(data.statusId)
    const app = await this.repo.update(id, update)
    if (!app) return fail('Application not found')
    return ok(serializeApp(app))
  }

  async upsertApplication(params: {
    id?: string
    userId: string
    loanCalculatorData?: object
    propertyDetails?: object
    type?: number
  }) {
    const app = await this.repo.upsert({
      id: params.id ? this.id(params.id) : undefined,
      userId: this.id(params.userId),
      loanCalculatorData: params.loanCalculatorData,
      propertyDetails: params.propertyDetails,
      type: params.type,
    })
    if (!app) return fail('Operation failed')
    return ok(serializeApp(app))
  }

  async getApplicationStatus(applicationId: string) {
    const app = await this.repo.findById(applicationId)
    if (!app) return fail('Application not found')
    return ok({ statusId: (app as any).statusId?.toString(), status: (app as any).status })
  }

  async getAllStatuses(): Promise<ReturnType<typeof ok>> {
    const statuses = await this.repo.getAllStatuses()
    return ok(statuses.map(s => ({ ...s, id: (s as any)._id.toString() })))
  }

  async updateInternalStatus(applicationId: string, statusId: string, statusName?: string) {
    await this.repo.updateStatus(applicationId, this.id(statusId), statusName)
    return ok(true)
  }

  async getLoanCalculatorData(applicationId: string) {
    const app = await this.repo.findById(applicationId)
    if (!app) return fail('Application not found')
    return ok((app as any).loanCalculatorData)
  }

  async saveApplicationData(params: { applicationId: string; sectionId: number; sectionData: object }) {
    const result = await this.repo.saveApplicationData({
      applicationId: this.id(params.applicationId),
      sectionId: params.sectionId,
      sectionData: params.sectionData,
    })
    return ok(result)
  }

  async getApplicationData(applicationId: string, sectionId?: number) {
    const data = await this.repo.getApplicationData(this.id(applicationId), sectionId)
    return ok(data)
  }

  async createAuditLog(params: { applicationId: string; userId?: string; sectionId?: number; action?: string; dataChanged?: object }) {
    const result = await this.repo.createAuditLog({
      applicationId: this.id(params.applicationId),
      userId: params.userId ? this.id(params.userId) : undefined,
      sectionId: params.sectionId,
      action: params.action,
      dataChanged: params.dataChanged,
    })
    return ok(result)
  }

  async getLogs(params: { applicationId?: string; pageIndex?: number; pageSize?: number }) {
    const result = await this.repo.getAuditLogs({
      applicationId: params.applicationId ? this.id(params.applicationId) : undefined,
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
    })
    return ok(result)
  }

  async createVersion(params: { applicationId: string; data: object; version: number; userId: string }) {
    const result = await this.repo.createVersion({
      applicationId: this.id(params.applicationId),
      data: params.data,
      version: params.version,
      userId: this.id(params.userId),
    })
    return ok(result)
  }

  async getMilestone(applicationId: string) {
    const milestone = await this.repo.getMilestone(applicationId)
    return ok(milestone)
  }

  async getForm(applicationId: string, userId: string) {
    const form = await this.repo.getForm(this.id(applicationId), this.id(userId))
    return ok(form)
  }

  async submitForm(params: { applicationId: string; userId: string; formData: object; version: number; isInit: boolean }) {
    const form = await this.repo.saveForm({
      applicationId: this.id(params.applicationId),
      userId: this.id(params.userId),
      formData: params.formData,
      version: params.version,
      isInit: params.isInit,
    })
    return ok(form)
  }

  async getAssessment(applicationId: string) {
    const assessment = await this.repo.getAssessment(this.id(applicationId))
    return ok(assessment)
  }

  async submitAssessment(params: {
    applicationId: string
    userId: string
    isApplicationReview: boolean
    isCreditAssessment: boolean
    isPolicyCompliance: boolean
    conditionsStatement?: string
    fullConditionsStatement?: string
    isInitialAssessment: boolean
    isFullAssessment: boolean
  }) {
    const assessment = await this.repo.saveAssessment({
      ...params,
      applicationId: this.id(params.applicationId),
      userId: this.id(params.userId),
    })
    return ok(assessment)
  }

  async downloadTermSheet(fileId: string, fileName: string, isManual = false) {
    try {
      const bucket = isManual ? config.S3_BUCKET_MANUAL_TERMSHEET : config.S3_BUCKET_NAME
      const fileData = await this.s3.getFile(bucket, fileId)
      return ok({ fileData, contentType: 'application/pdf', fileName })
    } catch {
      return fail('File not found or download failed')
    }
  }

  async getFiles(applicationId: string, category?: string) {
    const files = await this.repo.getFiles(this.id(applicationId), category)
    return ok(files)
  }

  async getFileCategories(applicationId: string) {
    const categories = await this.repo.getFileCategories(this.id(applicationId))
    return ok(categories)
  }

  async createFile(params: {
    applicationId: string
    userId: string
    fileId: string
    documentKey: string
    fileName?: string
    location?: string
    category?: string
    jsonData?: object
  }) {
    const file = await this.repo.createFile({
      ...params,
      applicationId: this.id(params.applicationId),
      userId: this.id(params.userId),
    })
    return ok(file)
  }

  async deleteFile(id: string) {
    await this.repo.deleteFile(id)
    return ok(true)
  }

  async getDealDetail(applicationId: string) {
    return ok(await this.repo.getDealDetail(applicationId))
  }

  async saveDealDetail(applicationId: string, dealData: object) {
    await this.repo.saveDealDetail(applicationId, dealData)
    return ok(true)
  }

  async handleAiAsyncTaskComplete(params: { applicationId: string; taskData: object }) {
    await this.repo.update(params.applicationId, { hasModifiedAgent: true })
    return ok(true)
  }

  async handleCreditPaperAsyncComplete(params: { applicationId: string; result: object }) {
    await this.repo.update(params.applicationId, {})
    return ok(true)
  }

  async canGenerateCreditPaper(applicationId: string) {
    const app = await this.repo.findById(applicationId)
    if (!app) return fail('Application not found')
    const canGenerate = !!(app.loanCalculatorData && app.propertyDetails)
    return ok(canGenerate)
  }

  async supportCallbackRequest(params: { applicationId?: string; message: string; contactEmail: string }) {
    return ok(true)
  }

  async submitScenario(params: { applicationId: string; scenarioData: object }) {
    return ok(true)
  }

  async updateKeyContact(params: { applicationId: string; contactData: object }) {
    await this.repo.update(params.applicationId, { keyContact: params.contactData })
    return ok(true)
  }

  async sendApplicationEventEmail(params: { applicationId: string; eventType: string }) {
    return ok(true)
  }

  async getAllSections() {
    return ok([
      { id: 1, name: 'Loan Details' },
      { id: 2, name: 'Property Details' },
      { id: 3, name: 'Borrower Details' },
      { id: 4, name: 'Financial Position' },
      { id: 5, name: 'Documents' },
    ])
  }

  async downloadCreditPaperFile(fileId: string) {
    try {
      const fileData = await this.s3.getFile(config.S3_BUCKET_NAME, fileId)
      return ok({ fileData, contentType: 'application/pdf', fileName: fileId })
    } catch {
      return fail('File not found')
    }
  }

  async triggerCreditPaperGeneration(applicationId: string, userId: string) {
    if (!config.WEBHOOK_URL) return fail('Webhook not configured')
    try {
      await axios.post(config.WEBHOOK_URL, { applicationId, userId, action: 'generate-credit-paper' })
      return ok(true)
    } catch {
      return fail('Failed to trigger credit paper generation')
    }
  }
}

function serializeApp(app: any) {
  if (!app) return app
  return {
    ...app,
    id: app._id?.toString(),
    _id: undefined,
  }
}
