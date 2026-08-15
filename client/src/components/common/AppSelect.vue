<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    modelValue?: string | number
    options?: { value: string | number; label: string }[]
    placeholder?: string
  }>(),
  { label: '', placeholder: '请选择', options: () => [] },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <label class="block">
    <span v-if="label" class="mb-1.5 block text-sm font-medium text-gray-700">{{ label }}</span>
    <select
      :value="modelValue ?? ''"
      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
  </label>
</template>
