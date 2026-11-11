# Witness invitation input schema

Use UTF-8 JSON. Media paths are relative to the JSON file or absolute local paths; generated copies are stored under `assets/user/`.

## Required

- `couple.groom`, `couple.bride`, and explicit boolean `couple.brideFirst` are required. Ask which name should appear first if the user has not said; do not derive it from gender, roles, or the order in which names were mentioned.
- `event.datetime`: ISO 8601 with explicit UTC offset.
- `event.date`, `event.time`, `event.venue`; `event.address` and `event.dresscode` are recommended.

## Recipient and letter

- `recipient.name`: for the first general version, use `亲友` unless the user already supplied a specific recipient. For later relationship-specific versions, use one site per recipient.
- `recipient.relationship`: preferred user-facing selection for later versions, e.g. `姐姐` or `高中同学`; maps to a letter template. Ask whether different relationships need distinct versions only after the user confirms the general version is usable, then present the options as names with optional codes.
- A relationship outside the preset list is allowed when `recipient.paragraphs` supplies the custom letter. Keep the user's exact relationship wording; the generator uses the general letter as a base without relabeling the relationship.
- `recipient.letterCode`: optional internal code `00`–`14` (or a single digit padded to two digits). If both relationship and code are supplied, they must agree. An unknown code falls back to the general letter (`00`).
- `recipient.verifyName`: when true, the entered normalized name must match. This is a story interaction, not security.
- `recipient.stamp`: short label such as `Family`, `Friend`, or `Witness`; overrides the selected relationship template.
- `recipient.greeting`: supports `{name}`; overrides the selected relationship template.
- `recipient.paragraphs`: factual, relationship-appropriate paragraphs; overrides the selected relationship template. Do not invent memories.
- `recipient.signature`: defaults to the displayed couple names.

Available relationship names and codes (derived from the original witness invitation): 通用亲友（00）、家人（01）、姐姐（02）、妹妹（03）、哥哥（04）、弟弟（05）、初中同学（06）、高中同学（07）、大学同学（08）、研究生同学（09）、前同事（10）、现同事（11）、发小（12）、好兄弟（13）、研究生导师（14）. The exact starter letters are in [relation-letters.json](relation-letters.json). The priority is explicit letter text > selected relationship template > general letter. Each generated site contains only its recipient's resolved letter.

## Mission and RSVP effect

- `mission.number`, `mission.role`, `mission.items`: confirmed display content.
- `mission.timeline`: optional list of confirmed `{time,label}` events. If absent or empty, hide the timeline row; never auto-add a redundant `12:18 · 婚礼` placeholder.
- RSVP is a visual confirmation button only. It does not ask for name, attendance options, companion count or a message; it does not store or submit data.

## Copy, privacy, and media

- `copy.coverTitle`, `coverNote`, `galleryTitle`, `galleryIntro`.
- `privacy.noindex`: default true; it is not access control.
- `sharing.url`: optional final public HTTPS URL for this recipient version. Once assigned, set it and regenerate so the initial HTML contains a public absolute `og:image` for link previews.
- `media.gallery`: list of `{src,largeSrc,title,caption,alt,wide}`; `largeSrc` is optional. `title` and `caption` are optional visible lightbox copy: omit them when there is no meaningful photo-specific wording, while keeping `alt` descriptive for accessibility. An empty gallery is suitable for preview, not a finished shareable invitation unless the user explicitly approves a photo-free version.
- `media.share`: optional override for the link-preview image. When omitted, use the bundled original sealed-envelope image, even if gallery photos exist.
- `media.missionProof`: optional image beside the mission checklist; defaults to the first gallery image.
- `media.accepted`: optional final-scene image; defaults to the first gallery image, independently of the link-preview image.
- `media.music`: omit for bundled classic BGM, set `""` for silent mode, or supply a permitted replacement. The bundled BGM is personal non-commercial use only.

Only documented fields should enter the configuration. Keep private planning notes, account details and the batch guest list outside each public recipient site.

## Minimal example

```json
{
  "couple": {"groom": "林一", "bride": "周宁", "brideFirst": true},
  "event": {
    "datetime": "2027-05-20T17:00:00+08:00",
    "date": "2027.05.20",
    "time": "17:00",
    "venue": "示例花园酒店 · 宴会厅",
    "address": "示例市幸福路20号"
  },
  "recipient": {
    "name": "亲友",
    "verifyName": false,
    "relationship": "通用亲友"
  },
  "mission": {"number": "W-0520", "role": "婚礼见证官", "items": ["见证誓言", "分享喜悦"]},
  "media": {"gallery": []}
}
```
