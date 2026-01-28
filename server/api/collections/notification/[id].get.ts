export default defineApiHandler(async (event) => {
  const pb = event.context.pb;
  const id = getRouterParam(event, 'id');

  // 必须带上 expand，前端实时监听才能拿到头像和内容
  const result = await pb.collection('notifications').getOne(id!, {
    expand: 'from_user,post,comment',
  });

  return { data: result };
});
