"""Resolve a complete invitation palette from user colors."""
import re

COLOR_KEYS = ('accent', 'paper', 'surface', 'surfaceDark', 'metallic', 'text',
              'surfaceText', 'darkText', 'card', 'cardText')

def foreground(color):
    channels = [int(color[i:i+2], 16) / 255 for i in (1, 3, 5)]
    linear = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in channels]
    luminance = sum(c * w for c, w in zip(linear, (.2126, .7152, .0722)))
    return '#000000' if luminance > .179 else '#ffffff'

def resolve_palette(theme):
    if not isinstance(theme, dict):
        raise ValueError('theme must be an object')
    preset = theme.get('preset', 'classic')
    if preset not in ('classic', 'chinese-red-paper', 'custom'):
        raise ValueError('unknown theme.preset')
    for key in COLOR_KEYS:
        if key in theme and not re.fullmatch(r'#[0-9a-fA-F]{6}', str(theme[key])):
            raise ValueError(f'theme.{key} must be a six-digit hex color')
    if 'texture' in theme and theme['texture'] not in ('paper', 'none'):
        raise ValueError('theme.texture must be paper or none')
    custom = preset == 'custom' or any(k in theme for k in COLOR_KEYS[2:]) or 'texture' in theme
    if not custom:
        return theme
    red = preset == 'chinese-red-paper'
    palette = dict(theme)
    palette.setdefault('accent', '#a61b1b' if red else '#8b3a3a')
    palette.setdefault('paper', '#f7ead2' if red else '#f4efe5')
    palette.setdefault('surface', palette['accent'])
    palette.setdefault('surfaceDark', '#' + ''.join(f'{round(int(palette["surface"][i:i+2],16)*.42):02x}' for i in (1,3,5)))
    palette.setdefault('metallic', '#d4ad58')
    palette.setdefault('text', foreground(palette['paper']))
    palette.setdefault('surfaceText', foreground(palette['surface']))
    palette.setdefault('darkText', foreground(palette['surfaceDark']))
    palette.setdefault('card', palette['paper'])
    palette.setdefault('cardText', foreground(palette['card']))
    palette.setdefault('texture', 'paper')
    return palette
