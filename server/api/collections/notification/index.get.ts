export default defineApiHandler(async (event) => {
  const pb = event.context.pb;
  const query = getQuery(event);

  const page = parseInt(query.page as string) || 1;
  const perPage = parseInt(query.perPage as string) || 10;
  const filter = query.filter as string;

  const result = await getNotificationsList({
    pb,
    page,
    perPage,
    filter,
  });

  return result;
});
