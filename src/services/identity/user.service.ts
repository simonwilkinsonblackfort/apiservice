import { FastifyInstance } from 'fastify'
import { Types } from 'mongoose'
import { UserRepository } from '../../repositories/identity/user.repository.js'
import { ok, fail } from '../../domain/common.js'

export class UserService {
  private userRepo = new UserRepository()

  constructor(private fastify: FastifyInstance) {}

  async registerUser(params: {
    email: string
    password: string
    mobile?: string
    firstName?: string
    lastName?: string
    roles?: string[]
  }) {
    const existing = await this.userRepo.findByEmail(params.email)
    if (existing) return fail('Email already registered')

    const user = await this.userRepo.createUser({
      email: params.email,
      password: params.password,
      mobile: params.mobile,
      roles: params.roles ?? ['Customer'],
      firstName: params.firstName,
      lastName: params.lastName,
    })

    return ok({ userId: user._id.toString(), email: user.email })
  }

  async blackfortRegisterUser(params: {
    email: string
    password: string
    mobile?: string
    firstName?: string
    lastName?: string
  }) {
    return this.registerUser({ ...params, roles: ['Customer'] })
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findById(new Types.ObjectId(userId))
    if (!user) return fail('User not found')

    return ok({
      userId: user._id.toString(),
      email: user.email,
      mobile: user.mobile,
      userName: user.userName,
      roles: user.roles,
      firstName: user.profile?.firstName,
      lastName: user.profile?.lastName,
      avatar: user.profile?.avatar,
    })
  }

  async updateUser(
    userId: string,
    data: { userName?: string; email?: string; mobile?: string },
  ) {
    const user = await this.userRepo.updateUser(new Types.ObjectId(userId), data)
    if (!user) return fail('User not found')
    return ok(true)
  }
}
