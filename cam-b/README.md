# Cam B field guide

Unlisted URL: https://takeonevisuals.com/cam-b/

The page is deliberately absent from public navigation and sitemap.xml. It carries `noindex, nofollow`; anyone with the URL can open it.

The 24 shot cards follow wedding-day filming order, derived from Supabase memory “Wedding film timeline templates — reference” (approved October 2, 2026). That template's film sequence differs from filming order. First look and golden-hour timing follow the actual wedding schedule.

`shotlist.js` holds the sections, filming cues and clip IDs. `sources.json` records the TwelveLabs video ID, original filename and time range for each example. Clips were selected from the existing `tov-approved-films` index and visually checked. `clips/` holds muted H.264 MP4 loops and JPEG posters, so playback needs no TwelveLabs API key or external video player. The filenames are asset IDs; visible card numbers follow day order.

Only visible clips load and play. Each clip and the whole page can be paused. Reduced-motion viewers start paused. Captured checkboxes save in localStorage on the shooter's device; Reset checklist clears them after confirmation.

Run a preview server from the repository root and the browser journeys with Playwright available:

```sh
python3 -m http.server 8765
node tests/cam-b-journeys.cjs
```

`CAM_B_BASE` can target the deployed site. `SCREENSHOT_DIR` sets the screenshot destination. The harness tests desktop/mobile playback for every clip, checklist persistence/reset, section navigation, reduced motion, and absence of a homepage link. It does not validate camera assignments for a particular wedding.
