export default defineEventHandler((event) => {
	// 获取真实客户端 IP
	const ip = getRequestIP(event, { xForwardedFor: true }) || '未知 IP';
	return { ip };
});
