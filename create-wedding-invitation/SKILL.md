---
name: create-wedding-invitation
description: Create, customize, validate, export, package, and publish the classic exhibition-style mobile wedding invitation from couple details, schedule, venue, copy, photos, music, and visual themes. Use for the classic four-screen invitation, continuous film gallery, Chinese red paper styling, PNG/PDF/ZIP exports, hosting, or pre-share checks. Do not use for the separate witness-mode invitation with identity confirmation, personal letters, missions, tickets, and RSVP.
---

# Create Classic Wedding Invitation

Create a private, mobile-first static wedding invitation from structured user input. Use the bundled classic template as the default; preserve its interaction model while adapting copy, media, colors, and event information.

## Workflow

1. Inspect the destination folder and any user-provided images or music. Never overwrite an existing invitation without explicit approval.
2. Collect only missing required information. Read [references/input-schema.md](references/input-schema.md) for fields and defaults. If the user has not explicitly chosen which name appears first, ask naturally before generating; do not infer display order from gender, roles, or the order names were supplied.
3. Ask the user to confirm they have permission to publish supplied portraits, guest information, and replacement music. For the original bundled BGM and images, preserve the notice “严禁商用”; this does not establish the creators' permission. See [references/materials.md](references/materials.md). Do not place guest lists or private messages in a public site unless specifically requested.
4. Classify photos by role and aspect ratio using [references/photo-slots.md](references/photo-slots.md). Use neutral placeholders when assets are missing; do not fabricate portraits of the couple.
5. Before generating, if the user has not specified a style or palette, ask naturally: “想做西式还是中式？西式默认经典米白，中式默认红色纸纹；也可以用你喜欢的其他配色。” Read [references/theme-presets.md](references/theme-presets.md): use `classic` for Western style and `chinese-red-paper` for Chinese style. Honor an explicit custom palette through `custom`. Do not repeat the question when the user's choice is already clear, infer the style from names or venue, or require a separate custom-color decision.
6. Create `invitation.json`, then run:

   ```bash
   python3 scripts/create_invitation.py --config /absolute/path/invitation.json --output /absolute/path/output
   ```

7. When integrating gallery photos, follow [references/copywriting-guide.md](references/copywriting-guide.md) for visitor-facing titles and captions, even when copywriting was not separately requested. Preserve approved copy and any explicit preference for no captions. Preserve facts exactly and avoid inventing relationship history.
8. Run `python3 scripts/validate_invitation.py /absolute/path/output`. Fix every error and review warnings.
9. Preview through an HTTP server, not by opening `file://` directly:

   ```bash
   python3 -m http.server 8000 --directory /absolute/path/output
   ```

