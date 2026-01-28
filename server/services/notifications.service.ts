/**
 * @file Notifications Service
 * @description 处理系统通知的增删查改，支持提及（Mention）解析与批量创建。
 */
import type {
  TypedPocketBase,
  NotificationRecord,
  GetNotificationsOptions,
  CreateNotificationOptions,
  HandleMentionsOptions,
  MarkReadOptions,
} from '~/types';

/**
 * 获取通知列表
 */
export async function getNotificationsList({ pb, page = 1, perPage = 10, filter = '' }: GetNotificationsOptions) {
  const currentUser = pb.authStore.record;
  if (!currentUser) return null;

  // 基础过滤：必须是发给我的
  let finalFilter = pb.filter('to_user = {:userId}', { userId: currentUser.id });

  // 如果调用方传了额外的过滤条件（比如 is_read = false），则进行组合
  if (filter) {
    finalFilter = `(${finalFilter}) && (${filter})`;
  }

  return await pb.collection('notifications').getList<NotificationRecord>(page, perPage, {
    filter: finalFilter,
    sort: '-created',
    expand: 'from_user,post,comment',
  });
}

/**
 * 创建单条通知
 */
export async function createNotification({ pb, data }: CreateNotificationOptions) {
  // 基础防御：禁止自己给自己发通知
  // 注意：Create<'notifications'> 里的字段可能是可选的，需确保存在
  if (data.from_user === data.to_user) return null;

  return await pb.collection('notifications').create<NotificationRecord>(data, {
    expand: 'from_user,post,comment',
  });
}

/**
 * 解析文本中的 @提及 并创建通知
 * @description 核心业务逻辑：提取 -> 去重 -> 查找用户 -> 批量写入
 */
export async function handleMentionsInText({ pb, text, fromUser, postId, commentId }: HandleMentionsOptions) {
  // 修正：统一使用接口定义
  // 1. 匹配 @用户名
  const mentionNames = text.match(/@([^\s@#$]+)/g)?.map((n) => n.slice(1)) || [];
  if (mentionNames.length === 0) return;

  // 2. 去重并排除作者本人
  const uniqueNames = [...new Set(mentionNames)].filter((name) => name !== fromUser.name);

  for (const name of uniqueNames) {
    try {
      const targetUser = await pb.collection('users').getFirstListItem(pb.filter('name = {:name}', { name }));

      if (targetUser && targetUser.id !== fromUser.id) {
        await createNotification({
          pb,
          data: {
            from_user: fromUser.id,
            to_user: targetUser.id,
            post: postId,
            comment: commentId,
            type: 'mention' as any, // 修正：强制类型适配 enum
            is_read: false,
          },
        });
      }
    } catch (e) {
      // 404 不处理
    }
  }
}

/**
 * 标记通知为已读
 */
export async function markNotificationAsRead({ pb, notificationId }: MarkReadOptions) {
  const currentUser = pb.authStore.record;
  if (!currentUser || !notificationId) return;

  // 这里的 getOne 建议带上权限校验或在 API Rule 处理
  const existing = await pb.collection('notifications').getOne(notificationId);
  if (existing.to_user !== currentUser.id) {
    throw createError({ status: 403, message: '无权操作此通知' });
  }

  return await pb.collection('notifications').update(notificationId, { is_read: true });
}

/**
 * 批量标记所有通知为已读
 */
export async function markAllNotificationsAsRead({ pb }: { pb: TypedPocketBase }) {
  const currentUser = pb.authStore.record;
  if (!currentUser) return;

  const unreads = await pb.collection('notifications').getFullList({
    filter: pb.filter('to_user = {:userId} && is_read = false', { userId: currentUser.id }),
    fields: 'id',
  });

  if (unreads.length === 0) return [];

  return await Promise.all(unreads.map((n) => pb.collection('notifications').update(n.id, { is_read: true })));
}
