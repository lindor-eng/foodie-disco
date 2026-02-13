# Plan: Location Manager for Foodie Disco

## Context

Build a personal location management tool that lets users import their Google Maps saved places (via Google Takeout file upload) and search for new locations by name. Locations are stored in a database and displayed as a list, automatically grouped by type (e.g., "Japanese Restaurant", "Museum").

---

## Tech Stack Additions

- **Database**: Turso (cloud SQLite) via `drizzle-orm` + `@libsql/client` — works locally during dev, deployable to serverless (Vercel, etc.). Pure JS client — no native module bundling issues.
- **API**: Google Places API (New) for search and type enrichment
- **Auth**: Simple token-based auth for mutation endpoints (env var `ADMIN_TOKEN`)
- **Packages to install**:
  - Runtime: `drizzle-orm`, `@libsql/client`
  - Dev: `drizzle-kit`

---

## Database Schema

**`locations` table** (`src/db/schema.ts`):

| Column | Type | Notes |
|--------|------|-------|
| id | integer PK | auto-increment |
| name | text | required |
| address | text | nullable |
| primaryType | text | machine-readable, e.g. `"japanese_restaurant"` |
| primaryTypeDisplayName | text | human-readable, e.g. `"Japanese Restaurant"` |
| latitude | real | nullable |
| longitude | real | nullable |
| source | text | `"imported"` / `"search"` / `"manual"` |
| googleMapsUrl | text | for deduplication + linking |
| googlePlaceId | text | for API lookups |
| createdAt | text | ISO timestamp |
| updatedAt | text | ISO timestamp |

DB connection singleton at `src/db/index.ts`. Uses Turso — local file during dev, cloud URL for production.

---

## File Structure (new files)

```
src/
  db/
    schema.ts                     # Drizzle schema
    index.ts                      # DB connection singleton
  lib/
    google-places.ts              # Server-side Places API client
    geojson-parser.ts             # Parse Google Takeout GeoJSON
    auth.ts                       # Admin token check for mutation endpoints
    types.ts                      # Shared TypeScript interfaces
  app/
    layout.tsx                    # UPDATE: app title/metadata
    page.tsx                      # UPDATE: main location list page
    share/
      [type]/page.tsx             # Public shareable page filtered by type
    api/
      locations/
        route.ts                  # GET all, POST new location
        [id]/route.ts             # DELETE single location
        import/route.ts           # POST GeoJSON file upload
        enrich/route.ts           # POST enrich types via Places API
      places/
        search/route.ts           # GET proxy to Google Places Text Search
  components/
    Header.tsx                    # App header with import button + search
    SearchBar.tsx                 # Debounced search input
    SearchResults.tsx             # Dropdown with "Add" action per result
    ImportDialog.tsx              # File upload modal with preview
    LocationList.tsx              # Groups locations by type
    LocationGroup.tsx             # Collapsible section per type
    LocationCard.tsx              # Single location row
    ShareButton.tsx               # Copy share link for a type group
    OnboardingFlow.tsx            # Step-by-step guide for new users
    EmptyState.tsx                # Shown when no locations exist
drizzle.config.ts                 # Drizzle Kit config (project root)
.env.local                        # GOOGLE_PLACES_API_KEY, TURSO_*, ADMIN_TOKEN
```

---

## Key Design Decisions

1. **Import vs Enrichment are separate steps** — Google Takeout GeoJSON has names/addresses/coords but **no category/type data**. Import is fast and free. Enriching with types costs Places API credits, so it's opt-in after import.

2. **Duplicate detection on import** — Skip locations with matching `googleMapsUrl` already in the DB.

3. **Server Components for the list** — `LocationList` queries SQLite directly (no API roundtrip). Client Components only where interactivity is needed (search, dialog, delete).

4. **Places API key stays server-side** — API route proxies search requests so the key is never exposed to the browser.

5. **Onboarding flow for new users** — When the DB has zero locations, the main page shows a guided onboarding flow instead of an empty list. The flow walks users through exporting their Google Maps saved places via Google Takeout with clear, step-by-step instructions and screenshots/illustrations. Ends with the file upload step so they can import immediately.

