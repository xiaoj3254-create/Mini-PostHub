<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    modelValue?: string
    rows?: number
    error?: string
  }>(),
  { placeholder: '', rows: 4, error: '' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <label class="block">
    <span v-if="label" class="mb-1.5 block text-sm font-medium text-gray-700">{{ label }}</span>
    <textarea
      :placeholder="placeholder"
      :rows="rows"
      :value="modelValue"
      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      :class="error ? 'border-red-400' : ''"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <span v-if="error" class="mt-1 block text-xs text-red-500">{{ error }}</span>
  </label>
</template>
