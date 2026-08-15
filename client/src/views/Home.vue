<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import * as categoryApi from '../api/category'
import * as postApi from '../api/post'
import type { Category, Post } from '../types'
import { formatCount } from '../utils/format'
import Avatar from '../components/common/Avatar.vue'
import EmptyState from '../components/common/EmptyState.vue'
import Pagination from '../components/common/Pagination.vue'
import PostCard from '../components/post/PostCard.vue'
import SmartImage from '../components/common/SmartImage.vue'

const PAGE_SIZE = 12

const categories = ref<Category[]>([])
const posts = ref<Post[]>([])
const total = ref(0)
const page = ref(1)
const keyword = ref('')
const categoryId = ref(0)
const sort = ref<'latest' | 'hot'>('latest')
const view = ref<'grid' | 'list'>('grid')
const loading = ref(false)

const emptyIcon = computed(() => (keyword.value.trim() ? '🔍' : '📭'))
const emptyText = computed(() => {
  if (keyword.value.trim()) return `没有找到与「${keyword.value.trim()}」相关的作品`
  return categoryId.value ? '该分类下暂无作品，看看其他分类吧' : '暂无作品，快来发布第一个吧'
})

onMounted(async () => {
  categories.value = await categoryApi.listEnabled()
  await load()
})

async function load() {
  loading.value = true
  try {
    const res = await postApi.listPosts({
      categoryId: categoryId.value || undefined,
      keyword: keyword.value.trim() || undefined,
      sort: sort.value,
      page: page.value,
      pageSize: PAGE_SIZE,
    })
    posts.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value = 1
  load()
}

function onCategory(id: number) {
  categoryId.value = id
  page.value = 1
  load()
}

function onSort(v: 'latest' | 'hot') {
  sort.value = v
  page.value = 1
  load()
}

function onPage(p: number) {
  page.value = p
  window.scrollTo({ top: 0, behavior: 'smooth' })
  load()
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8">
    <!-- Hero -->
    <div class="mb-8 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-6 sm:px-10">
      <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Mini PostHub</p>
      <h1 class="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">发现好作品</h1>
      <p class="mt-2 text-sm text-gray-500">投稿 · 审核 · 展示，这里是大家共同创作的内容广场</p>
    </div>

    <!-- Filter row -->
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="-mx-1 flex flex-wrap items-center gap-1.5">
        <button
          class="h-9 rounded-full px-4 text-sm font-medium transition"
          :class="categoryId === 0 ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900'"
          @click="onCategory(0)"
        >
          全部
        </button>
        <button
          v-for="c in categories"
          :key="c.id"
          class="h-9 rounded-full px-4 text-sm font-medium transition"
          :class="categoryId === c.id ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900'"
          @click="onCategory(c.id)"
        >
          {{ c.name }}
        </button>
      </div>

      <div class="flex items-center gap-3">
        <div class="relative">
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索标题 / 内容"
            class="h-9 w-56 rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-9 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            @keyup.enter="onSearch"
          />
          <button
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-indigo-600"
            @click="onSearch"
          >
            <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Sort + view toggle -->
    <div class="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
      <div class="flex h-9 items-center gap-1 rounded-lg bg-gray-100 p-1">
        <button
          class="h-7 rounded-md px-3.5 text-sm font-medium transition"
          :class="sort === 'latest' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          @click="onSort('latest')"
        >
          最新
        </button>
        <button
          class="h-7 rounded-md px-3.5 text-sm font-medium transition"
          :class="sort === 'hot' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          @click="onSort('hot')"
        >
          最热
        </button>
      </div>
      <div class="flex h-9 items-center gap-1 rounded-lg bg-gray-100 p-1">
        <button
          class="flex h-7 w-8 items-center justify-center rounded-md text-sm transition"
          :class="view === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          @click="view = 'grid'"
          title="网格视图"
        >
          ▦
        </button>
        <button
          class="flex h-7 w-8 items-center justify-center rounded-md text-sm transition"
          :class="view === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          @click="view = 'list'"
          title="列表视图"
        >
          ☰
        </button>
      </div>
    </div>

    <!-- Content -->
    <div v-if="loading" class="py-24 text-center text-gray-400">加载中…</div>
    <EmptyState v-else-if="!posts.length" :text="emptyText" :icon="emptyIcon" />

    <div v-else-if="view === 'grid'" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <PostCard v-for="p in posts" :key="p.id" :post="p" />
    </div>

    <div v-else class="space-y-3">
      <RouterLink
        v-for="p in posts"
        :key="p.id"
        :to="`/posts/${p.id}`"
        class="group flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
      >
        <SmartImage
          :src="p.cover"
          :alt="p.title"
          class="h-20 w-28 shrink-0 rounded-lg"
        />
        <div class="min-w-0 flex-1">
          <h3 class="line-clamp-1 font-semibold text-gray-900 group-hover:text-indigo-600">{{ p.title }}</h3>
          <p class="mt-1 line-clamp-2 text-xs text-gray-500">{{ p.content }}</p>
          <div class="mt-2.5 flex items-center gap-3 text-xs text-gray-400">
            <span class="flex items-center gap-1.5">
              <Avatar :src="p.author?.avatar" :name="p.author?.nickname" :size="18" />
              {{ p.author?.nickname }}
            </span>
            <span
              v-if="p.category"
              class="rounded-full bg-gray-100 px-2 py-0.5 text-gray-500"
            >
              {{ p.category.name }}
            </span>
            <span class="flex items-center gap-1">👁 {{ formatCount(p.viewCount) }}</span>
            <span class="flex items-center gap-1">⭐ {{ formatCount(p.favoriteCount) }}</span>
          </div>
        </div>
      </RouterLink>
    </div>

    <div class="mt-8">
      <Pagination :page="page" :page-size="PAGE_SIZE" :total="total" @change="onPage" />
    </div>
  </div>
</template>
