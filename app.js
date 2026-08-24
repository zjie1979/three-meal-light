(() => {
  "use strict";

  const STORAGE_KEY = "three-meal-light-v1";
  const DEFAULT_TEMPLATES = [
    { id: "meal-1", emoji: "🥔", name: "土豆", foods: "蒸土豆、烤土豆或少油土豆块", tip: "当主食吃，别再叠加太多米饭面条。" },
    { id: "meal-2", emoji: "🥣", name: "无糖酸奶", foods: "无糖酸奶，可以加少量水果或燕麦", tip: "优先选无糖，太甜的酸奶按甜品看。" },
    { id: "meal-3", emoji: "🐔", name: "鸡胸肉", foods: "鸡胸肉、鸡腿去皮或低油鸡肉", tip: "蛋白质够了，饱腹会更稳。" },
    { id: "meal-4", emoji: "🥚", name: "鸡蛋", foods: "水煮蛋、蒸蛋或少油煎蛋", tip: "简单好执行，一餐配1到2个就够用。" },
    { id: "meal-5", emoji: "🌽", name: "玉米红薯", foods: "玉米、红薯、南瓜等粗粮主食", tip: "这类也算主食，份量适中就行。" },
    { id: "meal-6", emoji: "🥬", name: "蔬菜", foods: "青菜、番茄、黄瓜、菌菇等", tip: "用来补体积和饱腹，不要只吃菜。" },
    { id: "meal-7", emoji: "🐟", name: "鱼虾牛肉", foods: "鱼、虾、瘦牛肉或豆腐", tip: "换着吃，别把一餐弄得太复杂。" },
    { id: "meal-8", emoji: "🍎", name: "水果", foods: "苹果、橙子、莓果等一小份水果", tip: "完整水果可以，果汁不算。" },
    { id: "meal-9", emoji: "🍚", name: "正常饭菜", foods: "正常吃一小份饭菜，少油少汤", tip: "外食时就选这一项，吃到七八分饱。" }
  ];
  const LEGACY_DEFAULT_TEMPLATE_NAMES = [
    "控糖早餐", "高蛋白早餐", "轻食早餐", "家常均衡餐", "清爽蒸煮餐",
    "外卖减负餐", "面食搭配餐", "火锅聪明餐", "自由满足餐"
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const cloneTemplates = () => DEFAULT_TEMPLATES.map((item) => ({ ...item }));
  const defaultState = () => ({
    version: 4,
    templates: cloneTemplates(),
    loop: {
      roundsCompleted: 0,
      currentRound: 1,
      checkedIds: [],
      events: []
    }
  });

  let state = loadState();
  let activeTemplateId = null;
  let installPrompt = null;
  let toastTimer = null;

  const refs = {
    roundTitle: $("#roundTitle"),
    roundMessage: $("#roundMessage"),
    currentRoundText: $("#currentRoundText"),
    roundProgressText: $("#roundProgressText"),
    roundProgressBar: $("#roundProgressBar"),
    roundsCompleted: $("#roundsCompleted"),
    checkinGrid: $("#checkinGrid"),
    templateGrid: $("#templateGrid"),
    historyList: $("#historyList"),
    statsRounds: $("#statsRounds"),
    statsMeals: $("#statsMeals"),
    statsCurrent: $("#statsCurrent"),
    editorSheet: $("#editorSheet"),
    sheetBackdrop: $("#sheetBackdrop"),
    editorEyebrow: $("#editorEyebrow"),
    templateIdInput: $("#templateIdInput"),
    templateEmoji: $("#templateEmoji"),
    templateName: $("#templateName"),
    templateFoods: $("#templateFoods"),
    templateTip: $("#templateTip"),
    installSheet: $("#installSheet"),
    toast: $("#toast"),
    celebrationCanvas: $("#celebrationCanvas")
  };

  function normalizeTemplates(savedTemplates) {
    return DEFAULT_TEMPLATES.map((fallback, index) => {
      const saved = Array.isArray(savedTemplates)
        ? savedTemplates.find((item) => item?.id === fallback.id) || savedTemplates[index]
        : null;
      const wasLegacyDefault = !saved || LEGACY_DEFAULT_TEMPLATE_NAMES.includes(saved.name);
      const source = wasLegacyDefault ? fallback : { ...fallback, ...saved };
      return {
        id: fallback.id,
        emoji: String(source.emoji || fallback.emoji).slice(0, 4),
        name: String(source.name || fallback.name).slice(0, 12),
        foods: String(source.foods || fallback.foods).slice(0, 80),
        tip: String(source.tip || fallback.tip).slice(0, 60)
      };
    });
  }

  function migrateLegacy(saved) {
    const next = defaultState();
    next.templates = normalizeTemplates(saved?.templates);
    const doneRecords = [];
    Object.entries(saved?.days || {}).sort().forEach(([date, day]) => {
      Object.values(day?.meals || {}).forEach((record) => {
        if (record?.done) doneRecords.push({ date, templateId: record.templateId });
      });
    });
    next.loop.roundsCompleted = Math.floor(doneRecords.length / 9);
    next.loop.currentRound = next.loop.roundsCompleted + 1;
    next.loop.checkedIds = [];
    return next;
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved) return defaultState();
      if (saved.version === 4 && saved.loop) {
        const fallback = defaultState();
        const checkedIds = Array.isArray(saved.loop.checkedIds)
          ? saved.loop.checkedIds.filter((id) => DEFAULT_TEMPLATES.some((item) => item.id === id)).slice(0, 9)
          : [];
        return {
          version: 4,
          templates: normalizeTemplates(saved.templates),
          loop: {
            roundsCompleted: Math.max(0, Number(saved.loop.roundsCompleted) || 0),
            currentRound: Math.max(1, Number(saved.loop.currentRound) || fallback.loop.currentRound),
            checkedIds,
            events: Array.isArray(saved.loop.events) ? saved.loop.events.slice(0, 80) : []
          }
        };
      }
      return migrateLegacy(saved);
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function templateFor(id) {
    return state.templates.find((item) => item.id === id) || state.templates[0];
  }

  function checkedCount() {
    return state.loop.checkedIds.length;
  }

  function renderCheckin() {
    const count = checkedCount();
    const progress = Math.round((count / 9) * 100);
    refs.roundTitle.textContent = count === 0 ? "这一轮从第一顿开始" : count === 8 ? "还差1顿完成一轮" : `这一轮已完成${count}顿`;
    refs.roundMessage.textContent = count === 0
      ? "直接点下面的卡片打卡。9顿打完，自动算1轮。"
      : "继续点没有完成的卡片；点错了也可以再点一次取消。";
    refs.currentRoundText.textContent = `第 ${state.loop.currentRound} 轮`;
    refs.roundProgressText.textContent = `${count} / 9 顿`;
    refs.roundProgressBar.style.width = `${progress}%`;
    refs.roundsCompleted.textContent = state.loop.roundsCompleted;

    refs.checkinGrid.innerHTML = state.templates.map((template, index) => {
      const isChecked = state.loop.checkedIds.includes(template.id);
      return `
        <button class="template-card checkin-card tone-${index + 1} ${isChecked ? "is-checked" : ""}" type="button" data-check-meal="${template.id}" aria-label="${isChecked ? "取消" : "打卡"}第${index + 1}顿 ${escapeHtml(template.name)}">
          <span class="template-emoji" aria-hidden="true">${escapeHtml(template.emoji)}</span>
          <b>${index + 1}. ${escapeHtml(template.name)}</b>
          <span>${escapeHtml(template.foods)}</span>
          <i class="check-label">${isChecked ? "已打卡" : "点我打卡"}</i>
        </button>`;
    }).join("");
    $$("[data-check-meal]", refs.checkinGrid).forEach((button) => button.addEventListener("click", () => toggleMeal(button.dataset.checkMeal)));
  }

  function renderLibrary() {
    refs.templateGrid.innerHTML = state.templates.map((template, index) => `
      <button class="template-card tone-${index + 1}" type="button" data-edit-template="${template.id}" aria-label="编辑第${index + 1}顿 ${escapeHtml(template.name)}">
        <span class="template-emoji" aria-hidden="true">${escapeHtml(template.emoji)}</span>
        <b>${escapeHtml(template.name)}</b>
        <span>${escapeHtml(template.foods)}</span>
        <i class="edit-label">编辑</i>
      </button>`).join("");
    $$("[data-edit-template]", refs.templateGrid).forEach((button) => button.addEventListener("click", () => openEditor(button.dataset.editTemplate)));
  }

  function renderStats() {
    const count = checkedCount();
    refs.statsRounds.textContent = `${state.loop.roundsCompleted} 轮`;
    refs.statsMeals.textContent = `${state.loop.roundsCompleted * 9 + count} 顿`;
    refs.statsCurrent.textContent = `${count} / 9`;
    refs.historyList.innerHTML = state.loop.events.length
      ? state.loop.events.slice(0, 30).map((event) => `
        <article class="history-item">
          <div class="history-date"><strong>${event.round}</strong><span>第${event.round}轮</span></div>
          <div class="history-detail"><strong>完成1轮</strong><span>${escapeHtml(formatDateTime(event.completedAt))}</span></div>
          <div class="history-dots" aria-label="完成9顿">${Array.from({ length: 3 }, () => '<i class="is-done"></i>').join("")}</div>
        </article>`).join("")
      : '<div class="empty-state">还没有完成一轮。<br />点满9顿后，这里会记录完成时间。</div>';
  }

  function renderAll() {
    renderCheckin();
    renderLibrary();
    renderStats();
  }

  function toggleMeal(templateId) {
    const checked = state.loop.checkedIds.includes(templateId);
    const template = templateFor(templateId);
    if (checked) {
      state.loop.checkedIds = state.loop.checkedIds.filter((id) => id !== templateId);
      saveState();
      renderAll();
      showToast(`已取消「${template.name}」`);
      return;
    }

    state.loop.checkedIds.push(templateId);
    if (state.loop.checkedIds.length >= 9) completeRound();
    else {
      saveState();
      renderAll();
      showToast(`第${state.loop.checkedIds.length}顿已打卡：${template.name}`);
    }
  }

  function completeRound() {
    const completedRound = state.loop.currentRound;
    state.loop.roundsCompleted += 1;
    state.loop.events.unshift({ round: completedRound, completedAt: new Date().toISOString() });
    state.loop.events = state.loop.events.slice(0, 80);
    state.loop.currentRound = state.loop.roundsCompleted + 1;
    state.loop.checkedIds = [];
    saveState();
    renderAll();
    celebrate(`第${completedRound}轮完成，已累计 ${state.loop.roundsCompleted} 轮`);
  }

  function undoLastMeal() {
    const lastId = state.loop.checkedIds.at(-1);
    if (!lastId) {
      showToast("这一轮还没有打卡");
      return;
    }
    state.loop.checkedIds = state.loop.checkedIds.slice(0, -1);
    saveState();
    renderAll();
    showToast(`已撤销：${templateFor(lastId).name}`);
  }

  function resetCurrentRound() {
    if (!state.loop.checkedIds.length) {
      showToast("这一轮还是空的");
      return;
    }
    if (!window.confirm("确定清空这一轮已打卡的内容吗？累计轮数不会清零。")) return;
    state.loop.checkedIds = [];
    saveState();
    renderAll();
    showToast("已清空这一轮");
  }

  function openEditor(templateId) {
    activeTemplateId = templateId;
    const template = templateFor(templateId);
    const number = state.templates.findIndex((item) => item.id === templateId) + 1;
    refs.editorEyebrow.textContent = `编辑第${number}顿`;
    refs.templateIdInput.value = template.id;
    refs.templateEmoji.value = template.emoji;
    refs.templateName.value = template.name;
    refs.templateFoods.value = template.foods;
    refs.templateTip.value = template.tip;
    showSheet(refs.editorSheet);
  }

  function saveTemplate() {
    const id = refs.templateIdInput.value || activeTemplateId;
    const index = state.templates.findIndex((item) => item.id === id);
    if (index < 0) return;
    const fallback = DEFAULT_TEMPLATES[index];
    state.templates[index] = {
      id,
      emoji: refs.templateEmoji.value.trim().slice(0, 4) || fallback.emoji,
      name: refs.templateName.value.trim().slice(0, 12) || fallback.name,
      foods: refs.templateFoods.value.trim().slice(0, 80) || fallback.foods,
      tip: refs.templateTip.value.trim().slice(0, 60) || fallback.tip
    };
    saveState();
    closeSheets();
    renderAll();
    showToast(`第${index + 1}顿已保存`);
  }

  function navigateTo(target) {
    $$(".view").forEach((view) => view.classList.toggle("is-active", view.dataset.view === target));
    $$(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.target === target));
    if (target === "custom") renderLibrary();
    if (target === "stats") renderStats();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showSheet(sheet) {
    refs.sheetBackdrop.hidden = false;
    sheet.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => $("button, input, textarea", sheet)?.focus({ preventScroll: true }));
  }

  function closeSheets() {
    refs.sheetBackdrop.hidden = true;
    [refs.editorSheet, refs.installSheet].forEach((sheet) => { sheet.hidden = true; });
    document.body.style.overflow = "";
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    refs.toast.textContent = message;
    refs.toast.classList.add("is-visible");
    toastTimer = setTimeout(() => refs.toast.classList.remove("is-visible"), 2300);
  }

  function celebrate(message) {
    const canvas = refs.celebrationCanvas;
    const context = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    context.scale(ratio, ratio);
    const colors = ["#28765D", "#EFBC61", "#EB745D", "#5D8FA8", "#CDE7A3"];
    const particles = Array.from({ length: 72 }, () => ({
      x: window.innerWidth / 2,
      y: window.innerHeight * .48,
      vx: (Math.random() - .5) * 9,
      vy: -Math.random() * 8 - 3,
      gravity: .18 + Math.random() * .08,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - .5) * .25,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 80 + Math.random() * 30
    }));
    let frame = 0;
    const draw = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.spin;
        p.life -= 1;
        context.save();
        context.globalAlpha = Math.max(0, p.life / 90);
        context.translate(p.x, p.y);
        context.rotate(p.rotation);
        context.fillStyle = p.color;
        context.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .65);
        context.restore();
      });
      frame += 1;
      if (frame < 112) requestAnimationFrame(draw);
      else context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
    requestAnimationFrame(draw);
    showToast(message);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `三餐九选备份-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("备份文件已导出");
  }

  function resetAllData() {
    if (!window.confirm("确定清空全部轮数、记录和自定义食物吗？建议先导出备份。")) return;
    state = defaultState();
    saveState();
    renderAll();
    navigateTo("checkin");
    showToast("已恢复默认");
  }

  function openInstallFlow() {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.finally(() => { installPrompt = null; });
    } else showSheet(refs.installSheet);
  }

  function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    try {
      await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    } catch (error) {
      console.warn("Service worker registration failed", error);
    }
  }

  function bindEvents() {
    $$(".nav-item").forEach((button) => button.addEventListener("click", () => navigateTo(button.dataset.target)));
    $("#undoLastButton").addEventListener("click", undoLastMeal);
    $("#resetRoundButton").addEventListener("click", resetCurrentRound);
    $("#editorForm").addEventListener("submit", (event) => { event.preventDefault(); saveTemplate(); });
    $("#exportButton").addEventListener("click", exportData);
    $("#resetButton").addEventListener("click", resetAllData);
    $("#installButton").addEventListener("click", openInstallFlow);
    refs.sheetBackdrop.addEventListener("click", closeSheets);
    $$("[data-close-sheet]").forEach((button) => button.addEventListener("click", closeSheets));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeSheets(); });
    window.addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); installPrompt = event; });
    window.addEventListener("appinstalled", () => showToast("已安装到主屏幕"));
  }

  saveState();
  bindEvents();
  renderAll();
  registerServiceWorker();
})();
