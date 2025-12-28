/**
 * @file API Route: /api/collections/post/:id [GET]
 * @description 获取单篇内容（文章）详情的 API 端点。
 */

// 导入核心的文章获取服务。
import { getPostById } from '../../../services/posts.service';
// 导入统一的 PocketBase 错误处理器。
import { handlePocketBaseError } from '../../../utils/errorHandler';
// 导入用于获取当前请求唯一的 PocketBase 实例的函数。
import { getPocketBaseInstance } from '../../../utils/pocketbase';
// 导入前端期望的、经过包装的单篇文章响应类型。
import type { SinglePostResponse } from '~/types/posts';

/**
 * 定义处理获取单篇文章详情请求的事件处理器。
 */
export default defineEventHandler(async (event): Promise<SinglePostResponse> => {
  try {
    // 步骤 1: 从动态路由中获取文章的 ID。
    // 例如，对于请求 /api/collections/post/xyz123, `postId` 将是 "xyz123"。
    const postId = getRouterParam(event, 'id');

    // 步骤 2: 对获取到的 ID 进行基础的有效性验证。
    if (!postId) {
      throw createError({
        statusCode: 400,
        message: '文章 ID 无效或未提供',
        statusMessage: 'Invalid Parameter',
      });
    }

    // 步骤 3: 获取本次请求专用的 PocketBase 实例。
    // 实例可以是匿名的，也可以是认证过的，服务层可以根据此来决定数据访问权限。
    const pb = getPocketBaseInstance(event);

    // 步骤 4: 调用服务层的 `getPostById` 函数来执行实际的数据库查询。
    // 传入 `pb` 实例和 `postId`，将具体的查询逻辑与 API 路由解耦。
    const post = await getPostById(pb, postId);

    // 步骤 5: 将从服务层获取的文章数据包装成标准化的 API 响应。
    return {
      message: '获取内容详情成功',
      data: post as any, // 使用 `as any` 以简化类型传递
    };
  } catch (error: any) {
    // 步骤 6: 捕获并统一处理过程中可能发生的任何错误。
    // 例如，如果 `getPostById` 找不到对应的文章，它会抛出一个错误，这里会捕获并返回一个标准的 404 响应。
    return handlePocketBaseError(error, '获取内容详情异常');
  }
});
