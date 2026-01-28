import type { TypedPocketBase } from './types';

declare module 'h3' {
  interface H3EventContext {
    pb: TypedPocketBase;
    _pb: TypedPocketBase;
    user?: any;
  }
}

export {};
