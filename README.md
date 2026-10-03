# Take One Visuals

Boutique wedding videography website for [takeonevisuals.com](https://takeonevisuals.com).

Static HTML/CSS/JS hosted on GitHub Pages. Films embedded from YouTube. Inquiries handled through Honeybook.

## Structure

- `index.html` — homepage (hero video, featured films, about strip, testimonial, inquiry CTA)
- `films.html` — full films portfolio
- `weddings/` — full couple collections, generated from `data/weddings/`
- `WEDDING_COLLECTIONS.md` — Supabase/Drive authoring and publication instructions
- `videos/` — hero video assets (poster, desktop, mobile sources)
- `images/` — site imagery
- `thumbnails-yt-picks/` — custom YouTube thumbnails (also used as Films page thumbnails)

## Local development

Open `index.html` directly in a browser, or serve with `python3 -m http.server 8000`.

Cake activity pairs use cutting first, eating together second, with the couple visible. Backups match each role; missing eating is flagged and replaced with a different covered activity pair. The existing two activity slots keep their timing.

Revision 2026-10-03.14 matches the shortened Gear 2 ending: one couple dance shot, one golden-hour walking shot, and a closing drone/couple shot. Holds are 2/2/6 measures, about 30 seconds at the preview tempo. Cut into golden hour, one-second dissolve into closing, and final two-second fade. Earlier reception slots remain unchanged.

Editing authority: Personal Assistant Supabase, Editing Handbook — START HERE. All operations, defaults and project routing live there. The website publishes the handbook child `Wedding web template — current`; it is not an independently authored rules source. Export `{manifest, parts:[{title,body}]}` privately through the connector, then run `python3 tools/sync_editor_template.py <export.json>` followed by the validator. `--check` compares without writing. Never expose private database credentials or handbook evidence in the site. Mark publication pending until the live revision/fingerprint match; preserve old source versions as history.
