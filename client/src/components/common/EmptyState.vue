<script setup lang="ts">
withDefaults(
  defineProps<{
    text?: string
    icon?: string
  }>(),
  { text: '暂无内容', icon: '📭' },
)
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <span class="mb-3 text-4xl">{{ icon }}</span>
    <p class="text-sm text-gray-400">{{ text }}</p>
  </div>
</template>
