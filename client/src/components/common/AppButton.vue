<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    loading?: boolean
  }>(),
  { variant: 'primary', size: 'md', disabled: false, loading: false },
)

const classes = computed(() => {
  const variants: Record<string, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-indigo-600 hover:bg-indigo-50',
  }
  const sizes: Record<string, string> = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }
  return `${variants[props.variant]} ${sizes[props.size]}`
})
</script>

<template>
  <button
    type="button"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
    :class="classes"
  >
    <span v-if="loading" class="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
    <slot />
  </button>
</template>
