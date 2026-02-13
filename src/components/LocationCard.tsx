"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Location } from "@/lib/types";
import { apiRequest } from "@/lib/client-utils";

export default function LocationCard({ location }: { location: Location }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete "${location.name}"?`)) return;

    setDeleting(true);
    const res = await apiRequest(`/api/locations/${location.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.refresh();
    } else {
      setDeleting(false);
      alert("Failed to delete. Make sure your admin token is set.");
    }
  }

  const nameContent = (
    <span className="font-medium">{location.name}</span>
  );

  return (
    <div
      className={`group/card flex items-start justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-hover ${
        deleting ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {location.googleMapsUrl ? (
            <a
              href={location.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate font-medium transition-colors hover:text-accent"
            >
              {location.name}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1 inline-block text-muted"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          ) : (
            nameContent
          )}
        </div>

        {location.address && (
          <p className="mt-0.5 truncate text-sm text-muted">
            {location.address}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">
          {location.source}
        </span>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover/card:opacity-100"
          title="Delete location"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
