export interface SkeletonItem {
  type: 'circle' | 'rect' | 'divider' | 'group' | 'slot';
  class?: string;
  width?: string;
  height?: string;
  count?: number;
  items?: SkeletonItem[];
  hasLine?: boolean;
}

export interface SkeletonType {
  type: 'comments' | 'posts' | 'post' | 'mdc';
  count?: number;
  containerClass?: string;
}
