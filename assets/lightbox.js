(() => {
  if (document.body && document.body.classList.contains("no-lightbox")) return;

  const STYLE = `
  .lb-overlay{
    position:fixed; inset:0; z-index:9999;
    background: rgba(0,0,0,.72);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display:none;
    align-items:center;
    justify-content:center;
    padding: 18px;
  }
  .lb-overlay.open{ display:flex; }

  .lb-frame{
    position:relative;
    width:min(1100px, 96vw);
    height:min(760px, 86vh);
    border-radius: 22px;
    border: 1px solid rgba(255,255,255,.14);
    background: rgba(255,255,255,.04);
    overflow:hidden;
    box-shadow: 0 22px 80px rgba(0,0,0,.35);
  }

  .lb-canvas{ z-index:1; }
  .lb-ui, .lb-nav, .lb-caption{ z-index:5; }

  .lb-canvas{
    position:absolute; inset:0;
    display:flex;
    align-items:center;
    justify-content:center;
    overflow:hidden;
    touch-action: none;
    user-select:none;
  }

  .lb-img{
    max-width: 92%;
    max-height: 92%;
    transform-origin: 0 0;
    will-change: transform;
    border-radius: 16px;
    box-shadow: 0 18px 65px rgba(0,0,0,.45);
    user-select:none;
    -webkit-user-drag:none;
  }

  .lb-ui{
    position:absolute; left:12px; right:12px; top:12px;
    display:flex; gap:10px; align-items:center; justify-content:space-between;
  }
  .lb-group{ display:flex; gap:8px; align-items:center; }

  .lb-btn{
    padding: 10px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.18);
    background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.92);
    font-size: 13px;
    cursor:pointer;
    transition: transform .15s ease, background .2s ease, border-color .2s ease;
  }
  .lb-btn:hover{
    transform: translateY(-1px);
    background: rgba(255,255,255,.09);
    border-color: rgba(255,255,255,.24);
  }

  .lb-nav{
    position:absolute; inset:0;
    display:flex; align-items:center; justify-content:space-between;
    padding: 0 10px;
    pointer-events:none;
  }
  .lb-arrow{
    width: 44px; height: 44px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.18);
    background: rgba(255,255,255,.06);
    display:flex; align-items:center; justify-content:center;
    color: rgba(255,255,255,.92);
    cursor:pointer;
    transition: transform .15s ease, background .2s ease, border-color .2s ease;
    pointer-events:auto;
  }
  .lb-arrow:hover{
    transform: translateY(-1px);
    background: rgba(255,255,255,.09);
    border-color: rgba(255,255,255,.24);
  }

  .lb-caption{
    position:absolute;
    left: 14px; right: 14px; bottom: 12px;
    display:flex; align-items:flex-end; justify-content:space-between; gap:10px;
  }
  .lb-capbox{
    display:flex;
    flex-direction:column;
    gap:6px;
    max-width: 74%;
  }
  .lb-cap{
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.14);
    background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.90);
    font-size: 12.8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .lb-meta{
    padding: 8px 12px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(255,255,255,.05);
    color: rgba(255,255,255,.80);
    font-size: 12.5px;
    line-height:1.45;
    max-height: 72px;
    overflow:auto;
  }
  .lb-count{
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.14);
    background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.78);
    font-size: 12.5px;
    white-space:nowrap;
  }

  @media (max-width: 640px){
    .lb-frame{ width: 96vw; height: 86vh; }
    .lb-arrow{ width: 42px; height: 42px; }
    .lb-meta{ max-height: 92px; }
  }
  `;

  const style = document.createElement("style");
  style.textContent = STYLE;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.className = "lb-overlay";
  overlay.innerHTML = `
    <div class="lb-frame" role="dialog" aria-modal="true">
      <div class="lb-ui">
        <div class="lb-group">
          <button class="lb-btn" type="button" data-act="zoomOut">−</button>
          <button class="lb-btn" type="button" data-act="zoomIn">+</button>
          <button class="lb-btn" type="button" data-act="reset">Скинути</button>
        </div>
        <div class="lb-group">
          <button class="lb-btn" type="button" data-act="close">Закрити ✕</button>
        </div>
      </div>

      <div class="lb-nav">
        <button class="lb-arrow" type="button" data-act="prev" aria-label="Попереднє">‹</button>
        <button class="lb-arrow" type="button" data-act="next" aria-label="Наступне">›</button>
      </div>

      <div class="lb-canvas">
        <img class="lb-img" alt="">
      </div>

      <div class="lb-caption">
        <div class="lb-capbox">
          <div class="lb-cap" id="lbCap"></div>
          <div class="lb-meta" id="lbMeta"></div>
        </div>
        <div class="lb-count" id="lbCount"></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const frame = overlay.querySelector(".lb-frame");
  const imgEl = overlay.querySelector(".lb-img");
  const capEl = overlay.querySelector("#lbCap");
  const metaEl = overlay.querySelector("#lbMeta");
  const countEl = overlay.querySelector("#lbCount");
  const canvas = overlay.querySelector(".lb-canvas");

  let items = [];
  let index = 0;

  let scale = 1;
  let tx = 0;
  let ty = 0;

  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  let touchStartX = 0;
  let touchStartY = 0;
  let touchLastX = 0;
  let touchLastY = 0;

  function canUseImage(img){
    if (!img) return false;
    if (img.closest(".no-lightbox")) return false;
    if (img.dataset.lightbox === "off") return false;
    if (location.pathname.includes("/album/")) return false;
    const src = img.currentSrc || img.src || "";
    return !!src;
  }

  function getGalleryScope(anchor){
    return anchor.closest("[data-gallery-scope]") || anchor.closest("main") || document.body;
  }

  function collectImages(anchor){
    const scope = getGalleryScope(anchor);
    const g = anchor.dataset.gallery || "";
    const all = Array.from(scope.querySelectorAll("img")).filter(canUseImage);
    const filtered = g ? all.filter(i => (i.dataset.gallery || "") === g) : all;

    return filtered.map(i => ({
      src: i.currentSrc || i.src,
      title: i.getAttribute("data-title") || i.alt || "",
      date: i.getAttribute("data-date") || "",
      desc: i.getAttribute("data-desc") || ""
    }));
  }

  function applyTransform(){
    imgEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function resetView(){
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  }

  function setMeta(it){
    const parts = [];
    if (it.date) parts.push(it.date);
    if (it.desc) parts.push(it.desc);
    metaEl.textContent = parts.join(" — ");
    metaEl.style.display = parts.length ? "" : "none";
  }

  function setImage(i){
    index = (i + items.length) % items.length;
    const it = items[index];
    imgEl.src = it.src;
    capEl.textContent = it.title || "";
    setMeta(it);
    countEl.textContent = items.length > 1 ? `${index + 1} / ${items.length}` : "";
    resetView();
  }

  function openAt(img){
    items = collectImages(img);
    if (!items.length) return;
    overlay.classList.add("open");
    document.documentElement.style.overflow = "hidden";
    const src = img.currentSrc || img.src;
    const i = items.findIndex(x => x.src === src);
    setImage(i >= 0 ? i : 0);
  }

  function close(){
    overlay.classList.remove("open");
    document.documentElement.style.overflow = "";
    imgEl.src = "";
    items = [];
  }

  function next(){ if (items.length) setImage(index + 1); }
  function prev(){ if (items.length) setImage(index - 1); }

  function zoomBy(delta){
    scale = Math.max(1, Math.min(4, scale + delta));
    applyTransform();
  }

  overlay.addEventListener("click", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.target === overlay) close();
  });

  frame.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    const a = btn.dataset.act;
    if (a === "close") close();
    if (a === "next") next();
    if (a === "prev") prev();
    if (a === "zoomIn") zoomBy(0.25);
    if (a === "zoomOut") zoomBy(-0.25);
    if (a === "reset") resetView();
  });

  canvas.addEventListener("mousedown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (scale <= 1) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    tx += e.clientX - lastX;
    ty += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    applyTransform();
  });

  window.addEventListener("mouseup", () => dragging = false);

  canvas.addEventListener("wheel", (e) => {
    if (!overlay.classList.contains("open")) return;
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 0.18 : -0.18);
  }, { passive:false });

  canvas.addEventListener("touchstart", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchLastX = touchStartX;
    touchLastY = touchStartY;
  }, { passive:true });

  canvas.addEventListener("touchmove", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.touches.length !== 1) return;

    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const dx = x - touchLastX;
    const dy = y - touchLastY;

    if (scale > 1){
      tx += dx;
      ty += dy;
      applyTransform();
    }

    touchLastX = x;
    touchLastY = y;
  }, { passive:true });

  canvas.addEventListener("touchend", () => {
    if (!overlay.classList.contains("open")) return;
    if (scale > 1) return;

    const dx = touchLastX - touchStartX;
    const dy = touchLastY - touchStartY;

    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)){
      if (dx < 0) next();
      else prev();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "+" || e.key === "=") zoomBy(0.2);
    if (e.key === "-" || e.key === "_") zoomBy(-0.2);
    if (e.key.toLowerCase() === "r") resetView();
  });

  document.addEventListener("click", (e) => {
    const img = e.target.closest("img");
    if (!img || !canUseImage(img)) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    openAt(img);
  }, true);
})();
