<script setup lang="ts">
import { POST_STATUS_COLOR, POST_STATUS_LABEL, type PostStatus } from '../../types'

defineProps<{ status: PostStatus }>()
</script>

<template>
  <span
    class="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="POST_STATUS_COLOR[status]"
  >
    {{ POST_STATUS_LABEL[status] }}
  </span>
</template>
