/**
 * @file API Route: /api/auth/login [POST]
 * @description 用户登录的 API 端点。
 *              接收用户的电子邮件和密码，调用认证服务进行验证，
 *              并在成功后建立用户的会话状态。
 */
import { getPocketBase } from '../../utils/pocketbase';
import { handleAuthSuccess } from '../../utils/auth-helpers';
import { defineApiHandler } from '~~/server/utils/api-wrapper';
import type { LoginRequest, AuthResponse } from '~/types/auth';

/**
 * 定义处理用户登录请求的事件处理器 (Event Handler)。
 * 这是 Nitro (Nuxt 的服务端引擎) 的标准写法。
 */
export default defineApiHandler(async (event): Promise<AuthResponse> => {
  // 从请求体中异步读取 JSON 数据，并断言其类型为 `LoginRequest`。
  const body = await readBody<LoginRequest>(event);
  const { email, password } = body;

  // 对输入进行基本的非空验证。
  if (!email || !password) {
    // 如果缺少关键字段，立即抛出一个 400 Bad Request 错误。
    throw createError({
      statusCode: 400,
      message: '请输入电子邮件和登录密码',
      statusMessage: 'Invalid Input',
    });
  }

  // 步骤 1: 为本次 HTTP 请求获取一个独立的、专用的 PocketBase 实例。
  // 传入 `event` 对象，`getPocketBase` 内部可能会用它来处理某些与请求相关的逻辑。
  const pb = getPocketBase(event);

  // 步骤 2: 调用服务层的 `loginService`，并传入当前的 `pb` 实例以及用户凭证。
  await loginService(pb, email, password);

  // 步骤 3: 如果 `loginService` 没有抛出错误，说明登录成功。
  // 接着，调用 `handleAuthSuccess` 并将已经填充了认证信息的 `pb` 实例传递给它。
  return await handleAuthSuccess(event, pb, '登录成功');
});
