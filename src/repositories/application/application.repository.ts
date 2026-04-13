import { Types } from 'mongoose'
import {
  LoanApplication,
  ApplicationData,
  AuditLog,
  ApplicationVersion,
  ApplicationForm,
  ApplicationAssessment,
  ApplicationFile,
  ApplicationStatus,
} from '../../models/index.js'
import { PaginatedRequest } from '../../domain/common.js'

export class ApplicationRepository {
  async create(params: {
    userId: Types.ObjectId
    type?: number
    loanCalculatorData?: object
    propertyDetails?: object
  }) {
    return LoanApplication.create({
      userId: params.userId,
      type: params.type,
      loanCalculatorData: params.loanCalculatorData,
      propertyDetails: params.propertyDetails,
    })
  }

  async findById(id: string | Types.ObjectId) {
    return LoanApplication.findById(id)
      .populate('statusId', 'name')
      .lean()
  }

  async findByUserId(userId: Types.ObjectId) {
    return LoanApplication.find({ userId })
      .sort({ createdAt: -1 })
      .lean()
  }

  async update(id: string | Types.ObjectId, data: Partial<{
    loanCalculatorData: object
    propertyDetails: object
    generatedTermSheetData: object
    type: number
    statusId: Types.ObjectId
    status: string
    mileStone: object
    dealData: object
    agentJsonFileId: string
    hasModifiedAgent: boolean
    internalStatus: string
    keyContact: object
  }>) {
    return LoanApplication.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true },
    ).lean()
  }

  async getListing(params: PaginatedRequest & { userId?: Types.ObjectId; statusId?: Types.ObjectId }) {
    const { pageIndex = 0, pageSize = 20, userId, statusId } = params
    const filter: Record<string, unknown> = {}
    if (userId) filter.userId = userId
    if (statusId) filter.statusId = statusId

    const [items, totalCount] = await Promise.all([
      LoanApplication.find(filter)
        .sort({ createdAt: -1 })
        .skip(pageIndex * pageSize)
        .limit(pageSize)
        .lean(),
      LoanApplication.countDocuments(filter),
    ])

    return { items, totalCount, pageIndex, pageSize }
  }

  async getGroupedByStatus(userId?: Types.ObjectId) {
    const filter = userId ? { userId } : {}
    const apps = await LoanApplication.find(filter).sort({ createdAt: -1 }).lean()

    const grouped: Record<string, typeof apps> = {}
    for (const app of apps) {
      const key = (app as any).status ?? 'Unknown'
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(app)
    }
    return grouped
  }

  async getCount(userId?: Types.ObjectId) {
    return LoanApplication.countDocuments(userId ? { userId } : {})
  }

  async getAllStatuses() {
    return ApplicationStatus.find({ isDeleted: false }).sort({ name: 1 }).lean()
  }

  async updateStatus(id: string | Types.ObjectId, statusId: Types.ObjectId, statusName?: string) {
    return LoanApplication.findByIdAndUpdate(
      id,
      { $set: { statusId, ...(statusName && { status: statusName }) } },
      { new: true },
    ).lean()
  }

  // ── Application Data ──

  async saveApplicationData(params: {
    applicationId: Types.ObjectId
    sectionId: number
    sectionData: object
  }) {
    return ApplicationData.findOneAndUpdate(
      { applicationId: params.applicationId, sectionId: params.sectionId },
      { $set: { sectionData: params.sectionData } },
      { upsert: true, new: true },
    ).lean()
  }

  async getApplicationData(applicationId: Types.ObjectId, sectionId?: number) {
    const filter: Record<string, unknown> = { applicationId }
    if (sectionId !== undefined) filter.sectionId = sectionId
    return ApplicationData.find(filter).lean()
  }

  // ── Audit Logs ──

  async createAuditLog(params: {
    applicationId: Types.ObjectId
    userId?: Types.ObjectId
    sectionId?: number
    action?: string
    dataChanged?: object
  }) {
    return AuditLog.create(params)
  }

  async getAuditLogs(params: {
    applicationId?: Types.ObjectId
    pageIndex?: number
    pageSize?: number
  }) {
    const { applicationId, pageIndex = 0, pageSize = 20 } = params
    const filter = applicationId ? { applicationId } : {}

    const [items, totalCount] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(pageIndex * pageSize).limit(pageSize).lean(),
      AuditLog.countDocuments(filter),
    ])
    return { items, totalCount, pageIndex, pageSize }
  }

  // ── Versions ──

  async createVersion(params: {
    applicationId: Types.ObjectId
    data: object
    version: number
    userId: Types.ObjectId
  }) {
    return ApplicationVersion.create({
      applicationId: params.applicationId,
      data: params.data,
      version: params.version,
      userCreated: params.userId,
    })
  }

  // ── Milestone ──

  async getMilestone(id: string | Types.ObjectId) {
    const app = await LoanApplication.findById(id).select('mileStone').lean()
    return (app as any)?.mileStone ?? null
  }

  // ── Forms ──

  async getForm(applicationId: Types.ObjectId, userId: Types.ObjectId) {
    return ApplicationForm.findOne({ applicationId, userId }).sort({ createdAt: -1 }).lean()
  }

  async saveForm(params: {
    applicationId: Types.ObjectId
    userId: Types.ObjectId
    formData: object
    version: number
    isInit: boolean
  }) {
    return ApplicationForm.create(params)
  }

  // ── Assessments ──

  async getAssessment(applicationId: Types.ObjectId) {
    return ApplicationAssessment.findOne({ applicationId }).sort({ createdAt: -1 }).lean()
  }

  async saveAssessment(params: {
    applicationId: Types.ObjectId
    userId: Types.ObjectId
    isApplicationReview: boolean
    isCreditAssessment: boolean
    isPolicyCompliance: boolean
    conditionsStatement?: string
    fullConditionsStatement?: string
    isInitialAssessment: boolean
    isFullAssessment: boolean
  }) {
    return ApplicationAssessment.create(params)
  }

  // ── Files ──

  async getFiles(applicationId: Types.ObjectId, category?: string) {
    const filter: Record<string, unknown> = { applicationId }
    if (category) filter.category = category
    return ApplicationFile.find(filter).sort({ createdAt: -1 }).lean()
  }

  async createFile(params: {
    applicationId: Types.ObjectId
    userId: Types.ObjectId
    fileId: string
    documentKey: string
    fileName?: string
    location?: string
    category?: string
    jsonData?: object
  }) {
    return ApplicationFile.create(params)
  }

  async deleteFile(id: string | Types.ObjectId) {
    return ApplicationFile.findByIdAndDelete(id)
  }

  async getFileCategories(applicationId: Types.ObjectId) {
    const results = await ApplicationFile.distinct('category', { applicationId })
    return results.filter(Boolean)
  }

  // ── Upsert ──

  async upsert(params: {
    id?: Types.ObjectId
    userId: Types.ObjectId
    loanCalculatorData?: object
    propertyDetails?: object
    type?: number
  }) {
    if (params.id) {
      return this.update(params.id, {
        loanCalculatorData: params.loanCalculatorData,
        propertyDetails: params.propertyDetails,
        type: params.type,
      })
    }
    return this.create(params)
  }

  // ── Deal Detail ──

  async getDealDetail(id: string | Types.ObjectId) {
    const app = await LoanApplication.findById(id).select('dealData').lean()
    return (app as any)?.dealData ?? null
  }

  async saveDealDetail(id: string | Types.ObjectId, dealData: object) {
    return LoanApplication.findByIdAndUpdate(id, { $set: { dealData } }, { new: true }).lean()
  }
}
