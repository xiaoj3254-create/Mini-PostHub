<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as postApi from '../../api/post'
import EmptyState from '../../components/common/EmptyState.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import SmartImage from '../../components/common/SmartImage.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import { useToastStore } from '../../stores/toast'
import type { Post, PostStatus } from '../../types'
import { formatDate } from '../../utils/format'

const toast = useToastStore()

type Tab = 'all' | PostStatus
const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已发布' },
  { key: 'rejected', label: '已驳回' },
]

const active = ref<Tab>('all')
const posts = ref<Post[]>([])
const loading = ref(false)
const showDelete = ref(false)
const deletingId = ref(0)
const deleting = ref(false)

async function load() {
  loading.value = true
  try {
    posts.value = await postApi.listMyPosts(active.value === 'all' ? undefined : active.value)
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function resubmit(p: Post) {
  await postApi.submitPost(p.id)
  toast.success('已重新提交审核')
  await load()
}

function openDelete(id: number) {
  deletingId.value = id
  showDelete.value = true
}

async function doDelete() {
  deleting.value = true
  try {
    await postApi.deletePost(deletingId.value)
    toast.success('已删除')
    showDelete.value = false
    await load()
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">我的投稿</h1>
      <RouterLink
        to="/publish"
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        发布新作品
      </RouterLink>
    </div>

    <!-- Tabs -->
    <div class="mb-6 flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition"
        :class="active === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
        @click="active = t.key; load()"
      >
        {{ t.label }}
      </button>
    </div>

    <div v-if="loading" class="py-20 text-center text-gray-400">加载中…</div>
    <EmptyState v-else-if="!posts.length" text="暂无投稿" icon="📭" />

    <div v-else class="space-y-4">
      <div v-for="p in posts" :key="p.id" class="rounded-2xl border border-gray-200 bg-white p-5">
        <div class="flex flex-wrap items-center gap-3">
          <SmartImage
            :src="p.cover"
            :alt="p.title"
            class="h-16 w-24 shrink-0 rounded-lg"
          />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <RouterLink :to="`/posts/${p.id}`" class="line-clamp-1 font-semibold text-gray-900 hover:text-indigo-600">
                {{ p.title }}
              </RouterLink>
              <StatusBadge :status="p.status" />
            </div>
            <p class="mt-1 line-clamp-1 text-xs text-gray-500">
              {{ p.category?.name || '未分类' }} · {{ formatDate(p.createdAt) }}
            </p>
            <p v-if="p.status === 'rejected'" class="mt-1 text-xs text-red-500">
              驳回原因：{{ p.rejectReason || '未填写原因' }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <RouterLink
              :to="`/posts/${p.id}`"
              class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              查看
            </RouterLink>
            <RouterLink
              v-if="p.status === 'draft' || p.status === 'rejected'"
              :to="`/posts/${p.id}/edit`"
              class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              编辑
            </RouterLink>
            <button
              v-if="p.status === 'draft' || p.status === 'rejected'"
              class="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100"
              @click="resubmit(p)"
            >
              {{ p.status === 'draft' ? '提交审核' : '重新提交' }}
            </button>
            <button
              class="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
              @click="openDelete(p.id)"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :open="showDelete"
      title="删除作品"
      message="删除后不可恢复，确定删除该作品吗？"
      confirm-text="删除"
      :loading="deleting"
      @close="showDelete = false"
      @confirm="doDelete"
    />
  </div>
</template>
