import { ensureOwnership } from '~~/server/utils/validate-owner';
import type { PostsResponse as PBPostsResponse, TypedPocketBase } from '~/types/pocketbase-types';
import type { PostExpand } from '~/types/posts';
import { getLinkPreview } from '~~/server/utils/graph-scraper';
import { syncMarkdownContent } from '~~/server/utils/markdown-sync';

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
 */
async function performImageSync(
  pb: TypedPocketBase,
  postId: string,
  content: string,
  existingImages: string[] = [],
) {
  return await syncMarkdownContent(content, postId, async (newItems) => {
    const formData = new FormData();

    // 保持旧文件
    existingImages.forEach((name) => formData.append('markdown_images', name));

    // 添加新文件
    newItems.forEach((item) => {
      formData.append('markdown_images', item.blob, item.fileName);
    });

    // 提交到 PB
    const record = await pb.collection('posts').update(postId, formData);

    // 返回 PB 生成的最新的文件名数组（取最后几个新加的）
    return record.markdown_images.slice(-newItems.length);
  });
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
  // 1. 所有权检查
  const existing = await ensureOwnership(pb, 'posts', postId);
  const formData = new FormData();

  // 2. 智能链接预览逻辑 (可保持现状，或封装成小工具)
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
          preview.image = '';
        } catch (e) {
          console.error('预览图抓取失败', e);
        }
      }
      formData.append('link_data', JSON.stringify(preview));
    }
  }

  // 3. Markdown 内容变更处理
  // 注意：这里我们只在内容真正变化时才执行同步
  if (body.content !== undefined && body.content !== existing.content) {
    const cleanContent = await performImageSync(
      pb,
      postId,
      body.content,
      existing.markdown_images || [],
    );
    formData.append('content', cleanContent);
  }

  // 4. 其他字段同步
  const syncFields = ['allow_comment', 'published', 'icon', 'action', 'link'];
  syncFields.forEach((field) => {
    if (body[field] !== undefined) {
      // 避免将布尔值或数字转为字符串时出现异常，PocketBase 接受字符串形式的 body
      formData.append(field, String(body[field]));
    }
  });

  // 5. 统一提交
  // 如果 formData 为空（比如只传了不改变内容的 body），则直接返回原数据
  if (Array.from(formData.keys()).length === 0) {
    return existing;
  }

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
