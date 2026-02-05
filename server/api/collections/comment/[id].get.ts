/**
 * @file API Route: /api/collections/comment/:id [GET]
 * @description 获取指定内容的评论聚合统计（如评论总数、参与者头像列表等）。
 */
export default defineApiHandler(async (event) => {
  const pb = event.context.pb;

  // 获取路由参数：此处 id 通常指代关联的文章 ID (postId)
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      status: 400,
      message: '参数缺失：必须提供目标内容 ID',
      statusText: 'Bad Request',
    });
  }

  try {
    // 查询聚合视图：从 comment_stats 视图中获取预计算的统计数据
    const record = await pb.collection('comment_stats').getOne(id, {
      fields: 'id,total_items,user_ids,user_avatars,user_github_avatars,last_user_name',
    });

    return {
      message: '获取统计成功',
      data: record,
    };
  } catch (e) {
    /**
     * 降级逻辑 (Graceful Degradation)：
     * 当文章尚未有评论时，视图中可能不存在该记录。
     * 返回标准化的“零值”对象，确保前端头像墙或计数组件不会因为 undefined 而崩溃。
     */
    return {
      message: '暂无统计数据',
      data: {
        id,
        total_items: 0,
        user_ids: '',
        user_avatars: '',
        user_github_avatars: '',
        last_user_name: '',
      },
    };
  }
});
