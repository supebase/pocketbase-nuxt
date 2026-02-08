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
  const mentionNames = text.match(/@([^\s@#$]+)/g)?.map((n) => n.slice(1)) || [];
  if (mentionNames.length === 0) return;

  const uniqueNames = [...new Set(mentionNames)].filter((name) => name !== fromUser.name);

  // 1. 批量查询目标用户
  const userFilter = uniqueNames.map((name) => pb.filter('name = {:name}', { name })).join(' || ');
  const targetUsers = await pb.collection('users').getFullList({ filter: userFilter, fields: 'id' });
  if (targetUsers.length === 0) return;

  // 💡 2. 关键优化：一次性查出该评论下所有【已存在的提及通知】
  const existingNotifications = await pb.collection('notifications').getFullList({
    filter: pb.filter('post = {:postId} && comment = {:commentId} && type = "mention"', {
      postId,
      commentId,
    }),
    fields: 'id,to_user',
  });
  const notifiedUserIds = new Set(existingNotifications.map((n) => n.to_user));

  // 3. 批量写入
  const batch = pb.createBatch();
  let hasOperation = false;

  for (const user of targetUsers) {
    if (user.id === fromUser.id) continue;

    // 💡 只有不在已通知列表里的才加入 Batch
    if (!notifiedUserIds.has(user.id)) {
      batch.collection('notifications').create({
        from_user: fromUser.id,
        to_user: user.id,
        post: postId,
        comment: commentId,
        type: 'mention',
        is_read: false,
      });
      hasOperation = true;
    }
  }

  if (hasOperation) {
    try {
      await batch.send();
    } catch (err) {
      console.error('[Mention Error] 批量通知失败:', err);
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

  const batch = pb.createBatch();
  unreads.forEach((n) => batch.collection('notifications').update(n.id, { is_read: true }));
  return await batch.send();
}
