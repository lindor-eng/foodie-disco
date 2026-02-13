import { getDb } from "@/db/index";
import type { Location } from "@/lib/types";
import PageShell from "@/components/PageShell";

export const dynamic = "force-dynamic";

export default function Home() {
  const db = getDb();
  const locations = db
    .prepare(
      `SELECT * FROM locations ORDER BY COALESCE(primaryTypeDisplayName, 'zzz'), name`
    )
    .all() as Location[];

  return <PageShell locations={locations} />;
}
