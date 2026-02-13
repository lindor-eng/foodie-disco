import type { Location, LocationGroup } from "@/lib/types";
import LocationGroupComponent from "./LocationGroup";

function groupLocations(locations: Location[]): LocationGroup[] {
  const map = new Map<string, Location[]>();

  for (const loc of locations) {
    const key = loc.primaryTypeDisplayName ?? "Uncategorized";
    const group = map.get(key);
    if (group) {
      group.push(loc);
    } else {
      map.set(key, [loc]);
    }
  }

  const groups: LocationGroup[] = [];
  for (const [displayName, locs] of map) {
    groups.push({
      type: locs[0].primaryType ?? "uncategorized",
      displayName,
      locations: locs,
    });
  }

  groups.sort((a, b) => {
    if (a.displayName === "Uncategorized") return 1;
    if (b.displayName === "Uncategorized") return -1;
    return a.displayName.localeCompare(b.displayName);
  });

  return groups;
}

export default function LocationList({
  locations,
}: {
  locations: Location[];
}) {
  const groups = groupLocations(locations);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <p className="mb-6 text-sm text-muted">
        {locations.length} place{locations.length !== 1 ? "s" : ""} across{" "}
        {groups.length} group{groups.length !== 1 ? "s" : ""}
      </p>

      <div className="space-y-6">
        {groups.map((group) => (
          <LocationGroupComponent
            key={group.type}
            displayName={group.displayName}
            locations={group.locations}
          />
        ))}
      </div>
    </main>
  );
}
