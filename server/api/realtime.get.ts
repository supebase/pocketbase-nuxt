import { getPocketBase } from '../utils/pocketbase';

export default defineEventHandler(async (event) => {
	// 1. 设置 SSE 标准响应头
	setHeaders(event, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache, no-transform',
		Connection: 'keep-alive',
		'X-Accel-Buffering': 'no', // 禁用 Nginx 缓存，确保实时性
	});

	const query = getQuery(event);
	const collections = typeof query.cols === 'string' ? query.cols.split(',') : ['posts'];

	// 2. 创建事件流
	const eventStream = createEventStream(event);

	// 3. 获取独立的 PB 实例
	// 确保 AuthStore 状态在连接初期是同步的
	const pb = getPocketBase(event);

	// 4. 执行订阅逻辑
	for (const col of collections) {
		try {
			// 开启实时监听
			await pb.collection(col).subscribe(
				'*',
				(data) => {
					// 将 PB 的更新推送给前端
					eventStream.push({
						event: col, // 事件名设为集合名，方便前端区分
						data: JSON.stringify({
							action: data.action, // 'create', 'update', or 'delete'
							record: data.record,
						}),
					});
				},
				{
					expand: 'user',
				}
			);
		} catch (err) {
			console.error(`[SSE] 订阅集合失败: ${col}`, err);
		}
	}

	// 5. 心跳检测 (Keep-alive)
	// 防止云服务商（如 Cloudflare, Vercel）或 Nginx 自动断开长连接
	const timer = setInterval(() => {
		eventStream.push({ event: 'ping', data: Date.now().toString() });
	}, 20000);

	// 6. 清理逻辑：连接关闭时必须取消订阅
	eventStream.onClosed(async () => {
		clearInterval(timer);
		try {
			// 必须取消订阅，否则 PocketBase 服务器会堆积无效连接
			for (const col of collections) {
				await pb.collection(col).unsubscribe('*');
			}
		} catch (e) {
			console.error('[SSE] 取消订阅异常', e);
		}
	});

	return eventStream.send();
});
