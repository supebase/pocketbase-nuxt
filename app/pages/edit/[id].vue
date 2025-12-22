<template>
  <div
    class="relative bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/90 dark:border-neutral-800/70 rounded-lg p-4"
  >
    <div
      v-if="isLoading"
      class="z-10 absolute inset-0 flex items-center justify-center bg-neutral-100/50 dark:bg-neutral-900/50 backdrop-blur-sm rounded-lg"
    >
      <UIcon name="i-hugeicons:loading-02" class="animate-spin text-2xl" />
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <URadioGroup
        v-model="form.action"
        indicator="hidden"
        orientation="horizontal"
        variant="card"
        :items="[
          { label: '贴文', description: '发布原创内容。', value: 'dit' },
          { label: '分享', description: '转发优质内容。', value: 'partager' },
        ]"
      />

      <USeparator />

      <UTextarea
        v-model="form.content"
        id="content"
        autoresize
        color="neutral"
        variant="none"
        :placeholder="form.action === 'partager' ? '粘贴链接...' : '输入内容...'"
        size="xl"
        :rows="10"
        class="w-full"
      />

      <div v-show="form.action === 'partager'" class="flex items-center gap-2.5">
        <UInput
          v-model="form.icon"
          placeholder="图标，例如：i-simple-icons:nuxt"
          variant="subtle"
          class="w-full"
        />
      </div>

      <USeparator />

      <div class="flex flex-col gap-4">
        <USwitch
          v-model="form.published"
          color="neutral"
          :label="form.published ? '立即对外正式发布' : '临时保存为草稿'"
        />
        <USwitch v-model="form.allow_comment" color="neutral" label="允许用户发表评论" />
      </div>

      <div class="flex items-center justify-between">
        <UButton type="button" color="neutral" variant="soft" to="/"> 取消 </UButton>
        <UButton type="submit" color="neutral" :loading="isSubmitting" class="cursor-pointer">
          编辑完成
        </UButton>
      </div>

      <UAlert
        v-if="globalError"
        icon="i-hugeicons:alert-02"
        color="error"
        variant="soft"
        :description="globalError"
        class="mt-4"
      />
    </form>
  </div>
</template>

<script setup lang="ts">
  const { markAsUpdated } = usePostUpdateTracker();

  const route = useRoute();
  const id = route.params.id as string;

  // --- 1. 表单响应式数据 ---
  const form = ref({
    content: '',
    allow_comment: true,
    published: true,
    icon: '',
    action: 'dit',
  });

  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const globalError = ref('');

  /**
   * 加载数据并映射字段
   */
  const loadPostData = async () => {
    if (!id) return;
    isLoading.value = true;

    try {
      // 1. 获取原始数据
      const response = await $fetch<any>(`/api/collections/post/${id}`);

      // 2. 关键修复：兼容 PocketBase 或其他包装过的 API 结构
      // 有些 API 返回的是 { data: { ... } }，有些直接返回内容
      const data = response?.data || response;

      if (data) {
        // 3. 显式手动映射，防止后端字段名不匹配
        form.value = {
          content: data.content || '',
          allow_comment: data.allow_comment ?? true,
          published: data.published ?? true,
          icon: data.icon || '',
          action: data.action || 'dit',
        };
      }
    } catch (err: any) {
      console.error('加载失败:', err);
      globalError.value = '无法加载文章数据，请重试';
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 提交更新
   */
  const handleSubmit = async () => {
    if (!form.value.content.trim()) {
      globalError.value = '内容不能为空';
      return;
    }

    isSubmitting.value = true;
    try {
      await $fetch(`/api/collections/post/${id}`, {
        method: 'PUT',
        body: form.value, // 发送的是映射后的干净数据
      });
      await refreshNuxtData('posts-list-data');
      // 4. 标记为已更新
      markAsUpdated(id);
      await navigateTo('/');
    } catch (err: any) {
      globalError.value = err.data?.message || '保存失败';
    } finally {
      isSubmitting.value = false;
    }
  };

  // 挂载时加载
  onMounted(() => {
    loadPostData();
  });
</script>