6. **Shareable URLs by type** — Each type group has a share button that copies a public URL like `/share/japanese-restaurant`. The share page is a read-only Server Component that queries the DB for locations matching that type — no editing, no search, just a clean list. Uses the slug form of `primaryType` as the URL parameter.

7. **Enrichment cost awareness** — Before batch enrichment, show the user: number of locations to enrich, estimated cost (~$0.032/request), and a confirmation step. Also support per-location enrichment (click to enrich one at a time) as a lower-cost alternative.

8. **Admin token auth on mutation endpoints** — All write endpoints (POST/DELETE on locations, import, enrich) require an `Authorization: Bearer <token>` header matching `ADMIN_TOKEN` env var. Read-only endpoints (GET locations, share pages) remain public. Auth helper at `src/lib/auth.ts`. The frontend sends the token from a cookie or local storage set during a simple login step.

9. **Turso for deployment readiness** — Using `@libsql/client` instead of `better-sqlite3`. During local dev, connects to a local SQLite file (`file:./data/foodie-disco.db`). For production, set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to connect to a Turso cloud database. This also eliminates native module bundling issues with Next.js.

---

## Implementation Steps

### Step 1: Database setup (Turso + Drizzle)
- Install deps: `drizzle-orm`, `@libsql/client`, dev: `drizzle-kit`
- Create `drizzle.config.ts`, `src/db/schema.ts`, `src/db/index.ts`
- DB connection uses `@libsql/client` — reads `TURSO_DATABASE_URL` env var, falls back to `file:./data/foodie-disco.db` for local dev
- Create `data/` directory, add `data/*.db*` to `.gitignore`
- Create `.env.local` with `TURSO_DATABASE_URL=file:./data/foodie-disco.db` and `ADMIN_TOKEN=<generate-random-token>`
- Run `npx drizzle-kit push` to create the DB
- **Verify**: `npx drizzle-kit studio` confirms table exists

### Step 2: Auth middleware + Locations CRUD API
- `src/lib/auth.ts` — helper that checks `Authorization: Bearer <token>` against `ADMIN_TOKEN` env var. Returns 401 if missing/invalid.
- `src/app/api/locations/route.ts` — GET (public, ordered by type then name), POST (auth required)
- `src/app/api/locations/[id]/route.ts` — DELETE (auth required)
- **Verify**: curl GET returns `[]`. POST without token returns 401. POST with correct Bearer token creates a location.

### Step 3: GeoJSON parser + import endpoint
- `src/lib/types.ts`, `src/lib/geojson-parser.ts`
- `src/app/api/locations/import/route.ts`
- Handle missing fields gracefully, skip duplicates by `googleMapsUrl`
- **Verify**: POST a test GeoJSON payload, confirm locations created

### Step 4: Places API proxy
- Create `.env.local` with `GOOGLE_PLACES_API_KEY`
- `src/lib/google-places.ts`, `src/app/api/places/search/route.ts`
- Uses Places API (New) Text Search endpoint
- **Verify**: curl search query returns results (requires valid API key)

### Step 5: Enrichment endpoint (auth required)
- `src/app/api/locations/enrich/route.ts` — POST, auth required
- Supports two modes:
  - **Batch**: `POST /api/locations/enrich` — enriches all locations with null `primaryType`
  - **Single**: `POST /api/locations/enrich` with `{ id: 123 }` — enriches one specific location
- Returns count of locations to enrich + estimated cost before processing (dry-run with `?preview=true`)
- Sequential processing with 200ms delay between requests to avoid rate limits
- **Verify**: After importing GeoJSON, call with `?preview=true` to see cost estimate, then enrich and confirm types populated

### Steps 6–12: All frontend/UI work (use `frontend-design` skill)

**IMPORTANT**: All UI implementation steps below MUST use the `/frontend-design` skill to ensure high design quality and avoid generic AI aesthetics.

### Step 6: UI — Layout + Header
- Use `/frontend-design` skill
- Update `layout.tsx` metadata, `page.tsx` with Header
- `src/components/Header.tsx`

### Step 7: UI — Location list
- Use `/frontend-design` skill
- `LocationList.tsx`, `LocationGroup.tsx`, `LocationCard.tsx`, `EmptyState.tsx`
- Grouped by `primaryTypeDisplayName`, "Uncategorized" for null types
- Delete button with confirmation on each card
- **Verify**: Page shows imported locations grouped by type

