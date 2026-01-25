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
