<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '../../components/common/AppButton.vue'
import AppInput from '../../components/common/AppInput.vue'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const username = ref('')
const password = ref('')
const loading = ref(false)

async function submit() {
  if (!username.value.trim() || !password.value) return
  loading.value = true
  try {
    await auth.login(username.value.trim(), password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(redirect)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-4 py-12">
    <div class="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 class="text-center text-2xl font-bold text-gray-900">登录</h1>
      <p class="mt-1 text-center text-sm text-gray-400">欢迎回到 Mini PostHub</p>

      <form class="mt-8 space-y-5" @submit.prevent="submit">
        <AppInput v-model="username" label="用户名" placeholder="请输入用户名" />
        <AppInput v-model="password" label="密码" type="password" placeholder="请输入密码" />
        <AppButton class="w-full" size="lg" :loading="loading" @click="submit">登录</AppButton>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        还没有账号？
        <RouterLink to="/register" class="font-medium text-indigo-600 hover:underline">立即注册</RouterLink>
      </p>
    </div>
  </div>
</template>
