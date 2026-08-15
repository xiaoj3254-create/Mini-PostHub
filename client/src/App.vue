<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/layout/Navbar.vue'
import Footer from './components/layout/Footer.vue'
import ToastContainer from './components/common/ToastContainer.vue'

const route = useRoute()
const isAdminPage = computed(() => route.path.startsWith('/admin'))
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <Navbar v-if="!isAdminPage" />
    <main class="min-h-[calc(100vh-3.5rem)]">
      <RouterView />
    </main>
    <Footer v-if="!isAdminPage" />
    <ToastContainer />
  </div>
</template>
