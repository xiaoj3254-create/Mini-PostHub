export type UserRole = 'user' | 'admin'
export type UserStatus = 'active' | 'banned'
export type PostStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export interface User {
  id: number
  username: string
  nickname: string
  avatar: string | null
  bio: string | null
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
  postCount?: number
}

export interface Category {
  id: number
  name: string
  description: string | null
  sort: number
  isEnabled: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Post {
  id: number
  userId: number
  categoryId: number
  title: string
  content: string
  images: string[]
  cover: string | null
  status: PostStatus
  rejectReason: string | null
  isOffShelf: boolean
  viewCount: number
  favoriteCount: number
  commentCount: number
  createdAt: string
  updatedAt: string
  author?: User
  category?: Category
  isCollected?: boolean
  collectedAt?: string
}

export interface Comment {
  id: number
  postId: number
  userId: number
  parentId: number | null
  content: string
  createdAt: string
  author: User
  replies?: Comment[]
}

export interface Paginated<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface PostDetailResult {
  post: Post
  related: Post[]
}

export interface AdminStats {
  users: number
  posts: number
  pendingPosts: number
  approvedPosts: number
  comments: number
  collects: number
  offShelfPosts: number
}

export const POST_STATUS_LABEL: Record<PostStatus, string> = {
  draft: '草稿',
  pending: '待审核',
  approved: '已发布',
  rejected: '已驳回',
}

export const POST_STATUS_COLOR: Record<PostStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
}
