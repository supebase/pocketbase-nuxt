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
