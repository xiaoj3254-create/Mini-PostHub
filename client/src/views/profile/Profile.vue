<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as authApi from '../../api/auth'
import AppButton from '../../components/common/AppButton.vue'
import AppInput from '../../components/common/AppInput.vue'
import AppTextarea from '../../components/common/AppTextarea.vue'
import Avatar from '../../components/common/Avatar.vue'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import { formatDate } from '../../utils/format'

const auth = useAuthStore()
const toast = useToastStore()

const nickname = ref('')
const avatar = ref('')
const bio = ref('')
const saving = ref(false)

const oldPassword = ref('')
const newPassword = ref('')
const confirm = ref('')
const changing = ref(false)

onMounted(() => {
  const u = auth.user
  if (u) {
    nickname.value = u.nickname
    avatar.value = u.avatar || ''
    bio.value = u.bio || ''
  }
})

async function saveProfile() {
  if (!nickname.value.trim()) return toast.error('昵称不能为空')
  saving.value = true
  try {
    await authApi.updateProfile({
      nickname: nickname.value.trim(),
      avatar: avatar.value.trim() || null,
      bio: bio.value.trim(),
    })
    await auth.refreshUser()
    toast.success('资料已更新')
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  if (newPassword.value.length < 6) return toast.error('新密码至少 6 位')
  if (newPassword.value !== confirm.value) return toast.error('两次输入的新密码不一致')
  changing.value = true
  try {
    await authApi.changePassword({ oldPassword: oldPassword.value, newPassword: newPassword.value })
    toast.success('密码修改成功')
    oldPassword.value = newPassword.value = confirm.value = ''
  } finally {
    changing.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <h1 class="mb-6 text-xl font-bold text-gray-900">个人中心</h1>

    <div class="grid gap-6 md:grid-cols-[280px_1fr]">
      <!-- Profile card -->
      <div class="h-fit rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <div class="flex justify-center">
          <Avatar :src="auth.user?.avatar" :name="auth.user?.nickname" :size="72" />
        </div>
        <h2 class="mt-4 text-lg font-semibold text-gray-900">{{ auth.user?.nickname }}</h2>
        <p class="mt-0.5 text-sm text-gray-400">@{{ auth.user?.username }}</p>
        <p class="mt-2 text-xs text-gray-400">
          {{ auth.user?.role === 'admin' ? '管理员' : '普通用户' }}
        </p>
        <div class="mt-5 border-t border-gray-100 pt-4 text-left text-sm text-gray-500">
          <p class="mb-1 flex justify-between"><span>注册时间</span><span>{{ formatDate(auth.user?.createdAt) }}</span></p>
          <p class="flex justify-between"><span>发布作品</span><span>{{ auth.user?.postCount ?? '-' }}</span></p>
        </div>
      </div>

      <!-- Edit forms -->
      <div class="space-y-6">
        <div class="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 class="mb-5 text-base font-semibold text-gray-900">编辑资料</h3>
          <div class="space-y-5">
            <AppInput v-model="nickname" label="昵称" placeholder="你的显示昵称" />
            <AppInput v-model="avatar" label="头像 URL" placeholder="https://… 图片链接" />
            <AppTextarea v-model="bio" label="个人简介" :rows="3" placeholder="介绍一下自己" />
            <div class="flex justify-end">
              <AppButton :loading="saving" @click="saveProfile">保存修改</AppButton>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 class="mb-5 text-base font-semibold text-gray-900">修改密码</h3>
          <div class="space-y-5">
            <AppInput v-model="oldPassword" label="当前密码" type="password" placeholder="请输入当前密码" />
            <AppInput v-model="newPassword" label="新密码" type="password" placeholder="至少 6 位" />
            <AppInput v-model="confirm" label="确认新密码" type="password" placeholder="再次输入新密码" />
            <div class="flex justify-end">
              <AppButton variant="secondary" :loading="changing" @click="changePassword">修改密码</AppButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