10. After all supplied photos, copy and other assets are integrated, perform the final per-page proportion optimization and visual check in [references/mobile-quality.md](references/mobile-quality.md#final-materials-check). Do not treat a placeholder preview as final approval. Recheck after subsequent material changes, before export or publishing.
11. After completing and checking the HTML invitation, proactively ask once whether the user wants a shareable public link, their personal Git repository, or local files only. Explain the convenience and public-data risk before the choice; do not repeat a choice already made. Offer PNG/PDF or ZIP as optional delivery formats. Read [references/exporting.md](references/exporting.md) for exports and [references/deployment.md](references/deployment.md) for local viewing, assisted publishing and account privacy.
12. If the user keeps it local, give a usable same-device preview path or live local URL and explain that localhost cannot be sent to remote guests. If they authorize public hosting, use available browser/computer-use tools to help with Cloudflare account setup and Pages Direct Upload, then verify and return the actual HTTPS link. The user handles passwords, one-time codes, CAPTCHAs and terms; never record account data in this skill or generated files.

## Editing Rules

- Mark any authorization-unverified bundled material “严禁商用”, including the restored original paper. Preserve this notice in the generated website and release package; it does not grant the original creator's permission. The later licensed candidates are not active defaults; do not mislabel the restored materials as those candidates.

- Preserve the latest user-corrected spelling of names and banquet rooms everywhere. Ask “请柬上想把谁的名字放在前面？” when display order is unconfirmed; never default to groom-first or bride-first. An explicit user choice takes priority and remains unchanged on subsequent edits. Use `couple.brideFirst` for display order, without swapping identities; check cover, information card, signature, page title and sharing text.
- Before delivery, follow [references/mobile-quality.md](references/mobile-quality.md) for one-screen layouts, whole-page typography and readable closing signatures, balanced whitespace, gallery placeholders, verified location cards and refresh checks.
- Reuse the bundled four-page composition layer as the default visual balance; adapt it to content rather than rebuilding each page's spacing independently.
- Use the restored original paper texture for classic backgrounds and keep ripples disabled. Its redistribution permission is unverified: preserve assets/PAPER_OVERRIDE.txt and the exception in materials.html/NOTICES.txt; do not describe this background as CC0 or publish it as an openly licensed asset. The licensed CC0 alternative remains in the repository sources.
- For a single-image invitation containing attendance details and one photo, use the `poster` export in [references/exporting.md](references/exporting.md). Inspect the exported image and display it inline in the response; a cover screenshot alone is not a complete information poster.

- For arbitrary full-page color requests, use the complete palette fields in [references/theme-presets.md](references/theme-presets.md). Use `preset: custom` and regenerate from the source JSON; changing only `accent` on a legacy preset does not recolor its fixed surfaces.

- Treat `invitation.json` as the source of truth. Do not hard-code user data into template HTML or CSS.
- A ceremony time alone is not a detailed itinerary. Leave `timeline` empty when no specific schedule was supplied; do not invent a generic duplicate row to satisfy a template. Hide the empty list and its spacing. Retain confirmed schedule items.
- Keep the output framework-free and deployable on any static host.
- Keep total optimized media reasonably small. Prefer WebP/JPEG for photos, provide explicit dimensions when modifying markup, and avoid shipping original camera files.
- Include the classic music player and bundled classic BGM by default when `media.music` is omitted. A supplied permitted track overrides it; an explicit empty `media.music` disables music. Retain the compact play/pause control and loop playback. Attempt playback when the invitation opens. Because mobile browsers commonly block audible autoplay, capture the visitor's first pointer, touch, click, or keyboard interaction anywhere on the page and start playback from that interaction; do not require the visitor to find the music button. Keep these page-level retry listeners after a load or play failure, and remove them only after playback succeeds or the visitor explicitly pauses. A visitor's explicit pause must disable subsequent automatic restarts until they press play again. Respect that state across page navigation. Use the original classic BGM; preserve “严禁商用” in the visible materials page and NOTICES.txt in every site and ZIP. Check initial/first-interaction playback, looping, pause, resume and load/play failure before delivery; see [references/input-schema.md](references/input-schema.md).
- Calculate the countdown from an ISO 8601 datetime containing an explicit UTC offset.
- Generate useful page title, description, image alt text, and Open Graph fields without exposing private data. Follow the classic template for WeChat sharing: write the final title, description, and image URL directly into the initial HTML. Use the approved cover as the default share image; if missing, use the first approved gallery photo, then the ending photo. Do not ask for a separate image or create a designed share card unless the user wants one or no existing photo is suitable. Before sharing in WeChat, `og:image` must use the image's public absolute HTTPS URL; relative paths and client-side metadata changes are not reliable for WeChat crawlers.
- Keep `privacy.noindex` enabled by default. Explain that `noindex` reduces search indexing but is not access control.
- Keep account handling in the current user task only. Never add a user's Cloudflare email, account ID, credentials, session data, tokens, authorization URLs, deployment history, or personal site links to this skill, its templates or output packages; follow [references/deployment.md](references/deployment.md).
- Keep all text as text content; never inject user-provided HTML.
- Do not copy the reference project's private photos, names, guest lists, addresses, or unapproved media into generated invitations. Use the user-selected original project BGM and paper. Keep unverified material explicitly marked “严禁商用” and do not mislabel it as an openly licensed asset.

## Bundled Resources

- `assets/classic-template/`: sanitized configuration-driven invitation template.
- `assets/classic-template/assets/classic-bgm.mp3`: original classic-project BGM; mark “严禁商用” and preserve notices. Replace or disable it when requested.
- `scripts/create_invitation.py`: create a new invitation without overwriting existing files.
- `scripts/validate_invitation.py`: validate configuration, required resources, privacy placeholders, and internal paths.
- `scripts/package_invitation.py`: validate and create a drag-and-drop hosting ZIP.
- `scripts/export_invitation.mjs`: export a 1080×1920 cover PNG, a 1080-pixel-wide long PNG, and a print PDF.
- `scripts/deploy_cloudflare.py`: preflight Cloudflare Pages deployment and publish only with the explicit `--publish` flag.
- `references/`: input contract plus theme, media, copywriting, exporting, and deployment guidance.
