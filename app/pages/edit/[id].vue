<template>
  <div
    class="bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/90 dark:border-neutral-800/70 rounded-lg p-4"
  >
    <div
      v-if="isLoading"
      class="z-10 absolute top-0 left-0 w-full h-full bg-neutral-100/50 dark:bg-neutral-900/50 backdrop-blur-sm"
    ></div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <URadioGroup
        v-model="form.action"
        indicator="hidden"
        orientation="horizontal"
        variant="card"
        :items="[
          {
            label: '贴文',
            description: '发布原创内容，记录观点、动态与生活。',
            value: 'dit',
          },
          {
            label: '分享',
            description: '转发优质内容，传递价值与趣味给用户。',
            value: 'partager',
          },
        ]"
      />

      <USeparator />

      <UTextarea
        v-model="form.content"
        id="content"
        autoresize
        color="neutral"
        variant="none"
        :placeholder="
          form.action === 'partager'
            ? '粘贴链接或内容，转发给他人 ...'
            : '输入原创内容，分享你的观点 ...'
        "
        size="xl"
        :rows="10"
        :maxrows="18"
        :disabled="isSubmitting"
        class="w-full"
      />

      <div v-show="form.action === 'partager'" class="flex items-center gap-2.5">
        <UInput
          v-model="form.icon"
          id="icon"
          placeholder="图标，例如：i-simple-icons:nuxt"
          variant="subtle"
          color="neutral"
          :disabled="isSubmitting"
          size="lg"
          class="w-full"
        />

        <UButton
          to="https://icones.js.org/collection/simple-icons"
          target="_blank"
          variant="link"
          color="neutral"
          icon="i-hugeicons:search-area"
          label="查找图标"
        />
      </div>

      <USeparator />

      <div class="flex flex-col gap-4">
        <USwitch
          v-model="form.published"
          :disabled="isSubmitting"
          color="neutral"
          :label="form.published ? '正式发布' : '草稿保存'"
        />

        <USwitch
          v-model="form.allow_comment"
          :disabled="isSubmitting"
          color="neutral"
          label="允许评论"
        />
      </div>

      <div class="flex items-center justify-between">
        <UButton type="button" color="neutral" variant="soft" to="/"> 取消 </UButton>

        <UButton type="submit" color="neutral" :loading="isSubmitting" :disabled="isSubmitting">
          <span v-if="!isSubmitting"> 编辑完成 </span>
          <span v-else>正在发布...</span>
        </UButton>
      </div>

      <UAlert
        v-if="errors.content"
        icon="i-hugeicons:alert-02"
        color="error"
        variant="soft"
        :description="errors.content"
        class="mt-4"
      />

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
  import type { PostRecord } from '~/types/posts';

  const route = useRoute();
  const { id } = route.params;

  // --- 1. 初始化与数据定义 ---

  const initialForm = {
    content: '',
    allow_comment: true,
    published: true,
    icon: '',
    action: 'dit',
  };

  const form = reactive({ ...initialForm });

  const errors = reactive({
    content: '',
  });

  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const globalError = ref('');
  const hasDataLoaded = ref(false); // 新增：标记数据是否已加载

  const loadPostData = async () => {
    // 防止重复加载
    if (hasDataLoaded.value && form.content) {
      return;
    }

    isLoading.value = true;
    globalError.value = '';

    try {
      const result = await $fetch<PostRecord>(`/api/collections/post/${id}`);
      if (result) {
        form.content = result.content || '';
        form.allow_comment = result.allow_comment ?? true;
        form.published = result.published ?? true;
        form.icon = result.icon || '';
        form.action = result.action || 'dit';
        hasDataLoaded.value = true; // 标记数据已加载
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      globalError.value = '加载文章数据失败';
    } finally {
      isLoading.value = false;
    }
  };

  // --- 2. 核心逻辑函数 ---

  /**
   * 重置表单到初始状态
   */
  const resetForm = () => {
    Object.assign(form, initialForm);
    errors.content = '';
    globalError.value = '';
    hasDataLoaded.value = false; // 重置标记
  };

  /**
   * 表单验证
   */
  const validateForm = () => {
    let isValid = true;
    errors.content = '';
    globalError.value = '';

    if (!form.content.trim()) {
      errors.content = '内容不能为空';
      isValid = false;
    } else if (form.content.length > 10000) {
      errors.content = '内容长度不能超过 10000 字符';
      isValid = false;
    }

    return isValid;
  };

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    isSubmitting.value = true;
    globalError.value = '';

    try {
      const updateData: any = {};

      // 构建更新数据
      if (form.content !== undefined) updateData.content = form.content;
      if (form.allow_comment !== undefined) updateData.allow_comment = form.allow_comment;
      if (form.published !== undefined) updateData.published = form.published;
      if (form.icon !== undefined) updateData.icon = form.icon;
      if (form.action !== undefined) updateData.action = form.action;

      await $fetch(`/api/collections/post/${id}`, {
        method: 'PUT',
        body: updateData,
      });

      // 提交成功后重置表单
      resetForm();

      // 刷新数据并跳转
      await refreshNuxtData('posts-list-data');
      await navigateTo('/');
    } catch (err: any) {
      // 错误处理保持不变
      if (err.data?.message) {
        globalError.value = err.data.message;
      } else if (err.data?.data) {
        const firstError = Object.values(err.data.data)[0] as any;
        globalError.value = firstError?.message || '输入信息有误';
      } else {
        globalError.value = err.message?.includes('fetch')
          ? '网络连接失败，请稍后再试'
          : '编辑失败，请检查网络或联系管理员';
      }
      console.error('Post Error Details:', err.data);
    } finally {
      isSubmitting.value = false;
    }
  };

  // --- 3. 生命周期钩子 ---

  // 使用 watchEffect 自动响应依赖变化
  watchEffect(() => {
    const postId = route.params.id;
    if (postId && !hasDataLoaded.value) {
      loadPostData();
    }
  });

  // 或者使用 watch 监听 id 变化
  watch(
    () => route.params.id,
    (newId) => {
      if (newId) {
        resetForm();
        loadPostData();
      }
    },
    { immediate: true } // 立即执行一次
  );
</script>
