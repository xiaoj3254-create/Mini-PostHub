import { httpDelete, httpGet, httpPost } from './http'
import type { Comment } from '../types'

export const listByPost = (postId: number) => httpGet<Comment[]>(`/posts/${postId}/comments`)

export const addComment = (postId: number, content: string) =>
  httpPost<Comment>(`/posts/${postId}/comments`, { content })

export const reply = (commentId: number, content: string) =>
  httpPost<Comment>(`/comments/${commentId}/reply`, { content })

export const removeComment = (commentId: number) => httpDelete<null>(`/comments/${commentId}`)
