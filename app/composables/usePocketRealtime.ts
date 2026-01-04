export const usePocketRealtime = (collections: string[]) => {
	const eventSource = ref<EventSource | null>(null);
	const status = ref<'connecting' | 'online' | 'offline'>('offline');
	let retryCount = 0;
	let retryTimer: NodeJS.Timeout | null = null;

	const listen = (
		callback: (payload: { collection: string; action: string; record: any }) => void
	) => {
		if (import.meta.server) return;

		const connect = () => {
			// 清理旧连接和定时器
			if (eventSource.value) {
				eventSource.value.close();
			}
			if (retryTimer) {
				clearTimeout(retryTimer);
			}

			status.value = 'connecting';
			const colsParam = collections.join(',');

			// 建立连接
			const es = new EventSource(`/api/realtime?cols=${colsParam}`, {
				withCredentials: true,
			});

			// 连接成功钩子
			es.onopen = () => {
				// console.log('[SSE] 连接成功');
				status.value = 'online';
				retryCount = 0; // 重置重试计数
			};

			// 订阅各集合事件
			collections.forEach((col) => {
				es.addEventListener(col, (event: MessageEvent) => {
					try {
						const data = JSON.parse(event.data);

						if (data && data.record) {
							callback({
								collection: col,
								action: data.action,
								record: data.record,
							});
						}
					} catch (e) {
						console.error(`[SSE] 解析 ${col} 数据失败:`, e);
					}
				});
			});

			// 核心修复：错误处理与重连逻辑
			es.onerror = (err) => {
				console.error('[SSE] 连接断开或发生错误');
				status.value = 'offline';
				es.close();

				// 指数退避算法: 1s, 2s, 4s, 8s, 16s, 最大 30s
				const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);

				console.log(`[SSE] 将在 ${delay}ms 后尝试第 ${retryCount + 1} 次重连...`);

				retryTimer = setTimeout(() => {
					retryCount++;
					connect();
				}, delay);
			};

			eventSource.value = es;
		};

		connect();
	};

	// 组件卸载时彻底关闭
	onUnmounted(() => {
		if (retryTimer) clearTimeout(retryTimer);

		if (eventSource.value) {
			eventSource.value.close();
			eventSource.value = null;
		}
	});

	return { listen, status };
};