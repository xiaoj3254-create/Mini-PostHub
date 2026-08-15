import { httpDelete, httpGet, httpPost } from './http'
import type { Post } from '../types'

export const addCollect = (postId: number) => httpPost<null>(`/posts/${postId}/collect`)

export const removeCollect = (postId: number) => httpDelete<null>(`/posts/${postId}/collect`)

export const listMyCollects = () => httpGet<Post[]>('/me/collects')
