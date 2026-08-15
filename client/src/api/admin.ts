import { httpDelete, httpGet, httpPost, httpPut } from './http'
import type {
  AdminStats,
  Category,
  Comment,
  Paginated,
  Post,
  PostStatus,
  User,
} from '../types'

export const getStats = () => httpGet<AdminStats>('/admin/stats')

export const listPosts = (params: {
  status?: PostStatus
  categoryId?: number
  keyword?: string
  page?: number
  pageSize?: number
}) => httpGet<Paginated<Post>>('/admin/posts', { params })

export const approvePost = (id: number) => httpPost<Post>(`/admin/posts/${id}/approve`)

export const rejectPost = (id: number, reason: string) =>
  httpPost<Post>(`/admin/posts/${id}/reject`, { reason })

export const toggleOffShelf = (id: number, isOffShelf: boolean) =>
  httpPost<Post>(`/admin/posts/${id}/off-shelf`, { isOffShelf })

export const removePost = (id: number) => httpDelete<null>(`/admin/posts/${id}`)

export const listCategories = () => httpGet<Category[]>('/admin/categories')

export const createCategory = (data: Partial<Category>) =>
  httpPost<Category>('/admin/categories', data)

export const updateCategory = (id: number, data: Partial<Category>) =>
  httpPut<Category>(`/admin/categories/${id}`, data)

export const removeCategory = (id: number) => httpDelete<null>(`/admin/categories/${id}`)

export const listUsers = (params: { keyword?: string; page?: number; pageSize?: number }) =>
  httpGet<Paginated<User>>('/admin/users', { params })

export const setUserStatus = (id: number, status: User['status']) =>
  httpPut<User>(`/admin/users/${id}/status`, { status })

export const setUserRole = (id: number, role: User['role']) =>
  httpPut<User>(`/admin/users/${id}/role`, { role })

export const listComments = (params: {
  postId?: number
  keyword?: string
  page?: number
  pageSize?: number
}) => httpGet<Paginated<Comment>>('/admin/comments', { params })

export const removeComment = (id: number) => httpDelete<null>(`/admin/comments/${id}`)
