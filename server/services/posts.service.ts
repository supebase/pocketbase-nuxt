import { ensureOwnership } from '~~/server/utils/validate-owner';
import type { PostsResponse as PBPostsResponse, TypedPocketBase } from '~/types/pocketbase-types';
import type { PostExpand, PostRecord } from '~/types/posts';
import type {
  GetPostsOptions,
  GetPostByIdOptions,
  CreatePostOptions,
  UpdatePostOptions,
  DeletePostOptions,
} from '~/types/server';
import { getLinkPreview } from '~~/server/utils/graph-scraper';

/**
 * 获取文章列表
 */
export async function getPostsList({ pb, page = 1, perPage = 10, query }: GetPostsOptions) {
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
      statusCode: 404,
      message: '文章不存在或您没有权限查看',
    });
  }
}

/**
 * 创建新文章
 */
export async function createPost({
  pb,
  initialData,
  rawContent,
}: CreatePostOptions): Promise<PostRecord> {
  const originalPublishedStatus = initialData.get('published') === 'true';

  // 先创建草稿
  initialData.set('published', 'false');
  initialData.set('content', 'Processing images...');
  const post = await pb.collection('posts').create(initialData);

  try {
    // 调用图片同步服务
    const cleanContent = await performMarkdownImageSync({
      pb,
      collection: 'posts',
      recordId: post.id,
      content: rawContent,
      existingImages: [],
    });

    return (await pb.collection('posts').update(
      post.id,
      {
        content: cleanContent,
        published: originalPublishedStatus,
      },
      { expand: 'user' },
    )) as PostRecord;
  } catch (error) {
    console.error(`[CreatePost] 同步失败: ${post.id}`, error);
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
export async function updatePost({ pb, postId, body }: UpdatePostOptions): Promise<PostRecord> {
  const existing = (await ensureOwnership(pb, 'posts', postId)) as PostRecord;
  const formData = new FormData();

  // 1. 处理链接预览 (逻辑保持)
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

  // 2. 调用图片同步服务
  if (body.content !== undefined && body.content !== existing.content) {
    const cleanContent = await performMarkdownImageSync({
      pb,
      collection: 'posts',
      recordId: postId,
      content: body.content,
      existingImages: existing.markdown_images || [],
    });
    formData.append('content', cleanContent);
  }

  // 3. 其他字段
  const syncFields = ['allow_comment', 'published', 'icon', 'action', 'link'];
  syncFields.forEach((field) => {
    if (body[field] !== undefined) formData.append(field, String(body[field]));
  });

  if (Array.from(formData.keys()).length === 0) return existing;

  return (await pb.collection('posts').update(postId, formData, {
    expand: 'user',
  })) as PostRecord;
}

/**
 * 删除文章
 */
export async function deletePost({ pb, postId }: DeletePostOptions) {
  await ensureOwnership(pb, 'posts', postId);
  return await pb.collection('posts').delete(postId);
}

/**
 * 增加浏览量
 */
export async function incrementPostViews({ pb, postId }: { pb: TypedPocketBase; postId: string }) {
  try {
    await pb.collection('posts').update(postId, { 'views+': 1 });
  } catch (error) {
    console.error(`无法更新浏览量:`, error);
  }
}
