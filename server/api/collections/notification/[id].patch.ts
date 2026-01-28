export default defineApiHandler(async (event) => {
  const pb = event.context.pb;
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ status: 400, message: '缺少通知 ID' });
  }

  await markNotificationAsRead({ pb, notificationId: id });

  return {
    message: '通知已读',
  };
});
