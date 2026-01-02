import { watchDebounced } from '@vueuse/core';

export const useEditorLogic = (initialContent: string = '') => {
	const showPreview = ref(false);
	const showPreviewContent = ref(false);
	const debouncedContent = ref(initialContent);
	const isDesktop = ref(false);
	const activeElement = ref<'editor' | 'preview' | null>(null);

	// DOM 引用
	const editorRef = ref<any>(null);
	const previewContainer = ref<HTMLElement | null>(null);

	// 获取真正的 textarea
	const getTextArea = () => editorRef.value?.$el?.querySelector('textarea') as HTMLTextAreaElement;

	// 同步滚动核心算法
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

	const togglePreview = async (val: boolean | 'indeterminate') => {
		const isChecked = val === true;

		if (isChecked) {
			showPreview.value = true;
			setTimeout(() => {
				showPreviewContent.value = true;
			}, 400);
		} else {
			showPreviewContent.value = false;
			setTimeout(() => {
				showPreview.value = false;
			}, 300);
		}
	};

	// 初始化内容监听
	const setupContentWatch = (contentSource: () => string) => {
		watchDebounced(
			contentSource,
			(newVal) => {
				debouncedContent.value = newVal;
			},
			{ debounce: 300 }
		);
	};

	// 绑定编辑器滚动
	const bindEditorScroll = () => {
		const textarea = getTextArea();

		if (textarea) {
			// 先移除防止重复绑定
			textarea.removeEventListener('scroll', onEditorScroll);
			textarea.addEventListener('scroll', onEditorScroll, { passive: true });
		}
	};

	// 绑定预览区滚动 (关键：因为预览区是 v-if 动态生成的)
	const bindPreviewScroll = () => {
		if (previewContainer.value) {
			previewContainer.value.removeEventListener('scroll', onPreviewScroll);
			previewContainer.value.addEventListener('scroll', onPreviewScroll, { passive: true });
		}
	};

	// 监听 showPreview 的变化，当变为 true 时，等待 DOM 更新后绑定
	watch(showPreview, async (newVal) => {
		if (newVal) {
			await nextTick(); // 等待 v-if 渲染 DOM
			bindPreviewScroll();
		}
	});

	onMounted(async () => {
		isDesktop.value = window.matchMedia('(hover: hover)').matches;

		// 等待一轮 tick，确保 NuxtUI 组件内部的 $el 已经挂载
		await nextTick();
		bindEditorScroll();
	});

	// 养成良好习惯：组件销毁时移除监听
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
		getTextArea,
	};
};
