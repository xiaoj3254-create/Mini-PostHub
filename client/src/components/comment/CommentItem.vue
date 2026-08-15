<script setup lang="ts">
import type { Comment } from '../../types'
import { formatDate } from '../../utils/format'
import Avatar from '../common/Avatar.vue'

defineProps<{ comment: Comment }>()
defineEmits<{ reply: [commentId: number, name: string] }>()
</script>

<template>
  <div class="flex gap-3">
    <Avatar :src="comment.author?.avatar" :name="comment.author?.nickname" :size="34" />
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-800">{{ comment.author?.nickname }}</span>
        <span class="text-xs text-gray-400">{{ formatDate(comment.createdAt) }}</span>
      </div>
      <p class="mt-1 text-sm leading-6 text-gray-700">{{ comment.content }}</p>
      <button
        class="mt-1 text-xs text-gray-400 transition hover:text-indigo-600"
        @click="$emit('reply', comment.id, comment.author?.nickname || '')"
      >
        回复
      </button>

      <div v-if="comment.replies?.length" class="mt-3 space-y-3 border-l-2 border-gray-100 pl-4">
        <div v-for="reply in comment.replies" :key="reply.id" class="flex gap-3">
          <Avatar :src="reply.author?.avatar" :name="reply.author?.nickname" :size="30" />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-800">{{ reply.author?.nickname }}</span>
              <span class="text-xs text-gray-400">{{ formatDate(reply.createdAt) }}</span>
            </div>
            <p class="mt-1 text-sm leading-6 text-gray-700">{{ reply.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
