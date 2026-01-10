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

    // текст після "Текст:"
    let body = "";
    const idx = block.toLowerCase().indexOf("текст:");
    if (idx !== -1) {
      body = block.slice(idx + "текст:".length).trim();
    }

    return { title, date, photos, body };
  });

  // сортування: нові зверху (якщо дата у форматі YYYY-MM-DD)
  posts.sort((a,b) => (b.date || "").localeCompare(a.date || ""));
  return posts;
}

function esc(s){
  return (s || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function renderNews(posts) {
  const list = document.getElementById("newsList");
  const empty = document.getElementById("emptyState");
  list.innerHTML = "";

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

(async () => {
  try {
    const posts = await loadNews();
    renderNews(posts);
  } catch (e) {
    console.error(e);
    document.getElementById("emptyState").style.display = "block";
    document.getElementById("emptyState").innerText =
      "Не вдалося завантажити новини. Перевір, чи існує файл news/news.txt";
  }
})();
