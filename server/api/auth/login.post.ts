/**
 * @file API Route: /api/auth/login [POST]
 * @description 用户登录的 API 端点。
 *              接收用户的电子邮件和密码，调用认证服务进行验证，
 *              并在成功后建立用户的会话状态。
 */

// 导入核心的登录服务，该服务封装了与 PocketBase 交互的认证逻辑。
import { loginService } from '../../services/auth.service';
// 导入统一的 PocketBase 错误处理器，用于将技术错误转换为用户友好的响应。
import { handlePocketBaseError } from '../../utils/errorHandler';
// 导入认证成功后的处理器，用于设置 Nuxt Session 和 PocketBase Cookie。
import { handleAuthSuccess } from '../../utils/authHelpers';
// 导入用于获取当前请求唯一的 PocketBase 实例的函数。
import { getPocketBase } from '../../utils/pocketbase';
// 导入与认证相关的类型定义，增强代码的类型安全。
import type { LoginRequest, AuthResponse } from '~/types/auth';

/**
 * 定义处理用户登录请求的事件处理器 (Event Handler)。
 * 这是 Nitro (Nuxt 的服务端引擎) 的标准写法。
 */
export default defineEventHandler(async (event): Promise<AuthResponse> => {
  // 从请求体中异步读取 JSON 数据，并断言其类型为 `LoginRequest`。
  const body = await readBody<LoginRequest>(event);
  const { email, password } = body;

  // 对输入进行基本的非空验证。
  if (!email || !password) {
    // 如果缺少关键字段，立即抛出一个 400 Bad Request 错误。
    throw createError({
      statusCode: 400,
      message: '请输入电子邮件和登录密码', // 用户友好的中文提示
      statusMessage: 'Invalid Input',      // HTTP 状态文本
    });
  }

  // 步骤 1: 为本次 HTTP 请求获取一个独立的、专用的 PocketBase 实例。
  // 传入 `event` 对象，`getPocketBase` 内部可能会用它来处理某些与请求相关的逻辑。
  const pb = getPocketBase(event);

  try {
    // 步骤 2: 调用服务层的 `loginService`，并传入当前的 `pb` 实例以及用户凭证。
    // `loginService` 会执行实际的认证操作。
    // ⚠️ 关键点：如果登录成功，`loginService` 会将获取到的用户认证信息（Token 和用户数据）
    //          填充到我们传入的这个 `pb` 实例的 `authStore` 中。
    await loginService(pb, email, password);

    // 步骤 3: 如果 `loginService` 没有抛出错误，说明登录成功。
    // 接着，调用 `handleAuthSuccess` 并将已经填充了认证信息的 `pb` 实例传递给它。
    // `handleAuthSuccess` 会完成后续的所有状态设置工作，包括：
    //   - 创建 Nuxt 服务端 Session (通过 `setUserSession`)
    //   - 将 PocketBase 的 `pb_auth` Token 设置到浏览器的 Cookie 中
    //   - 返回一个标准化的成功响应体。
    return await handleAuthSuccess(event, pb, '登录成功');

  } catch (error) {
    // 步骤 4: 如果在 `try` 块中的任何 `await` 步骤（主要是 `loginService`）抛出了错误，
    //          在这里统一捕获。
    // 调用 `handlePocketBaseError` 将原始的 PocketBase 错误或网络错误
    // 转换为一个对前端友好的、结构化的 HTTP 错误响应。
    return handlePocketBaseError(error, '登录失败，请检查账号信息是否正确');
  }
});
