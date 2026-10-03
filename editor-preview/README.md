# Wedding editor preview

Direct public URL: https://takeonevisuals.com/editor-preview/. Absent from public navigation and sitemap, with noindex/nofollow. No authentication, privileged keys, private video IDs or private source paths are shipped.

`template.json` is the complete versioned web template: all 67 current picture/planning cards, exact timing, musical grid/anchors, track order, authored instruction text, public demo alternatives, speed/retime/fade/transition defaults and approved revisions. It was seeded from the verified Supabase native capture, then revised under the new Supabase + website authority. The native Resolve template is historical and was not changed. This web version fills the seed's missing Gear 4 music planning span so the unducked music lane remains readable through the lift.

The approved kiss false ending fades during the kiss, immediately restarting reception at measure 41 without a release/cheer interlude or black hold. Default fade is 1 second, adjustable in the inspector. Expanded Gear 4/5 scoring and breather bridges are represented directly in the purple planning cards. Audio is not played; harmonic keys remain unverified until a real song is chosen. The browser previews 70% speed with playbackRate; Optical Flow is an instruction for the edit, not browser interpolation.

Public example assets are referenced from `/cam-b/clips/`, already selected through the authorized `tov-approved-films` TwelveLabs index and published for the shot guide. There is no live semantic search or new API upload. Primary demo excerpt IDs are unique; alternatives may be reused. Several movies supply the examples, not one coherent wedding. Excerpts loop to illustrate musical slots; assembled/source footage is not exported. Dialogue planning stays locked below B-roll, preserving template timing without claiming actual synchronized speech playback.

The default viewer displays active template instructions independently of footage: Picture across the top, Dialogue/A-roll full width below, Music left / Custom Scoring right, Ambient SFX left / Clip SFX right. Empty lanes explain when no cue is needed. Template transport works with no media populated. Phase cues show the opening/closing fades, centered dissolves, kiss fade and immediate reception restart without fading the readable instructions. Demo footage is a separate viewer toggle; auditioning a take switches into it. The viewer has a fixed responsive height and reserves space for the transition cue. Four fixed card rows keep the timeline and transport stationary throughout scrubbing; long instructions scroll inside their own card. `tests/editor-layout-stability.cjs` checks page, viewer, transport and timeline geometry across 32 template instants at desktop, narrow-desktop and phone sizes.

The default layout keeps the media pool hidden, the inspector collapsed, and share/save/import/reset/tempo under Options. A compact Section menu navigates story anchors.

The playhead head and full vertical line support pointer-captured dragging over the ruler, all tracks and clips, with continuous time/card updates. Mouse/touch share the same path; coordinate conversion uses the current scrolled timeline rectangle and zoom. Home/End and arrow keys work on the focused playhead. Clip dragging stays independent.

Device variants live in localStorage. Share URLs include only template fingerprint, measure-relative trims, take choices, speeds, fades and grid tempo. Save/Open JSON round-trip the same validated allowlisted representation. They cannot change authoritative template defaults or insert arbitrary source URLs. Incompatible versions open the current demo with an explanation.

## Maintaining the authoritative template

1. Read Supabase memory `Wedding film timeline templates (artifact)` and `Wedding template — website and Supabase authority`, then `Wedding web template — current`. Its manifest points to the immutable complete JSON fragments for the current revision. Read the relevant approved preference/override notes too. Resolve need not be open.
2. Reconstruct the complete JSON by concatenating the fragment fields from the listed `full_record_parts` in order. Verify fingerprint using `tools/validate_editor_template.py`. Compare with the website's `template.json`; investigate any mismatch before editing.
3. Apply the requested revision to the complete JSON, including affected card text, slots, musical anchors and defaults. Increment `revision` and approved override notes. Compute `fingerprint` as SHA-256 of JSON with the fingerprint property omitted, sorted keys, compact separators, Python's default ASCII escaping. Never include secrets, raw source locations or private footage. Preserve unrelated concurrent website changes.
4. Use the authenticated Supabase connector, not the public page, to write the complete revision as immutable memory reference fragments of at most 2,000 JSON characters each. Fragment row titles are `Wedding web template — revision <revision> — part NNN`, tagged `wedding-web-template`. Each body is JSON `{part,fragment}`. Keep serialized row bodies below 3,000 characters. In one SQL statement/transaction create the revision parts and update `Wedding web template — current` to its manifest: revision, fingerprint, URL, card counts, approved override IDs and ordered full_record_parts. Read Supabase write rules before any write. Verify part count, reconstructed fingerprint and JSON equality to the website file. Do not change historical native mirror rows.
5. Rebase immediately before push, validate data and rerun browser journeys after the rebase, then push only this page and its checks. Verify deployment succeeded on that commit and that the live JSON fingerprint equals Supabase. Update current manifest publication status/commit after verification. Never mark the website synchronized based only on a push.

No public Supabase write endpoint is deployed. Future assistant changes use the existing authenticated connector and GitHub publication workflow. Page users can save personal variants, not edit shared defaults.

## Validation

Run a repository-root HTTP server and the repeatable harness:

```sh
python3 tools/validate_editor_template.py
python3 -m http.server 8766
node tests/editor-preview-journeys.cjs
node tests/editor-planning-journeys.cjs
```

Set `EDITOR_BASE` to the public origin to rerun against the deployed version. `PW_EXECUTABLE` optionally selects an installed testing Chromium binary. The planning harness adds desktop, narrow-desktop and mobile layout, populated-independent active cards, unpopulated template playback, phase cues, captured ruler/line dragging through every track at several zoom/scroll offsets, a real touch-pointer journey and compact-panel controls. The original harness covers desktop/mobile playback for every audition, clip selection, inspector and pointer resizing, keyboard movement, tempo/zoom, persistence, share/save/import, readable template lanes, A-roll lock, dissolves, kiss fade/restart and absence from homepage navigation. It does not validate real source synchronization, musical beat/key analysis, real audio mixing or Resolve integration.

Free timeline editing: drag or trim clips on all six lanes; start and length inputs provide precise mobile edits. B / Split cuts the selected card at the playhead, Delete removes it, Cmd/Ctrl Z undoes and Cmd/Ctrl Shift Z redoes. These are local variants, saved through device storage, JSON or share links; they do not overwrite the authoritative template. Split cards reuse only approved template assets. Duration grows beyond 56 measures when needed. This is a planning editor, not a media renderer or full Resolve replacement. Run tests/editor-free-edit.cjs for editing/persistence coverage. Earlier locked-slot/import-lock assertions describe the old behavior and are superseded by this journey.

The demo footage mode, audition controls, auto-population and section selector have been removed. The viewer stays in a fixed upper viewport band while the timeline scrolls in its own pane. Track height scales all lanes from 48 to 200 pixels and persists per device. Planning cards remain independently scrollable. Verify with tests/editor-vertical-layout.cjs and tests/editor-free-edit.cjs; older demo and section-selector journeys describe retired UI.
