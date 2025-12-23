<template>
  <div
    class="bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/90 dark:border-neutral-800/70 rounded-lg p-4">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <URadioGroup v-model="form.action" indicator="hidden" orientation="horizontal" variant="card"
        class="select-none" :items="[
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
        ]" />

      <div class="relative">
        <UTextarea v-model="form.content" id="content" autoresize color="neutral" variant="none"
          :placeholder="form.action === 'partager'
            ? '粘贴链接或内容，转发给他人 ...'
            : '输入原创内容，分享你的观点 ...'
            " size="xl" :rows="10" :maxrows="18" :disabled="isSubmitting" class="w-full" />

        <div class="absolute -bottom-4 right-0 pointer-events-none">
          <span class="text-xs tabular-nums select-none" :class="form.content.length >= maxLimit
            ? 'text-red-600 font-bold'
            : 'text-dimmed'
            ">
            {{ form.content.length }} / {{ maxLimit }}
          </span>
        </div>
      </div>

      <div v-show="form.action === 'partager'" class="flex items-center gap-2.5 select-none">
        <UInput v-model="form.icon" id="icon" placeholder="图标，例如：i-simple-icons:nuxt"
          variant="subtle" color="neutral" :disabled="isSubmitting" size="lg" class="w-full" />

        <UButton to="https://icones.js.org/collection/simple-icons" target="_blank" variant="link"
          color="neutral" icon="i-hugeicons:search-area" label="查找图标" />
      </div>

      <USeparator />

      <div class="flex flex-col gap-4 select-none">
        <USwitch v-model="form.published" :disabled="isSubmitting" color="neutral"
          :label="form.published ? '立即对外正式发布' : '临时保存为草稿'" />

        <USwitch v-model="form.allow_comment" :disabled="isSubmitting" color="neutral"
          label="允许用户发表评论" />
      </div>

      <div class="flex items-center justify-between select-none">
        <UButton type="button" color="neutral" variant="soft" class="cursor-pointer"
          @click="$router.back()"> 取消 </UButton>

        <UButton type="submit" color="neutral" :loading="isSubmitting"
          :disabled="isSubmitting || form.content.length >= maxLimit || form.content.trim() === ''"
          class="cursor-pointer">
          <span v-if="!isSubmitting">
            {{ form.action === 'partager' ? '分享互联网' : '发表新贴文' }}
          </span>
          <span v-else>正在发布...</span>
        </UButton>
      </div>

      <div class="space-y-2 mt-4">
        <UAlert v-if="errors.content" icon="i-hugeicons:alert-02" color="error" variant="soft"
          :description="errors.content" />

        <UAlert v-if="globalError" icon="i-hugeicons:alert-02" color="error" variant="soft"
          :description="globalError" />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
/**
 * 使用工厂函数定义初始值，确保每次重置都是干净的副本
 */
const createInitialForm = () => ({
  content: '',
  allow_comment: true,
  published: true,
  icon: '',
  action: 'dit',
});

const form = reactive(createInitialForm());

const errors = reactive({
  content: '',
});

const maxLimit = 10000; // 设置最大字数与后端一致

const isSubmitting = ref(false);
const globalError = ref('');

/**
 * 重置表单状态
 */
const resetForm = () => {
  Object.assign(form, createInitialForm());
  errors.content = '';
  globalError.value = '';
};

/**
 * 表单验证
 */
const validateForm = () => {
  errors.content = '';
  globalError.value = '';

  const content = form.content.trim();
  if (!content) {
    errors.content = '内容不能为空';
    return false;
  }
  if (content.length > maxLimit) {
    errors.content = `内容长度超过限制 (${maxLimit} 字符)`;
    return false;
  }

  return true;
};

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (!validateForm() || isSubmitting.value) return;

  isSubmitting.value = true;
  globalError.value = '';

  try {
    // 路径修改：使用重构后的 API 路径
    await $fetch('/api/collections/posts', {
      method: 'POST',
      body: form,
    });

    // 1. 提交成功后重置
    resetForm();

    // 2. 刷新首页数据缓存
    await refreshNuxtData('posts-list-data');

    // 3. 跳转回首页
    await navigateTo('/');
  } catch (err: any) {
    // 优先展示后端返回的友好错误信息
    if (err.data?.message) {
      globalError.value = err.data.message;
    } else if (err.data?.data) {
      // 处理 PocketBase 的嵌套字段错误
      const firstError = Object.values(err.data.data)[0] as any;
      globalError.value = firstError?.message || '输入信息有误';
    } else {
      globalError.value = '发布失败，请检查网络或联系管理员';
    }

    console.error('Post Submit Error:', err);
  } finally {
    isSubmitting.value = false;
  }
};

/**
 * 在 KeepAlive 模式下离开页面时重置
 */
onDeactivated(() => {
  resetForm();
});
</script>