"use client";

import { useState } from "react";
import type { Location } from "@/lib/types";
import Header from "./Header";
import EmptyState from "./EmptyState";
import LocationList from "./LocationList";
import ImportDialog from "./ImportDialog";

export default function PageShell({ locations }: { locations: Location[] }) {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onImportClick={() => setImportOpen(true)} />

      {locations.length === 0 ? (
        <EmptyState onImportClick={() => setImportOpen(true)} />
      ) : (
        <LocationList locations={locations} />
      )}

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}
