# Theme presets

Set `theme.preset` in `invitation.json`. Keep user-supplied `theme.accent` and `theme.paper` only when a custom override is requested.

## Complete custom palettes

Use `preset: custom` for arbitrary full-page colors. Adding any extended field below to either existing preset also enables full-palette rendering. Existing presets without extended fields keep their established appearance. When switching an existing invitation, replace its theme object to avoid retaining old overrides; regenerate the site and exports from the source configuration.

All colors accept six-digit `#RRGGBB` values. The generator fills omitted values and persists the resolved palette in `invitation.json`.

| Field | Usage / automatic default |
| --- | --- |
| accent | Labels and countdown; defaults to preset accent |
| paper | Information and closing section base |
| surface | Cover base; defaults to accent |
| surfaceDark | Gallery, dialog, controls; darkened surface |
| metallic | Decorative frames and separators; gold by default (flat color, not a metallic material) |
| text | Text on paper; automatic black or white |
| surfaceText | Cover text; automatic black or white |
| darkText | Gallery and dialog text; automatic black or white |
| card | Information card fill; defaults to paper |
| cardText | Card body; automatic black or white |
| texture | `paper` (default) or `none`; no ripple in full-palette mode |

Example: forest green with warm ivory and muted gold:

```json
{"theme":{"preset":"custom","accent":"#28533F","paper":"#F2EBDD","surface":"#28533F","surfaceDark":"#102B20","metallic":"#B9A476","text":"#23332A","surfaceText":"#FFF6E5"}}
```

For natural-language color requests, choose matching surface, dark surface, accent and decorative colors. Check readability after texture blending, especially accent labels on the card; automatic black/white selection uses the base color and cannot guarantee contrast for every texture or explicit override. Colors are inherited by PNG and print rendering; texture can alter their apparent brightness. Do not promise every area matches a raw hex swatch exactly.

## `classic`

Restrained warm ivory vintage-paper gallery theme. Use for Western style. Before generation, ask whether the user prefers Western or Chinese style when no style or palette has been supplied; Western maps to `classic`, Chinese maps to `chinese-red-paper`. Honor freely requested custom colors without requiring the user to choose from a palette menu.

## `chinese-red-paper`

Use for requests such as “中式红色主题”, “朱砂红请柬”, or “红色宣纸质感”. It provides:

- deep cinnabar and jujube-red surfaces;
- gold typography, borders, and controls;
- visible handmade-paper grain from the bundled vintage paper asset;
- warm ivory information cards;
- no ripple ornament or ripple animation.

Recommended configuration:

```json
{
  "theme": {
    "preset": "chinese-red-paper",
    "accent": "#a61b1b",
    "paper": "#f7ead2"
  }
}
```

Do not add generic Chinese symbols, dragons, phoenixes, seals, or patterned ornaments unless the user asks for them. Preserve readability and verify the cover image after export because texture blending varies with browser rendering.
