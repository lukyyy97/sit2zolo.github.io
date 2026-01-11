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
    pointer-events:none;
  }

  .lb-group{
    display:flex; gap:8px; align-items:center;
    pointer-events:auto;
  }

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
    pointer-events:auto;
    transition: transform .15s ease, background .2s ease, border-color .2s ease;
  }
  .lb-arrow:hover{
    transform: translateY(-1px);
    background: rgba(255,255,255,.09);
    border-color: rgba(255,255,255,.24);
  }

  .lb-caption{
    position:absolute;
    left: 14px; right: 14px; bottom: 12px;
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    pointer-events:none;
  }
  .lb-cap{
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.14);
    background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.86);
    font-size: 12.5px;
    max-width: 70%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events:auto;
  }
  .lb-count{
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.14);
    background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.78);
    font-size: 12.5px;
    pointer-events:auto;
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
          <button class="lb-btn" data-act="zoomOut">−</button>
          <button class="lb-btn" data-act="zoomIn">+</button>
          <button class="lb-btn" data-act="reset">Скинути</button>
        </div>
        <div class="lb-group">
          <button class="lb-btn" data-act="close">Закрити ✕</button>
        </div>
      </div>

      <div class="lb-nav">
        <button class="lb-arrow" data-act="prev">‹</button>
        <button class="lb-arrow" data-act="next">›</button>
      </div>

      <div class="lb-canvas">
        <img class="lb-img" alt="">
      </div>

      <div class="lb-caption">
        <div class="lb-cap" id="lbCap"></div>
        <div class="lb-count" id="lbCount"></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const imgEl = overlay.querySelector(".lb-img");
  const capEl = overlay.querySelector("#lbCap");
  const countEl = overlay.querySelector("#lbCount");

  let items = [];
  let index = 0;
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  function canUseImage(img){
    if (!img) return false;
    if (img.closest(".no-lightbox")) return false;
    if (img.dataset.lightbox === "off") return false;
    if (location.pathname.includes("/album/")) return false;
    return true;
  }

  function collectImages(anchor){
    const scope = anchor.closest("main") || document.body;
    return Array.from(scope.querySelectorAll("img"))
      .filter(canUseImage)
      .map(i => ({
        src: i.currentSrc || i.src,
        title: i.getAttribute("data-title") || i.alt || ""
      }));
  }

  function applyTransform(){
    imgEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function resetView(){
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  }

  function setImage(i){
    index = (i + items.length) % items.length;
    const it = items[index];
    imgEl.src = it.src;
    capEl.textContent = it.title;
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
  }

  overlay.addEventListener("click", e => {
    if (e.target === overlay) close();
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const a = btn.dataset.act;
    if (a === "close") close();
    if (a === "next") setImage(index + 1);
    if (a === "prev") setImage(index - 1);
    if (a === "zoomIn") { scale = Math.min(4, scale + .25); applyTransform(); }
    if (a === "zoomOut") { scale = Math.max(1, scale - .25); applyTransform(); }
    if (a === "reset") resetView();
  });

  const canvas = overlay.querySelector(".lb-canvas");

  canvas.addEventListener("mousedown", e => {
    if (scale <= 1) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener("mousemove", e => {
    if (!dragging) return;
    tx += e.clientX - lastX;
    ty += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    applyTransform();
  });

  window.addEventListener("mouseup", () => dragging = false);

  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    scale = Math.max(1, Math.min(4, scale + (e.deltaY < 0 ? .2 : -.2)));
    applyTransform();
  }, { passive:false });

  document.addEventListener("click", e => {
    const img = e.target.closest("img");
    if (!img || !canUseImage(img)) return;
    openAt(img);
  });

  window.addEventListener("keydown", e => {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") setImage(index + 1);
    if (e.key === "ArrowLeft") setImage(index - 1);
  });
})();
