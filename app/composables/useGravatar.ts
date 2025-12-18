export interface GravatarOptions {
    size?: number;
    rank?: string;
}

export function useGravatar(avatarIdSource: MaybeRefOrGetter<string | undefined | null>, options: GravatarOptions = {}) {
    const { size = 64, rank = 'G' } = options;
    const isLoading = ref(false); // 默认为 false，由 watch 决定何时开启
    const hasError = ref(false);

    const avatarUrl = computed(() => {
        const id = toValue(avatarIdSource);
        return id ? `https://gravatar.loli.net/avatar/${id}?s=${size}&r=${rank}` : '';
    });

    watch(() => toValue(avatarIdSource), (newId) => {
        if (newId) {
            isLoading.value = true;
            hasError.value = false;
        } else {
            isLoading.value = false;
        }
    }, { immediate: true });

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