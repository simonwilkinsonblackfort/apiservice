// Matches C# CommonResponse<T>
export interface CommonResponse<T> {
  success: boolean
  payload?: T
  error?: string
  errorCode?: string
}

export function ok<T>(payload: T): CommonResponse<T> {
  return { success: true, payload }
}

export function fail(error: string, errorCode?: string): CommonResponse<never> {
  return { success: false, error, errorCode }
}

// Token types (matches C# TokenType enum)
export enum TokenType {
  PassCode = 1,
  MagicLink = 2,
  ResetPassword = 3,
  RenewToken = 4,
  VerifyIdentity = 5,
  VerifyEmail = 6,
  VerifyPhone = 7,
  VerifyOTPCode = 8,
  DownloadTermSheet = 9,
  BlackFortAuthToken = 10,
}

// Role names (matches C# RoleName enum)
export enum RoleName {
  Admin = 'Admin',
  Customer = 'Customer',
}

// User status
export enum UserStatus {
  Active = 1,
  Inactive = 2,
  Pending = 3,
  Locked = 4,
}

// JWT payload shape
export interface JwtPayload {
  sub: string        // AspNetUser Id (string)
  userId: string     // identity.User.Id (bigint as string)
  email: string
  roles: string[]
  orgId?: string
  iat?: number
  exp?: number
}

export type PaginatedRequest = {
  pageIndex?: number
  pageSize?: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  searchTerm?: string
}

export type PaginatedResponse<T> = {
  items: T[]
  totalCount: number
  pageIndex: number
  pageSize: number
}
