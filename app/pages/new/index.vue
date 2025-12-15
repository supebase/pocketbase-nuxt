<template>
  <div class="post-create-container">
    <h1 class="title">发表文章</h1>

    <form
      @submit.prevent="handleSubmit"
      class="post-form">
      <!-- 内容输入区域 -->
      <div class="form-group">
        <label
          for="content"
          class="form-label"
          >文章内容</label
        >
        <textarea
          id="content"
          v-model="form.content"
          :disabled="isSubmitting"
          placeholder="请输入文章内容"
          rows="10"
          class="form-textarea"></textarea>
        <div
          v-if="errors.content"
          class="error-message">
          {{ errors.content }}
        </div>
      </div>

      <!-- 允许评论复选框 -->
      <div class="form-group checkbox-group">
        <input
          type="checkbox"
          id="allow_comment"
          v-model="form.allow_comment"
          :disabled="isSubmitting"
          class="form-checkbox" />
        <label
          for="allow_comment"
          class="checkbox-label"
          >允许评论</label
        >
      </div>

      <!-- 提交按钮和加载状态 -->
      <div class="form-actions">
        <button
          type="submit"
          :disabled="isSubmitting"
          class="submit-button">
          <span v-if="!isSubmitting">发布文章</span>
          <span v-else>发布中...</span>
        </button>
      </div>

      <!-- 全局错误提示 -->
      <div
        v-if="globalError"
        class="global-error">
        {{ globalError }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
// 表单数据
const form = reactive({
  content: "",
  allow_comment: true, // 默认允许评论
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
