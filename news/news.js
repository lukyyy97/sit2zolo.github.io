let ALL_POSTS = [];

async function loadNews() {
  const res = await fetch("./news.txt?ts=" + Date.now());
  const text = await res.text();
  return parseNews(text);
}

function parseNews(text) {
  const blocks = text
    .split("\n---\n")
    .map(b => b.trim())
    .filter(Boolean);

  const posts = blocks.map(block => {
    const getField = (name) => {
      const re = new RegExp(`^${name}:\\s*(.*)$`, "mi");
      const m = block.match(re);
      return m ? m[1].trim() : "";
    };

    const title = getField("Заголовок") || "Без назви";
    const date = getField("Дата") || "";

    const photosRaw = getField("Фото") || "";
    const photos = photosRaw
      ? photosRaw.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    let body = "";
    const idx = block.toLowerCase().indexOf("текст:");
    if (idx !== -1) body = block.slice(idx + "текст:".length).trim();

    return { title, date, photos, body };
  });

  posts.sort((a,b) => (b.date || "").localeCompare(a.date || ""));
  return posts;
}

function esc(s){
  return (s || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function normalize(s){
  return (s || "").toLowerCase().trim();
}

function applyFilters(){
  const qEl = document.getElementById("q");
  const fromEl = document.getElementById("dateFrom");
  const toEl = document.getElementById("dateTo");

  const q = normalize(qEl?.value);
  const dFrom = (fromEl?.value || "");
  const dTo = (toEl?.value || "");

  const filtered = ALL_POSTS.filter(p => {
    const pDate = p.date || "";

    if (dFrom && (!pDate || pDate < dFrom)) return false;
    if (dTo && (!pDate || pDate > dTo)) return false;

    if (q){
      const hay = normalize((p.title || "") + " " + (p.body || ""));
      if (!hay.includes(q)) return false;
    }

    return true;
  });

  renderNews(filtered, ALL_POSTS.length);
}

function renderCount(shown, total){
  const box = document.getElementById("countBox");
  if (!box) return;
  box.textContent = `Показано ${shown} із ${total}`;
}

function renderNews(posts, totalAll) {
  const list = document.getElementById("newsList");
  const empty = document.getElementById("emptyState");
  if (!list || !empty) return;

  list.innerHTML = "";
  renderCount(posts.length, totalAll);

  if (!posts.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  for (const p of posts) {
    const el = document.createElement("article");
    el.className = "post";

    const photosHtml = p.photos.length
      ? `<div class="photos">
          ${p.photos.map(src => `
            <div class="ph">
              <img src="../${esc(src)}" alt="${esc(p.title)}">
            </div>
          `).join("")}
        </div>`
      : "";

    el.innerHTML = `
      <div class="meta">
        <span class="tag">Новина</span>
        ${p.date ? `<span class="date">${esc(p.date)}</span>` : ""}
      </div>
      <h3>${esc(p.title)}</h3>
      ${photosHtml}
      <p>${esc(p.body).replaceAll("\n","<br>")}</p>
    `;

    list.appendChild(el);
  }
}

function wireUI(){
  const q = document.getElementById("q");
  const dateFrom = document.getElementById("dateFrom");
  const dateTo = document.getElementById("dateTo");
  const clearBtn = document.getElementById("clearBtn");

  let t = null;
  const schedule = () => {
    if (t) clearTimeout(t);
    t = setTimeout(applyFilters, 120);
  };

  q?.addEventListener("input", schedule);
  dateFrom?.addEventListener("change", applyFilters);
  dateTo?.addEventListener("change", applyFilters);

  clearBtn?.addEventListener("click", () => {
    if (q) q.value = "";
    if (dateFrom) dateFrom.value = "";
    if (dateTo) dateTo.value = "";
    applyFilters();
  });
}

(async () => {
  try {
    ALL_POSTS = await loadNews();
    wireUI();
    applyFilters();
  } catch (e) {
    console.error(e);
    const empty = document.getElementById("emptyState");
    const list = document.getElementById("newsList");
    const box = document.getElementById("countBox");
    if (box) box.textContent = "Показано 0 із 0";
    if (list) list.innerHTML = "";
    if (empty) {
      empty.style.display = "block";
      empty.textContent = "Не вдалося завантажити новини. Перевір, чи існує файл news/news.txt";
    }
  }
})();
