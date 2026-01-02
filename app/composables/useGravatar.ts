export interface GravatarOptions {
	size?: number;
	rank?: string;
}

export function useGravatar(
	avatarIdSource: MaybeRefOrGetter<string | undefined | null>,
	options: GravatarOptions = {}
) {
	const { size = 64, rank = 'G' } = options;

	// 如果初始就有 ID，则默认为加载中
	const isLoading = ref(!!toValue(avatarIdSource));
	const hasError = ref(false);

	const avatarUrl = computed(() => {
		const id = toValue(avatarIdSource);
		// 使用 gravatar.loli.net 镜像源
		return id ? `https://gravatar.loli.net/avatar/${id}?s=${size}&r=${rank}` : '';
	});

	// 监听 ID 变化，重置状态
	watch(
		() => toValue(avatarIdSource),
		(newId) => {
			if (newId) {
				isLoading.value = true;
				hasError.value = false;
			} else {
				isLoading.value = false;
				hasError.value = false;
			}
		}
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
