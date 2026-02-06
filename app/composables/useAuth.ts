export const useAuth = (isLoginModeArg?: Ref<boolean>) => {
  const { fetch: fetchSession } = useUserSession();
  const { locationData, fetchGeo } = useGeoLocation();
  const toast = useToast();
  const route = useRoute();

  // --- 1. 状态管理 ---
  const email = ref('');
  const password = ref('');
  const passwordConfirm = ref('');
  const loading = ref(false);
  const githubLoading = ref(false);
  const isLoggingOut = ref(false);

  const error = ref<string | null>(null);

  const isLoginMode = isLoginModeArg || ref(true);

  watch(isLoginMode, () => {
    error.value = null;
    passwordConfirm.value = '';
  });

  // --- 2. 密码强度计算 ---
  const strength = computed(() => checkPasswordStrength(password.value));
  const score = computed(() => calculatePasswordScore(strength.value));
  const color = computed(() => getPasswordStrengthColor(score.value));

  // --- 3. 登录与注册逻辑 ---
  const handleAuth = async () => {
    loading.value = true;
    error.value = null;

    if (!isLoginMode.value && !locationData.value?.location) {
      await fetchGeo();
    }

    if (isEmptyString(email.value) || isEmptyString(password.value)) {
      error.value = '请输入电子邮件和登录密码';
      loading.value = false;
      return;
    }

    if (!isValidEmail(email.value)) {
      error.value = '请输入有效的电子邮件地址';
      loading.value = false;
      return;
    }

    if (!isLoginMode.value) {
      // 密码长度校验 (例如 PB 默认通常是 8 位)
      if (!isValidPasswordLength(password.value, 8)) {
        error.value = '密码长度至少需要 8 个字符';
        loading.value = false;
        return;
      }

      // 密码一致性校验
      if (!doPasswordsMatch(password.value, passwordConfirm.value)) {
        error.value = '两次输入的密码不一致';
        loading.value = false;
        return;
      }
    }

    const endpoint = isLoginMode.value ? '/api/auth/login' : '/api/auth/register';

    try {
      const body = {
        email: email.value,
        password: password.value,
        ...(isLoginMode.value
          ? {}
          : {
              passwordConfirm: passwordConfirm.value,
              location: locationData.value?.location,
            }),
      };

      await $fetch<any>(endpoint, { method: 'POST', body });
      await fetchSession();

      toast.add({
        title: isLoginMode.value ? '登录成功' : '创建成功',
        description: isLoginMode.value ? `欢迎回来，${email.value}` : '您已成功创建账户并登录',
        icon: 'i-hugeicons:checkmark-circle-03',
        color: 'success',
      });

      email.value = '';
      password.value = '';
      passwordConfirm.value = '';

      let redirectPath = (route.query.redirect as string) || '/';

      if (!redirectPath.startsWith('/') || redirectPath.includes('//')) {
        redirectPath = '/';
      }

      await navigateTo(redirectPath, { replace: true });
    } catch (err: any) {
      error.value = err.data?.message || err.message || '服务器响应异常';
    } finally {
      loading.value = false;
    }
  };

  // --- 4. 登出逻辑 ---
  const handleLogout = async () => {
    if (isLoggingOut.value) return;

    isLoggingOut.value = true;

    try {
      await $fetch('/api/auth/logout', { method: 'POST' });
      await new Promise((resolve) => setTimeout(resolve, 500));
      await fetchSession();

      toast.add({
        title: '退出成功',
        description: '您已成功退出账户',
        icon: 'i-hugeicons:checkmark-circle-03',
        color: 'info',
      });

      await navigateTo(
        {
          path: '/auth',
          query: { redirect: route.fullPath },
        },
        { replace: true },
      );
    } catch (err: any) {
      toast.add({
        title: '退出失败',
        description: err.data?.message || '服务器连接异常',
        icon: 'i-hugeicons:alert-02',
        color: 'error',
      });
    } finally {
      isLoggingOut.value = false;
    }
  };

  const loginWithGithub = () => {
    githubLoading.value = true;
    error.value = null;
    window.location.href = '/api/auth/github';
  };

  return {
    email,
    password,
    passwordConfirm,
    loading,
    githubLoading,
    isLoggingOut,
    error,
    strength,
    color,
    handleAuth,
    handleLogout,
    fetchGeo,
    loginWithGithub,
  };
};
