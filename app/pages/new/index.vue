<template>
  <div
    class="bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/90 dark:border-neutral-800/70 rounded-lg p-4"
  >
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
          :label="form.published ? '立即对外正式发布' : '临时保存为草稿'"
        />

        <USwitch
          v-model="form.allow_comment"
          :disabled="isSubmitting"
          color="neutral"
          label="允许用户发表评论"
        />
      </div>

      <div class="flex items-center justify-between">
        <UButton type="button" color="neutral" variant="soft" to="/"> 取消 </UButton>

        <UButton
          type="submit"
          color="neutral"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          class="cursor-pointer"
        >
          <span v-if="!isSubmitting">
            {{ form.action === 'partager' ? '分享互联网' : '发表新贴文' }}
          </span>
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
  import { reactive, ref, onDeactivated } from 'vue';

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

  const isSubmitting = ref(false);
  const globalError = ref('');

  // --- 2. 核心逻辑函数 ---

  /**
   * 重置表单到初始状态
   */
  const resetForm = () => {
    // 使用 Object.assign 快速重置 reactive 对象
    Object.assign(form, initialForm);
    // 清除错误信息
    errors.content = '';
    globalError.value = '';
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
      await $fetch('/api/collections/posts', {
        method: 'POST',
        body: form,
      });

      // 提交成功后重置表单
      resetForm();

      // 刷新数据并跳转
      await refreshNuxtData('posts-list-data');
      await navigateTo('/');
    } catch (err: any) {
      // 1. 优先获取后端 handlePocketBaseError 传回的友好 message
      if (err.data?.message) {
        globalError.value = err.data.message;
      }
      // 2. 如果是具体的字段错误 (PocketBase 可能会返回 data.data)
      else if (err.data?.data) {
        const firstError = Object.values(err.data.data)[0] as any;
        globalError.value = firstError?.message || '输入信息有误';
      }
      // 3. 网络错误或未知错误
      else {
        globalError.value = err.message?.includes('fetch')
          ? '网络连接失败，请稍后再试'
          : '发布失败，请检查网络或联系管理员';
      }

      console.error('Post Error Details:', err.data);
    } finally {
      isSubmitting.value = false;
    }
  };

  // --- 3. 生命周期钩子 ---

  /**
   * 处理 KeepAlive 模式下的离开页面重置
   * 当组件被缓存但从视图中移除时触发
   */
  onDeactivated(() => {
    resetForm();
  });
</script>
