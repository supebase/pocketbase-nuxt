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
