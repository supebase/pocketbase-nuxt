declare module 'h3' {
  interface H3EventContext {
    user: UsersResponse | null;
    pb: TypedPocketBase;
  }
}
