import type { Ref } from 'vue';

export interface EditorModel {
  content: string;
  action: string;
  icon?: string;
  link?: string;
  published: boolean;
  poll: boolean;
  reactions: boolean;
  allow_comment: boolean;
}

export interface RealtimePayload {
  collection: string;
  action: string;
  record: any;
}

export interface LocationData {
  location: string;
  ip: string;
}

export interface UseGeoLocationReturn {
  locationData: Ref<LocationData>;
  fetchGeo: () => Promise<void>;
}

export interface RawUserStats {
  total_users: number;
  today_new_users: number;
  yesterday_new_users: number;
  active_users_30d: number;
}

export interface DisplayStatItem {
  label: string;
  value: number;
  icon: string;
  desc: string;
  growth?: number;
}

export interface PartyMessage {
  type: 'connections' | string;
  value: string;
}

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

export interface PasswordRequirement {
  met: boolean;
  text: string;
}

export interface TocLink {
  id: string;
  text: string;
  depth?: number;
  children?: TocLink[];
}

export interface CleanRule {
  name: string;
  pattern: RegExp;
  replacement: string;
}

export interface CacheEntry {
  value: string;
  expiry: number;
}

export interface ServerMetrics {
  status: string;
  mode: string;
  total_connections?: number;
  unique_devices?: number;
  system_resource?: {
    heap_used: string;
    rss: string;
    uptime: string;
  };
  summary?: {
    total_active_connections: number;
    total_unique_devices?: number;
    server_time: string;
  };
  instances?: Array<{
    pm_id: number;
    status: string;
    connections: number;
    cpu: string;
    memory: string;
    restart_count: number;
  }>;
}

export interface RefreshState {
  isRefreshing: Ref<boolean>;
  isResetting: Ref<boolean>;
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
}

export type TransformFn<T> = (items: T[]) => T[];
