import { parseMarkdown } from '@nuxtjs/mdc/runtime';
import type { SinglePostResponse } from '~/types/posts';

export const usePostLogic = async (id: string) => {
    const { updatedMarks, clearUpdateMark } = usePostUpdateTracker();
    const { user: currentUser } = useUserSession();
    const { listen } = usePocketRealtime(['posts']);

    // --- 🔑 关键点 1：在 await 之前注册生命周期 ---
    if (import.meta.client) {
        onMounted(() => {
            listen(({ collection, action, record }) => {
                // 此时 data 已经在闭包中，等到异步请求完成后，这里就能正常工作
                if (collection === 'posts' && record.id === id && action === 'update') {
                    if (data.value && data.value.data) {
                        data.value = {
                            ...data.value,
                            data: { ...data.value.data, views: record.views }
                        };
                    }
                }
            });
        });
    }

    // --- 🔑 关键点 2：第一个 await 放在钩子注册之后 ---
    const { data, status, refresh, error } = await useLazyFetch<SinglePostResponse>(
        () => `/api/collections/post/${id}`,
        {
            key: `post-detail-${id}`,
            server: true,
            query: { userId: computed(() => currentUser.value?.id) },
        }
    );

    // --- 后续逻辑保持不变 ---
    const mdcReady = ref(false);
    const ast = ref<any>(null);
    const toc = ref<any>(null);
    const isUpdateRefresh = ref(false);

    const postWithRelativeTime = computed(() => {
        const postData = data.value?.data;
        if (!postData) return null;
        return {
            ...postData,
            relativeTime: useRelativeTime(postData.created),
        };
    });

    const parseContent = async (content: string) => {
        if (!content) { mdcReady.value = true; return; }
        const fallback = setTimeout(() => { if (!mdcReady.value) mdcReady.value = true; }, 3000);
        try {
            const result = await parseMarkdown(content, { toc: { depth: 4, searchDepth: 4 } });
            ast.value = result;
            toc.value = result.toc;
            if (import.meta.client) {
                nextTick(() => {
                    setTimeout(() => {
                        mdcReady.value = true;
                        isUpdateRefresh.value = false;
                        clearTimeout(fallback);
                    }, 1000); // 稍微给点延迟
                });
            } else { mdcReady.value = true; }
        } catch (e) {
            console.error('MDC 渲染错误:', e);
            mdcReady.value = true;
            clearTimeout(fallback);
        }
    };

    return {
        postWithRelativeTime, status, error, refresh,
        mdcReady, ast, toc, isUpdateRefresh,
        parseContent, updatedMarks, clearUpdateMark
    };
};