<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as commentApi from '../../api/comment'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import type { Comment } from '../../types'
import AppButton from '../common/AppButton.vue'
import CommentItem from './CommentItem.vue'

const props = withDefaults(defineProps<{ postId: number; locked?: boolean }>(), { locked: false })

const auth = useAuthStore()
const toast = useToastStore()
const comments = ref<Comment[]>([])
const content = ref('')
const replyingTo = ref<{ commentId: number; name: string } | null>(null)
const loading = ref(false)

async function load() {
  comments.value = await commentApi.listByPost(props.postId)
}

onMounted(load)

async function submit() {
  if (!content.value.trim()) {
    toast.error('请输入评论内容')
    return
  }
  loading.value = true
  try {
    if (replyingTo.value) {
      await commentApi.reply(replyingTo.value.commentId, content.value)
      toast.success('回复成功')
      replyingTo.value = null
    } else {
      await commentApi.addComment(props.postId, content.value)
      toast.success('评论成功')
    }
    content.value = ''
    await load()
  } finally {
    loading.value = false
  }
}

function onReply(commentId: number, name: string) {
  if (!auth.isLoggedIn) return
  replyingTo.value = { commentId, name }
  content.value = content.value || `@${name} `
}
</script>

<template>
  <div>
    <h3 class="mb-4 text-base font-semibold text-gray-900">评论（{{ comments.length }}）</h3>

    <div v-if="auth.isLoggedIn && locked" class="mb-6 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-500">
      ⏳ 该作品未通过审核，暂不能评论
    </div>
    <div v-else-if="auth.isLoggedIn" class="mb-6">
      <div v-if="replyingTo" class="mb-2 text-sm text-gray-500">
        回复 <span class="font-medium text-indigo-600">{{ replyingTo.name }}</span>
        <button class="ml-2 text-xs text-gray-400 hover:text-gray-600" @click="replyingTo = null">取消</button>
      </div>
      <textarea
        v-model="content"
        rows="3"
        placeholder="写下你的看法…"
        class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
      <div class="mt-2 flex justify-end">
        <AppButton :loading="loading" @click="submit">发表评论</AppButton>
      </div>
    </div>
    <p v-else class="mb-6 text-sm text-gray-400">
      <RouterLink to="/login" class="text-indigo-600 hover:underline">登录</RouterLink> 后参与评论
    </p>

    <div v-if="comments.length" class="space-y-5">
      <CommentItem v-for="c in comments" :key="c.id" :comment="c" @reply="onReply" />
    </div>
    <p v-else class="py-8 text-center text-sm text-gray-400">还没有评论，来抢沙发～</p>
  </div>
</template>
