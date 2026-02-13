export interface Location {
  id: number;
  name: string;
  address: string | null;
  primaryType: string | null;
  primaryTypeDisplayName: string | null;
  latitude: number | null;
  longitude: number | null;
  source: "imported" | "search" | "manual";
  googleMapsUrl: string | null;
  googlePlaceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocationGroup {
  type: string;
  displayName: string;
  locations: Location[];
}
