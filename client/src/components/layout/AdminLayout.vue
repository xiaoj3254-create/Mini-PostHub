<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const menus = [
  { name: '仪表盘', path: '/admin', icon: '📊' },
  { name: '作品审核', path: '/admin/posts', icon: '🖼️' },
  { name: '分类管理', path: '/admin/categories', icon: '🗂️' },
  { name: '用户管理', path: '/admin/users', icon: '👥' },
  { name: '评论管理', path: '/admin/comments', icon: '💬' },
]

function logout() {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <div class="flex min-h-screen">
    <aside class="flex w-56 flex-col border-r border-gray-200 bg-white">
      <div class="flex h-14 items-center gap-2 border-b border-gray-100 px-5 font-bold text-indigo-600">
        <span class="text-lg">📮</span>
        <span>管理后台</span>
      </div>
      <nav class="flex-1 py-4">
        <RouterLink
          v-for="m in menus"
          :key="m.path"
          :to="m.path"
          class="mx-3 mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-indigo-600"
          active-class="!bg-indigo-50 !text-indigo-600"
        >
          <span>{{ m.icon }}</span>
          <span>{{ m.name }}</span>
        </RouterLink>
      </nav>
      <div class="border-t border-gray-100 p-4">
        <RouterLink to="/" class="mb-2 block text-center text-sm text-gray-500 hover:text-indigo-600">← 返回前台</RouterLink>
        <button class="w-full rounded-lg border border-gray-200 py-1.5 text-sm text-gray-600 hover:bg-gray-50" @click="logout">
          退出登录
        </button>
      </div>
    </aside>

    <main class="flex-1 bg-gray-50">
      <header class="flex h-14 items-center justify-end border-b border-gray-200 bg-white px-6">
        <span class="text-sm text-gray-500">{{ auth.user?.nickname }} · 管理员</span>
      </header>
      <div class="mx-auto w-full max-w-7xl p-6">
        <RouterView />
      </div>
    </main>
  </div>
</template>
