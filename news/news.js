const NEWS_URL = "./news.txt";

function esc(s){
  return (s || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

function toISODate(uaDate){
  const m = String(uaDate || "").trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if(!m) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function parseNews(text){
  const blocks = text.split("\n---\n").map(b => b.trim()).filter(Boolean);

  const posts = blocks.map(block => {
    const getField = (name) => {
      const re = new RegExp(`^${name}:\\s*(.*)$`, "mi");
      const m = block.match(re);
      return m ? m[1].trim() : "";
    };

    const title = getField("Заголовок") || "Без назви";
    const date = getField("Дата") || "";
    const photosRaw = getField("Фото") || "";
    const photos = photosRaw ? photosRaw.split(",").map(s => s.trim()).filter(Boolean) : [];

    let body = "";
    const idx = block.toLowerCase().indexOf("текст:");
    if (idx !== -1) body = block.slice(idx + "текст:".length).trim();

    return {
      title,
      date,
      isoDate: toISODate(date),
      photos,
      body
    };
  });

  posts.sort((a,b) => (b.isoDate || "").localeCompare(a.isoDate || ""));
  return posts;
}

function linkifySafe(text){
  const raw = String(text || "");

  const re = /(^|[\s(])((https?:\/\/|www\.)[^\s<>"')\]]+)/gi;

  let out = "";
  let last = 0;
  let m;

  while((m = re.exec(raw)) !== null){
    const prefix = m[1] || "";
    const urlRaw = m[2] || "";

    const start = m.index;
    const wholeLen = m[0].length;

    out += esc(raw.slice(last, start));
    out += esc(prefix);

    let href = urlRaw;
    if (/^www\./i.test(href)) href = "https://" + href;

    const safeHref = esc(href);
    const safeText = esc(urlRaw);

    out += `<a href="${safeHref}" target="_blank" rel="noreferrer noopener">${safeText}</a>`;

    last = start + wholeLen;
  }

  out += esc(raw.slice(last));

  out = out.replace(/\r\n|\r|\n/g, "<br>");
  return out;
}

function hasQuery(post, q){
  if(!q) return true;
  const s = (post.title + " " + post.body + " " + post.date).toLowerCase();
  return s.includes(q.toLowerCase());
}

function inDateRange(post, fromISO, toISO){
  if(!fromISO && !toISO) return true;
  if(!post.isoDate) return false;

  if(fromISO && post.isoDate < fromISO) return false;
  if(toISO && post.isoDate > toISO) return false;
  return true;
}

function render(posts){
  const list = document.getElementById("newsList");
  const empty = document.getElementById("emptyState");
  const countBox = document.getElementById("countBox");
  if(!list) return;

  const q = (document.getElementById("q")?.value || "").trim();
  const fromISO = document.getElementById("dateFrom")?.value || "";
  const toISO = document.getElementById("dateTo")?.value || "";

  const filtered = posts.filter(p => hasQuery(p, q) && inDateRange(p, fromISO, toISO));

  if(countBox) countBox.textContent = `Показано ${filtered.length} із ${posts.length}`;
  if(empty) empty.style.display = filtered.length ? "none" : "block";

  list.innerHTML = "";

  filtered.forEach((p) => {
    const post = document.createElement("article");
    post.className = "post";

    const photosHtml = p.photos.length ? `
      <div class="photos">
        ${p.photos.map((src, idx) => `
          <div class="ph">
            <img
              src="${esc("../" + src)}"
              alt="${esc(p.title)}"
              data-title="${esc(p.title)}"
              data-date="${esc(p.date || "")}"
              data-desc="${esc(p.body || "")}"
              data-gallery="news-${esc(p.isoDate || "nodate")}-${esc(p.title)}"
              data-index="${idx}"
            >
          </div>
        `).join("")}
      </div>
    ` : "";

    const bodyHtml = linkifySafe(p.body);

    post.innerHTML = `
      <div class="meta">
        <span class="tag">Новина</span>
        ${p.date ? `<span class="date">${esc(p.date)}</span>` : ""}
      </div>

      <h3>${esc(p.title)}</h3>

      ${photosHtml}

      <p>${bodyHtml}</p>
    `;

    list.appendChild(post);
  });

  if (window.Lightbox && typeof window.Lightbox.bind === "function"){
    window.Lightbox.bind({
      root: list,
      selector: "img[data-gallery]",
      getMeta: (imgEl) => ({
        title: imgEl.getAttribute("data-title") || "",
        date: imgEl.getAttribute("data-date") || "",
        desc: imgEl.getAttribute("data-desc") || ""
      })
    });
  }
}

(async () => {
  try{
    const res = await fetch(NEWS_URL + "?ts=" + Date.now());
    const text = await res.text();
    const posts = parseNews(text);

    const qEl = document.getElementById("q");
    const fromEl = document.getElementById("dateFrom");
    const toEl = document.getElementById("dateTo");
    const clearBtn = document.getElementById("clearBtn");

    const rerender = () => render(posts);

    qEl?.addEventListener("input", rerender);
    fromEl?.addEventListener("change", rerender);
    toEl?.addEventListener("change", rerender);

    clearBtn?.addEventListener("click", () => {
      if (qEl) qEl.value = "";
      if (fromEl) fromEl.value = "";
      if (toEl) toEl.value = "";
      render(posts);
    });

    render(posts);
  }catch(e){
    console.error(e);
  }
})();
