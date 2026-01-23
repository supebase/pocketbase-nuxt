export interface EditorModel {
  content: string;
  action: string;
  icon?: string;
  link?: string;
  published: boolean;
  allow_comment: boolean;
}

export interface LocationData {
  location: string;
  ip: string;
}

export interface UseGeoLocationReturn {
  locationData: Ref<LocationData>;
  fetchGeo: () => Promise<void>;
}
