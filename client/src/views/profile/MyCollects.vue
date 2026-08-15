<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as collectApi from '../../api/collect'
import EmptyState from '../../components/common/EmptyState.vue'
import SmartImage from '../../components/common/SmartImage.vue'
import { useToastStore } from '../../stores/toast'
import type { Post } from '../../types'
import { formatCount, formatDate } from '../../utils/format'

const toast = useToastStore()
const posts = ref<Post[]>([])
const loading = ref(false)
const removing = ref<number | null>(null)

async function load() {
  loading.value = true
  try {
    posts.value = await collectApi.listMyCollects()
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function cancel(id: number) {
  removing.value = id
  try {
    await collectApi.removeCollect(id)
    toast.success('已取消收藏')
    await load()
  } finally {
    removing.value = null
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <h1 class="mb-6 text-xl font-bold text-gray-900">我的收藏</h1>

    <div v-if="loading" class="py-20 text-center text-gray-400">加载中…</div>
    <EmptyState v-else-if="!posts.length" text="还没有收藏任何作品" icon="⭐" />

    <div v-else class="space-y-4">
      <div v-for="p in posts" :key="p.id" class="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4">
        <SmartImage :src="p.cover" :alt="p.title" class="h-16 w-24 shrink-0 rounded-lg" />
        <div class="min-w-0 flex-1">
          <RouterLink :to="`/posts/${p.id}`" class="line-clamp-1 font-semibold text-gray-900 hover:text-indigo-600">
            {{ p.title }}
          </RouterLink>
          <p class="mt-1 text-xs text-gray-400">
            {{ p.author?.nickname }} · {{ formatDate(p.createdAt) }} · 👁 {{ formatCount(p.viewCount) }}
          </p>
        </div>
        <button
          class="shrink-0 rounded-lg border border-amber-200 px-3 py-1.5 text-sm text-amber-600 transition hover:bg-amber-50"
          :disabled="removing === p.id"
          @click="cancel(p.id)"
        >
          {{ removing === p.id ? '取消中…' : '★ 取消收藏' }}
        </button>
      </div>
    </div>
  </div>
</template>
