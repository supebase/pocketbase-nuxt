/**
 * @file 文章相关的服务层 (Posts Service)
 * @description 负责封装与 PocketBase 数据库 `posts` 集合相关的所有数据操作（CRUD）。
 *              该文件遵循“依赖注入”的设计模式，所有函数都接收一个 PocketBase 实例作为参数，
 *              以确保操作的上下文（特别是用户认证状态）由调用方（API 路由）决定。
 */
import { ensureOwnership } from '~~/server/utils/auth';
import type { PostsResponse as PBPostsResponse, TypedPocketBase } from '~/types/pocketbase-types';
import type { PostExpand } from '~/types/posts';
import { processMarkdownImages } from '~~/server/utils/markdown';
import { sanitizePostContent } from '~~/server/utils/sanitize';

/**
 * 获取文章列表（支持搜索和分页）。
 * @param pb 由 API 路由层传入的、与当前请求上下文绑定的 PocketBase 实例。
 * @param page 要获取的页码，默认为 1。
 * @param perPage 每页的项目数量，默认为 10。
 * @param query 可选的搜索关键词，用于过滤文章标题或内容。
 * @returns 返回一个分页后的文章列表。
 */
export async function getPostsList(pb: TypedPocketBase, page: number = 1, perPage: number = 10, query?: string) {
	// 1. 基础权限过滤：所有人可见已发布的
	// 或者 (未发布 且 作者是自己)
	let filterString = '(published = true';
	const currentUser = pb.authStore.record;

	if (currentUser) {
		// 如果用户已登录，增加“可见自己草稿”的逻辑
		filterString += ` || (published = false && user = "${currentUser.id}")`;
	}
	filterString += ')';

	// 2. 关键词搜索逻辑
	if (query) {
		// 使用 pb.filter 防止注入，并将搜索逻辑与权限逻辑用 && 连接
		const searchQuery = pb.filter('content ~ {:q}', { q: query });
		filterString = `(${filterString} && ${searchQuery})`;
	}

	const options: any = {
		sort: '-created',
		expand: 'user',
		filter: filterString,
	};

	return await pb.collection('posts').getList<PBPostsResponse<PostExpand>>(page, perPage, options);
}

/**
 * 根据 ID 获取单篇文章的详情。
 * @param pb 与当前请求上下文绑定的 PocketBase 实例。
 * @param postId 要获取的文章的唯一 ID。
 * @returns 返回找到的文章记录。
 */
export async function getPostById(pb: TypedPocketBase, postId: string) {
	const currentUser = pb.authStore.record;

	// 构建安全过滤规则
	let filter = `id = "${postId}" && (published = true`;

	if (currentUser) {
		filter += ` || user = "${currentUser.id}"`;
	}
	filter += ')';

	try {
		// 💡 使用 getFirstListItem 配合 filter，可以在数据库层面直接完成安全校验
		return await pb.collection('posts').getFirstListItem<PBPostsResponse<PostExpand>>(filter, {
			expand: 'user',
		});
	} catch (error: any) {
		// 如果找不到满足条件的记录（可能是 ID 不存在，也可能是权限不足），PocketBase 会抛出 404
		throw createError({
			statusCode: 404,
			message: '文章不存在或您没有权限查看',
		});
	}
}

/**
 * 内部核心方法：同步 Markdown 图片到本地，并处理 PB 的文件引用逻辑
 */
async function syncPostImages(pb: TypedPocketBase, postId: string, content: string, existingImages: string[] = []) {
	const { blobs, remoteUrls } = await processMarkdownImages(content);

	// 如果没有远程图片，直接清洗返回
	if (remoteUrls.length === 0) {
		return sanitizePostContent(content);
	}

	const formData = new FormData();
	// 关键细节：保留旧图片引用（PUT 逻辑必备，POST 时 existingImages 为空不影响）
	existingImages.forEach(name => formData.append('markdown_images', name));

	// 追加新下载的图片
	blobs.forEach((blob, i) => {
		formData.append('markdown_images', blob, `img_${Date.now()}_${i}.png`);
	});

	// 第一次更新：为了获得上传后的文件名
	const record = await pb.collection('posts').update(postId, formData);

	// 第二次处理：替换内容中的远程 URL 为本地 API 代理 URL
	let finalContent = content;

	const allImages = record.markdown_images; // 包含 旧图 + 新图
	const startIndex = allImages.length - remoteUrls.length;

	remoteUrls.forEach((url, i) => {
		const fileName = allImages[startIndex + i];
		const proxyUrl = `/api/images/posts/${postId}/${fileName}`;
		finalContent = finalContent.split(url).join(proxyUrl);
	});

	return sanitizePostContent(finalContent);
}

/**
 * 创建一篇新文章。
 * @param pb 与当前请求上下文绑定的 PocketBase 实例（必须是已认证用户的实例）。
 * @param data 要创建的文章数据。`Create<'posts'>` 类型确保了传入的数据符合数据库 `posts` 集合的字段要求。
 * @returns 返回新创建的文章记录。
 */
export async function createPost(pb: TypedPocketBase, initialData: FormData, rawContent: string) {
	// 1. 先用原始数据（含 content 占位）创建记录，拿到 postId
	initialData.append('content', rawContent);

	const post = await pb.collection('posts').create(initialData);
	// 2. 处理图片和 HTML 清洗
	const cleanContent = await syncPostImages(pb, post.id, rawContent);
	// 3. 最终更新内容
	return await pb.collection('posts').update(post.id, { content: cleanContent });
}

/**
 * 更新一篇已有的文章。
 * @param pb 与当前请求上下文绑定的 PocketBase 实例（必须是已认证用户的实例）。
 * @param postId 要更新的文章的 ID。
 * @param data 要更新的文章数据。`Update<'posts'>` 类型使得所有字段都是可选的，允许部分更新。
 * @returns 返回更新后的文章记录。
 */
export async function updatePost(pb: TypedPocketBase, postId: string, body: any) {
	const existing = await ensureOwnership(pb, 'posts', postId);

	// 如果内容被修改，执行复杂的图片同步逻辑
	if (body.content !== undefined && body.content !== existing.content) {
		const cleanContent = await syncPostImages(pb, postId, body.content, existing.markdown_images);
		body.content = cleanContent;
	}
	// 处理其他可能的 FormData 字段更新（如 link_data 等由调用方传入）
	return await pb.collection('posts').update(postId, body);
}

/**
 * 根据 ID 删除一篇文章。
 * @param pb 与当前请求上下文绑定的 PocketBase 实例（必须是已认证用户的实例）。
 * @param postId 要删除的文章的 ID。
 */
export async function deletePost(pb: TypedPocketBase, postId: string) {
	await ensureOwnership(pb, 'posts', postId);
	return await pb.collection('posts').delete(postId);
}
