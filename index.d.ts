import type { TypedPocketBase } from './types';

declare module 'h3' {
  interface H3EventContext {
    pb: TypedPocketBase;
    user?: any;
  }
}

export {};
