<script setup lang="ts">
import { ref } from 'vue'
import * as postApi from '../../api/post'
import { useToastStore } from '../../stores/toast'

const props = withDefaults(defineProps<{ modelValue: string[]; max?: number }>(), { max: 9 })
const emit = defineEmits<{ 'update:modelValue': [urls: string[]] }>()

const toast = useToastStore()
const uploading = ref(false)
const inputRef = ref<HTMLInputElement>()

async function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files?.length) return
  const remain = props.max - props.modelValue.length
  if (remain <= 0) {
    toast.error(`最多上传 ${props.max} 张图片`)
    return
  }
  const toUpload = Array.from(files).slice(0, remain)
  uploading.value = true
  try {
    const urls = [...props.modelValue]
    for (const f of toUpload) {
      const { url } = await postApi.uploadImage(f)
      urls.push(url)
    }
    emit('update:modelValue', urls)
  } finally {
    uploading.value = false
    if (inputRef.value) inputRef.value.value = ''
  }
}

function removeAt(index: number) {
  const urls = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', urls)
}
</script>

<template>
  <div class="grid grid-cols-3 gap-3 sm:grid-cols-4">
    <div
      v-for="(url, i) in modelValue"
      :key="url"
      class="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
    >
      <img :src="url" :alt="`图片 ${i + 1}`" class="size-full object-cover" />
      <button
        class="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/50 text-xs text-white opacity-0 transition group-hover:opacity-100"
        @click="removeAt(i)"
      >
        ✕
      </button>
    </div>

    <label
      v-if="modelValue.length < max"
      class="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition hover:border-indigo-400 hover:text-indigo-500"
    >
      <input ref="inputRef" type="file" accept="image/*" multiple class="hidden" @change="onFileChange" />
      <span v-if="uploading" class="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span v-else class="text-2xl">＋</span>
      <span class="text-xs">{{ uploading ? '上传中…' : '添加图片' }}</span>
    </label>
  </div>
</template>
