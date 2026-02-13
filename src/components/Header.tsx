"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { getAdminToken, setAdminToken } from "@/lib/client-utils";

function useStoredToken() {
  return useSyncExternalStore(
    () => () => {},
    () => getAdminToken() ?? "",
    () => ""
  );
}

export default function Header({
  onImportClick,
}: {
  onImportClick: () => void;
}) {
  const storedToken = useStoredToken();
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [token, setToken] = useState(storedToken);
  const [saved, setSaved] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setShowTokenInput(false);
      }
    }
    if (showTokenInput) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showTokenInput]);

  function handleSaveToken() {
    setAdminToken(token);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setShowTokenInput(false);
    }, 1000);
  }

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white text-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-semibold tracking-tight">
          Foodie Disco
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onImportClick}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Import
        </button>

        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setShowTokenInput(!showTokenInput)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground"
            title="Set admin token"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </button>

          {showTokenInput && (
            <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-background p-4 shadow-lg">
              <label className="mb-2 block text-xs font-medium text-muted">
                Admin Token
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your admin token"
                  className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent"
                  onKeyDown={(e) => e.key === "Enter" && handleSaveToken()}
                />
                <button
                  onClick={handleSaveToken}
                  className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                >
                  {saved ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
