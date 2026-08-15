import { httpGet } from './http'
import type { Category } from '../types'

export const listEnabled = () => httpGet<Category[]>('/categories')
