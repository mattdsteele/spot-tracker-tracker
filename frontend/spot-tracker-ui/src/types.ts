import type { LngLatLike } from 'maplibre-gl';

export type ApiUrls = {
  course: string;
  pings: string;
  transitions: string;
  geofences: string;
};

export type Pings = Ping[];

export type Ping = {
  latitude: number;
  longitude: number;
  time: number;
};

export type FenceDefinition = {
  'fence-name': string;
  geometry: LngLatLike;
};

export type course = {
  name: string;
  route: point[];
  pointsOfInterest: pointsOfInterest[];
};

export type point = {
  latitude: number;
  longitude: number;
};

export type pointsOfInterest = {
  latitude: number;
  longitude: number;
  name: string;
};

export type GeofenceTransition = {
  eventType: string;
  geofence: string;
  deviceId: string;
  eventTime: string;
  location: LngLatLike;
};
