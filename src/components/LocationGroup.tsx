import type { Location } from "@/lib/types";
import LocationCard from "./LocationCard";

export default function LocationGroup({
  displayName,
  locations,
}: {
  displayName: string;
  locations: Location[];
}) {
  return (
    <details open className="group">
      <summary className="flex cursor-pointer list-none items-center gap-3 py-2 [&::-webkit-details-marker]:hidden">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted transition-transform group-open:rotate-90"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <h2 className="font-display text-base font-semibold tracking-tight">
          {displayName}
        </h2>
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
          {locations.length}
        </span>
      </summary>

      <div className="mt-2 space-y-1.5 pl-7">
        {locations.map((loc) => (
          <LocationCard key={loc.id} location={loc} />
        ))}
      </div>
    </details>
  );
}
