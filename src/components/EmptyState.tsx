"use client";

export default function EmptyState({
  onImportClick,
}: {
  onImportClick: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-soft">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>

      <h2 className="mb-2 font-display text-2xl font-semibold tracking-tight">
        No locations yet
      </h2>
      <p className="mb-8 max-w-sm text-center text-muted">
        Import your saved places from Google Takeout to see them organized and
        grouped by type.
      </p>

      <button
        onClick={onImportClick}
        className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Import Places
      </button>
    </div>
  );
}
