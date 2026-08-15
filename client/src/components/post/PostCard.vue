<script setup lang="ts">
import type { Post } from '../../types'
import { formatCount } from '../../utils/format'
import { categoryEmoji, categoryGradient } from '../../utils/categoryStyle'
import Avatar from '../common/Avatar.vue'
import SmartImage from '../common/SmartImage.vue'

defineProps<{ post: Post }>()
</script>

<template>
  <RouterLink
    :to="`/posts/${post.id}`"
    class="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-md"
  >
    <div class="relative aspect-[16/9]">
      <SmartImage
        :src="post.cover"
        :alt="post.title"
        :icon="categoryEmoji(post.category?.name)"
        :fallback-class="categoryGradient(post.category?.name)"
        class="absolute inset-0"
      />
      <span
        v-if="post.category"
        class="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-gray-700 shadow-sm backdrop-blur"
      >
        {{ post.category.name }}
      </span>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <h3 class="line-clamp-1 text-sm font-semibold text-gray-900 transition group-hover:text-indigo-600">
        {{ post.title }}
      </h3>
      <p class="mt-2 line-clamp-2 text-xs leading-5 text-gray-500">{{ post.content }}</p>

      <div class="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs text-gray-400">
        <div class="flex min-w-0 items-center gap-1.5">
          <Avatar :src="post.author?.avatar" :name="post.author?.nickname" :size="22" />
          <span class="truncate">{{ post.author?.nickname }}</span>
        </div>
        <div class="flex shrink-0 items-center gap-2.5">
          <span class="flex items-center gap-1" title="浏览">👁 {{ formatCount(post.viewCount) }}</span>
          <span class="flex items-center gap-1" title="收藏">⭐ {{ formatCount(post.favoriteCount) }}</span>
          <span class="flex items-center gap-1" title="评论">💬 {{ formatCount(post.commentCount) }}</span>
        </div>
      </div>
    </div>
  </RouterLink>
</template>
