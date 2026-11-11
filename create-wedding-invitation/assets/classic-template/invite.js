(() => {
  "use strict";
  const data = window.INVITATION;
  const $ = (id) => document.getElementById(id);
  const text = (id, value) => { $(id).textContent = value || ""; };
  const imageUrl = (path) => path || "./assets/placeholder.svg";
  const setPhoto = (button, item) => {
    const src = typeof item === "string" ? item : item.src;
    button.style.backgroundImage = `url("${imageUrl(src).replace(/\"/g, "%22")}")`;
    button.dataset.src = imageUrl(src);
    button.dataset.title = typeof item === "string" ? "" : item.title || "";
    button.dataset.caption = typeof item === "string" ? "" : item.caption || "";
    button.setAttribute("aria-label", typeof item === "string" ? "查看照片" : item.alt || item.title || "查看照片");
  };
  document.documentElement.dataset.theme = data.theme.preset || "classic";
  if (data.theme.surface) {
    document.documentElement.dataset.palette = 'custom';
    document.documentElement.dataset.texture = data.theme.texture || 'paper';
    for (const key of ['accent', 'paper', 'surface', 'surfaceDark', 'metallic', 'text', 'surfaceText', 'darkText', 'card', 'cardText']) {
      if (/^#[0-9a-f]{6}$/i.test(data.theme[key] || '')) {
        document.documentElement.style.setProperty('--palette-' + key, data.theme[key]);
      }
    }
  }
  document.documentElement.style.setProperty("--accent", data.theme.accent);
  document.documentElement.style.setProperty("--paper", data.theme.paper);
  const names = data.couple.brideFirst ? [data.couple.bride, data.couple.groom] : [data.couple.groom, data.couple.bride];
  document.title = `${names.join(' & ')} · 婚礼邀请`;
  if (data.couple.brideFirst) {
    for (const [firstId, lastId] of [['bride', 'groom'], ['ticketBride', 'ticketGroom']]) {
      const first = $(firstId), last = $(lastId), parent = first.parentNode;
      parent.insertBefore(first, parent.firstChild);
      parent.appendChild(last);
    }
  }
  const eventClock = String(data.event.datetime || '').match(/T(\d{2}):(\d{2})/);
  const eventDateTime = eventClock && !/\d{1,2}:\d{2}|\d{1,2}点/.test(data.event.dateDisplay)
    ? `${data.event.dateDisplay}　${eventClock[1]}:${eventClock[2]}` : data.event.dateDisplay;
  document.querySelector('meta[name="description"]').content = `${eventDateTime}，${data.event.venue}。诚邀您参加我们的婚礼。`;
  document.querySelector('meta[property="og:title"]').content = document.title;
  document.querySelector('meta[property="og:description"]').content = document.querySelector('meta[name="description"]').content;
  document.querySelector('meta[property="og:image"]').content = data.media.share || data.media.cover || "./assets/placeholder.svg";
  document.querySelector('meta[name="robots"]').content = data.privacy?.noindex !== false ? "noindex,nofollow" : "index,follow";
  text("eyebrow", data.copy.eyebrow); text("title", data.copy.title); text("groom", data.couple.groom); text("bride", data.couple.bride); text("invitation", data.copy.invitation);
  text("date", eventDateTime); text("venueShort", data.event.venue); text("galleryTitle", data.copy.galleryTitle); text("galleryIntro", data.copy.galleryIntro);
  text("ticketGroom", data.couple.groom); text("ticketBride", data.couple.bride); text("ticketDate", eventDateTime); text("venue", data.event.venue); text("address", data.event.address); text("dresscode", data.event.dresscode);
  text("locationVenue", data.event.venue);
  if (data.event.mapUrl) {
    try {
      const mapUrl = new URL(data.event.mapUrl);
      if (mapUrl.protocol === 'https:' && mapUrl.hostname === 'www.amap.com') {
        $("mapLink").href = mapUrl.href;
        $("mapLink").hidden = false;
      }
    } catch { /* Keep the address visible if no valid map link is configured. */ }
  }
  $("dressRow").hidden = !data.event.dresscode; text("closing", data.copy.closing); text("signature", data.copy.signature);
  setPhoto($("coverPhoto"), data.media.cover); setPhoto($("endingPhoto"), data.media.ending);
  const gallery = data.media.gallery.length ? data.media.gallery : Array.from({length: 3}, (_, i) => ({src: "", title: "照片待添加", alt: `相册照片占位 ${i + 1}`}));
  gallery.forEach((item) => { const button = document.createElement("button"); button.type = "button"; button.className = "photo"; setPhoto(button, item); $("galleryList").append(button); });
  if (!data.media.gallery.length) {
    const note = document.createElement("p");
    note.className = "gallery-placeholder-note";
    note.textContent = "照片待添加 · 左右滑动预览";
    $("galleryList").after(note);
  }
  const timeline = Array.isArray(data.timeline) ? data.timeline : [];
  $("timeline").hidden = timeline.length === 0;
  $("timeline").style.display = timeline.length ? "" : "none";
  timeline.forEach((item) => { const li = document.createElement("li"); li.textContent = `${item.time} · ${item.label}`; $("timeline").append(li); });
  const updateCountdown = () => text("days", String(Math.max(0, Math.ceil((new Date(data.event.datetime).getTime() - Date.now()) / 86400000)))); updateCountdown(); setInterval(updateCountdown, 60000);
  const dialog = $("lightbox"); document.addEventListener("click", (event) => { const button = event.target.closest(".photo"); if (!button) return; $("lightboxImage").src = button.dataset.src; $("lightboxImage").alt = button.getAttribute("aria-label"); text("lightboxTitle", button.dataset.title); text("lightboxCaption", button.dataset.caption); dialog.showModal(); });
  $("closeLightbox").addEventListener("click", () => dialog.close());
  if (data.media.music) {
    const audio = new Audio(data.media.music);
    const button = $("musicButton");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.72;
    button.hidden = false;
    let wantsMusic = true;
    let loadFailed = false;
    const syncMusicState = () => {
      const playing = !audio.paused && !audio.error;
      button.setAttribute("aria-pressed", String(playing));
      button.setAttribute("aria-label", playing ? "暂停音乐" : "播放音乐");
      button.title = playing ? "暂停音乐" : "播放音乐";
      button.textContent = playing ? "Ⅱ" : "♪";
    };
    const removeUnlockListeners = () => {
      document.removeEventListener("pointerdown", unlockMusic, true);
      document.removeEventListener("touchstart", unlockMusic, true);
      document.removeEventListener("click", unlockMusic, true);
      document.removeEventListener("keydown", unlockMusic, true);
    };
    const musicFailed = () => {
      loadFailed = true;
      audio.pause();
      syncMusicState();
      button.setAttribute("aria-label", "音乐暂时无法播放，轻触页面或点击重试");
      button.title = "音乐暂时无法播放，轻触页面或点击重试";
    };
    const tryPlay = async () => {
      if (!wantsMusic || !audio.paused) return;
      try {
        if (loadFailed) { loadFailed = false; audio.load(); }
        await audio.play();
        removeUnlockListeners();
      } catch {
        // Audible autoplay may be blocked; keep the first-interaction fallback.
        syncMusicState();
      }
    };
    function unlockMusic(event) {
      if (event.target?.closest?.("#musicButton")) return;
      tryPlay();
    }
    audio.addEventListener("play", syncMusicState);
    audio.addEventListener("pause", syncMusicState);
    audio.addEventListener("error", musicFailed);
    syncMusicState();
    button.addEventListener("click", async () => {
      if (!audio.paused) {
        wantsMusic = false;
        audio.pause();
        removeUnlockListeners();
        return;
      }
      wantsMusic = true;
      await tryPlay();
    });
    document.addEventListener("pointerdown", unlockMusic, { passive: true, capture: true });
    document.addEventListener("touchstart", unlockMusic, { passive: true, capture: true });
    document.addEventListener("click", unlockMusic, true);
    document.addEventListener("keydown", unlockMusic, true);
    tryPlay();
  }
})();
