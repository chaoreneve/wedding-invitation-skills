# Exporting and packaging

Validate the generated invitation before exporting.

## Website ZIP

Create a ZIP whose root contains `index.html`:

```bash
python3 scripts/package_invitation.py /absolute/path/invitation-site --output /absolute/path/invitation-site.zip
```

Use this ZIP for Cloudflare Pages or Netlify Drop. Do not email the ZIP as a substitute for a visitor-friendly URL unless the recipient knows how to host it.

## PNG and PDF

### Single-image invitation poster

For “一图版请柬”, “一张图交代请柬信息” or a compact invitation image with a photo, run:

```bash
node scripts/export_invitation.mjs --site /absolute/path/site --output /absolute/path/exports --formats poster
```

This creates `invitation-poster.png`, exactly 1080×1920 (9:16), intended as a single phone-screen image. It is a dedicated composition, not a cover screenshot: include displayed name order, invitation copy, date/time, venue/room, street address, one cover photo and any confirmed itinerary or dress code. Check one-screen fit; rebalance spacing and photo size if necessary. If unusually long content cannot fit legibly, ask about optional copy or offer a separate long image; never silently extend, crop, omit facts or shrink text excessively. Phones have different aspect ratios, so do not promise edge-to-edge filling on every model. If an exact device ratio is requested, adapt the export dimensions explicitly.

Use the existing photo and theme, without modifying the website. If there is no photo, disclose the placeholder and request a photo for the final version. Do not add a fake QR code or depict map links as working buttons in the image. Review the actual exported PNG for legibility, framing and complete facts; then **display the PNG inline** using its absolute local path, not only a download link. Static images do not provide navigation, animation or music. Do not copy the current couple's photos/details into the reusable Skill.

#### Poster composition and final check

- Start from the bundled large-type composition: a grouped heading (title, names, short invitation), one central photo, then attendance details. At the 720×1280 logical layout, names are 59px, date/time 43px, venue 41px, address 34px and the portrait is 520px tall. These are starting values, not a mandate for every photo or longer input.
- Keep each fact once; do not repeat names in a footer or add an English heading solely to fill space. Use deliberate gaps between groups rather than distributing every line with `space-between`. Retain breathing room; avoid heavy mats, extra ornaments or enlarged borders merely to fill the canvas.
- Preserve the selected paper texture without decorative ripples. A fine photo edge and subtle paper overlay should not obscure faces. Respect `theme.texture: none` and other themes.
- Prefer date and time together on one line, separated by whitespace, and a single-line address when legible. The poster removes only the middle-dot separator between date and time; dots within the date and punctuation in the venue remain intact. It does not alter source data. To preserve supplied date punctuation on request, call `posterHtml(data, baseUrl, { keepDateSeparator: true })` in the exporter. Do not split every fact into extra lines merely to make line lengths match; use wrapping when actually needed.
- Inspect the exported image at phone display size as well as full resolution. Check text readability, complete address/time, name order, portrait framing, visual balance and one-screen bounds. If the user asks to enlarge everything, scale text and photo together while reducing outside whitespace; do not simply increase output pixel dimensions. Never crop content or shrink important text to hide overflow.
- When the user requests a small correction or return to an earlier version, preserve that version's composition and change only the requested detail. Export to a new path so the user can compare. Keep private examples outside the reusable skill folder.

### Other exports

Run the exporter with a Node runtime that can resolve Playwright and an installed Chromium-based browser:

```bash
node scripts/export_invitation.mjs --site /absolute/path/invitation-site --output /absolute/path/exports
```

The exporter creates:

- `invitation-cover-1080x1920.png`: a fixed 9:16 cover for messaging and social sharing.
- `invitation-long.png`: a 1080-pixel-wide long image containing all sections.
- `invitation.pdf`: a printable multipage document.

Pass `--formats cover,long,pdf` to select outputs. Pass `--force` only after confirming overwrite of existing exports.

PNG and PDF exports are static. They do not retain music, countdown updates, swiping, links, or lightbox interactions. Treat the website as the primary experience and exports as fallbacks.

If the browser dependency is unavailable, keep the validated website and ZIP. Do not install a browser without user approval; offer browser Print > Save as PDF and a full-page screenshot as manual fallbacks.
