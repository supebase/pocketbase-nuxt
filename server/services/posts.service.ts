import { ensureOwnership } from '~~/server/utils/validate-owner';
import type { PostsResponse as PBPostsResponse, TypedPocketBase } from '~/types/pocketbase-types';
import type { PostExpand } from '~/types/posts';
import { getLinkPreview } from '~~/server/utils/graph-scraper';
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
 * 核心逻辑：同步 Markdown 中的远程图片到 PocketBase
 * @returns 返回处理后的 content
 */
async function performImageSync(
  pb: TypedPocketBase,
  postId: string,
  content: string,
  existingImages: string[] = [],
) {
  const { successResults, skippedCount } = await processMarkdownImages(content);

  // 1. 如果没有新图片下载成功，仅处理清洗逻辑
  if (successResults.length === 0) {
    let finalContent = content;
    if (skippedCount > 0 && !content.includes('部分远程图片因体积过大')) {
      finalContent += `\n\n> ⚠️ **提示**: 部分远程图片因体积过大未同步到本地。`;
    }
    return sanitizePostContent(finalContent);
  }

  // 2. 构造 FormData 用于更新文件字段
  const formData = new FormData();

  // 必须逐个 append 旧文件名，否则 PocketBase 会删除未提及的文件
  existingImages.forEach((name) => formData.append('markdown_images', name));

  // 添加新下载的 Blob
  successResults.forEach((item, i) => {
    formData.append('markdown_images', item.blob, `img_${Date.now()}_${i}.png`);
  });

  // 3. 提交文件更新
  const record = await pb.collection('posts').update(postId, formData);

  // 4. 替换 Markdown 中的原始 URL 为本地代理 URL
  let finalContent = content;
  const allImages = record.markdown_images;
  // PocketBase 默认将新文件追加到数组末尾
  const startIndex = allImages.length - successResults.length;

  successResults.forEach((item, i) => {
    const fileName = allImages[startIndex + i];
    const proxyUrl = `/api/images/posts/${postId}/${fileName}`;
    finalContent = finalContent.split(item.url).join(proxyUrl);
  });

  if (skippedCount > 0 && !finalContent.includes('部分远程图片因体积过大')) {
    finalContent += `\n\n> ⚠️ **提示**: 部分远程图片因体积过大未同步到本地。`;
  }

  return sanitizePostContent(finalContent);
}

/**
 * 创建新文章
 */
export async function createPost(pb: TypedPocketBase, initialData: FormData, rawContent: string) {
  const originalPublishedStatus = initialData.get('published') === 'true';

  // 先以草稿状态创建，避免图片未处理完就发布
  initialData.set('published', 'false');
  initialData.set('content', 'Processing images...');

  const post = await pb.collection('posts').create(initialData);

  try {
    const cleanContent = await performImageSync(pb, post.id, rawContent, []);
    return await pb.collection('posts').update(post.id, {
      content: cleanContent,
      published: originalPublishedStatus,
    });
  } catch (error: any) {
    console.error(`[CreatePost] 图片同步失败: ${post.id}`, error);
    // 即使失败也返回文章 ID，让用户知道内容已存在
    throw createError({
      statusCode: 202,
      message: '内容已保存，但图片同步失败。',
      data: { postId: post.id },
    });
  }
}

/**
 * 更新文章
 */
export async function updatePost(pb: TypedPocketBase, postId: string, body: any) {
  // 1. 【标注：所有权检查】
  // 统一在此处校验，防止越权修改
  const existing = await ensureOwnership(pb, 'posts', postId);

  const formData = new FormData();

  // 2. 【标注：智能链接处理】
  // 只有当 link 字段被传入且发生变化时，才重新抓取预览
  if (body.link !== undefined && body.link !== existing.link) {
    if (body.link === '') {
      formData.append('link_data', '');
      formData.append('link_image', ''); // 清空
    } else {
      const preview = await getLinkPreview(body.link);
      if (preview?.image?.startsWith('http')) {
        try {
          // 【标注：超时保护】设置 5s 超时，防止阻塞 Nitro 线程
          const buf = await $fetch<ArrayBuffer>(preview.image, {
            responseType: 'arrayBuffer',
            timeout: 5000,
          });
          formData.append('link_image', new Blob([buf]), 'preview.png');
          preview.image = ''; // 图片已上传至 PB，清空原始 URL
        } catch (e) {
          console.error('图片抓取失败', e);
        }
      }
      formData.append('link_data', JSON.stringify(preview));
    }
  }

  // 3. 【标注：Markdown 内容变更检查】
  // 复用你已有的 performImageSync 逻辑
  if (body.content !== undefined && body.content !== existing.content) {
    const cleanContent = await performImageSync(
      pb,
      postId,
      body.content,
      existing.markdown_images || [],
    );
    formData.append('content', cleanContent);
  }

  // 4. 【标注：其他字段同步】
  const syncFields = ['allow_comment', 'published', 'icon', 'action', 'link'];
  syncFields.forEach((field) => {
    if (body[field] !== undefined) formData.append(field, String(body[field]));
  });

  return await pb.collection('posts').update(postId, formData);
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
