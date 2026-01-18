const data = {
  courses: [
    {
      id: "onboarding",
      title: "Onboarding Office Net",
      category: "Cursos Internos",
      level: "Básico",
      tags: ["processos", "atendimento"],
      description: "Boas-vindas + padrão de atendimento + rotina.",
      lessons: [
        { id: "l1", title: "Boas-vindas", videoId: "dQw4w9WgXcQ" },
        { id: "l2", title: "Padrão de atendimento", videoId: "dQw4w9WgXcQ" }
      ]
    },
    {
      id: "sistemas",
      title: "Sistemas: rotina operacional",
      category: "Tutoriais de Sistemas",
      level: "Intermediário",
      tags: ["crm", "ordens"],
      description: "Operação do sistema do dia a dia.",
      lessons: [
        { id: "l1", title: "Visão geral do sistema", videoId: "dQw4w9WgXcQ" }
      ]
    }
  ]
};

const KEY = "office_net_stream_progress_v1";
const $ = (q) => document.querySelector(q);

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function write(v){ localStorage.setItem(KEY, JSON.stringify(v)); }
function complete(courseId, lessonId){
  const all = read();
  all[courseId] ||= [];
  if(!all[courseId].includes(lessonId)) all[courseId].push(lessonId);
  write(all);
}
function pct(done, total){ return total ? Math.round((done/total)*100) : 0; }

function kpis(){
  const all = read();
  const totalLessons = data.courses.reduce((s,c)=>s+c.lessons.length,0);
  const doneLessons = Object.values(all).reduce((s,arr)=>s+arr.length,0);
  $("#kpi").textContent = `${doneLessons}/${totalLessons} aulas concluídas`;
}

function groupByCategory(list){
  const m = {};
  for(const c of list){
    (m[c.category] ||= []).push(c);
  }
  return m;
}

function renderHome(list){
  const byCat = groupByCategory(list);
  const featured = list[0];

  $("#app").innerHTML = `
    <section class="hero">
      <div class="left">
        <h1>Aprender aqui é rápido e objetivo.</h1>
        <p>${featured ? featured.description : "Catálogo interno de treinamentos e trilhas."}</p>
        <div class="cta">
          <button class="btn primary" id="btnFeatured">Assistir agora</button>
          <button class="btn ghost" id="btnReset">Limpar progresso</button>
        </div>
      </div>
      <div class="right">
        <strong style="display:block">Destaque</strong>
        <small style="color:rgba(234,241,234,.6);font-weight:700">${featured ? featured.title : ""}</small>
        <div style="margin-top:12px" class="prog"><div id="featProg"></div></div>
      </div>
    </section>

    ${Object.entries(byCat).map(([cat, items]) => `
      <div class="rowHead">
        <h2>${cat}</h2>
        <small>${items.length} cursos</small>
      </div>
      <div class="rail">
        ${items.map(card).join("")}
      </div>
    `).join("")}
  `;

  $("#btnFeatured")?.addEventListener("click", () => openCourse(featured.id));
  $("#btnReset")?.addEventListener("click", () => {
    if(confirm("Limpar progresso salvo neste navegador?")){
      localStorage.removeItem(KEY);
      kpis(); renderHome(data.courses);
    }
  });

  // prog do destaque
  if(featured){
    const all = read();
    const done = (all[featured.id] || []).length;
    const per = pct(done, featured.lessons.length);
    $("#featProg").style.width = per + "%";
  }

  document.querySelectorAll("[data-open]").forEach(b => {
    b.addEventListener("click", () => openCourse(b.getAttribute("data-open")));
  });
}

function card(c){
  const all = read();
  const done = (all[c.id] || []).length;
  const per = pct(done, c.lessons.length);

  return `
    <div class="tile">
      <div style="display:flex;justify-content:space-between;gap:10px;">
        <div>
          <strong style="display:block">${c.title}</strong>
          <small style="color:rgba(234,241,234,.55);font-weight:700">${c.level}</small>
        </div>
        <span class="tag">${c.category}</span>
      </div>

      <div class="tags">
        ${(c.tags||[]).slice(0,3).map(t=>`<span class="tag">${t}</span>`).join("")}
      </div>

      <div class="prog"><div style="width:${per}%"></div></div>

      <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn primary" data-open="${c.id}">Abrir</button>
        <button class="btn ghost" data-open="${c.id}">Continuar</button>
      </div>
    </div>
  `;
}

function openCourse(courseId){
  const c = data.courses.find(x=>x.id===courseId);
  if(!c) return;

  $("#mTitle").textContent = c.title;
  $("#mMeta").textContent = `${c.category} • ${c.level}`;

  const all = read();
  const completed = new Set(all[c.id] || []);

  const first = c.lessons[0];
  setVideo(first.videoId);

  $("#mLessons").innerHTML = c.lessons.map((l, idx) => {
    const done = completed.has(l.id);
    return `
      <div class="lesson">
        <div>
          <strong>${idx+1}. ${l.title}</strong>
          <small>${done ? "✅ Concluída" : "⏳ Pendente"}</small>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn ghost" data-play="${l.videoId}">Assistir</button>
          <button class="btn primary" data-done="${l.id}" ${done ? "disabled":""}>
            ${done ? "Concluída" : "Concluir"}
          </button>
        </div>
      </div>
    `;
  }).join("");

  const doneCount = completed.size;
  const per = pct(doneCount, c.lessons.length);
  $("#mSide").innerHTML = `
    <div class="tile" style="min-width:auto">
      <strong style="display:block">Progresso</strong>
      <small style="color:rgba(234,241,234,.55);font-weight:700">${doneCount}/${c.lessons.length} aulas</small>
      <div class="prog" style="margin-top:10px"><div style="width:${per}%"></div></div>
      <p style="margin:10px 0 0;color:rgba(234,241,234,.65);line-height:1.5">
        Dica: conclua as aulas na ordem para manter consistência do processo.
      </p>
    </div>
  `;

  $("#modal").setAttribute("aria-hidden","false");

  document.querySelectorAll("[data-play]").forEach(b=>{
    b.addEventListener("click", ()=> setVideo(b.getAttribute("data-play")));
  });

  document.querySelectorAll("[data-done]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const lessonId = b.getAttribute("data-done");
      complete(c.id, lessonId);
      kpis();
      openCourse(c.id); // re-render modal
    });
  });
}

function setVideo(videoId){
  $("#mFrame").src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1`;
}

function closeModal(){
  $("#modal").setAttribute("aria-hidden","true");
  $("#mFrame").src = "";
}

document.addEventListener("click", (e) => {
  if(e.target.matches("[data-close]")) closeModal();
});

$("#q").addEventListener("input", () => {
  const q = $("#q").value.trim().toLowerCase();
  const list = data.courses.filter(c => {
    const hay = [c.title,c.category,c.level,(c.tags||[]).join(" "),c.description].join(" ").toLowerCase();
    return hay.includes(q);
  });
  renderHome(list);
});

$("#btnClear").addEventListener("click", () => {
  $("#q").value = "";
  renderHome(data.courses);
});

kpis();
renderHome(data.courses);
