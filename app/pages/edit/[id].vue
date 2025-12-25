<template>
  <div
    class="relative bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/90 dark:border-neutral-800/70 rounded-lg p-4">
    <div v-if="isLoading"
      class="z-10 absolute inset-0 flex items-center justify-center bg-neutral-100/50 dark:bg-neutral-900/50 backdrop-blur-sm rounded-lg">
      <UIcon name="i-hugeicons:loading-02" class="animate-spin text-2xl text-primary" />
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <URadioGroup v-model="form.action" indicator="hidden" orientation="horizontal" variant="card"
        :items="[
          { label: '贴文', description: '发布原创内容，记录观点、动态与生活。', value: 'dit' },
          { label: '分享', description: '转发优质内容，传递价值与趣味给用户。', value: 'partager' },
        ]" />

      <div class="relative">
        <UTextarea v-model="form.content" id="content" autoresize color="neutral" variant="none"
          :placeholder="form.action === 'partager' ? '粘贴链接或内容，转发给他人 ...' : '输入原创内容，分享你的观点 ...'"
          size="xl" :rows="10" :maxrows="18" :disabled="isSubmitting" class="w-full" />

        <div class="absolute -bottom-4 right-0 pointer-events-none">
          <span class="text-xs tabular-nums select-none" :class="form.content.length >= maxLimit
            ? 'text-red-600 font-bold'
            : 'text-dimmed'
            ">
            {{ form.content.length }} / {{ maxLimit }}
          </span>
        </div>
      </div>

      <div v-show="form.action === 'partager'" class="flex items-center gap-2.5">
        <UInput v-model="form.icon" placeholder="图标，例如：i-simple-icons:nuxt" variant="subtle"
          color="neutral" :disabled="isSubmitting" class="w-full" />
        <UButton to="https://icones.js.org/collection/simple-icons" target="_blank" variant="link"
          color="neutral" icon="i-hugeicons:search-area" label="图标库" />
      </div>

      <USeparator />

      <div class="flex flex-col gap-6 select-none">
        <UInput v-model="form.link" id="link" placeholder="链接卡片，例如：https://ericdit.com"
          variant="subtle" color="neutral" :disabled="isSubmitting" size="lg" class="w-full" />

        <USwitch v-model="form.published" color="neutral" :disabled="isSubmitting"
          :label="form.published ? '立即对外正式发布' : '临时保存为草稿'" />
          
        <USwitch v-model="form.allow_comment" color="neutral" :disabled="isSubmitting"
          label="允许用户发表评论" />
      </div>

      <div class="flex items-center justify-between">
        <UButton type="button" color="error" variant="soft" class="cursor-pointer"
          @click="$router.back()"> 取消编辑 </UButton>

        <UButton type="submit" color="neutral" :loading="isSubmitting"
          :disabled="isLoading || isSubmitting || form.content.length >= maxLimit || form.content.trim() === ''"
          class="cursor-pointer">
          {{ isSubmitting ? '正在保存...' : '更新内容' }}
        </UButton>
      </div>

      <UAlert v-if="globalError" icon="i-hugeicons:alert-02" color="error" variant="soft"
        :description="globalError" class="mt-4" />
    </form>
  </div>
</template>

<script setup lang="ts">
import type { SinglePostResponse } from '~/types/posts';

const { markAsUpdated } = usePostUpdateTracker();
const route = useRoute();
const { id } = route.params as { id: string };

// --- 1. 表单数据 ---
const form = ref({
  content: '',
  allow_comment: true,
  published: true,
  icon: '',
  action: 'dit',
  link: '',
});

const maxLimit = 10000; // 设置最大字数与后端一致

const isLoading = ref(false);
const isSubmitting = ref(false);
const globalError = ref('');

/**
 * 加载已有数据
 */
const loadPostData = async () => {
  if (!id) return;
  isLoading.value = true;
  globalError.value = '';

  try {
    // 路径对齐重构后的后端路由
    const response = await $fetch<SinglePostResponse>(`/api/collections/post/${id}`);
    const data = response?.data;

    if (data) {
      // 映射字段
      form.value = {
        content: data.content || '',
        allow_comment: data.allow_comment ?? true,
        published: data.published ?? true,
        icon: data.icon || '',
        action: data.action || 'dit',
        link: data.link || '',
      };
    }
  } catch (err: any) {
    console.error('加载详情失败:', err);
    globalError.value = err.data?.message || '无法加载文章，该内容可能已被删除';
  } finally {
    isLoading.value = false;
  }
};

/**
 * 提交更新逻辑
 */
const handleSubmit = async () => {
  if (!form.value.content.trim()) {
    globalError.value = '内容不能为空';
    return;
  }
  if (form.value.content.length > maxLimit) {
    globalError.value = `内容长度超过限制 (${maxLimit} 字符)`;
    return false;
  }

  isSubmitting.value = true;
  globalError.value = '';

  try {
    // 使用 PATCH 方法更新局部数据
    await $fetch(`/api/collections/post/${id}`, {
      method: 'PUT',
      body: form.value,
    });

    // 1. 强制刷新列表缓存
    await refreshNuxtData('posts-list-data');

    // 2. 重要：标记该 ID 已更新，这样回到详情页时会触发“静默同步”
    markAsUpdated(id);

    // 3. 提示并跳转
    await navigateTo('/');
  } catch (err: any) {
    globalError.value = err.data?.message || '更新失败，请稍后重试';
  } finally {
    isSubmitting.value = false;
  }
};

// 生命周期
onMounted(loadPostData);
</script>