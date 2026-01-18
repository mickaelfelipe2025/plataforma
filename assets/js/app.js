const App = (() => {
  const appEl = document.getElementById("app");
  const btnReset = document.getElementById("btnResetProgress");

  let DATA = { courses: [] };

  btnReset.addEventListener("click", () => {
    const ok = confirm("Tem certeza que deseja limpar o progresso salvo neste navegador?");
    if (!ok) return;
    Storage.reset();
    route();
  });

  async function loadData() {
    const res = await fetch("./data/courses.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Falha ao carregar courses.json");
    DATA = await res.json();
  }

  function setActiveNav(key) {
    document.querySelectorAll(".nav__link").forEach(a => {
      a.classList.toggle("active", a.dataset.nav === key);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function pct(n, total) {
    if (!total) return 0;
    return Math.round((n / total) * 100);
  }

  function getYoutubeEmbedUrl(videoId) {
    return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1`;
  }

  function calcStats() {
    const totalCourses = DATA.courses.length;
    let totalLessons = 0;
    let completedLessons = 0;

    for (const c of DATA.courses) {
      totalLessons += c.lessons.length;
      const prog = Storage.getCourse(c.id);
      completedLessons += (prog.completedLessons || []).length;
    }

    return { totalCourses, totalLessons, completedLessons };
  }

  function renderHome() {
    setActiveNav("home");
    const st = calcStats();

    appEl.innerHTML = `
      <section class="hero">
        <div class="hero__grid">
          <div>
            <h1 class="h1">Central de Treinamentos • Office Net</h1>
            <p class="p">
              Tudo em um só lugar: cursos internos, tutoriais de sistemas e orientações para atendimento.
              Sem servidor — vídeos no YouTube — progresso salvo no navegador.
            </p>

            <div class="actions">
              <a class="btn btn--primary" href="#/catalogo">Abrir catálogo</a>
              <a class="btn btn--ghost" href="#/ajuda">Como usar</a>
            </div>

            <div class="kpis">
              <div class="kpi">
                <strong>${st.totalCourses}</strong>
                <small>Cursos / trilhas</small>
              </div>
              <div class="kpi">
                <strong>${st.totalLessons}</strong>
                <small>Aulas no total</small>
              </div>
              <div class="kpi">
                <strong>${st.completedLessons}</strong>
                <small>Aulas concluídas</small>
              </div>
            </div>
          </div>

          <div class="card">
            <h2 style="margin:0 0 10px; font-size:14px;">Acesso rápido</h2>
            <div class="actions">
              <a class="btn btn--primary" href="#/catalogo?cat=Cursos%20Internos">Cursos Internos</a>
              <a class="btn btn--primary" href="#/catalogo?cat=Tutoriais%20de%20Sistemas">Tutoriais Sistemas</a>
              <a class="btn btn--primary" href="#/catalogo?cat=Tutoriais%20para%20Clientes">Tutoriais Clientes</a>
            </div>
            <p class="p" style="margin-top:10px;">
              Dica: mantenha os cursos curtos (5–12 min por aula). Isso aumenta conclusão.
            </p>
          </div>
        </div>
      </section>

      <div class="section">
        <h2>Recomendados</h2>
        <span class="hint">Seleção rápida pra começar</span>
      </div>
      <div class="grid">
        ${DATA.courses.slice(0, 6).map(renderCourseCard).join("")}
      </div>
    `;
  }

  function renderCourseCard(course) {
    const prog = Storage.getCourse(course.id);
    const done = (prog.completedLessons || []).length;
    const total = course.lessons.length;
    const percent = pct(done, total);

    const levelBadge =
      course.level === "Básico" ? "badge badge--green" :
      course.level === "Intermediário" ? "badge badge--gold" :
      "badge";

    return `
      <article class="card">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px;">
          <div>
            <h3 style="margin:0; font-size:15px;">${escapeHtml(course.title)}</h3>
            <p class="p" style="margin-top:6px;">${escapeHtml(course.description || "")}</p>
          </div>
          <span class="${levelBadge}">${escapeHtml(course.level || "—")}</span>
        </div>

        <div class="badges">
          <span class="badge">${escapeHtml(course.category || "Sem categoria")}</span>
          ${(course.tags || []).slice(0, 3).map(t => `<span class="badge">${escapeHtml(t)}</span>`).join("")}
        </div>

        <div style="margin-top:12px;">
          <div class="progress" aria-label="Progresso do curso">
            <div style="width:${percent}%;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:8px; color:rgba(31,45,31,.75); font-weight:700; font-size:12px;">
            <span>${done}/${total} aulas</span>
            <span>${percent}%</span>
          </div>
        </div>

        <div class="actions">
          <a class="btn btn--primary" href="#/curso/${encodeURIComponent(course.id)}">Abrir</a>
          <a class="btn btn--ghost" href="#/catalogo?cat=${encodeURIComponent(course.category || "")}">Ver similares</a>
        </div>
      </article>
    `;
  }

  function renderCatalog() {
    setActiveNav("catalogo");

    const url = new URL(location.href);
    const catFromUrl = url.hash.includes("?") ? new URLSearchParams(url.hash.split("?")[1]).get("cat") : "";

    appEl.innerHTML = `
      <div class="section">
        <h2>Catálogo</h2>
        <span class="hint">Busque, filtre e abra os treinamentos</span>
      </div>

      <div class="toolbar">
        <input id="q" class="input" placeholder="Buscar por título, tag, categoria..." />
        <select id="cat" class="select">
          <option value="">Todas as categorias</option>
          ${Array.from(new Set(DATA.courses.map(c => c.category).filter(Boolean)))
            .sort()
            .map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
        </select>
        <select id="level" class="select">
          <option value="">Todos os níveis</option>
          <option value="Básico">Básico</option>
          <option value="Intermediário">Intermediário</option>
          <option value="Avançado">Avançado</option>
        </select>
      </div>

      <div id="grid" class="grid"></div>
    `;

    const qEl = document.getElementById("q");
    const catEl = document.getElementById("cat");
    const levelEl = document.getElementById("level");
    const gridEl = document.getElementById("grid");

    if (catFromUrl) catEl.value = catFromUrl;

    const render = () => {
      const q = qEl.value.trim().toLowerCase();
      const cat = catEl.value;
      const level = levelEl.value;

      const filtered = DATA.courses.filter(c => {
        if (cat && c.category !== cat) return false;
        if (level && c.level !== level) return false;

        if (!q) return true;
        const hay = [
          c.title, c.description, c.category, c.level,
          ...(c.tags || [])
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });

      gridEl.innerHTML = filtered.map(renderCourseCard).join("") || `
        <div class="card" style="grid-column:1/-1;">
          <h3 style="margin:0 0 6px;">Nada encontrado</h3>
          <p class="p">Tente outro termo ou limpe os filtros.</p>
        </div>
      `;
    };

    qEl.addEventListener("input", render);
    catEl.addEventListener("change", render);
    levelEl.addEventListener("change", render);

    render();
  }

  function renderCourse(courseId) {
    const course = DATA.courses.find(c => c.id === courseId);
    if (!course) {
      appEl.innerHTML = `
        <div class="card">
          <h2 style="margin:0 0 6px;">Curso não encontrado</h2>
          <p class="p">Verifique o ID no courses.json.</p>
          <div class="actions"><a class="btn btn--primary" href="#/catalogo">Voltar ao catálogo</a></div>
        </div>
      `;
      return;
    }

    setActiveNav("catalogo");

    const prog = Storage.getCourse(course.id);
    const completed = new Set(prog.completedLessons || []);
    const total = course.lessons.length;
    const done = completed.size;
    const percent = pct(done, total);

    const firstLesson = course.lessons[0];
    const selectedLessonId = (location.hash.split("?lesson=")[1] || firstLesson?.id || "");
    const selectedLesson = course.lessons.find(l => l.id === selectedLessonId) || firstLesson;

    appEl.innerHTML = `
      <div class="section">
        <h2>${escapeHtml(course.title)}</h2>
        <span class="hint">${escapeHtml(course.category || "")} • ${escapeHtml(course.level || "")}</span>
      </div>

      <div class="card">
        <p class="p">${escapeHtml(course.description || "")}</p>

        <div style="margin-top:12px;">
          <div class="progress">
            <div style="width:${percent}%;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:8px; color:rgba(31,45,31,.75); font-weight:700; font-size:12px;">
            <span>${done}/${total} aulas concluídas</span>
            <span>${percent}%</span>
          </div>
        </div>

        <div class="actions">
          <a class="btn btn--ghost" href="#/catalogo">← Voltar</a>
          <a class="btn btn--primary" href="#/curso/${encodeURIComponent(course.id)}">Atualizar</a>
        </div>
      </div>

      <div class="player">
        <iframe
          src="${getYoutubeEmbedUrl(selectedLesson.videoId)}"
          title="${escapeHtml(selectedLesson.title)}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      </div>

      <div class="section">
        <h2>Aulas</h2>
        <span class="hint">Marque como concluída para salvar seu progresso</span>
      </div>

      <div>
        ${course.lessons.map((l, idx) => {
          const isDone = completed.has(l.id);
          const isActive = l.id === selectedLesson.id;
          return `
            <div class="lesson" style="${isActive ? "border-color: rgba(60,170,40,.35);" : ""}">
              <div class="lesson__left">
                <strong>${idx+1}. ${escapeHtml(l.title)}</strong>
                <small>${isDone ? "✅ Concluída" : "⏳ Pendente"} • ID: ${escapeHtml(l.id)}</small>
              </div>
              <div class="actions" style="margin-top:0;">
                <a class="btn btn--ghost" href="#/curso/${encodeURIComponent(course.id)}?lesson=${encodeURIComponent(l.id)}">Assistir</a>
                <button class="btn btn--primary" data-complete="${escapeHtml(l.id)}" ${isDone ? "disabled" : ""}>
                  ${isDone ? "Concluída" : "Marcar como concluída"}
                </button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;

    document.querySelectorAll("[data-complete]").forEach(btn => {
      btn.addEventListener("click", () => {
        const lessonId = btn.getAttribute("data-complete");
        Storage.setLessonCompleted(course.id, lessonId);
        route(); // re-render
      });
    });
  }

  function renderHelp() {
    setActiveNav("ajuda");
    appEl.innerHTML = `
      <div class="section">
        <h2>Ajuda</h2>
        <span class="hint">Como manter a plataforma organizada</span>
      </div>

      <div class="card">
        <h3 style="margin:0 0 8px;">Como adicionar cursos</h3>
        <p class="p">
          Abra <strong>plataforma/data/courses.json</strong> e adicione um novo item em <strong>courses</strong>.
          Cada aula precisa de um <strong>videoId</strong> do YouTube.
        </p>
        <div class="badges">
          <span class="badge badge--green">Dica</span>
          <span class="badge">Use IDs curtos e únicos</span>
          <span class="badge">Aulas de 5–12 min</span>
        </div>

        <h3 style="margin:16px 0 8px;">Limites (sem servidor)</h3>
        <p class="p">
          O progresso fica salvo apenas neste navegador/dispositivo. Se você precisar de login, ranking, trilhas por usuário
          e certificado, aí sim entra backend (ou Google Sheets como “quase-backend”).
        </p>
      </div>
    `;
  }

  function route() {
    const hash = location.hash || "#/";
    const clean = hash.replace("#", "");

    if (clean === "/") return renderHome();
    if (clean.startsWith("/catalogo")) return renderCatalog();
    if (clean.startsWith("/ajuda")) return renderHelp();

    if (clean.startsWith("/curso/")) {
      const rest = clean.split("/curso/")[1] || "";
      const courseId = decodeURIComponent(rest.split("?")[0]);
      return renderCourse(courseId);
    }

    renderHome();
  }

  async function init() {
    await loadData();
    window.addEventListener("hashchange", route);
    route();
  }

  return { init };
})();

App.init().catch(err => {
  const appEl = document.getElementById("app");
  appEl.innerHTML = `
    <div class="card">
      <h2 style="margin:0 0 6px;">Erro ao iniciar</h2>
      <p class="p">${String(err.message || err)}</p>
      <p class="p" style="margin-top:8px;">Verifique se <strong>plataforma/data/courses.json</strong> existe e está válido.</p>
    </div>
  `;
});
