<script setup lang="ts">
withDefaults(defineProps<{ open: boolean; title?: string; width?: string }>(), {
  title: '',
  width: 'max-w-lg',
})

const emit = defineEmits<{ close: [] }>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @keydown="onKeydown"
      >
        <div class="absolute inset-0 bg-black/40" @click="emit('close')" />
        <div class="relative w-full rounded-2xl bg-white p-6 shadow-xl" :class="width">
          <div v-if="title" class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
            <button class="text-gray-400 transition hover:text-gray-600" @click="emit('close')">
              <svg class="size-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
