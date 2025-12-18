<template>
  <div
      class="bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/90 dark:border-neutral-800/70 rounded-lg p-4">
    <form
      @submit.prevent="handleSubmit"
      class="space-y-6">
      <UTextarea
        v-model="form.content"
        autoresize
        color="neutral"
        variant="none"
        :placeholder="form.action === 'partager' ? '粘贴链接或内容，转发给他人 ...' : '输入原创内容，分享你的观点 ...'"
        size="lg"
        :rows="10"
        :maxrows="18"
        :disabled="isSubmitting"
        class="w-full" />

      <URadioGroup
        v-model="form.action"
        indicator="hidden"
        orientation="horizontal"
        variant="table"
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
        ]" />

      <UInput
        v-model="form.icon"
        v-show="form.action === 'partager'"
        placeholder="图标，例如：hugeicons:share-06"
        variant="subtle"
        color="neutral"
        :disabled="isSubmitting"
        icon="hugeicons:share-06"
        size="lg"
        class="w-full" />

      <div class="flex items-center justify-between">
        <USwitch
          v-model="form.allow_comment"
          :disabled="isSubmitting"
          label="允许评论" />

        <UButton
          type="submit"
          color="neutral"
          :loading="isSubmitting"
          :disabled="isSubmitting">
          <span v-if="!isSubmitting">
            {{ form.action === "partager" ? "分享互联网" : "发表新贴文" }}
          </span>
          <span v-else>正在发布...</span>
        </UButton>
      </div>

      <UAlert
        v-if="errors.content"
        icon="hugeicons:alert-02"
        color="error"
        variant="soft"
        :title="errors.content"
        class="mt-4" />

      <UAlert
        v-if="globalError"
        icon="hugeicons:alert-02"
        color="error"
        variant="soft"
        :title="globalError"
        class="mt-4" />
    </form>
  </div>
</template>

<script setup lang="ts">
// 表单数据
const form = reactive({
  content: "",
  allow_comment: true, // 默认允许评论
  icon: "",
  action: "dit", // 默认操作是贴文
});

// 表单验证错误
const errors = reactive({
  content: "",
});

// 状态管理
const isSubmitting = ref(false);
const globalError = ref("");

// 表单验证
const validateForm = () => {
  let isValid = true;

  // 重置错误
  errors.content = "";
  globalError.value = "";

  // 验证内容
  if (!form.content.trim()) {
    errors.content = "内容不能为空";
    isValid = false;
  } else if (form.content.length > 10000) {
    errors.content = "内容长度不能超过10000字符";
    isValid = false;
  }

  return isValid;
};

// 提交表单
const handleSubmit = async () => {
  // 表单验证
  if (!validateForm()) {
    return;
  }

  // 设置提交状态
  isSubmitting.value = true;
  globalError.value = "";
  errors.content = "";

  try {
    // 调用后端API
    await $fetch("/api/posts/records", {
      method: "POST",
      body: form,
    });

    form.content = "";
    form.allow_comment = true;
    form.icon = "";
    form.action = "dit";
    // 跳转到首页
    await navigateTo("/");
  } catch (error: any) {
    // 检查是否存在详细字段错误 (由 handlePocketBaseError 转发)
    if (error.data && Object.keys(error.data).length > 0) {
      // 尝试分配给 content 字段
      if (error.data.content) {
        errors.content = error.data.content.message;
      }

      // 如果存在通用错误或未分配的字段错误，则显示在 globalError
      const hasUnassignedError = Object.keys(error.data).some((field) => field !== "content");

      if (error.statusMessage && (hasUnassignedError || errors.content === "")) {
        globalError.value = error.statusMessage + "。请检查字段错误。";
      }
    } else {
      // 捕获通用错误 (未登录 401, 或服务端抛出的 400/500)
      globalError.value = error.statusMessage || "发布失败，请稍后重试";
    }

    console.error("Post Error:", error);
  } finally {
    // 恢复提交状态
    isSubmitting.value = false;
  }
};
</script>
