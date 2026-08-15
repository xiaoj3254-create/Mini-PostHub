<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import Avatar from '../common/Avatar.vue'

const auth = useAuthStore()
const router = useRouter()
const userMenuOpen = ref(false)

function toggleMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function logout() {
  userMenuOpen.value = false
  auth.logout()
  router.push('/')
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
    <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
      <div class="flex items-center gap-8">
        <RouterLink to="/" class="flex items-center gap-2 text-lg font-bold text-indigo-600">
          <span class="text-xl">📮</span>
          <span>Mini PostHub</span>
        </RouterLink>
        <nav class="hidden items-center gap-5 text-sm font-medium text-gray-600 sm:flex">
          <RouterLink to="/" class="transition hover:text-indigo-600" exact-active-class="text-indigo-600">
            首页
          </RouterLink>
          <RouterLink
            v-if="auth.isLoggedIn"
            to="/publish"
            class="transition hover:text-indigo-600"
            active-class="text-indigo-600"
          >
            发布作品
          </RouterLink>
        </nav>
      </div>

      <div class="flex items-center gap-3">
        <template v-if="auth.isLoggedIn">
          <span class="hidden text-sm text-gray-500 sm:inline">{{ auth.user?.nickname }}</span>
          <div class="relative">
            <button
              class="flex items-center gap-1.5 rounded-full p-0.5 transition hover:bg-gray-100 hover:ring-2 hover:ring-indigo-100"
              @click.stop="toggleMenu"
            >
              <Avatar :src="auth.user?.avatar" :name="auth.user?.nickname" :size="32" />
              <svg
                class="size-3 text-gray-400 transition"
                :class="userMenuOpen ? 'rotate-180' : ''"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Click-outside overlay -->
            <div v-if="userMenuOpen" class="fixed inset-0 z-30" @click="userMenuOpen = false" />

            <Transition name="menu">
              <div
                v-if="userMenuOpen"
                class="absolute right-0 top-full z-40 mt-2 w-44 rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg"
              >
                <RouterLink
                  to="/profile"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  @click="userMenuOpen = false"
                >
                  个人中心
                </RouterLink>
                <RouterLink
                  to="/me/posts"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  @click="userMenuOpen = false"
                >
                  我的投稿
                </RouterLink>
                <RouterLink
                  to="/me/collects"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  @click="userMenuOpen = false"
                >
                  我的收藏
                </RouterLink>
                <RouterLink
                  v-if="auth.isAdmin"
                  to="/admin"
                  class="block px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
                  @click="userMenuOpen = false"
                >
                  管理后台
                </RouterLink>
                <div class="my-1 border-t border-gray-100" />
                <button
                  class="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  @click="logout"
                >
                  退出登录
                </button>
              </div>
            </Transition>
          </div>
        </template>
        <template v-else>
          <RouterLink to="/login" class="text-sm font-medium text-gray-600 transition hover:text-indigo-600">登录</RouterLink>
          <RouterLink
            to="/register"
            class="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            注册
          </RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
