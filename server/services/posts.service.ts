import { ensureOwnership } from '~~/server/utils/validate-owner';
import type { PostsResponse as PBPostsResponse, TypedPocketBase } from '~/types/pocketbase-types';
import type { PostExpand } from '~/types/posts';
import { processMarkdownImages } from '~~/server/utils/markdown';
import { sanitizePostContent } from '~~/server/utils/sanitize';

/**
 * 获取文章列表
 */
export async function getPostsList(
  pb: TypedPocketBase,
  page: number = 1,
  perPage: number = 10,
  query?: string,
) {
  let filterString = '(published = true';
  const currentUser = pb.authStore.record;

  if (currentUser) {
    filterString += ` || (published = false && user = "${currentUser.id}")`;
  }
  filterString += ')';

  if (query) {
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
 * 根据 ID 获取单篇文章详情
 */
export async function getPostById(pb: TypedPocketBase, postId: string) {
  const currentUser = pb.authStore.record;
  let filter = `id = "${postId}" && (published = true`;

  if (currentUser) {
    filter += ` || user = "${currentUser.id}"`;
  }
  filter += ')';

  try {
    return await pb.collection('posts').getFirstListItem<PBPostsResponse<PostExpand>>(filter, {
      expand: 'user',
    });
  } catch (error: any) {
    throw createError({
      statusCode: 404,
      message: '文章不存在或您没有权限查看',
    });
  }
}

/**
 * 内部核心方法：同步 Markdown 图片到本地
 * 增加了“图片过大”的提示逻辑
 */
async function syncPostImages(
  pb: TypedPocketBase,
  postId: string,
  content: string,
  existingImages: string[] = [],
) {
  const { successResults, skippedCount } = await processMarkdownImages(content);

  // 如果没有新图片下载成功，仅进行清洗并返回（可能包含提示更新）
  if (successResults.length === 0) {
    let finalContent = content;
    if (skippedCount > 0 && !content.includes('部分远程图片因体积过大')) {
      finalContent += `\n\n> ⚠️ **提示**: 部分远程图片因体积过大未同步到本地，已保留原始链接。`;
    }
    return sanitizePostContent(finalContent);
  }

  const formData = new FormData();
  existingImages.forEach((name) => formData.append('markdown_images', name));

  successResults.forEach((item, i) => {
    formData.append('markdown_images', item.blob, `img_${Date.now()}_${i}.png`);
  });

  const record = await pb.collection('posts').update(postId, formData);

  let finalContent = content;
  const allImages = record.markdown_images;
  const startIndex = allImages.length - successResults.length;

  successResults.forEach((item, i) => {
    const fileName = allImages[startIndex + i];
    const proxyUrl = `/api/images/posts/${postId}/${fileName}`;
    finalContent = finalContent.split(item.url).join(proxyUrl);
  });

  // 处理跳过提示
  if (skippedCount > 0 && !finalContent.includes('部分远程图片因体积过大')) {
    finalContent += `\n\n> ⚠️ **提示**: 部分远程图片因体积过大未同步到本地，已保留原始链接。`;
  }

  return sanitizePostContent(finalContent);
}

/**
 * 创建新文章
 */
export async function createPost(pb: TypedPocketBase, initialData: FormData, rawContent: string) {
  const originalPublishedStatus = initialData.get('published') === 'true';
  initialData.set('published', 'false');
  initialData.append('content', rawContent);

  const post = await pb.collection('posts').create(initialData);

  try {
    const cleanContent = await syncPostImages(pb, post.id, rawContent);
    return await pb.collection('posts').update(post.id, {
      content: cleanContent,
      published: originalPublishedStatus,
    });
  } catch (error: any) {
    console.error(`处理失败: ${post.id}`, error);
    throw createError({
      statusCode: 202,
      message: '内容已保存，但图片同步过程遇到问题，请手动检查。',
      data: { postId: post.id },
    });
  }
}

/**
 * 更新文章
 */
export async function updatePost(pb: TypedPocketBase, postId: string, body: any) {
  // 此时 ensureOwnership 已具备强大的类型检查
  const existing = await ensureOwnership(pb, 'posts', postId);

  if (body.content !== undefined && body.content !== existing.content) {
    const cleanContent = await syncPostImages(pb, postId, body.content, existing.markdown_images);
    body.content = cleanContent;
  }
  return await pb.collection('posts').update(postId, body);
}

/**
 * 删除文章
 */
export async function deletePost(pb: TypedPocketBase, postId: string) {
  await ensureOwnership(pb, 'posts', postId);
  return await pb.collection('posts').delete(postId);
}

/**
 * 增加浏览量
 */
export async function incrementPostViews(pb: TypedPocketBase, postId: string) {
  try {
    await pb.collection('posts').update(postId, { 'views+': 1 });
  } catch (error) {
    console.error(`无法更新浏览量:`, error);
  }
}
