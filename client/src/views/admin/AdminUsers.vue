<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as adminApi from '../../api/admin'
import AppButton from '../../components/common/AppButton.vue'
import EmptyState from '../../components/common/EmptyState.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import type { User } from '../../types'
import { formatDate } from '../../utils/format'

const PAGE_SIZE = 10

const auth = useAuthStore()
const toast = useToastStore()
const users = ref<User[]>([])
const total = ref(0)
const page = ref(1)
const keyword = ref('')
const loading = ref(false)
const busyId = ref<number | null>(null)

async function load() {
  loading.value = true
  try {
    const res = await adminApi.listUsers({
      keyword: keyword.value.trim() || undefined,
      page: page.value,
      pageSize: PAGE_SIZE,
    })
    users.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

onMounted(load)

function onSearch() {
  page.value = 1
  load()
}

function onPage(p: number) {
  page.value = p
  load()
}

async function toggleStatus(u: User) {
  busyId.value = u.id
  try {
    await adminApi.setUserStatus(u.id, u.status === 'banned' ? 'active' : 'banned')
    toast.success(u.status === 'banned' ? '已解封' : '已封禁')
    await load()
  } finally {
    busyId.value = null
  }
}

async function toggleRole(u: User) {
  if (u.id === auth.user?.id) {
    toast.error('不能修改自己的角色')
    return
  }
  busyId.value = u.id
  try {
    await adminApi.setUserRole(u.id, u.role === 'admin' ? 'user' : 'admin')
    toast.success(u.role === 'admin' ? '已取消管理员' : '已设为管理员')
    await load()
  } finally {
    busyId.value = null
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <h1 class="text-xl font-bold text-gray-900">用户管理</h1>
      <div class="ml-auto flex items-center gap-2">
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索用户名 / 昵称"
          class="w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
          @keyup.enter="onSearch"
        />
        <AppButton size="sm" @click="onSearch">搜索</AppButton>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div v-if="loading" class="py-20 text-center text-gray-400">加载中…</div>
      <EmptyState v-else-if="!users.length" text="没有找到用户" />

      <table v-else class="w-full text-sm">
        <thead class="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
          <tr>
            <th class="px-4 py-3 font-medium">用户</th>
            <th class="px-4 py-3 font-medium">角色</th>
            <th class="px-4 py-3 font-medium">状态</th>
            <th class="px-4 py-3 font-medium">作品数</th>
            <th class="px-4 py-3 font-medium">注册时间</th>
            <th class="px-4 py-3 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50/60">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div
                  class="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600"
                >
                  {{ u.nickname?.[0] || '?' }}
                </div>
                <div class="min-w-0">
                  <p class="font-medium text-gray-900">{{ u.nickname }}</p>
                  <p class="text-xs text-gray-400">@{{ u.username }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="u.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'"
              >
                {{ u.role === 'admin' ? '管理员' : '用户' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="u.status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'"
              >
                {{ u.status === 'banned' ? '已封禁' : '正常' }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ u.postCount ?? 0 }}</td>
            <td class="px-4 py-3 text-gray-500">{{ formatDate(u.createdAt) }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1.5">
                <button
                  class="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  :disabled="busyId === u.id"
                  @click="toggleRole(u)"
                >
                  {{ u.role === 'admin' ? '取消管理员' : '设为管理员' }}
                </button>
                <button
                  class="rounded-lg px-2.5 py-1 text-xs"
                  :class="u.status === 'banned' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'"
                  :disabled="busyId === u.id"
                  @click="toggleStatus(u)"
                >
                  {{ u.status === 'banned' ? '解封' : '封禁' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-5">
      <Pagination :page="page" :page-size="PAGE_SIZE" :total="total" @change="onPage" />
    </div>
  </div>
</template>
