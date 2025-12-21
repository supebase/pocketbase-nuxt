<template>
  <main
    class="min-h-screen flex items-center justify-center px-6"
    role="main"
    aria-labelledby="error-title"
  >
    <div class="text-center max-w-sm">
      <div class="text-6xl font-black mb-4">
        {{ error?.statusCode }}
      </div>

      <h1 id="error-title" class="text-2xl text-muted font-extrabold mb-3">
        {{ error?.data }}
      </h1>

      <p class="text-sm text-dimmed mb-8" role="alert">
        {{ error?.message }}
      </p>

      <UButton
        variant="solid"
        color="neutral"
        size="lg"
        @click="handleError"
        class="cursor-pointer"
      >
        返回首页
      </UButton>
    </div>
  </main>
</template>

<script setup lang="ts">
  import type { NuxtError } from '#app';

  // 定义属性
  const props = defineProps<{
    error: NuxtError;
  }>();

  /**
   * 清除错误并重定向
   * clearError 是 Nuxt 内置函数，用于重置应用状态
   */
  const handleError = () => {
    clearError({ redirect: '/' });
  };
</script>
