import type { TypedPocketBase, UsersRecord } from './pocketbase-types';

declare module 'h3' {
  interface H3EventContext {
    pb: TypedPocketBase;
    user?: UsersRecord | null;
  }
}

export {};
