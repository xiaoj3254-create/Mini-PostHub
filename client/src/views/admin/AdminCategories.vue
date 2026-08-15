<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as adminApi from '../../api/admin'
import AppButton from '../../components/common/AppButton.vue'
import AppInput from '../../components/common/AppInput.vue'
import AppModal from '../../components/common/AppModal.vue'
import AppTextarea from '../../components/common/AppTextarea.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import EmptyState from '../../components/common/EmptyState.vue'
import { useToastStore } from '../../stores/toast'
import type { Category } from '../../types'

const toast = useToastStore()
const categories = ref<Category[]>([])
const loading = ref(false)

const showModal = ref(false)
const editing = ref<Category | null>(null)
const formName = ref('')
const formDescription = ref('')
const formSort = ref(0)
const formEnabled = ref(true)
const saving = ref(false)

const deleteTarget = ref<Category | null>(null)
const deleting = ref(false)

async function load() {
  loading.value = true
  try {
    categories.value = await adminApi.listCategories()
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openCreate() {
  editing.value = null
  formName.value = ''
  formDescription.value = ''
  formSort.value = 0
  formEnabled.value = true
  showModal.value = true
}

function openEdit(c: Category) {
  editing.value = c
  formName.value = c.name
  formDescription.value = c.description || ''
  formSort.value = c.sort
  formEnabled.value = c.isEnabled
  showModal.value = true
}

async function save() {
  if (!formName.value.trim()) {
    toast.error('请输入分类名称')
    return
  }
  saving.value = true
  try {
    const payload = {
      name: formName.value.trim(),
      description: formDescription.value.trim() || undefined,
      sort: Number(formSort.value) || 0,
      isEnabled: formEnabled.value,
    }
    if (editing.value) {
      await adminApi.updateCategory(editing.value.id, payload)
      toast.success('分类已更新')
    } else {
      await adminApi.createCategory(payload)
      toast.success('分类已创建')
    }
    showModal.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function toggleEnabled(c: Category) {
  await adminApi.updateCategory(c.id, { isEnabled: !c.isEnabled })
  toast.success(c.isEnabled ? '已停用' : '已启用')
  await load()
}

function openDelete(c: Category) {
  deleteTarget.value = c
}

async function doDelete() {
  const target = deleteTarget.value
  if (!target) return
  deleting.value = true
  try {
    await adminApi.removeCategory(target.id)
    toast.success('分类已删除')
    deleteTarget.value = null
    await load()
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">分类管理</h1>
      <AppButton @click="openCreate">新增分类</AppButton>
    </div>

    <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div v-if="loading" class="py-20 text-center text-gray-400">加载中…</div>
      <EmptyState v-else-if="!categories.length" text="还没有分类" />

      <table v-else class="w-full text-sm">
        <thead class="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
          <tr>
            <th class="px-4 py-3 font-medium">名称</th>
            <th class="px-4 py-3 font-medium">描述</th>
            <th class="px-4 py-3 font-medium">排序</th>
            <th class="px-4 py-3 font-medium">状态</th>
            <th class="px-4 py-3 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="c in categories" :key="c.id" class="hover:bg-gray-50/60">
            <td class="px-4 py-3 font-medium text-gray-900">{{ c.name }}</td>
            <td class="max-w-60 px-4 py-3 line-clamp-1 text-gray-500">{{ c.description || '-' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ c.sort }}</td>
            <td class="px-4 py-3">
              <button
                class="rounded-full px-2.5 py-0.5 text-xs font-medium transition"
                :class="c.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'"
                @click="toggleEnabled(c)"
              >
                {{ c.isEnabled ? '已启用' : '已停用' }}
              </button>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1.5">
                <button
                  class="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  @click="openEdit(c)"
                >
                  编辑
                </button>
                <button class="rounded-lg px-2.5 py-1 text-xs text-red-500 hover:bg-red-50" @click="openDelete(c)">
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit modal -->
    <AppModal :open="showModal" :title="editing ? '编辑分类' : '新增分类'" @close="showModal = false">
      <div class="space-y-4">
        <AppInput v-model="formName" label="分类名称" placeholder="例如：摄影" />
        <AppTextarea v-model="formDescription" label="描述（可选）" :rows="2" placeholder="分类说明" />
        <AppInput v-model="formSort" label="排序（数字越小越靠前）" type="number" />
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input v-model="formEnabled" type="checkbox" class="size-4 accent-indigo-600" />
          启用该分类
        </label>
      </div>
      <div class="mt-6 flex justify-end gap-3">
        <AppButton variant="secondary" @click="showModal = false">取消</AppButton>
        <AppButton :loading="saving" @click="save">{{ editing ? '保存' : '创建' }}</AppButton>
      </div>
    </AppModal>

    <ConfirmDialog
      :open="!!deleteTarget"
      title="删除分类"
      :message="`确定删除分类「${deleteTarget?.name}」吗？该分类下已有作品时将无法删除。`"
      confirm-text="删除"
      :loading="deleting"
      @close="deleteTarget = null"
      @confirm="doDelete"
    />
  </div>
</template>
