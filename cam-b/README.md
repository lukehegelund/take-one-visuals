# Cam B field guide

Unlisted URL: https://takeonevisuals.com/cam-b/

The page is deliberately absent from public navigation and sitemap.xml. It carries `noindex, nofollow`; anyone with the URL can open it.

The 43 shot cards follow wedding-day filming order, derived from Supabase memory “Wedding film timeline templates — reference” (approved October 2, 2026). That template's film sequence differs from filming order. First look and golden-hour timing follow the actual wedding schedule.

`shots.json` holds the sections, Essential shots/Other ideas categories, filming cues, three variations per shot and editor placements. `shotlist.js` renders the tabs, rotating players and miniature editor timeline. `sources.json` records the TwelveLabs video ID, original filename and time range for each example. Clips were selected from the existing `tov-approved-films` index and visually checked. `clips/` holds muted H.264 MP4 loops and JPEG posters, so playback needs no TwelveLabs API key or external video player. The filenames are asset IDs; visible card numbers follow day order.

Only visible clips load and play. Each shot cycles through three examples from three different weddings, with numbered buttons for manual selection. Each clip and the whole page can be paused. Reduced-motion viewers start paused. Captured checkboxes save in localStorage on the shooter's device; Reset checklist clears them after confirmation.

Run a preview server from the repository root and the browser journeys with Playwright available:

```sh
python3 -m http.server 8765
node tests/cam-b-journeys.cjs
```

`CAM_B_BASE` can target the deployed site. `SCREENSHOT_DIR` sets the screenshot destination. The harness tests desktop/mobile playback for every clip, checklist persistence/reset, section navigation, reduced motion, and absence of a homepage link. It also verifies every variation rotates to the next, hidden panels pause, tab keyboard navigation works, and each editor thumbnail highlights the configured template slots. It does not validate camera assignments for a particular wedding.

The miniature timeline maps the approved template into 13 story slots, with V1 picture, A1 music, A2 vows, and A3 natural sound. Its widths are schematic, not prescribed durations. Golden-hour coverage includes 12 portrait cards: seven essentials and five other ideas. Event cards are essential whenever scheduled and call for the entire moment to be captured cleanly and uninterrupted. Short looping examples demonstrate framing, not recording duration. Ceremony and reception notes require coverage of every scheduled reading, ritual, tradition, game or performance. Only one editor preview can remain open at a time; changing tabs closes previews in the hidden panel. Reception details can fill the second or third opening picture slot.
