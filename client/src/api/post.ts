import { httpDelete, httpGet, httpPost, httpPut } from './http'
import type { Paginated, Post, PostDetailResult } from '../types'

export interface PostListQuery {
  categoryId?: number
  keyword?: string
  sort?: 'latest' | 'hot'
  page?: number
  pageSize?: number
}

export interface CreatePostInput {
  title: string
  content: string
  categoryId: number
  images?: string[]
  cover?: string
  status?: 'draft' | 'pending'
}

export interface UpdatePostInput {
  title?: string
  content?: string
  categoryId?: number
  images?: string[]
  cover?: string
}

export const listPosts = (params: PostListQuery) =>
  httpGet<Paginated<Post>>('/posts', { params })

export const getPost = (id: number) => httpGet<PostDetailResult>(`/posts/${id}`)

export const listMyPosts = (status?: Post['status']) =>
  httpGet<Post[]>('/me/posts', { params: status ? { status } : {} })

export const createPost = (data: CreatePostInput) => httpPost<Post>('/posts', data)

export const updatePost = (id: number, data: UpdatePostInput) => httpPut<Post>(`/posts/${id}`, data)

export const submitPost = (id: number) => httpPost<Post>(`/posts/${id}/submit`)

export const deletePost = (id: number) => httpDelete<null>(`/posts/${id}`)

export const uploadImage = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return httpPost<{ url: string }>('/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
