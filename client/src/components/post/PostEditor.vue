<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import * as categoryApi from '../../api/category'
import type { Category, Post } from '../../types'
import AppButton from '../common/AppButton.vue'
import AppInput from '../common/AppInput.vue'
import AppSelect from '../common/AppSelect.vue'
import AppTextarea from '../common/AppTextarea.vue'
import ImageUploader from './ImageUploader.vue'

export interface PostPayload {
  title: string
  content: string
  categoryId: number
  images: string[]
}

const props = withDefaults(defineProps<{ initial?: Post | null; loading?: boolean }>(), {
  loading: false,
})
const emit = defineEmits<{
  submit: [payload: PostPayload, status: 'draft' | 'pending']
}>()

const categories = ref<Category[]>([])
const title = ref('')
const content = ref('')
const categoryId = ref<number | string>('')
const images = ref<string[]>([])

onMounted(async () => {
  categories.value = await categoryApi.listEnabled()
})

watch(
  () => props.initial,
  (v) => {
    if (v) {
      title.value = v.title
      content.value = v.content
      categoryId.value = v.categoryId
      images.value = v.images || []
    }
  },
  { immediate: true },
)

function doSubmit(status: 'draft' | 'pending') {
  if (!title.value.trim()) return
  if (!content.value.trim()) return
  if (!categoryId.value) return
  emit('submit', {
    title: title.value.trim(),
    content: content.value,
    categoryId: Number(categoryId.value),
    images: images.value,
  }, status)
}
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="initial?.status === 'rejected'"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <p class="font-medium">你的作品被驳回：{{ initial.rejectReason || '未填写原因' }}</p>
      <p class="mt-0.5 text-xs text-red-500">请修改后重新提交审核</p>
    </div>

    <AppInput v-model="title" label="作品标题" placeholder="给你的作品起个标题" maxlength="100" />

    <AppSelect
      v-model="categoryId"
      label="所属分类"
      :options="categories.map((c) => ({ value: c.id, label: c.name }))"
    />

    <div>
      <span class="mb-1.5 block text-sm font-medium text-gray-700">作品图片（可选，最多 9 张）</span>
      <ImageUploader v-model="images" />
    </div>

    <AppTextarea
      v-model="content"
      label="作品描述"
      placeholder="详细介绍你的作品…"
      :rows="8"
    />

    <div class="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
      <AppButton variant="secondary" :disabled="loading" @click="doSubmit('draft')">
        保存草稿
      </AppButton>
      <AppButton :loading="loading" @click="doSubmit('pending')">
        {{ initial?.status === 'rejected' ? '修改并重新提交' : '提交审核' }}
      </AppButton>
    </div>
  </div>
</template>
