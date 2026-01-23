<template>
  <div class="mt-4">
    <UForm :state="formState" @submit="handleAuth" class="flex flex-col gap-4">
      <UInput
        v-model="email"
        id="email"
        placeholder="电子邮件"
        color="neutral"
        :disabled="loading"
        icon="i-hugeicons:at"
        size="xl"
        class="w-full"
      />

      <UInput
        v-model="password"
        id="password"
        placeholder="登录密码"
        :color="isLoginMode ? 'neutral' : color"
        :disabled="loading"
        icon="i-hugeicons:lock-key"
        size="xl"
        class="w-full"
        :type="showPassword ? 'text' : 'password'"
        :ui="{ trailing: 'pe-1' }"
      >
        <template #trailing>
          <UButton
            tabindex="-1"
            color="neutral"
            variant="link"
            class="cursor-pointer"
            :icon="showPassword ? 'i-hugeicons:view' : 'i-hugeicons:view-off'"
            :aria-label="showPassword ? '隐藏密码' : '显示密码'"
            :aria-pressed="showPassword"
            aria-controls="password"
            @click="togglePasswordVisibility"
          />
        </template>
      </UInput>

      <div v-if="!isLoginMode">
        <ul class="space-y-2 ml-4.25">
          <li
            v-for="(req, index) in strength"
            :key="index"
            class="flex items-center gap-3"
            :class="req.met ? 'text-success' : 'text-dimmed'"
          >
            <UIcon :name="req.met ? 'i-hugeicons:checkmark-circle-03' : 'i-hugeicons:circle'" class="size-4 shrink-0" />
            <span class="text-xs text-dimmed tabular-nums">
              {{ req.text }}
            </span>
          </li>
        </ul>
      </div>

      <UInput
        v-if="!isLoginMode"
        v-model="passwordConfirm"
        id="passwordConfirm"
        placeholder="确认密码"
        color="neutral"
        :disabled="loading"
        icon="i-hugeicons:square-lock-check-01"
        size="xl"
        class="w-full"
        :type="showPasswordConfirm ? 'text' : 'password'"
        :ui="{ trailing: 'pe-1' }"
      >
        <template #trailing>
          <UButton
            tabindex="-1"
            color="neutral"
            variant="link"
            class="cursor-pointer"
            :icon="showPasswordConfirm ? 'i-hugeicons:view' : 'i-hugeicons:view-off'"
            :aria-label="showPasswordConfirm ? '隐藏密码' : '显示密码'"
            :aria-pressed="showPasswordConfirm"
            aria-controls="passwordConfirm"
            @click="togglePasswordConfirmVisibility"
          />
        </template>
      </UInput>

      <UButton
        type="submit"
        loading-auto
        :label="buttonLabel"
        color="neutral"
        size="xl"
        block
        class="mt-1 cursor-pointer"
      />
    </UForm>

    <USeparator type="dashed" label="或者" class="my-5" />

    <UButton type="button" variant="soft" label="返回首页" color="neutral" size="xl" block to="/" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isLoginMode: boolean;
}>();

const emit = defineEmits<{
  'update:error': [val: string | null];
}>();

// 1. 引入 Auth 逻辑
const { email, password, passwordConfirm, loading, error, strength, color, handleAuth, fetchGeo } = useAuth(
  toRef(props, 'isLoginMode'),
);

// 2. 密码可见性逻辑 (保持原始自定义组合函数)
const { isVisible: showPassword, toggleVisibility: togglePasswordVisibility } = usePasswordVisibility();

const { isVisible: showPasswordConfirm, toggleVisibility: togglePasswordConfirmVisibility } = usePasswordVisibility();

// 3. 这里的 formState 主要是给 UForm 的 state 绑定的
const formState = computed(() => ({
  email: email.value,
  password: password.value,
  passwordConfirm: passwordConfirm.value,
}));

const buttonLabel = computed(() => {
  if (loading.value) return props.isLoginMode ? '正在验证身份' : '正在创建并登录';
  return props.isLoginMode ? '登录账户' : '创建新账户';
});

watch(error, (newVal) => {
  emit('update:error', newVal || null);
});

defineExpose({
  clearError: () => {
    error.value = null;
  },
});

// 4. 初始化
onMounted(() => {
  if (!props.isLoginMode) {
    fetchGeo();
  }
});

const resetForm = () => {
  email.value = '';
  password.value = '';
  passwordConfirm.value = '';
  error.value = null;
};

onDeactivated(() => {
  resetForm();
});
</script>
