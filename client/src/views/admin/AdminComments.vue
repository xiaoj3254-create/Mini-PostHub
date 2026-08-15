<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as adminApi from '../../api/admin'
import AppButton from '../../components/common/AppButton.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import EmptyState from '../../components/common/EmptyState.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useToastStore } from '../../stores/toast'
import type { Comment } from '../../types'
import { formatDate } from '../../utils/format'

const PAGE_SIZE = 10

const toast = useToastStore()
const comments = ref<Comment[]>([])
const total = ref(0)
const page = ref(1)
const keyword = ref('')
const loading = ref(false)

const deleteTarget = ref<number>(0)
const deleting = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await adminApi.listComments({
      keyword: keyword.value.trim() || undefined,
      page: page.value,
      pageSize: PAGE_SIZE,
    })
    comments.value = res.list
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

function openDelete(id: number) {
  deleteTarget.value = id
}

async function doDelete() {
  deleting.value = true
  try {
    await adminApi.removeComment(deleteTarget.value)
    toast.success('评论已删除')
    deleteTarget.value = 0
    await load()
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <h1 class="text-xl font-bold text-gray-900">评论管理</h1>
      <div class="ml-auto flex items-center gap-2">
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索评论内容"
          class="w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
          @keyup.enter="onSearch"
        />
        <AppButton size="sm" @click="onSearch">搜索</AppButton>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div v-if="loading" class="py-20 text-center text-gray-400">加载中…</div>
      <EmptyState v-else-if="!comments.length" text="没有符合条件的评论" />

      <table v-else class="w-full text-sm">
        <thead class="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
          <tr>
            <th class="px-4 py-3 font-medium">评论内容</th>
            <th class="px-4 py-3 font-medium">评论者</th>
            <th class="px-4 py-3 font-medium">作品</th>
            <th class="px-4 py-3 font-medium">时间</th>
            <th class="px-4 py-3 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="c in comments" :key="c.id" class="hover:bg-gray-50/60">
            <td class="max-w-80 px-4 py-3">
              <p class="line-clamp-1 text-gray-800">{{ c.content }}</p>
              <p v-if="c.parentId" class="mt-0.5 text-xs text-gray-400">回复评论 #{{ c.parentId }}</p>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ c.author?.nickname }}</td>
            <td class="px-4 py-3">
              <RouterLink :to="`/posts/${c.postId}`" class="text-indigo-600 hover:underline">#{{ c.postId }}</RouterLink>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ formatDate(c.createdAt) }}</td>
            <td class="px-4 py-3">
              <div class="flex justify-end">
                <button
                  class="rounded-lg px-2.5 py-1 text-xs text-red-500 hover:bg-red-50"
                  @click="openDelete(c.id)"
                >
                  删除
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

    <ConfirmDialog
      :open="deleteTarget > 0"
      title="删除评论"
      message="删除后不可恢复，确定删除该评论吗？"
      confirm-text="删除"
      :loading="deleting"
      @close="deleteTarget = 0"
      @confirm="doDelete"
    />
  </div>
</template>
