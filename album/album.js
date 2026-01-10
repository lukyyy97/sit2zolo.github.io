const grid = document.getElementById("grid");

function esc(s){
  return (s || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function render(list){
  grid.innerHTML = "";

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
      <div class="frame">
        <div class="photo-wrap">
          <div class="photo">
            <img src="../${esc(p.photo)}" alt="${esc(p.lastName)} ${esc(p.firstName)}">
          </div>
        </div>

        <div class="body">
          <h3 class="name">${esc(p.lastName)} ${esc(p.firstName)}</h3>
          <div class="meta">
            ${rolePill}
            ${p.birthday ? `<span class="pill">🎂 ${esc(p.birthday)}</span>` : ""}
          </div>
          <p class="quote">“${esc(p.quote || "test text")}”</p>
        </div>
      </div>
    `;

    grid.appendChild(card);
  }
}

(function init(){
  const all = Array.isArray(window.STUDENTS) ? window.STUDENTS : [];
  render(all);
})();
