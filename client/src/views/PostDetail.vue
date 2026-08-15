<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as collectApi from '../api/collect'
import * as postApi from '../api/post'
import Avatar from '../components/common/Avatar.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import SmartImage from '../components/common/SmartImage.vue'
import CommentSection from '../components/comment/CommentSection.vue'
import { categoryEmoji, categoryGradient } from '../utils/categoryStyle'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import type { Post } from '../types'
import { formatCount, formatDate } from '../utils/format'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

// 路由参数变化时（如相关推荐 / 前进后退）组件会被复用，用 computed + watch 重新加载
const postId = computed(() => Number(route.params.id))
const post = ref<Post | null>(null)
const related = ref<Post[]>([])
const loading = ref(true)
const collecting = ref(false)
const showDelete = ref(false)
const deleting = ref(false)
const lightbox = ref<string | null>(null)

async function loadPost() {
  loading.value = true
  post.value = null
  collecting.value = false
  showDelete.value = false
  lightbox.value = null
  try {
    const res = await postApi.getPost(postId.value)
    post.value = res.post
    related.value = res.related
  } catch {
    router.replace('/')
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, loadPost)
onMounted(loadPost)

async function toggleCollect() {
  const p = post.value
  if (!p) return
  if (!auth.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  collecting.value = true
  try {
    if (p.isCollected) {
      await collectApi.removeCollect(p.id)
      p.isCollected = false
      p.favoriteCount = Math.max(0, p.favoriteCount - 1)
    } else {
      await collectApi.addCollect(p.id)
      p.isCollected = true
      p.favoriteCount += 1
    }
  } finally {
    collecting.value = false
  }
}

async function doDelete() {
  deleting.value = true
  try {
    await postApi.deletePost(postId.value)
    toast.success('作品已删除')
    router.push('/me/posts')
  } finally {
    deleting.value = false
    showDelete.value = false
  }
}

// 主图加载失败：隐藏图片，露出灰底容器
function hideOnError(e: Event) {
  const el = e.currentTarget as HTMLImageElement
  el.style.display = 'none'
}
</script>

<template>
  <div v-if="loading" class="py-24 text-center text-gray-400">加载中…</div>

  <div v-else-if="post" class="mx-auto max-w-6xl px-4 py-8">
    <div class="grid gap-8 lg:grid-cols-[1fr_320px]">
      <!-- Main -->
      <article class="min-w-0 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <div class="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-400">
          <RouterLink to="/" class="hover:text-indigo-600">首页</RouterLink>
          <span>/</span>
          <RouterLink v-if="post.category" to="/" class="hover:text-indigo-600">{{ post.category.name }}</RouterLink>
        </div>

        <h1 class="text-2xl font-bold leading-snug text-gray-900 sm:text-3xl">{{ post.title }}</h1>

        <div class="mt-4 flex flex-wrap items-center gap-4 border-b border-gray-100 pb-5">
          <div class="flex items-center gap-2.5">
            <Avatar :src="post.author?.avatar" :name="post.author?.nickname" :size="38" />
            <div>
              <p class="text-sm font-medium text-gray-800">{{ post.author?.nickname }}</p>
              <p class="text-xs text-gray-400">{{ formatDate(post.createdAt) }}</p>
            </div>
          </div>
          <div class="ml-auto flex items-center gap-4 text-sm text-gray-400">
            <span title="浏览">👁 {{ formatCount(post.viewCount) }}</span>
            <span title="评论">💬 {{ formatCount(post.commentCount) }}</span>
            <span title="收藏">⭐ {{ formatCount(post.favoriteCount) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-5 flex flex-wrap items-center gap-3">
          <button
            class="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition"
            :class="
              post.isCollected
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            "
            :disabled="collecting"
            @click="toggleCollect"
          >
            {{ post.isCollected ? '★ 已收藏' : '☆ 收藏' }}
          </button>

          <template v-if="auth.isLoggedIn && auth.user?.id === post.userId">
            <RouterLink
              v-if="post.status === 'draft' || post.status === 'rejected'"
              :to="`/posts/${post.id}/edit`"
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              编辑
            </RouterLink>
            <button
              class="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              @click="showDelete = true"
            >
              删除
            </button>
          </template>
        </div>

        <p v-if="post.status === 'rejected'" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          该作品被驳回：{{ post.rejectReason || '未填写原因' }}
        </p>

        <!-- Gallery -->
        <div v-if="post.images?.length" class="mt-6 space-y-4">
          <div
            v-for="(img, i) in post.images"
            :key="img"
            class="overflow-hidden rounded-xl border border-gray-100 bg-gray-100"
          >
            <img
              :src="img"
              :alt="`${post.title} 图${i + 1}`"
              loading="lazy"
              class="w-full cursor-zoom-in transition"
              @error="hideOnError"
              @click="lightbox = img"
            />
          </div>
        </div>

        <!-- Content -->
        <div class="mt-8 whitespace-pre-wrap text-[15px] leading-7 text-gray-800">{{ post.content }}</div>

        <div class="mt-10 border-t border-gray-100 pt-8">
          <CommentSection :post-id="post.id" :locked="post.status !== 'approved' || post.isOffShelf" />
        </div>
      </article>

      <!-- Sidebar -->
      <aside class="space-y-6">
        <div v-if="related.length" class="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 class="mb-4 text-sm font-semibold text-gray-900">相关推荐</h3>
          <div class="space-y-4">
            <RouterLink
              v-for="r in related"
              :key="r.id"
              :to="`/posts/${r.id}`"
              class="group flex gap-3"
            >
              <SmartImage
                :src="r.cover"
                :alt="r.title"
                :icon="categoryEmoji(r.category?.name)"
                :fallback-class="categoryGradient(r.category?.name)"
                class="h-14 w-20 shrink-0 rounded-lg"
              />
              <div class="min-w-0">
                <p class="line-clamp-2 text-sm font-medium text-gray-800 group-hover:text-indigo-600">{{ r.title }}</p>
                <p class="mt-1 text-xs text-gray-400">👁 {{ formatCount(r.viewCount) }}</p>
              </div>
            </RouterLink>
          </div>
        </div>
      </aside>
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

  <!-- Lightbox -->
  <Teleport to="body">
    <div
      v-if="lightbox"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      @click="lightbox = null"
    >
      <img :src="lightbox" class="max-h-full max-w-full rounded-lg" />
    </div>
  </Teleport>
</template>
