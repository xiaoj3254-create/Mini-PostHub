<script setup lang="ts">
import AppButton from './AppButton.vue'
import AppModal from './AppModal.vue'

withDefaults(
  defineProps<{
    open: boolean
    title?: string
    message: string
    confirmText?: string
    danger?: boolean
    loading?: boolean
  }>(),
  { title: '确认操作', confirmText: '确认', danger: true, loading: false },
)

const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
  <AppModal :open="open" :title="title" width="max-w-sm" @close="emit('close')">
    <p class="text-sm leading-6 text-gray-600">{{ message }}</p>
    <div class="mt-6 flex justify-end gap-3">
      <AppButton variant="secondary" @click="emit('close')">取消</AppButton>
      <AppButton :variant="danger ? 'danger' : 'primary'" :loading="loading" @click="emit('confirm')">
        {{ confirmText }}
      </AppButton>
    </div>
  </AppModal>
</template>
