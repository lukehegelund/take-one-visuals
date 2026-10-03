# TOV workspace

`/studio/` uses Supabase project `kxsuzgpnvtepsyhkezin` (web-app-backend) for email/password authentication. Supabase JS 2.58.0 is vendored unchanged from its npm UMD distribution. Only a publishable key is shipped.

`public.tov_studio_memberships` is authoritative for application roles. Authenticated users can read only their own membership; they cannot insert, edit, or delete roles. Administrators assign roles through the trusted backend. Owner: both tools. Shooter: shotlist. Editor: editor template. Couple: reserved, no tools yet. No public signup form.

The client gate is a navigation convenience. GitHub Pages HTML, template JSON, clips, and source remain public, and this does not make them private. Sensitive future client content must be stored behind Supabase RLS/storage policies or served through an authenticated backend. Existing checklist/timeline changes continue to save on the device; login does not add cloud synchronization.

Open `/tests/studio-journeys.html` locally for seven repeatable browser journeys covering roles, wrong passwords, logout, and unavailable membership lookup. These use auth stubs, so real Supabase login must also be verified. Database checks confirm owner sees one membership and an unrelated user sees zero.

Shared Shotlist / Editor navigation is styled by navigation.css. Signed-in owners land directly on the shotlist, editors on the editor, and shooters on the shotlist; the login panel appears only when needed. Both tools and the login share slate backgrounds and warm gold accents.

Invitations and recovery emails must redirect to https://takeonevisuals.com/studio/password.html (add that exact URL in Auth redirect settings). Invite members using the trusted Auth admin API or dashboard, then assign their membership server-side. Users set their own password on this page; no public signup or self-assigned role is added. The page consumes implicit invite/recovery links and supports reloading an unfinished form in the same tab. Password reset is linked from login. Email delivery requires working SMTP.
