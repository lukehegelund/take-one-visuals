# Wedding collections

This is the first design iteration, starting with Rachel and Ryan. The reusable
personal template will be made after Luke finishes fine-tuning this page.

The top Films menu and all-films links now open `/weddings/`; the original
`films.html` portfolio is available as Highlights from collection navigation.
The archive includes every identified wedding collection with at least one
uploaded delivery film, including one-film and partial collections. Names come
from Drive and dates from Supabase; unknown wedding dates are omitted. Empty
folders do not get empty public pages.

For navigation-only edits to city pages, run
`python3 build_location_pages.py --navigation-only`. The live city pages contain
later editorial changes that the original full generator does not yet include;
do not run its default full rebuild merely to change navigation.

Luke approved public viewing and live publication on September 10, 2026.
Each published film has anyone-with-link viewer access. Folder permissions
are preserved; the site never links to delivery folders. Film titles have no descriptive captions and the page has no Drive
file/folder link. Preserve this presentation for future collections. Drive's own
embedded player can still expose its native file controls; it is not a mechanism
for hiding video file URLs from viewers.

## Architecture

- Google Drive owns the original videos. The page streams Drive's `/preview`
  player directly, with one active iframe. No video downloads, copies, API keys,
  or Supabase credentials are shipped to visitors.
- Main-film thumbnails are cached at `images/weddings/<first-drive-id>.jpg`.
  Archive cards and couple-page social previews always use the first video's
  actual Drive thumbnail. No expiring thumbnail URL is shipped to visitors.
- A small record per couple is stored as JSON in Supabase `memory`, tagged
  `tov-wedding-gallery`. Its checked-in copy is `data/weddings/<slug>.json`.
- `build_weddings.py` validates those records and generates `/weddings/` and
  `/weddings/<slug>/index.html`. Shared `weddings.css` and `weddings.js` control
  every couple's layout. A new couple requires data, not new page code.
- The archive searches names/date and reveals 24 cards at a time. It loads no
  video players. Each couple loads only its own seven (or other number of) film
  metadata records. Tested with 350 collections.
- Video content stays live in Drive. New files are NOT silently published:
  an AI adds verified files to the couple's record, then regenerates/publishes.
  Replacing a file's content while preserving its Drive ID updates playback.
- Drive still controls the actual player UI and availability. These embeds
  depend on Drive's sharing, processing, and traffic limits. Switching video
  hosting later should extend the shared renderer, not rebuild every page.

## AI authoring workflow

1. Read the Supabase note `TOV wedding collections — authoring and publishing`
   and the repo's `WEDDING_COLLECTIONS.md`. Find the couple in `weddings` for
   verified names/date; do not export contact, payment, or contract fields.
2. Find their delivered-video folder in personal Drive. Use a direct folder
   listing; keyword search can miss uploaded videos. Select finished videos
   deliberately, excluding raw footage, contracts, alternate drafts, and
   unrelated files. Read each file's permission metadata.
3. Create/update a `memory` reference titled `TOV wedding gallery — <slug>`,
   tagged `tov-wedding-gallery` and `takeonevisuals`; body is ONLY valid JSON
   matching the existing record. `schema_version` is 1. Use a stable unique
   lowercase slug, adding date if names collide. Do not rename existing slugs.
4. Mirror that JSON into `data/weddings/<slug>.json`. Export only this allowlisted
   data. The exact useful query is:

   ```sql
   select body::jsonb as gallery
   from memory
   where kind = 'reference' and status = 'active'
     and tags @> array['tov-wedding-gallery']
     and title = 'TOV wedding gallery — rachel-ryan';
   ```

   The AI can write the returned object directly; no database password is needed.
5. Keep `status: "draft"` until publication is authorized and every selected
   video is playable by the intended audience. Use `python3 build_weddings.py
   --preview` locally to include drafts. Preview output is NOT a privacy boundary
   and MUST NOT be committed or pushed. It is marked noindex for indexing only.
6. For public playback, each selected Drive file needs `anyone`/`reader` access.
   Luke authorized public viewing and this full archive expansion. For later
   work outside that scope, obtain authorization before exposing restricted files. Use file-level
   grants with `allowFileDiscovery: false`; never expose the whole delivery
   folder or give editing access. Preserve all existing permissions. Check an
   anonymous preview as well as permission metadata. A logged-in owner seeing a
   video is not proof that public playback works.
7. Set the record to `published` in Supabase and its JSON copy. Run:

   ```sh
   python3 sync_wedding_thumbnails.py
   python3 build_weddings.py
   python3 -m unittest discover -s tests -p 'test_weddings.py'
   node --check weddings.js
   python3 sync_wedding_thumbnails.py --check
   python3 build_weddings.py --check
   ```

8. Commit only relevant files. Follow the Supabase `Clean pushes to a shared
   live site` runbook: rebase immediately before pushing, regenerate/check after
   rebase, push without force, confirm GitHub Pages deployed that commit.
9. Verify the live archive, direct couple URL, and film links (`#ceremony`, etc.).
   Save the current live URLs and state in the Supabase authoring note.

## Record rules

Array order is film order; the first video opens by default. Each video needs a
stable `id`, viewer-facing `title`, verified `drive_id`, `landscape` or `portrait`
format, and short factual `description`. Dates use YYYY-MM-DD or `null` when unverified. Never use an upload date as
a wedding date. Undated collections sort after dated collections. No guessed venue,
runtime, or wedding details. Unknown fields, unsafe slugs, and duplicate film IDs
are rejected. Set status to `draft` to withdraw a collection on the next build;
the generator removes only its own generated pages.

The public site does not query the personal Supabase database at visitor runtime.
The existing memory table's protections remain intact. Future automation can use
the same record export/build flow without exposing private business records.

## Covers and incomplete deliveries

The first `videos` entry is the main video and determines both initial playback
and the cover image. Prefer the finished wedding film when available; a
ceremony or highlight can be the main video for a partial delivery. To add a
newly delivered film, update the same record and rebuild. If it becomes the main
film, move it to the first position and run `sync_wedding_thumbnails.py`. Run
that script with `--refresh` when replacing a main video's content under the
same Drive ID. Google chooses the source thumbnail, which can be dark when the
video begins with a fade. The site preserves that actual thumbnail.

September 10 inventory: Cole & Caitlin's delivery folder is empty. Jennifer's
latest ceremony (v4) and the loose `Wedding Video Final.mov` from June 2022
need confirmed couple names. Do not guess their identities. Excluded raw
footage, superseded edits, photos, and unrelated commercial/family uploads.
Moriah & Dane includes their latest wedding film and nine delivered video
messages. Video book versions are labeled separately.
