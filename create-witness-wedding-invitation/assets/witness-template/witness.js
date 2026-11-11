(() => {
  "use strict";
  const data = window.WITNESS_INVITATION;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const normalize = value => String(value || "").replace(/[（(].*?[）)]/g, "").replace(/\s+/g, "").toLowerCase();
  const displayName = name => String(name || "").trim() || data.recipient.name || "亲友";
  const flowScenes = ['#secret-letter','#identity-check','#identity-denied','#personal-letter','#hall-01','#mission','#mission-accepted'];
  document.body.classList.add('is-locked-flow');
  flowScenes.forEach((selector, index) => { const node=$(selector); if(node) node.hidden=index!==0; });
  const scrollToTarget = selector => {
    const node = $(selector);
    if (!node) return;
    node.hidden = false;
    node.dispatchEvent(new CustomEvent('witness:scene-unlocked',{bubbles:true}));
    const stack = $('.screen-stack');
    if (stack?.contains(node)) stack.scrollTo({top:node.offsetTop,left:0,behavior:'smooth'});
    else node.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  document.title = `${data.couple.names} · 见证者婚礼邀请`;
  document.querySelector('meta[name="robots"]').content = data.privacy?.noindex === false ? "index,follow" : "noindex,nofollow";
  Object.entries(data.copy || {}).forEach(([key, value]) => $$(`[data-copy="${key}"]`).forEach(node => { node.textContent = value || ""; }));
  ["date", "time", "venue", "address", "dresscode"].forEach(key => $$(`[data-field="${key}"]`).forEach(node => { node.textContent = data.event[key] || ""; }));
  ['address','dresscode'].forEach(key=>{if(!data.event[key])$$(`[data-field="${key}"]`).forEach(node=>{const row=node.closest('div');if(row)row.hidden=true;});});
  $('[data-mission-code]').textContent = data.mission.number;
  $('[data-mission-role]').textContent = data.mission.role;
  $('[data-mission-list]').replaceChildren(...data.mission.items.map(item => Object.assign(document.createElement("li"), { textContent: item })));
  const timeline = data.mission.timeline || [];
  const timelineNode = $('[data-mission-timeline]');
  timelineNode.closest('.mission-timeline').hidden = timeline.length === 0;
  timelineNode.replaceChildren(...timeline.map(item => { const li=document.createElement('li'); const time=document.createElement('time'); const label=document.createElement('strong'); time.textContent=item.time||''; label.textContent=item.label||''; li.append(time,label); return li; }));
  const proofSrc = data.media.missionProof || data.media.gallery[0]?.src || './assets/placeholder.svg';
  const acceptedSrc = data.media.accepted || data.media.gallery[0]?.src || './assets/placeholder.svg';
  $('[data-mission-proof-image]').src=proofSrc;
  $('[data-mission-proof-image]').closest('[data-lightbox]').dataset.lightboxSrc=proofSrc;
  $('[data-accepted-image]').src=acceptedSrc;
  $('[data-accepted-image]').closest('[data-lightbox]').dataset.lightboxSrc=acceptedSrc;

  const updateCountdown = () => {
    const diff = new Date(data.event.datetime).getTime() - Date.now();
    const days = Math.max(0, Math.ceil(diff / 86400000));
    $$('[data-countdown-days]').forEach(node => { node.textContent = String(days); });
  };
  updateCountdown();
  window.setInterval(updateCountdown, 60000);

  const personalize = raw => {
    const name = displayName(raw);
    $$('[data-guest-name]').forEach(node => { node.textContent = name; });
    $('[data-letter-stamp]').textContent = data.recipient.stamp || "Witness";
    $('[data-letter-greeting]').textContent = (data.recipient.greeting || "亲爱的 {name}：").replace("{name}", name);
    $('[data-letter-copy]').replaceChildren(...data.recipient.paragraphs.map(paragraph => Object.assign(document.createElement("p"), { textContent: paragraph })));
    $('[data-letter-signature]').textContent = data.recipient.signature || data.couple.names;
    return name;
  };
  personalize(data.recipient.name);

  document.addEventListener("click", event => {
    const target = event.target.closest(".ripple-target");
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "click-ripple";
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    target.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  });

  const drawer = $('.nav-drawer');
  const menuButton = $('.menu-button');
  menuButton.addEventListener('click', () => {
    const open = drawer.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  drawer.addEventListener('click', event => {
    const link=event.target.closest('a');
    if(link && $(link.getAttribute('href'))?.hidden){event.preventDefault();link.classList.add('is-denied');window.setTimeout(()=>link.classList.remove('is-denied'),520);return;}
    drawer.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
  $$('[data-next]').forEach(button => button.addEventListener('click', () => {
    if(button.matches('[data-envelope-open]')){button.classList.add('is-unsealing');window.setTimeout(()=>{button.classList.remove('is-unsealing');scrollToTarget(button.dataset.next);},420);return;}
    button.classList.add('is-active');
    window.setTimeout(() => button.classList.remove('is-active'), 700);
    scrollToTarget(button.dataset.next);
  }));

  const identityForm = $('[data-identity-form]');
  const identityButton = $('button[type="submit"]', identityForm);
  const identityAlert = $('[data-identity-alert]', identityForm);
  $$('input[name="identity"]', identityForm).forEach(radio => {
    radio.closest('label').addEventListener('click', () => {
      radio.checked = true;
      if (radio.value === 'other') window.setTimeout(() => scrollToTarget('#identity-denied'), 120);
    });
  });
  identityForm.addEventListener('submit', event => {
    event.preventDefault();
    if (identityForm.classList.contains('is-verifying')) return;
    const values = new FormData(identityForm);
    const name = String(values.get('guestName') || '').trim();
    if (values.get('identity') === 'other' || (data.recipient.verifyName && normalize(name) !== normalize(data.recipient.name))) {
      scrollToTarget('#identity-denied');
      return;
    }
    if(!name){identityAlert.hidden=false;identityAlert.textContent='这封信需要知道真正的收件人姓名，先写下你的名字吧。';return;}
    identityAlert.hidden=true;
    personalize(name);
    const delay = matchMedia('(prefers-reduced-motion: reduce)').matches ? 120 : 1350;
    identityForm.classList.add('is-verifying');
    identityButton.disabled = true;
    identityButton.textContent = '开启中';
    window.setTimeout(() => scrollToTarget('#personal-letter'), delay);
    window.setTimeout(() => {
      identityForm.classList.remove('is-verifying');
      identityButton.disabled = false;
      identityButton.textContent = '确认身份';
    }, delay + 720);
  });

  const passphraseOpener = $('[data-passphrase-open]');
  const passphraseForm = $('[data-passphrase-form]');
  if (passphraseOpener && passphraseForm) {
    const deniedLayout = passphraseOpener.closest('.denied-layout');
    const passphraseInput = $('input[name="passphrase"]', passphraseForm);
    const passphraseResult = $('[data-passphrase-result]', passphraseForm);
    const passphraseButton = $('button[type="submit"]', passphraseForm);
    const showPassphraseResult = (message, state) => {
      passphraseResult.textContent = message;
      passphraseResult.dataset.state = state;
      passphraseForm.classList.remove('is-wrong', 'is-unlocked');
      if (state === 'wrong') {
        passphraseForm.classList.add('is-wrong');
        window.setTimeout(() => passphraseForm.classList.remove('is-wrong'), 620);
      }
      if (state === 'success') passphraseForm.classList.add('is-unlocked');
    };
    passphraseOpener.addEventListener('click', () => {
      passphraseForm.hidden = false;
      passphraseForm.classList.add('is-open');
      deniedLayout?.classList.add('has-passphrase');
      showPassphraseResult('纸缝里露出一行暗号：天官赐福。', 'hint');
      window.setTimeout(() => passphraseInput?.focus(), 140);
    });
    passphraseInput?.addEventListener('input', () => {
      if (passphraseResult.dataset.state === 'wrong') showPassphraseResult('可以继续对暗号。', 'hint');
    });
    passphraseForm.addEventListener('submit', event => {
      event.preventDefault();
      if (normalize(passphraseInput?.value) !== normalize('百无禁忌')) {
        showPassphraseResult('封印轻轻晃了一下：似乎还差一点。可以继续作答，也可以请本人来开启。', 'wrong');
        passphraseInput?.focus();
        passphraseInput?.select();
        return;
      }
      personalize('神秘人');
      passphraseOpener.classList.add('is-unlocked');
      passphraseButton.disabled = true;
      passphraseButton.textContent = '信封开启中';
      showPassphraseResult('暗号正确。神秘人通行，信件正在为你展开。', 'success');
      const delay = matchMedia('(prefers-reduced-motion: reduce)').matches ? 160 : 920;
      window.setTimeout(() => scrollToTarget('#personal-letter'), delay);
    });
  }

  const projector = $('[data-projector]');
  const track = $('[data-projector-track]', projector);
  const gallery = data.media.gallery.length ? data.media.gallery : [{ src: './assets/placeholder.svg', alt: '照片占位' }];
  if (!data.media.gallery.length) projector.classList.add('is-placeholder-only');
  const makeFrame = (item, index, clone = false) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `film-frame photo-filled ripple-target${item.wide ? ' film-frame-wide' : ''}${index === 0 ? ' is-active' : ''}`;
    button.dataset.projectorFrame = '';
    button.dataset.projectorIndex = String(index);
    button.dataset.lightbox = item.title || '';
    button.dataset.caption = item.caption || '';
    button.dataset.lightboxSrc = item.largeSrc || item.src;
    if (clone) { button.tabIndex = -1; button.setAttribute('aria-hidden', 'true'); }
    const image = document.createElement('img');
    image.src = item.src;
    image.alt = clone ? '' : item.alt || item.title || '新人照片';
    image.decoding = 'async';
    button.append(image);
    return button;
  };
  gallery.forEach((item, index) => track.append(makeFrame(item, index)));
  if (gallery.length > 1) gallery.forEach((item, index) => track.append(makeFrame(item, index, true)));

  if (gallery.length > 1) {
    const windowEl = $('.projector-window', projector);
    const frames = $$('[data-projector-frame]', projector);
    let position = 0;
    let loopWidth = 0;
    let autoFrame = null;
    let lastFrameTime = 0;
    let resumeTimer = null;
    let pointerId = null;
    let dragStartX = 0;
    let dragStartPosition = 0;
    let hasDragged = false;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const normalizePosition = value => {
      if (!loopWidth) return value;
      let normalized = value % loopWidth;
      if (normalized > 0) normalized -= loopWidth;
      return normalized;
    };
    const renderTrack = () => { track.style.transform = `translate3d(${position}px, 0, 0)`; };
    const updateLoopWidth = () => {
      loopWidth = frames[gallery.length].offsetLeft - frames[0].offsetLeft;
      position = normalizePosition(position);
      renderTrack();
    };
    const runAutoScroll = timestamp => {
      if (!lastFrameTime) lastFrameTime = timestamp;
      const elapsed = Math.min(timestamp - lastFrameTime, 50);
      lastFrameTime = timestamp;
      position = normalizePosition(position - elapsed * loopWidth / 40000);
      renderTrack();
      autoFrame = requestAnimationFrame(runAutoScroll);
    };
    const start = () => {
      clearTimeout(resumeTimer);
      if (!autoFrame && !reduceMotion.matches) { lastFrameTime = 0; autoFrame = requestAnimationFrame(runAutoScroll); }
    };
    const stop = () => { clearTimeout(resumeTimer); if (autoFrame) cancelAnimationFrame(autoFrame); autoFrame = null; };
    const resumeSoon = () => { clearTimeout(resumeTimer); resumeTimer = setTimeout(start, 1200); };
    window.addEventListener('resize', updateLoopWidth);
    windowEl.addEventListener('pointerdown', event => {
      if (event.button !== undefined && event.button !== 0) return;
      pointerId = event.pointerId; dragStartX = event.clientX; dragStartPosition = position; hasDragged = false; stop();
    });
    windowEl.addEventListener('pointermove', event => {
      if (event.pointerId !== pointerId) return;
      const deltaX = event.clientX - dragStartX;
      if (Math.abs(deltaX) > 6 && !hasDragged) { hasDragged = true; projector.classList.add('is-dragging'); windowEl.setPointerCapture?.(pointerId); }
      position = normalizePosition(dragStartPosition + deltaX); renderTrack();
      if (hasDragged && event.cancelable) event.preventDefault();
    });
    const endDrag = event => {
      if (event.pointerId !== pointerId) return;
      pointerId = null; projector.classList.remove('is-dragging'); windowEl.releasePointerCapture?.(event.pointerId); resumeSoon();
    };
    windowEl.addEventListener('pointerup', endDrag);
    windowEl.addEventListener('pointercancel', endDrag);
    windowEl.addEventListener('click', event => { if (!hasDragged) return; event.preventDefault(); event.stopPropagation(); hasDragged = false; }, true);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    document.addEventListener('witness:scene-unlocked',event=>{if(!event.target.contains(projector))return;updateLoopWidth();start();});
    updateLoopWidth();
    projector.setAttribute('data-projector-ready', '');
    start();
  }

  const modal = $('[data-lightbox-modal]');
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-lightbox]');
    if (!trigger) return;
    const title = (trigger.dataset.lightbox || '').trim();
    const caption = (trigger.dataset.caption || '').trim();
    $('[data-lightbox-image]').src = trigger.dataset.lightboxSrc;
    $('[data-lightbox-image]').alt = trigger.querySelector('img')?.alt || title || '照片';
    $('[data-lightbox-title]').textContent = title;
    $('[data-lightbox-title]').hidden = !title;
    $('[data-lightbox-caption]').textContent = caption;
    $('[data-lightbox-caption]').hidden = !caption;
    modal.querySelector('.lightbox-card').classList.toggle('is-image-only', !title && !caption);
    modal.hidden = false;
  });
  $('.lightbox-close').addEventListener('click', () => { modal.hidden = true; });
  modal.addEventListener('click', event => { if (event.target === modal) modal.hidden = true; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') modal.hidden = true; });

  if (data.media.music) {
    const audio = new Audio(data.media.music);
    const button = $('.sound-button');
    let shouldPlay = true;
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.72;
    button.hidden = false;
    const sync = () => {
      const playing = !audio.paused;
      button.setAttribute('aria-pressed', String(playing));
      button.setAttribute('aria-label', playing ? '关闭音乐' : '开启音乐');
      button.textContent = playing ? 'Ⅱ' : '♪';
    };
    const removeUnlock = () => {
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('touchstart', unlock, true);
      document.removeEventListener('keydown', unlock, true);
    };
    const play = async () => { if (!shouldPlay || !audio.paused) return; try { await audio.play(); removeUnlock(); } catch { sync(); } };
    function unlock(event) { if (event.target?.closest?.('.sound-button')) return; play(); }
    audio.addEventListener('play', sync);
    audio.addEventListener('pause', sync);
    button.addEventListener('click', () => {
      if (!audio.paused) { shouldPlay = false; audio.pause(); removeUnlock(); }
      else { shouldPlay = true; play(); }
    });
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('touchstart', unlock, true);
    document.addEventListener('keydown', unlock, true);
    sync();
    play();
  }
})();
