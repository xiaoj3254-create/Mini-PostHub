<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string | null
    name?: string
    size?: number
  }>(),
  { src: null, name: '', size: 36 },
)

const initial = computed(() => (props.name || '?').slice(0, 1).toUpperCase())
// src 加载失败时回退到首字母
const errored = ref(false)
</script>

<template>
  <span
    class="inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-indigo-100 font-semibold text-indigo-600"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.42)}px` }"
  >
    <img v-if="src && !errored" :src="src" :alt="name" class="size-full object-cover" @error="errored = true" />
    <span v-else>{{ initial }}</span>
  </span>
</template>
