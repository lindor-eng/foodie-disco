interface TakeoutFeature {
  type: string;
  geometry?: {
    type: string;
    coordinates?: [number, number];
  };
  properties?: {
    Title?: string;
    "Google Maps URL"?: string;
    Location?: {
      Address?: string;
    };
  };
}

interface TakeoutGeoJSON {
  type: string;
  features?: TakeoutFeature[];
}

export interface ParsedLocation {
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
  source: "imported";
}

export function parseGeoJSON(data: TakeoutGeoJSON): ParsedLocation[] {
  if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    throw new Error("Invalid GeoJSON: expected a FeatureCollection");
  }

  const locations: ParsedLocation[] = [];

  for (const feature of data.features) {
    if (feature.type !== "Feature") continue;

    const name = feature.properties?.Title;
    if (!name) continue;

    const coords = feature.geometry?.type === "Point"
      ? feature.geometry.coordinates
      : undefined;

    locations.push({
      name,
      address: feature.properties?.Location?.Address ?? null,
      latitude: coords ? coords[1] : null,
      longitude: coords ? coords[0] : null,
      googleMapsUrl: feature.properties?.["Google Maps URL"] ?? null,
      source: "imported",
    });
  }

  return locations;
}
