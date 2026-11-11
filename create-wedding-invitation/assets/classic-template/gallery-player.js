(() => {
  const track = document.getElementById('galleryList');
  const slides = [...track.querySelectorAll('.photo')];
  if (slides.length < 2 || !window.INVITATION?.media?.gallery?.length) return;
  const viewport = document.createElement('div');
  viewport.className = 'projector-window'; viewport.tabIndex = 0;
  viewport.setAttribute('role','region');
  viewport.setAttribute('aria-label','自动放映照片带，左右拖动；键盘左右键移动，空格暂停或继续');
  track.before(viewport); viewport.append(track); track.classList.add('projector-track');
  slides.forEach(slide => {
    const copy = slide.cloneNode(true);
    copy.setAttribute('aria-hidden','true'); copy.tabIndex = -1; copy.dataset.loopClone = 'true'; track.append(copy);
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let position = 0, loopWidth = 0, frame = 0, last = 0, visible = false, paused = false, resumeAt = 0, drag = null, suppressUntil = 0;
  const normalize = value => loopWidth ? ((value % loopWidth) + loopWidth) % loopWidth - loopWidth : value;
  const render = () => { track.style.transform = 'translate3d(' + position + 'px,0,0)'; };
  const measure = () => {
    const fraction = loopWidth ? position / loopWidth : -1;
    loopWidth = track.children[slides.length].offsetLeft - slides[0].offsetLeft;
    position = normalize(fraction * loopWidth); render();
  };
  const tick = now => {
    const elapsed = last ? Math.min(now-last,50) : 0; last = now;
    if (visible && !paused && !reduced.matches && !document.hidden && !drag && now >= resumeAt && !document.querySelector('dialog[open]')) {
      position = normalize(position + elapsed * loopWidth / 40000); render();
    }
    frame = requestAnimationFrame(tick);
  };
  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    drag = {id:event.pointerId,x:event.clientX,y:event.clientY,position,moved:false};
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX-drag.x, dy = event.clientY-drag.y;
    if (!drag.moved && Math.abs(dy)>8 && Math.abs(dy)>Math.abs(dx)) { drag=null; return; }
    if (!drag.moved && Math.abs(dx)>6) {
      drag.moved=true; viewport.classList.add('is-dragging'); viewport.setPointerCapture(event.pointerId);
    }
    if (drag.moved) { position=normalize(drag.position+dx); render(); if(event.cancelable) event.preventDefault(); }
  });
  const finish = event => {
    if (!drag || drag.id !== event.pointerId) return;
    if(drag.moved) suppressUntil=performance.now()+400;
    drag=null; viewport.classList.remove('is-dragging');
    if(viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    resumeAt=performance.now()+1200;
  };
  window.addEventListener('pointerup',finish); window.addEventListener('pointercancel',finish);
  viewport.addEventListener('click',event => {
    if(performance.now()<suppressUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
  },true);
  viewport.addEventListener('keydown',event => {
    if(event.key==='ArrowLeft'||event.key==='ArrowRight') {
      event.preventDefault(); position=normalize(position+(event.key==='ArrowLeft'?1:-1)*viewport.clientWidth*.7); render(); resumeAt=performance.now()+1200;
    } else if(event.code==='Space'&&event.target===viewport) { event.preventDefault(); paused=!paused; }
  });
  viewport.addEventListener('focusin',event => {
    const index=slides.indexOf(event.target);
    if(index>=0 && event.target.matches(':focus-visible')) { position=normalize(-slides[index].offsetLeft+20); render(); }
  });
  new ResizeObserver(measure).observe(viewport);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting; last=0;},{threshold:.2}).observe(viewport);
  document.addEventListener('visibilitychange',()=>{last=0;});
  window.addEventListener('pagehide',()=>cancelAnimationFrame(frame));
  window.addEventListener('pageshow',event=>{if(event.persisted){last=0;frame=requestAnimationFrame(tick);}});
  measure(); frame=requestAnimationFrame(tick);
})();
