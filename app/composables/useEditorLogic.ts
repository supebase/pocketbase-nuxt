import { watchDebounced } from '@vueuse/core';

export const useEditorLogic = () => {
    const showPreview = ref(false);
    const showPreviewContent = ref(false);
    const debouncedContent = ref('');
    const isDesktop = ref(false);
    const activeElement = ref<'editor' | 'preview' | null>(null);

    const editorRef = ref<any>(null);
    const previewContainer = ref<HTMLElement | null>(null);

    const getTextArea = () => editorRef.value?.$el?.querySelector('textarea') as HTMLTextAreaElement;

    const syncScroll = (source: HTMLElement, target: HTMLElement, type: 'editor' | 'preview') => {
        if (activeElement.value !== type) return;
        window.requestAnimationFrame(() => {
            const sourceMax = source.scrollHeight - source.clientHeight;
            const targetMax = target.scrollHeight - target.clientHeight;
            if (sourceMax <= 0 || targetMax <= 0) return;
            const percentage = source.scrollTop / sourceMax;
            const targetScrollTop = percentage * targetMax;
            if (Math.abs(target.scrollTop - targetScrollTop) > 1) {
                target.scrollTop = targetScrollTop;
            }
        });
    };

    const onEditorScroll = (e: Event) => {
        if (previewContainer.value && showPreview.value) {
            syncScroll(e.target as HTMLElement, previewContainer.value, 'editor');
        }
    };

    const onPreviewScroll = (e: Event) => {
        const textarea = getTextArea();
        if (textarea && showPreview.value) {
            syncScroll(e.target as HTMLElement, textarea, 'preview');
        }
    };

    const togglePreview = (val: any) => {
        const isChecked = val === true;
        if (isChecked) {
            showPreview.value = true;
            setTimeout(() => (showPreviewContent.value = true), 400);
        } else {
            showPreviewContent.value = false;
            setTimeout(() => (showPreview.value = false), 300);
        }
    };

    const setupContentWatch = (contentSource: () => string) => {
        watchDebounced(contentSource, (newVal) => {
            debouncedContent.value = newVal;
        }, { debounce: 300, immediate: true });
    };

    // 内部自动管理监听
    watch([showPreview, editorRef], async ([previewVisible, editorReady]) => {
        await nextTick();
        const textarea = getTextArea();
        if (textarea) {
            textarea.removeEventListener('scroll', onEditorScroll);
            textarea.addEventListener('scroll', onEditorScroll, { passive: true });
        }
        if (previewVisible && previewContainer.value) {
            previewContainer.value.removeEventListener('scroll', onPreviewScroll);
            previewContainer.value.addEventListener('scroll', onPreviewScroll, { passive: true });
        }
    });

    onMounted(() => {
        isDesktop.value = window.matchMedia('(hover: hover)').matches;
    });

    onUnmounted(() => {
        const textarea = getTextArea();
        if (textarea) textarea.removeEventListener('scroll', onEditorScroll);
        if (previewContainer.value) {
            previewContainer.value.removeEventListener('scroll', onPreviewScroll);
        }
    });

    return {
        showPreview,
        showPreviewContent,
        debouncedContent,
        isDesktop,
        activeElement,
        editorRef,
        previewContainer,
        togglePreview,
        onPreviewScroll,
        setupContentWatch,
    };
};