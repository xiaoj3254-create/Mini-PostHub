<script setup lang="ts">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    src?: string | null
    alt?: string
    icon?: string
    fallbackClass?: string
  }>(),
  { src: null, alt: '', icon: '🖼️', fallbackClass: 'bg-gray-100' },
)

const errored = ref(false)
</script>

<template>
  <!-- 尺寸/圆角等样式由调用方通过 class 传入，合并到根元素 -->
  <div class="relative overflow-hidden">
    <img
      v-if="src && !errored"
      :src="src"
      :alt="alt"
      loading="lazy"
      class="size-full bg-gray-100 object-cover"
      @error="errored = true"
    />
    <div v-else class="flex size-full items-center justify-center" :class="fallbackClass">
      <span class="text-2xl text-gray-300">{{ icon }}</span>
    </div>
  </div>
</template>
