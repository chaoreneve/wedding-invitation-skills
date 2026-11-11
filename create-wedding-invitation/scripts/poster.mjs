/** One-image invitation, independent of the interactive page layout. */
export function posterHtml(data, baseUrl, { keepDateSeparator = false } = {}) {
  // Presentation only: never change the website's source event data.
  data = {...data, event: {...data.event, dateDisplay: keepDateSeparator
    ? data.event.dateDisplay : String(data.event.dateDisplay ?? '').replace(/\s*·\s*/, '　')}};
  const eventClock = String(data.event.datetime || '').match(/T(\d{2}):(\d{2})/);
  const eventDateTime = eventClock && !/\d{1,2}:\d{2}|\d{1,2}点/.test(data.event.dateDisplay)
    ? `${data.event.dateDisplay}　${eventClock[1]}:${eventClock[2]}` : data.event.dateDisplay;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const theme = data.theme || {};
  const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback;
  const red = theme.preset === 'chinese-red-paper';
  const bg = color(theme.surface, red ? '#72151b' : theme.paper || '#f4efe5');
  const fg = color(theme.surfaceText, red ? '#fff4d8' : '#30231d');
  const gold = color(theme.metallic, red ? '#d4ad58' : '#8b3a3a');
  const names = data.couple.brideFirst ? [data.couple.bride, data.couple.groom] : [data.couple.groom, data.couple.bride];
  const photo = new URL(data.media.cover || './assets/placeholder.svg', baseUrl).href;
  const texture = new URL('./assets/paper-warm.jpg', baseUrl).href;
  const timeline = (data.timeline || []).map(item => `<li>${esc(item.time)} · ${esc(item.label)}</li>`).join('');
  return `<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><style>
  *{box-sizing:border-box}body{margin:0;width:720px;background:${bg};color:${fg};font-family:"Songti SC","Noto Serif SC",serif}
  .poster{width:720px;height:1280px;padding:74px 48px;position:relative;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px;background-image:${theme.texture === 'none' ? 'none' : `url("${texture}")`};background-size:cover;background-blend-mode:multiply;background-color:${bg}}
  .poster>*{flex-shrink:0}.facts{width:100%}
  .poster:before{content:"";position:absolute;inset:24px;border:1px solid ${gold};opacity:.5;pointer-events:none}
  .eyebrow{font:14px system-ui;letter-spacing:.3em;margin:0 0 14px}h1{font-size:30px;font-weight:400;letter-spacing:.16em;margin:0 0 20px;overflow-wrap:anywhere}.names{font-size:52px;font-weight:600;margin:0 0 16px;line-height:1.4}.intro{font-size:26px;margin:0 0 24px;line-height:1.6}
  .heading{width:100%}.heading h1{justify-content:center;margin:0 0 18px;color:${gold};font-size:25px}.heading .names{margin:0 0 12px}.heading .intro{margin:0;font-size:25px}
  .photo-frame{position:relative;padding:3px;margin:0 auto;border:1px solid ${gold};background:transparent}
  .photo{display:block;max-width:100%;width:auto;height:520px;object-fit:contain;margin:0}
  .photo-frame:after{content:"";position:absolute;inset:3px;pointer-events:none;background:${theme.texture === 'none' ? 'none' : `url("${texture}") center/cover`};mix-blend-mode:soft-light;opacity:.13}
  h1{display:flex;align-items:center;gap:18px}h1:before,h1:after{content:"";width:58px;height:1px;background:${gold};opacity:.75}
  .facts{line-height:1.65}.date{font:600 43px/1.55 "Songti SC",serif;margin:0 0 22px}.venue{font-size:41px;font-weight:600;line-height:1.6;margin:0 0 12px}.address,.dress{font-size:34px;margin:0;overflow-wrap:anywhere}ul{list-style:none;padding:12px 0 0;margin:0;font-size:32px}
  .heading h1{font-size:28px}.heading .names{font-size:59px}.heading .intro{font-size:28px}
  </style><body><main class="poster"><header class="heading"><h1>${esc(data.copy?.title || '婚礼邀请')}</h1><p class="names">${names.map(esc).join(' &amp; ')}</p><p class="intro">${esc(data.copy?.invitation || '诚邀您参加我们的婚礼')}</p></header><div class="photo-frame"><img class="photo" src="${esc(photo)}" alt="新人合照"></div><section class="facts"><p class="date">${esc(eventDateTime)}</p><p class="venue">${esc(data.event.venue)}</p><p class="address">${esc(data.event.address)}</p>${data.event.dresscode ? `<p class="dress">着装建议：${esc(data.event.dresscode)}</p>` : ''}${timeline ? `<ul>${timeline}</ul>` : ''}</section></main></body></html>`;
}
