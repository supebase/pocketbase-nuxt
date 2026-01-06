<template>
  <main class="min-h-screen flex items-center justify-center px-6">
    <div class="text-center max-w-sm">
      <div class="text-6xl font-black mb-4">{{ error?.statusCode }}</div>

      <h1 class="text-2xl text-muted font-extrabold mb-3">
        {{ error?.statusCode === 404 ? '页面不见了' : '出错了' }}
      </h1>

      <p class="text-sm text-dimmed mb-8">
        {{ error?.message || '服务器开小差了，请稍后再试' }}
      </p>

      <UButton variant="solid" color="neutral" size="lg" @click="handleError">
        返回首页
      </UButton>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app';

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
