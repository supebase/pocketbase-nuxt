export default defineApiHandler(async (event) => {
  const pb = event.context.pb;

  await markAllNotificationsAsRead({ pb });

  return {
    message: '所有通知已标记为已读',
  };
});
