import axios, { type AxiosRequestConfig } from 'axios'
import { useToastStore } from '../stores/toast'
import { useAuthStore } from '../stores/auth'

const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => response.data.data,
  (error) => {
    const toast = useToastStore()
    const status = error.response?.status
    const message = error.response?.data?.message || '网络错误，请稍后重试'

    if (status === 401) {
      const auth = useAuthStore()
      auth.clearAuth()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    toast.error(message)
    return Promise.reject(new Error(message))
  },
)

// The response interceptor unwraps `{ code, message, data }` into `data`,
// so cast the resolved value to the caller's expected type.
export const httpGet = <T>(url: string, config?: AxiosRequestConfig) =>
  http.get(url, config) as unknown as Promise<T>
export const httpPost = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  http.post(url, data, config) as unknown as Promise<T>
export const httpPut = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  http.put(url, data, config) as unknown as Promise<T>
export const httpDelete = <T>(url: string, config?: AxiosRequestConfig) =>
  http.delete(url, config) as unknown as Promise<T>

export default http
