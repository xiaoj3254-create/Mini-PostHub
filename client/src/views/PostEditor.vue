<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as postApi from '../api/post'
import type { Post } from '../types'
import { useToastStore } from '../stores/toast'
import PostEditor, { type PostPayload } from '../components/post/PostEditor.vue'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const editingId = computed(() => (route.params.id ? Number(route.params.id) : 0))
const isEdit = computed(() => editingId.value > 0)
const initial = ref<Post | null>(null)
const loading = ref(true)
const saving = ref(false)

onMounted(async () => {
  if (!isEdit.value) {
    loading.value = false
    return
  }
  try {
    const { post } = await postApi.getPost(editingId.value)
    if (post.status === 'pending' || post.status === 'approved') {
      toast.error('该作品当前状态不可编辑')
      router.replace('/me/posts')
      return
    }
    initial.value = post
  } finally {
    loading.value = false
  }
})

async function onSubmit(payload: PostPayload, status: 'draft' | 'pending') {
  saving.value = true
  try {
    if (isEdit.value) {
      await postApi.updatePost(editingId.value, payload)
      if (status === 'pending') await postApi.submitPost(editingId.value)
    } else {
      await postApi.createPost({ ...payload, status })
    }
    toast.success(status === 'pending' ? '已提交审核，请等待管理员审核' : '草稿已保存')
    router.push('/me/posts')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8">
    <h1 class="mb-6 text-xl font-bold text-gray-900">{{ isEdit ? '编辑作品' : '发布作品' }}</h1>
    <div v-if="loading" class="py-20 text-center text-gray-400">加载中…</div>
    <div v-else class="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
      <PostEditor :initial="initial" :loading="saving" @submit="onSubmit" />
    </div>
  </div>
</template>
