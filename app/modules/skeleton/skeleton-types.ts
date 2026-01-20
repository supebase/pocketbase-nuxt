export interface SkeletonItem {
  type: 'circle' | 'rect' | 'divider' | 'group' | 'slot';
  class?: string;
  width?: string;
  height?: string;
  count?: number;
  items?: SkeletonItem[];
  hasLine?: boolean;
}
