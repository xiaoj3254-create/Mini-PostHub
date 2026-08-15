import { httpGet, httpPost, httpPut } from './http'
import type { User } from '../types'

export interface AuthResult {
  user: User
  token: string
}

export const register = (data: { username: string; password: string; nickname?: string }) =>
  httpPost<AuthResult>('/auth/register', data)

export const login = (data: { username: string; password: string }) =>
  httpPost<AuthResult>('/auth/login', data)

export const getMe = () => httpGet<User>('/auth/me')

export const updateProfile = (data: { nickname?: string; avatar?: string | null; bio?: string }) =>
  httpPut<User>('/auth/profile', data)

export const changePassword = (data: { oldPassword: string; newPassword: string }) =>
  httpPut<null>('/auth/password', data)