### Step 8: UI — Onboarding flow
- Use `/frontend-design` skill
- `src/components/OnboardingFlow.tsx` — shown when DB has zero locations (replaces empty state on first visit)
- Multi-step walkthrough with clear visuals:
  1. **Welcome** — brief intro to the app
  2. **Go to Google Takeout** — direct link to `takeout.google.com`, instruct to "Deselect all" then select only "Saved Places" (under Maps)
  3. **Export settings** — choose "Export once", ".json" format, smallest file size
  4. **Download & extract** — wait for export email, download zip, find `Saved Places.json` inside `Takeout/Maps (your places)/`
  5. **Upload** — integrated file upload drop zone right in the onboarding (reuses ImportDialog logic)
- "Skip" option at any step for users who already have their file or want to search manually
- After successful import, transitions to the main location list
- **Verify**: Clear the DB, visit the page, see the onboarding flow, follow steps to import

### Step 9: UI — Import dialog (for returning users)
- Use `/frontend-design` skill
- `src/components/ImportDialog.tsx` — accessible from Header for users who want to import additional files later
- File input (.json/.geojson), preview count + sample names, import button
- After import: shows results + "Enrich types" button
- **Verify**: Full import flow works end-to-end

### Step 10: UI — Search
- Use `/frontend-design` skill
- `SearchBar.tsx` (debounced 300ms), `SearchResults.tsx`
- Results show name, address, type with "Add" button
- Adding a search result saves it with type data already populated
- **Verify**: Search, add, location appears in correct type group

### Step 11: Shareable URLs
- Use `/frontend-design` skill
- `src/app/share/[type]/page.tsx` — Server Component, queries DB for locations where `primaryType` matches the URL param
- Read-only view: location name, address, Google Maps link. No edit/delete/search controls
- Clean, minimal layout suitable for sharing (app title + type heading + list)
- `src/components/ShareButton.tsx` — appears on each `LocationGroup`, copies the share URL to clipboard
- **Verify**: Click share on "Japanese Restaurant" group, open the copied URL in an incognito tab, confirm it shows only Japanese restaurants

### Step 12: Polish
- Use `/frontend-design` skill
- Loading states for search and import
- Error handling with user-friendly messages
- Dark mode verification (already supported by Tailwind setup)

---

## Environment Setup (for reference)

### `.env.local` contents:
```
# Database (local dev uses file, production uses Turso cloud)
TURSO_DATABASE_URL=file:./data/foodie-disco.db
# TURSO_AUTH_TOKEN=         # Only needed for Turso cloud

# Auth token for mutation endpoints (generate a random string)
ADMIN_TOKEN=your-secret-admin-token

# Google Places API key
GOOGLE_PLACES_API_KEY=your_api_key_here
```

### Google API Key Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable "Places API (New)" in APIs & Services > Library
4. Create API key in APIs & Services > Credentials
5. Restrict key to "Places API (New)" only
6. Add to `.env.local` as `GOOGLE_PLACES_API_KEY`

### Turso Cloud Setup (for deployment):
1. Install Turso CLI: `curl -sSfL https://get.tur.so/install.sh | bash`
2. Sign up: `turso auth signup`
3. Create DB: `turso db create foodie-disco`
4. Get URL: `turso db show foodie-disco --url`
5. Get token: `turso db tokens create foodie-disco`
6. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in production env

---

## Verification

- **Import**: Upload a real Google Takeout `Saved Places.json` file, confirm all locations appear
- **Enrich**: Click "Enrich types" after import, confirm locations get categorized
- **Search**: Search for a place, add it, confirm it appears in the right type group
- **Persistence**: Refresh page, all locations still present
- **Share**: Click share button on a type group, open URL in new tab, confirm read-only view with correct locations
- **Auth**: Mutation endpoints reject requests without valid `ADMIN_TOKEN`. GET/share endpoints work without auth.
- **Onboarding**: With empty DB, page shows onboarding flow. After import, transitions to list view.
- **Build**: `npm run build` succeeds, `npm run lint` passes
