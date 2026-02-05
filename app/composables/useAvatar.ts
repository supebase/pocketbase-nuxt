export interface GravatarOptions {
  size?: number;
  rank?: string;
}

export function useAvatar(
  avatarIdSource: MaybeRefOrGetter<string | undefined | null>,
  avatarGithubSource: MaybeRefOrGetter<string | undefined | null>,
  userIdSource: MaybeRefOrGetter<string | undefined | null>,
  options: GravatarOptions = {},
) {
  const { size = 64, rank = 'G' } = options;
  const { getUserAvatar } = useAssets();

  // 如果初始就有 ID，则默认为加载中
  const isLoading = ref(!!toValue(avatarIdSource));
  const hasError = ref(false);

  const avatarUrl = computed(() => {
    const githubUrl = toValue(avatarGithubSource);
    const userId = toValue(userIdSource);
    // 如果有 GitHub 头像，直接用它
    if (githubUrl && userId) return getUserAvatar(userId, githubUrl);

    const id = toValue(avatarIdSource);
    // 使用 cn.cravatar.com 镜像源
    return id ? `https://cn.cravatar.com/avatar/${id}?s=${size}&r=${rank}` : '';
  });

  // 监听 ID 变化，重置状态
  watch(
    [() => toValue(avatarIdSource), () => toValue(avatarGithubSource), () => toValue(userIdSource)],
    ([newId, newFile, newUid]) => {
      if (newId || (newFile && newUid)) {
        isLoading.value = true;
        hasError.value = false;
      } else {
        isLoading.value = false;
        hasError.value = false;
      }
    },
  );

  const handleLoad = () => {
    isLoading.value = false;
    hasError.value = false;
  };

  const handleError = () => {
    isLoading.value = false;
    hasError.value = true;
  };

  return { avatarUrl, isLoading, hasError, handleLoad, handleError };
}
