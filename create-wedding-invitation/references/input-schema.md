# Input schema

Create a UTF-8 JSON object with these fields. Paths in `media` are resolved relative to the JSON file and copied into the generated site's `assets/` directory.

## Required

- `couple.groom`: groom's displayed name.
- `couple.bride`: bride's displayed name.
- `couple.brideFirst`: explicit boolean for the user-chosen display order. Ask which name appears first if the user has not said; do not derive this from gender, roles, or name-mention order. Preserve the choice on edits, and never swap identities.
- `event.datetime`: ISO 8601 datetime with an explicit offset, for example `2027-05-20T17:00:00+08:00`.
- `event.dateDisplay`: human-readable date. If it has no time, the page and poster append the local HH:MM from `event.datetime`; do not add a duplicate timeline row just to show the time.
- `event.venue`: venue name, optionally including a room.
- `event.address`: full or visitor-appropriate address.

## Optional

- `event.mapUrl`: verified HTTPS hotel place URL on `www.amap.com`. Omit if unverified; the navigation button stays hidden, while the address card remains visible. Never infer a banquet-room floor or entrance from the hotel pin.

- `timeline`: list of confirmed schedule items `{ "time": "17:00", "label": "婚礼仪式" }`. Omit or use `[]` if the user provides no specific itinerary; the list is hidden. Do not invent a generic “婚礼” item just to repeat the event time. Preserve explicitly supplied schedule items, even when there is only one.

- `event.dresscode`: omit or use an empty string when not applicable.
- `copy.eyebrow`, `copy.title`, `copy.invitation`, `copy.galleryTitle`, `copy.galleryIntro`, `copy.closing`, `copy.signature`.
- `theme.accent`: CSS hex color. Default `#8b3a3a`.
- `theme.paper`: CSS hex color. Default `#f4efe5`.
- `theme.preset`: `classic`, `chinese-red-paper`, or `custom`. Default `classic`.
- `theme.surface`, `surfaceDark`, `metallic`, `text`, `surfaceText`, `darkText`, `card`, `cardText`: optional six-digit hex colors for full-page palette overrides; see [theme-presets.md](theme-presets.md) for defaults and examples.
- `theme.texture`: `paper` or `none`; enables full-palette rendering.
- `privacy.noindex`: discourage search indexing. Default `true`; this is not password protection.
- `media.cover`: cover image path.
- `media.ending`: ending image path.
- `media.share`: optional existing approved photo used by the static sharing metadata. By default use the cover, then the first gallery photo, then the ending photo; no separate share-card asset is required.
- `sharing.url`: optional final public invitation URL. Before WeChat sharing, use it to resolve `media.share` into an absolute HTTPS `og:image` URL in the initial HTML.
- `media.music`: omit this field to use the bundled classic BGM. Set it to a user-approved browser-compatible audio path (prefer MP3) to replace the default, or set it explicitly to `""` to create a silent invitation and hide the control. Multiple supplied tracks require a choice rather than silently picking one. When present, playback loops by default. Attempt to start on page open, then fall back to the visitor's first pointer, touch, click, or keyboard interaction anywhere on the page when the browser blocks audible autoplay. The visitor must not need to find the music button to unlock playback. Always provide play/pause and keep the page-level gesture retry available after load or play failures. An explicit pause disables gesture-triggered restart until the visitor presses play again. Changing sections must not restart the track or override a visitor's pause. The bundled default is the original classic-project BGM: “严禁商用”. Preserve materials.html and NOTICES.txt; see materials.md. Replacement tracks remain the user's responsibility. Static PNG/PDF exports contain no audio.
- `media.gallery`: list of `{ "src": "path", "title": "title", "caption": "caption", "alt": "accessible description" }`.

## Example

```json
{
  "couple": {"groom": "林一", "bride": "周宁", "brideFirst": true},
  "event": {
    "datetime": "2027-05-20T17:00:00+08:00",
    "dateDisplay": "2027.05.20",
    "venue": "示例花园酒店 · 宴会厅",
    "address": "示例市示例路 20 号",
    "dresscode": "白色 / 黑色 / 香槟色"
  },
  "timeline": [
    {"time": "17:00", "label": "婚礼仪式"},
    {"time": "18:00", "label": "晚宴"}
  ],
  "privacy": {"noindex": true},
  "theme": {"preset": "classic", "accent": "#8b3a3a", "paper": "#f4efe5"},
  "media": {
    "cover": "photos/cover.jpg",
    "ending": "photos/ending.jpg",
    "gallery": [
      {"src": "photos/story-01.jpg", "title": "初见", "caption": "故事从这里开始。", "alt": "新人合影"}
    ]
  }
}
```
