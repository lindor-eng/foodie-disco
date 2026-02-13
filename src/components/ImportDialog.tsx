"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/client-utils";

type Stage = "select" | "preview" | "importing" | "done" | "error";

interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
}

export default function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("select");
  const [fileName, setFileName] = useState("");
  const [previewNames, setPreviewNames] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [geoJsonData, setGeoJsonData] = useState<unknown>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  const reset = useCallback(() => {
    setStage("select");
    setFileName("");
    setPreviewNames([]);
    setTotalCount(0);
    setGeoJsonData(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  function handleClose() {
    if (stage === "done") router.refresh();
    reset();
    onClose();
  }

  // Sync dialog open/close with the `open` prop
  const setDialogRef = useCallback(
    (node: HTMLDialogElement | null) => {
      (dialogRef as React.MutableRefObject<HTMLDialogElement | null>).current = node;
      if (node) {
        if (open && !node.open) {
          node.showModal();
        } else if (!open && node.open) {
          node.close();
        }
      }
    },
    [open]
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
          setError("This doesn't look like a valid Google Takeout GeoJSON file.");
          setStage("error");
          return;
        }

        const names: string[] = [];
        for (const f of data.features) {
          if (f.properties?.Title) names.push(f.properties.Title);
        }

        setGeoJsonData(data);
        setTotalCount(names.length);
        setPreviewNames(names.slice(0, 5));
        setStage("preview");
      } catch {
        setError("Could not parse this file. Make sure it's a valid JSON file.");
        setStage("error");
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setStage("importing");
    try {
      const res = await apiRequest("/api/locations/import", {
        method: "POST",
        body: JSON.stringify(geoJsonData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Import failed");
      }
      const data: ImportResult = await res.json();
      setResult(data);
      setStage("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStage("error");
    }
  }

  if (!open) return null;

  return (
    <dialog
      ref={setDialogRef}
      onClose={handleClose}
      className="w-full max-w-md rounded-2xl border border-border bg-background p-0 shadow-xl"
    >
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Import Places
          </h2>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {stage === "select" && (
          <div>
            <p className="mb-4 text-sm text-muted">
              Upload your Google Takeout <span className="font-mono text-xs">Saved Places.json</span> file.
            </p>
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border px-6 py-10 transition-colors hover:border-accent hover:bg-surface">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-sm font-medium">Choose a file</span>
              <span className="text-xs text-muted">.json or .geojson</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.geojson"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        )}

        {stage === "preview" && (
          <div>
            <div className="mb-4 rounded-lg bg-surface p-4">
              <div className="mb-1 text-sm font-medium">{fileName}</div>
              <div className="text-sm text-muted">
                {totalCount} place{totalCount !== 1 ? "s" : ""} found
              </div>
            </div>

            {previewNames.length > 0 && (
              <div className="mb-5">
                <div className="mb-2 text-xs font-medium text-muted">
                  Preview
                </div>
                <ul className="space-y-1">
                  {previewNames.map((name, i) => (
                    <li key={i} className="truncate text-sm">
                      {name}
                    </li>
                  ))}
                  {totalCount > 5 && (
                    <li className="text-xs text-muted">
                      and {totalCount - 5} more...
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={reset}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Import {totalCount} place{totalCount !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        )}

        {stage === "importing" && (
          <div className="flex flex-col items-center py-8">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
            <p className="text-sm text-muted">Importing places...</p>
          </div>
        )}

        {stage === "done" && result && (
          <div>
            <div className="mb-5 rounded-lg bg-accent-soft p-4 text-center">
              <div className="mb-1 text-2xl font-display font-semibold">
                {result.imported}
              </div>
              <div className="text-sm text-muted">
                place{result.imported !== 1 ? "s" : ""} imported
                {result.skipped > 0 && (
                  <span>
                    {" "}({result.skipped} duplicate{result.skipped !== 1 ? "s" : ""} skipped)
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Done
            </button>
          </div>
        )}

        {stage === "error" && (
          <div>
            <div className="mb-5 rounded-lg border border-danger/20 bg-danger/5 p-4 text-center">
              <p className="text-sm text-danger">{error}</p>
            </div>
            <button
              onClick={reset}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
