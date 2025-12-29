<template>
  <div class="mt-4">
    <UForm :state="formState" @submit="handleAuth" class="flex flex-col gap-4">
      <UInput v-model="email" id="email" placeholder="电子邮件" color="neutral" :disabled="loading"
        icon="i-hugeicons:at" size="xl" class="w-full" />

      <UInput v-model="password" id="password" placeholder="登录密码"
        :color="isLoginMode ? 'neutral' : color" :disabled="loading" icon="i-hugeicons:lock-key"
        size="xl" class="w-full" :type="showPassword ? 'text' : 'password'"
        :ui="{ trailing: 'pe-1' }">
        <template #trailing>
          <UButton tabindex="-1" color="neutral" variant="link" class="cursor-pointer"
            :icon="showPassword ? 'i-hugeicons:view' : 'i-hugeicons:view-off'"
            :aria-label="showPassword ? '隐藏密码' : '显示密码'" :aria-pressed="showPassword"
            aria-controls="password" @click="togglePasswordVisibility" />
        </template>
      </UInput>

      <div v-if="!isLoginMode">
        <ul class="space-y-2 ml-3.25">
          <li v-for="(req, index) in strength" :key="index" class="flex items-center gap-1"
            :class="req.met ? 'text-primary' : 'text-dimmed'">
            <UIcon :name="req.met ? 'i-hugeicons:checkmark-circle-03' : 'i-hugeicons:circle'"
              class="size-4 shrink-0" />
            <span class="text-xs text-dimmed tabular-nums">
              {{ req.text }}
            </span>
          </li>
        </ul>
      </div>

      <UInput v-if="!isLoginMode" v-model="passwordConfirm" id="passwordConfirm" placeholder="确认密码"
        color="neutral" :disabled="loading" icon="i-hugeicons:square-lock-check-01" size="xl"
        class="w-full" :type="showPasswordConfirm ? 'text' : 'password'" :ui="{ trailing: 'pe-1' }">
        <template #trailing>
          <UButton tabindex="-1" color="neutral" variant="link" class="cursor-pointer"
            :icon="showPasswordConfirm ? 'i-hugeicons:view' : 'i-hugeicons:view-off'"
            :aria-label="showPasswordConfirm ? '隐藏密码' : '显示密码'" :aria-pressed="showPasswordConfirm"
            aria-controls="passwordConfirm" @click="togglePasswordConfirmVisibility" />
        </template>
      </UInput>

      <UButton type="submit" loading-auto :label="buttonLabel" color="neutral" size="xl" block
        class="mt-1 cursor-pointer" />
    </UForm>

    <USeparator type="dashed" label="或者" class="my-5" />

    <UButton type="button" variant="soft" label="返回首页" color="neutral" size="xl" block to="/" />

    <UAlert v-if="error" icon="i-hugeicons:alert-02" color="error" variant="soft"
      :description="error" class="mt-4" />
  </div>
</template>

<script setup lang="ts">
const { fetch: fetchSession } = useUserSession();
const { locationData, fetchGeo } = useGeoLocation();
const toast = useToast();

const props = defineProps<{
  isLoginMode: boolean;
}>();

// 状态
const email = ref('');
const password = ref('');
const passwordConfirm = ref('');
const loading = ref(false);
const error = ref('');

// 使用密码显示/隐藏组合式函数
const { isVisible: showPassword, toggleVisibility: togglePasswordVisibility } =
  usePasswordVisibility();
const { isVisible: showPasswordConfirm, toggleVisibility: togglePasswordConfirmVisibility } =
  usePasswordVisibility();

// 计算属性
const formState = computed(() => ({
  email: email.value,
  password: password.value,
  passwordConfirm: passwordConfirm.value,
}));

const buttonLabel = computed(() => {
  if (loading.value) return props.isLoginMode ? '正在验证身份' : '正在创建并登录';
  return props.isLoginMode ? '登录账户' : '创建新账户';
});

// 处理表单提交的函数
async function handleAuth() {
  loading.value = true;
  error.value = '';

  // 1. 前端验证
  if (!email.value || !password.value) {
    error.value = '请输入电子邮件和登录密码';
    loading.value = false;
    return;
  }

  if (!props.isLoginMode && password.value !== passwordConfirm.value) {
    error.value = '两次输入的密码不一致';
    loading.value = false;
    return;
  }

  // 2. API 调用
  const endpoint = props.isLoginMode ? '/api/auth/login' : '/api/auth/register';

  try {
    const body = props.isLoginMode
      ? { email: email.value, password: password.value }
      : {
        email: email.value,
        password: password.value,
        passwordConfirm: passwordConfirm.value,
        location: locationData.value.location,
      };

    // 使用 $fetch 发起认证请求
    await $fetch<any>(endpoint, {
      method: 'POST',
      body,
    });

    /**
     * 💡 关键点：手动触发 PB 客户端同步
     * 虽然后端通过 Set-Cookie 发送了 pb_auth，但在单页应用中，
     * 调用这个方法可以强制 $pb.authStore 重新从 Cookie 中加载状态，
     * 确保后续的实时订阅 (Realtime) 立即拥有权限。
     */
    const { $pb } = useNuxtApp();
    if (import.meta.client) {
      $pb.authStore.loadFromCookie(document.cookie);
    }

    // 刷新 Nuxt Session (nuxt-auth-utils)
    await fetchSession();

    toast.add({
      title: props.isLoginMode ? "登录成功" : "创建成功",
      description: props.isLoginMode ? `欢迎回来，${email.value}` : "您已成功创建账户并登录",
      icon: "i-hugeicons:checkmark-circle-03",
      color: "success",
    });

    email.value = '';
    password.value = '';
    passwordConfirm.value = '';

    // 成功后跳转
    const route = useRoute();
    let redirectPath = (route.query.redirect as string) || '/';

    // 安全检查：确保是内部路径，防止外部钓鱼链接
    if (!redirectPath.startsWith('/') || redirectPath.includes('//')) {
      redirectPath = '/';
    }

    // 6. 执行跳转
    await navigateTo(redirectPath, { replace: true });
  } catch (err: any) {
    // 1. 优先读取 err.data.message (这是我们后端 handlePocketBaseError 传回的友好中文)
    if (err.data?.message) {
      error.value = err.data.message;
    }
    // 2. 如果没有 data.message，尝试读取外层的 err.message
    else if (err.message) {
      // 这里的 err.message 可能是 Nuxt 自动生成的，也可能是网络错误
      error.value = err.message.includes('fetch') ? '无法连接到服务器，请检查网络' : err.message;
    }
    // 3. 最后兜底
    else {
      error.value = '发生未知错误，请稍后再试';
    }

    console.error('Auth Error Details:', {
      status: err.statusCode,
      message: err.message,
      data: err.data,
    });
  } finally {
    loading.value = false;
  }
}

// 密码强度相关计算
const strength = computed(() => checkPasswordStrength(password.value));
const score = computed(() => calculatePasswordScore(strength.value));
const color = computed(() => getPasswordStrengthColor(score.value));

onMounted(() => {
  if (!props.isLoginMode) {
    fetchGeo();
  }
});
</script>
