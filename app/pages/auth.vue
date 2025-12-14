<template>
  <div class="auth-container">
    <h2>{{ isLoginMode ? "用户登录" : "用户注册" }}</h2>
    <p
      v-if="error"
      style="color: red">
      {{ error }}
    </p>

    <form @submit.prevent="handleAuth">
      <input
        v-model="email"
        type="email"
        placeholder="邮箱"
        required />
      <input
        v-model="password"
        type="password"
        placeholder="密码"
        required />

      <template v-if="!isLoginMode">
        <input
          v-model="passwordConfirm"
          type="password"
          placeholder="确认密码"
          required />
      </template>

      <button
        type="submit"
        :disabled="loading">
        {{ loading ? "处理中..." : isLoginMode ? "登录" : "注册" }}
      </button>
    </form>

    <p>
      {{ isLoginMode ? "还没有账号？" : "已有账号？" }}
      <a
        href="#"
        @click.prevent="isLoginMode = !isLoginMode">
        {{ isLoginMode ? "去注册" : "去登录" }}
      </a>
    </p>
  </div>
</template>

<script setup lang="ts">
const { fetch: fetchSession } = useUserSession();

const isLoginMode = ref(true);
const email = ref("");
const password = ref("");
const passwordConfirm = ref("");
const loading = ref(false);
const error = ref("");

async function handleAuth() {
  loading.value = true;
  error.value = "";

  const endpoint = isLoginMode.value ? "/api/auth/login" : "/api/auth/register";

  try {
    const body = isLoginMode.value
      ? { email: email.value, password: password.value }
      : {
          email: email.value,
          password: password.value,
          passwordConfirm: passwordConfirm.value,
        };

    // 使用 $fetch 调用 SSR API 路由
    await $fetch(endpoint, {
      method: "POST",
      body,
    });

    // 登录/注册成功后，立即调用 navigateTo 进行跳转
    await fetchSession();
    await navigateTo("/");
  } catch (err: any) {
    // 捕获 SSR 路由中 throw createError 抛出的错误
    error.value = err.data?.statusMessage || "An unknown error occurred.";
    console.error("Auth Error:", err);
  } finally {
    loading.value = false;
  }
}
</script>
