const grid = document.getElementById("grid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const countBox = document.getElementById("countBox");

function esc(s){
  return (s || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function normalize(s){
  return (s || "").toLowerCase().trim();
}

function render(list){
  grid.innerHTML = "";
  if (!list.length){
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
  }

  countBox.textContent = `Карток: ${list.length}`;

  for (const p of list){
    const isLeader = !!p.leader;

    const card = document.createElement("article");
    card.className = "card" + (isLeader ? " leader" : "");

    const crown = isLeader
      ? `<div class="crown" title="${esc(p.role || "Класний керівник")}"><span>👑</span></div>`
      : "";

    const rolePill = isLeader && p.role
      ? `<span class="pill">${esc(p.role)}</span>`
      : "";

    card.innerHTML = `
      ${crown}
      <div class="photo">
        <img src="../${esc(p.photo)}" alt="${esc(p.lastName)} ${esc(p.firstName)}">
      </div>
      <div class="body">
        <h3 class="name">${esc(p.lastName)} ${esc(p.firstName)}</h3>
        <div class="meta">
          ${rolePill}
          ${p.birthday ? `<span class="pill">🎂 ${esc(p.birthday)}</span>` : ""}
        </div>
        <p class="quote">“${esc(p.quote || "test text")}”</p>
      </div>
    `;

    grid.appendChild(card);
  }
}

function applySearch(){
  const q = normalize(searchInput.value);
  const all = Array.isArray(window.STUDENTS) ? window.STUDENTS : [];

  if (!q){
    render(all);
    return;
  }

  const filtered = all.filter(p => {
    const hay = normalize(`${p.lastName || ""} ${p.firstName || ""}`);
    return hay.includes(q);
  });

  render(filtered);
}

(function init(){
  const all = Array.isArray(window.STUDENTS) ? window.STUDENTS : [];
  render(all);

  let t = null;
  searchInput.addEventListener("input", () => {
    if (t) clearTimeout(t);
    t = setTimeout(applySearch, 120);
  });
})();
