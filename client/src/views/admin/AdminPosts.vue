<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as adminApi from '../../api/admin'
import AppButton from '../../components/common/AppButton.vue'
import AppModal from '../../components/common/AppModal.vue'
import AppTextarea from '../../components/common/AppTextarea.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import EmptyState from '../../components/common/EmptyState.vue'
import Pagination from '../../components/common/Pagination.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import { useToastStore } from '../../stores/toast'
import type { Category, Post, PostStatus } from '../../types'
import { formatCount, formatDate } from '../../utils/format'

const PAGE_SIZE = 10

const toast = useToastStore()
const posts = ref<Post[]>([])
const categories = ref<Category[]>([])
const total = ref(0)
const page = ref(1)
const status = ref<'' | PostStatus>('')
const categoryId = ref<number>(0)
const keyword = ref('')
const loading = ref(false)

const rejectTarget = ref<Post | null>(null)
const rejectReason = ref('')
const rejecting = ref(false)

const offTarget = ref<Post | null>(null)
const offLoading = ref(false)

const deleteTarget = ref<number>(0)
const deleting = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await adminApi.listPosts({
      status: status.value || undefined,
      categoryId: categoryId.value || undefined,
      keyword: keyword.value.trim() || undefined,
      page: page.value,
      pageSize: PAGE_SIZE,
    })
    posts.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  categories.value = await adminApi.listCategories()
  await load()
})

function onSearch() {
  page.value = 1
  load()
}

function onPage(p: number) {
  page.value = p
  load()
}

async function approve(p: Post) {
  await adminApi.approvePost(p.id)
  toast.success(`已通过《${p.title}》`)
  await load()
}

function openReject(p: Post) {
  rejectTarget.value = p
  rejectReason.value = ''
}

async function doReject() {
  const target = rejectTarget.value
  if (!target) return
  if (!rejectReason.value.trim()) {
    toast.error('请填写驳回原因')
    return
  }
  rejecting.value = true
  try {
    await adminApi.rejectPost(target.id, rejectReason.value.trim())
    toast.success('已驳回')
    rejectTarget.value = null
    await load()
  } finally {
    rejecting.value = false
  }
}

async function toggleOff(p: Post) {
  offTarget.value = p
}

async function doToggleOff() {
  const target = offTarget.value
  if (!target) return
  offLoading.value = true
  try {
    await adminApi.toggleOffShelf(target.id, !target.isOffShelf)
    toast.success(target.isOffShelf ? '已恢复上架' : '已下架')
    offTarget.value = null
    await load()
  } finally {
    offLoading.value = false
  }
}

function openDelete(id: number) {
  deleteTarget.value = id
}

async function doDelete() {
  deleting.value = true
  try {
    await adminApi.removePost(deleteTarget.value)
    toast.success('已删除')
    deleteTarget.value = 0
    await load()
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <h1 class="text-xl font-bold text-gray-900">作品审核</h1>
      <div class="ml-auto flex flex-wrap items-center gap-2">
        <select
          v-model="status"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none"
          @change="onSearch"
        >
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已发布</option>
          <option value="rejected">已驳回</option>
          <option value="draft">草稿</option>
        </select>
        <select
          v-model="categoryId"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none"
          @change="onSearch"
        >
          <option :value="0">全部分类</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索标题 / 内容"
          class="w-44 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
          @keyup.enter="onSearch"
        />
        <AppButton size="sm" @click="onSearch">搜索</AppButton>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div v-if="loading" class="py-20 text-center text-gray-400">加载中…</div>
      <EmptyState v-else-if="!posts.length" text="没有符合条件的作品" />

      <table v-else class="w-full text-sm">
        <thead class="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
          <tr>
            <th class="px-4 py-3 font-medium">作品</th>
            <th class="px-4 py-3 font-medium">分类</th>
            <th class="px-4 py-3 font-medium">状态</th>
            <th class="px-4 py-3 font-medium">数据</th>
            <th class="px-4 py-3 font-medium">发布时间</th>
            <th class="px-4 py-3 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="p in posts" :key="p.id" class="hover:bg-gray-50/60">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <img
                  :src="p.cover || undefined"
                  :alt="p.title"
                  class="h-11 w-16 shrink-0 rounded bg-gray-100 object-cover"
                />
                <div class="min-w-0">
                  <RouterLink :to="`/posts/${p.id}`" class="line-clamp-1 font-medium text-gray-900 hover:text-indigo-600">
                    {{ p.title }}
                  </RouterLink>
                  <p class="text-xs text-gray-400">{{ p.author?.nickname }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ p.category?.name || '-' }}</td>
            <td class="px-4 py-3">
              <StatusBadge :status="p.status" />
              <p v-if="p.isOffShelf" class="mt-1 text-xs text-red-500">已下架</p>
              <p v-if="p.status === 'rejected' && p.rejectReason" class="mt-1 max-w-40 line-clamp-1 text-xs text-red-400" :title="p.rejectReason">
                {{ p.rejectReason }}
              </p>
            </td>
            <td class="px-4 py-3 text-gray-500">
              👁 {{ formatCount(p.viewCount) }} · ⭐ {{ formatCount(p.favoriteCount) }} · 💬 {{ formatCount(p.commentCount) }}
            </td>
            <td class="px-4 py-3 text-gray-500">{{ formatDate(p.createdAt) }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1.5">
                <button
                  v-if="p.status === 'pending'"
                  class="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-100"
                  @click="approve(p)"
                >
                  通过
                </button>
                <button
                  v-if="p.status === 'pending'"
                  class="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                  @click="openReject(p)"
                >
                  驳回
                </button>
                <button
                  v-if="p.status === 'approved'"
                  class="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  @click="toggleOff(p)"
                >
                  {{ p.isOffShelf ? '恢复上架' : '下架' }}
                </button>
                <button
                  class="rounded-lg px-2.5 py-1 text-xs text-red-500 hover:bg-red-50"
                  @click="openDelete(p.id)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-5">
      <Pagination :page="page" :page-size="PAGE_SIZE" :total="total" @change="onPage" />
    </div>

    <!-- Reject modal -->
    <AppModal :open="!!rejectTarget" title="驳回作品" @close="rejectTarget = null">
      <p class="mb-3 text-sm text-gray-500">正在驳回：<span class="font-medium text-gray-800">{{ rejectTarget?.title }}</span></p>
      <AppTextarea v-model="rejectReason" label="驳回原因" placeholder="请填写驳回原因，作者将看到此原因" :rows="3" />
      <div class="mt-6 flex justify-end gap-3">
        <AppButton variant="secondary" @click="rejectTarget = null">取消</AppButton>
        <AppButton variant="danger" :loading="rejecting" @click="doReject">确认驳回</AppButton>
      </div>
    </AppModal>

    <!-- Off shelf confirm -->
    <ConfirmDialog
      :open="!!offTarget"
      :title="offTarget?.isOffShelf ? '恢复上架' : '下架作品'"
      :message="
        offTarget?.isOffShelf
          ? `确定恢复《${offTarget?.title}》上架吗？`
          : `下架后前台将隐藏《${offTarget?.title}》，确定吗？`
      "
      :confirm-text="offTarget?.isOffShelf ? '恢复' : '下架'"
      :danger="!offTarget?.isOffShelf"
      :loading="offLoading"
      @close="offTarget = null"
      @confirm="doToggleOff"
    />

    <ConfirmDialog
      :open="deleteTarget > 0"
      title="删除作品"
      message="删除后不可恢复，确定删除吗？"
      confirm-text="删除"
      :loading="deleting"
      @close="deleteTarget = 0"
      @confirm="doDelete"
    />
  </div>
</template>
