<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as adminApi from '../../api/admin'
import type { AdminStats } from '../../types'

const stats = ref<AdminStats | null>(null)

interface StatCard {
  key: keyof AdminStats
  label: string
  icon: string
  color: string
  to?: string
}

// to: 跳转目标；无 to 的卡片不可点击（收藏数暂无独立模块）
const cards: StatCard[] = [
  { key: 'users', label: '用户总数', icon: '👥', color: 'text-indigo-600', to: '/admin/users' },
  { key: 'posts', label: '作品总数', icon: '🖼️', color: 'text-violet-600', to: '/admin/posts' },
  { key: 'pendingPosts', label: '待审核', icon: '⏳', color: 'text-amber-600', to: '/admin/posts' },
  { key: 'approvedPosts', label: '已发布', icon: '✅', color: 'text-emerald-600', to: '/admin/posts' },
  { key: 'comments', label: '评论数', icon: '💬', color: 'text-blue-600', to: '/admin/comments' },
  { key: 'collects', label: '收藏数', icon: '⭐', color: 'text-yellow-600' },
  { key: 'offShelfPosts', label: '已下架', icon: '🚫', color: 'text-red-600', to: '/admin/posts' },
]

onMounted(async () => {
  stats.value = await adminApi.getStats()
})
</script>

<template>
  <div>
    <h1 class="mb-6 text-xl font-bold text-gray-900">仪表盘</h1>

    <div v-if="stats" class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      <template v-for="c in cards" :key="c.key">
        <RouterLink
          v-if="c.to"
          :to="c.to"
          class="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
        >
          <div class="flex items-center justify-between">
            <span class="text-2xl">{{ c.icon }}</span>
            <span class="text-xs text-gray-300 transition group-hover:text-indigo-500">跳转 →</span>
          </div>
          <p class="mt-3 text-2xl font-bold text-gray-900">{{ stats[c.key] }}</p>
          <p class="mt-0.5 text-sm text-gray-400">{{ c.label }}</p>
        </RouterLink>
        <div v-else class="rounded-2xl border border-gray-200 bg-white p-5">
          <span class="text-2xl">{{ c.icon }}</span>
          <p class="mt-3 text-2xl font-bold text-gray-900">{{ stats[c.key] }}</p>
          <p class="mt-0.5 text-sm text-gray-400">{{ c.label }}</p>
        </div>
      </template>
    </div>
    <p v-else class="py-20 text-center text-gray-400">加载中…</p>
  </div>
</template>
