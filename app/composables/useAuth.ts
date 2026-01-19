export const useAuth = (isLoginModeArg?: Ref<boolean>) => {
  const { fetch: fetchSession } = useUserSession();
  const { locationData, fetchGeo } = useGeoLocation();
  const toast = useToast();
  const route = useRoute();

  // --- 1. 状态管理 ---
  const email = ref('');
  const password = ref('');
  const passwordConfirm = ref('');
  const loading = ref(false); // 用于登录/注册
  const isLoggingOut = ref(false); // 用于登出

  const error = ref('');

  const isLoginMode = isLoginModeArg || ref(true);

  watch(isLoginMode, () => {
    error.value = '';
    passwordConfirm.value = '';
  });

  // --- 2. 密码强度计算 ---
  const strength = computed(() => checkPasswordStrength(password.value));
  const score = computed(() => calculatePasswordScore(strength.value));
  const color = computed(() => getPasswordStrengthColor(score.value));

  // --- 3. 登录与注册逻辑 ---
  const handleAuth = async () => {
    loading.value = true;
    error.value = '';

    if (!isLoginMode.value && !locationData.value?.location) {
      await fetchGeo(); // 如果注册时没拿到位置，尝试补抓一次
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

      // 如果你将来想在控制台调试原始字段数据，可以保留这个，但不要赋给 error.value
      // if (err.data?.data?.fields) {
      // 	console.warn('[Field Validation Errors]:', err.data.data.fields);
      // }
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
      await fetchSession();

      toast.add({
        title: '退出成功',
        description: '您已成功退出账户',
        icon: 'i-hugeicons:checkmark-circle-03',
        color: 'info',
      });

      await new Promise((resolve) => setTimeout(resolve, 400));

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

  return {
    email,
    password,
    passwordConfirm,
    loading,
    isLoggingOut,
    error,
    strength,
    color,
    handleAuth,
    handleLogout,
    fetchGeo,
  };
};
