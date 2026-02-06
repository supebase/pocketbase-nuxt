/**
 * @file Posts Service
 * @description 处理文章的 CRUD，包含自动图片同步、链接预览抓取及复杂的可见性过滤。
 */
import type {
  PostsResponse as PBPostsResponse,
  TypedPocketBase,
  PostExpand,
  PostRecord,
  GetPostsOptions,
  GetPostByIdOptions,
  CreatePostOptions,
  UpdatePostOptions,
  DeletePostOptions,
} from '~/types';

/**
 * 获取文章列表
 * @description 权限过滤逻辑：公开文章 || 自己的草稿
 */
export async function getPostsList({ pb, page = 1, perPage = 10, query }: GetPostsOptions) {
  const currentUser = pb.authStore.record;

  // 使用数组和 pb.filter 构建，结构更清晰，防止注入
  const filters = [`published = true`];
  if (currentUser) {
    filters.push(pb.filter('user = {:userId} && published = false', { userId: currentUser.id }));
  }

  // 最终用 || 连接权限逻辑，用 && 连接搜索逻辑
  let finalFilter = `(${filters.join(' || ')})`;

  if (query) {
    finalFilter = `(${finalFilter} && ${pb.filter('content ~ {:q}', { q: query })})`;
  }

  return await pb.collection('posts').getList<PBPostsResponse<PostExpand>>(page, perPage, {
    sort: '-created',
    expand: 'user',
    filter: finalFilter,
  });
}

/**
 * 获取单篇文章
 * @throws 404 - 如果文章不存在或无访问权限（非作者且未发布）
 */
export async function getPostById({ pb, postId }: GetPostByIdOptions) {
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
      status: 404,
      message: '页面不存在或您没有权限查看',
      statusText: 'Not Found',
    });
  }
}

/**
 * 创建新文章
 * @description 两阶段提交：1.先创建草稿以获取 ID 2.同步处理 Markdown 中的远程图片 3.更新最终内容
 */
export async function createPost({ pb, initialData, rawContent }: CreatePostOptions): Promise<PostRecord> {
  const originalPublishedStatus = initialData.get('published') === 'true';

  // 占位创建
  initialData.set('published', 'false');
  initialData.set('content', 'Processing images...');
  const post = await pb.collection('posts').create(initialData);

  try {
    // 同步 Markdown 图片到 PocketBase 存储
    const cleanContent = await performMarkdownImageSync({
      pb,
      collection: 'posts',
      recordId: post.id,
      content: rawContent,
      existingImages: [],
    });

    // 更新最终状态
    return (await pb.collection('posts').update(
      post.id,
      {
        content: cleanContent,
        published: originalPublishedStatus,
      },
      { expand: 'user' },
    )) as PostRecord;
  } catch (error) {
    // console.error(`[CreatePost] 同步失败: ${post.id}`, error);
    throw createError({
      status: 202,
      message: '内容已保存，但图片同步失败。',
      statusText: 'Accepted',
      data: { postId: post.id },
    });
  }
}

/**
 * 更新文章
 * @description 处理链接预览抓取及内容差异化同步
 */
export async function updatePost({ pb, postId, body }: UpdatePostOptions): Promise<PostRecord> {
  const existing = (await ensureOwnership(pb, 'posts', postId)) as PostRecord;
  const formData = new FormData();

  // 链接预览：若链接变化则重新抓取元数据及 OpenGraph 图片
  if (body.link !== undefined && body.link !== existing.link) {
    if (body.link === '') {
      formData.append('link_data', '');
      formData.append('link_image', '');
    } else {
      const preview = await getLinkPreview(body.link);
      if (preview?.image?.startsWith('http')) {
        try {
          const buf = await $fetch<ArrayBuffer>(preview.image, {
            responseType: 'arrayBuffer',
            timeout: 5000,
          });
          formData.append('link_image', new Blob([buf]), 'preview.png');
          // 图片已转存，清除原始 URL
          preview.image = '';
        } catch (e) {
          // console.error('预览图抓取失败', e);
        }
      }
      formData.append('link_data', JSON.stringify(preview));
    }
  }

  // 内容更新：仅在内容变化时重新同步图片
  if (body.content !== undefined && body.content !== existing.content) {
    // 提取图片 URL 的辅助函数
    const extractImages = (md: string) => {
      // 匹配 ![alt](url) 其中的 url 部分
      const matches = md.matchAll(/!\[.*?\]\((.+?)\)/g);
      return Array.from(matches, (m) => m[1]?.split(' ')[0]); // 排除 title 部分
    };

    const oldImages = extractImages(existing.content);
    const newImages = extractImages(body.content);

    // 检查图片是否有增减或顺序变化
    const imagesChanged = JSON.stringify(oldImages) !== JSON.stringify(newImages);

    if (imagesChanged) {
      const cleanContent = await performMarkdownImageSync({
        pb,
        collection: 'posts',
        recordId: postId,
        content: body.content,
        existingImages: existing.markdown_images || [],
      });
      formData.append('content', cleanContent);
    } else {
      // 图片没变，只更新文字内容
      formData.append('content', body.content);
    }
  }

  // 基础字段同步
  const syncFields = ['allow_comment', 'published', 'poll', 'reactions', 'icon', 'action', 'link'];
  syncFields.forEach((field) => {
    if (body[field] !== undefined) formData.append(field, String(body[field]));
  });

  if (Array.from(formData.keys()).length === 0) return existing;

  const updated = (await pb.collection('posts').update(postId, formData, {
    expand: 'user',
  })) as PostRecord;

  await invalidatePostCaches(postId);

  return updated;
}

/**
 * 删除文章
 */
export async function deletePost({ pb, postId }: DeletePostOptions) {
  await ensureOwnership(pb, 'posts', postId);
  const result = await pb.collection('posts').delete(postId);

  await invalidatePostCaches(postId);

  return result;
}

/**
 * 增加浏览量 (原子更新)
 */
export async function incrementPostViews({ pb, postId }: { pb: TypedPocketBase; postId: string }) {
  try {
    // 使用 PocketBase 的原子加法操作
    await pb.collection('posts').update(postId, { 'views+': 1 });
  } catch (error) {
    // console.error(`无法更新浏览量:`, error);
  }
}
