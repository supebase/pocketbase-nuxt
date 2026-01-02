/**
 * @file 点赞相关的服务层 (Likes Service)
 * @description 该文件封装了所有与点赞功能相关的业务逻辑，
 *              包括切换点赞状态、获取单条评论的点赞数，以及最高效的批量获取多条评论的点赞信息。
 */
import type { LikesResponse as PBLikesResponse, Create, TypedPocketBase } from '~/types/pocketbase-types';
import type { CommentLikeInfo } from '~/types/likes';

/**
 * 切换点赞状态
 */
export async function toggleLike(pb: TypedPocketBase, commentId: string, userId: string) {
	// 使用 pb.filter 构造安全查询
	const filter = pb.filter('comment = {:commentId} && user = {:userId}', { commentId, userId });

	// 1. 查找现有记录
	let existingLike: PBLikesResponse | null = null;

	try {
		// getFirstListItem 比 getList[0] 更直接
		existingLike = await pb.collection('likes').getFirstListItem(filter, {
			requestKey: null,
		});
	} catch (e) {
		// 找不到记录会抛出 404，属于正常业务流
	}

	let liked = false;

	if (existingLike) {
		await pb.collection('likes').delete(existingLike.id);
		liked = false;
	} else {
		const newLike: Create<'likes'> = { user: userId, comment: commentId };
		await pb.collection('likes').create(newLike);
		liked = true;
	}

	// 2. 获取最新计数
	const likes = await getCommentLikes(pb, commentId);
	return { liked, likes, commentId };
}

/**
 * 获取单条评论点赞数
 */
export async function getCommentLikes(pb: TypedPocketBase, commentId: string): Promise<number> {
	const result = await pb.collection('likes').getList(1, 1, {
		filter: pb.filter('comment = {:commentId}', { commentId }),
		fields: 'id',
		requestKey: null,
	});
	return result.totalItems;
}

/**
 * 批量获取点赞信息（高性能）
 */
export async function getCommentsLikesMap(pb: TypedPocketBase, commentIds: string[], userId?: string): Promise<Record<string, CommentLikeInfo>> {
	if (!commentIds || commentIds.length === 0) return {};

	// 1. 构建 IN 查询：comment = "id1" || comment = "id2" ...
	// PocketBase v0.20+ 支持这种简洁的 filter 构造方式
	const commentFilter = commentIds.map((id) => pb.filter('comment = {:id}', { id })).join(' || ');

	const allLikes = await pb.collection('likes').getFullList<PBLikesResponse>({
		filter: `(${commentFilter})`,
		requestKey: null,
	});

	const likesMap: Record<string, CommentLikeInfo> = {};

	commentIds.forEach((id) => {
		likesMap[id] = { commentId: id, likes: 0, isLiked: false };
	});

	allLikes.forEach((like) => {
		const info = likesMap[like.comment];
		if (info) {
			info.likes++;
			if (userId && like.user === userId) {
				info.isLiked = true;
			}
		}
	});

	return likesMap;
}
