<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '../../components/common/AppButton.vue'
import AppInput from '../../components/common/AppInput.vue'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'

const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()

const username = ref('')
const nickname = ref('')
const password = ref('')
const confirm = ref('')
const loading = ref(false)

async function submit() {
  const name = username.value.trim()
  const nick = nickname.value.trim()
  if (!name) return toast.error('请输入用户名')
  if (name.length < 3 || name.length > 20) return toast.error('用户名长度需在 3-20 个字符之间')
  if (password.value.length < 6) return toast.error('密码至少 6 位')
  if (password.value !== confirm.value) return toast.error('两次输入的密码不一致')
  loading.value = true
  try {
    await auth.register({ username: name, password: password.value, nickname: nick || undefined })
    toast.success('注册成功，欢迎加入！')
    router.push('/')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-4 py-12">
    <div class="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 class="text-center text-2xl font-bold text-gray-900">注册</h1>
      <p class="mt-1 text-center text-sm text-gray-400">加入 Mini PostHub，分享你的作品</p>

      <form class="mt-8 space-y-5" @submit.prevent="submit">
        <AppInput v-model="username" label="用户名" placeholder="3-20 个字符，登录使用" />
        <AppInput v-model="nickname" label="昵称（可选）" placeholder="默认与用户名相同" />
        <AppInput v-model="password" label="密码" type="password" placeholder="至少 6 位" />
        <AppInput v-model="confirm" label="确认密码" type="password" placeholder="再次输入密码" />
        <AppButton class="w-full" size="lg" :loading="loading" @click="submit">注册</AppButton>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        已有账号？
        <RouterLink to="/login" class="font-medium text-indigo-600 hover:underline">去登录</RouterLink>
      </p>
    </div>
  </div>
</template>
