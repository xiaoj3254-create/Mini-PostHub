<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  pageSize: number
  total: number
}>()

const emit = defineEmits<{ change: [page: number] }>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const pages = computed(() => {
  const current = props.page
  const count = totalPages.value
  const list: number[] = []
  for (let p = 1; p <= count; p++) {
    if (p === 1 || p === count || Math.abs(p - current) <= 2) list.push(p)
  }
  const withEllipsis: (number | '...')[] = []
  let prev = 0
  for (const p of list) {
    if (p - prev > 1) withEllipsis.push('...')
    withEllipsis.push(p)
    prev = p
  }
  return withEllipsis
})

function go(p: number) {
  if (p < 1 || p > totalPages.value || p === props.page) return
  emit('change', p)
}
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-1.5">
    <button
      class="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="page <= 1"
      @click="go(page - 1)"
    >
      上一页
    </button>
    <template v-for="(p, i) in pages" :key="i">
      <button
        v-if="p !== '...'"
        class="rounded-lg border px-3 py-1.5 text-sm transition"
        :class="
          p === page
            ? 'border-indigo-600 bg-indigo-600 text-white'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
        "
        @click="go(p)"
      >
        {{ p }}
      </button>
      <span v-else class="px-1 text-gray-400">…</span>
    </template>
    <button
      class="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="page >= totalPages"
      @click="go(page + 1)"
    >
      下一页
    </button>
  </div>
</template>
