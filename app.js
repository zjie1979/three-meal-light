(() => {
  "use strict";

  const STORAGE_KEY = "three-meal-light-v1";
  const SLOTS = {
    breakfast: { name: "早餐", icon: "☀️", color: "#D9903D", defaultTemplateId: "meal-1" },
    lunch: { name: "午餐", icon: "🌤️", color: "#2C7A61", defaultTemplateId: "meal-4" },
    dinner: { name: "晚餐", icon: "🌙", color: "#5D8FA8", defaultTemplateId: "meal-5" }
  };
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
    version: 3,
    templates: cloneTemplates(),
    settings: { times: { breakfast: "08:00", lunch: "12:30", dinner: "18:30" } },
    days: {}
  });

  let migratedOnLoad = false;
  let state = loadState();
  let selectedDate = dateKey(new Date());
  let activeSlotKey = null;
  let activeTemplateId = null;
  let selectedSatiety = null;
  let installPrompt = null;
  let toastTimer = null;

  const refs = {
    dateTitle: $("#dateTitle"),
    dateSubtitle: $("#dateSubtitle"),
    nextDayButton: $("#nextDayButton"),
    dailyMealList: $("#dailyMealList"),
    doneCount: $("#doneCount"),
    miniProgress: $("#miniProgress"),
    progressRing: $("#progressRing"),
    dailyHeadline: $("#dailyHeadline"),
    dailyMessage: $("#dailyMessage"),
    streakCount: $("#streakCount"),
    customCount: $("#customCount"),
    weightInput: $("#weightInput"),
    weightTrend: $("#weightTrend"),
    templateGrid: $("#templateGrid"),
    pickerSheet: $("#pickerSheet"),
    pickerEyebrow: $("#pickerEyebrow"),
    pickerGrid: $("#pickerGrid"),
    recordSheet: $("#recordSheet"),
    recordEyebrow: $("#recordEyebrow"),
    recordTitle: $("#recordTitle"),
    selectedPlan: $("#selectedPlan"),
    foodNote: $("#foodNote"),
    satietyScale: $("#satietyScale"),
    recordFeedback: $("#recordFeedback"),
    completeMealButton: $("#completeMealButton"),
    editorSheet: $("#editorSheet"),
    editorEyebrow: $("#editorEyebrow"),
    templateIdInput: $("#templateIdInput"),
    templateEmoji: $("#templateEmoji"),
    templateName: $("#templateName"),
    templateFoods: $("#templateFoods"),
    templateTip: $("#templateTip"),
    installSheet: $("#installSheet"),
    sheetBackdrop: $("#sheetBackdrop"),
    toast: $("#toast"),
    weekBars: $("#weekBars"),
    historyList: $("#historyList"),
    weekMeals: $("#weekMeals"),
    weekPerfectDays: $("#weekPerfectDays"),
    weekSatiety: $("#weekSatiety"),
    timeForm: $("#timeForm"),
    celebrationCanvas: $("#celebrationCanvas")
  };

  function normalizeTemplates(savedTemplates) {
    return DEFAULT_TEMPLATES.map((fallback, index) => {
      const saved = Array.isArray(savedTemplates)
        ? savedTemplates.find((item) => item?.id === fallback.id) || savedTemplates[index]
        : null;
      return {
        ...fallback,
        ...(saved || {}),
        id: fallback.id,
        emoji: String(saved?.emoji || fallback.emoji).slice(0, 4),
        name: String(saved?.name || fallback.name).slice(0, 12),
        foods: String(saved?.foods || fallback.foods).slice(0, 80),
        tip: String(saved?.tip || fallback.tip).slice(0, 60)
      };
    });
  }

  function migrateV2(saved) {
    const fallback = defaultState();
    const savedTemplates = Array.isArray(saved.templates) ? saved.templates : [];
    return {
      version: 3,
      templates: DEFAULT_TEMPLATES.map((simpleTemplate, index) => {
        const savedTemplate = savedTemplates.find((item) => item?.id === simpleTemplate.id) || savedTemplates[index];
        const wasLegacyDefault = !savedTemplate || LEGACY_DEFAULT_TEMPLATE_NAMES.includes(savedTemplate.name);
        return wasLegacyDefault ? { ...simpleTemplate } : {
          ...simpleTemplate,
          ...savedTemplate,
          id: simpleTemplate.id,
          emoji: String(savedTemplate?.emoji || simpleTemplate.emoji).slice(0, 4),
          name: String(savedTemplate?.name || simpleTemplate.name).slice(0, 12),
          foods: String(savedTemplate?.foods || simpleTemplate.foods).slice(0, 80),
          tip: String(savedTemplate?.tip || simpleTemplate.tip).slice(0, 60)
        };
      }),
      settings: { times: { ...fallback.settings.times, ...(saved.settings?.times || {}) } },
      days: saved.days || {}
    };
  }

  function migrateV1(saved) {
    const next = defaultState();
    next.settings.times = { ...next.settings.times, ...(saved.settings?.times || {}) };
    Object.entries(saved.days || {}).forEach(([key, oldDay]) => {
      const day = { weight: oldDay?.weight || "", meals: {} };
      Object.keys(SLOTS).forEach((slotKey) => {
        const oldRecord = oldDay?.meals?.[slotKey];
        if (!oldRecord) return;
        day.meals[slotKey] = {
          templateId: SLOTS[slotKey].defaultTemplateId,
          done: Boolean(oldRecord.done),
          note: String(oldRecord.note || ""),
          satiety: Number(oldRecord.satiety) || null,
          updatedAt: oldRecord.updatedAt || null
        };
      });
      next.days[key] = day;
    });
    return next;
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || !saved.days) return defaultState();
      if (saved.version === 1) {
        migratedOnLoad = true;
        return migrateV1(saved);
      }
      if (saved.version === 2) {
        migratedOnLoad = true;
        return migrateV2(saved);
      }
      if (saved.version !== 3) return defaultState();
      const fallback = defaultState();
      return {
        version: 3,
        templates: normalizeTemplates(saved.templates),
        settings: { times: { ...fallback.settings.times, ...(saved.settings?.times || {}) } },
        days: saved.days || {}
      };
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseDate(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
  }

  function addDays(key, amount) {
    const date = parseDate(key);
    date.setDate(date.getDate() + amount);
    return dateKey(date);
  }

  function getDay(key = selectedDate, create = false) {
    if (!state.days[key] && create) state.days[key] = { weight: "", meals: {} };
    return state.days[key] || { weight: "", meals: {} };
  }

  function mealRecord(key, slotKey) {
    return getDay(key).meals?.[slotKey] || {
      templateId: SLOTS[slotKey].defaultTemplateId,
      done: false,
      note: "",
      satiety: null,
      updatedAt: null
    };
  }

  function templateFor(id) {
    return state.templates.find((item) => item.id === id) || state.templates[0];
  }

  function templateNumber(id) {
    return Math.max(1, state.templates.findIndex((item) => item.id === id) + 1);
  }

  function mealCount(key) {
    return Object.keys(SLOTS).filter((slotKey) => mealRecord(key, slotKey).done).length;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatSelectedDate() {
    const today = dateKey(new Date());
    if (selectedDate === today) return "今天";
    if (selectedDate === addDays(today, -1)) return "昨天";
    return parseDate(selectedDate).toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
  }

  function renderToday() {
    const today = dateKey(new Date());
    const day = getDay();
    const done = mealCount(selectedDate);
    refs.dateTitle.textContent = formatSelectedDate();
    refs.dateSubtitle.textContent = parseDate(selectedDate).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
    refs.nextDayButton.disabled = selectedDate >= today;
    refs.doneCount.textContent = done;
    refs.miniProgress.textContent = `${done} / 3`;
    refs.progressRing.style.setProperty("--progress", Math.round((done / 3) * 100));
    refs.streakCount.textContent = calculateStreak();
    refs.customCount.textContent = state.templates.length;
    refs.weightInput.value = day.weight || "";
    updateWeightTrend();

    const messages = [
      ["每餐就选一个常吃项", "土豆、酸奶、鸡胸肉这些都可以，简单记录就行。"],
      ["第一餐完成了", "下一餐继续选一个顺手的食物，不用配得很复杂。"],
      ["今天已经完成大半", "正常吃完下一餐，不用为了减重故意挨饿。"],
      ["今天三餐已完成", "简单、能长期坚持，就是好计划。"]
    ];
    refs.dailyHeadline.textContent = messages[done][0];
    refs.dailyMessage.textContent = messages[done][1];

    refs.dailyMealList.innerHTML = Object.entries(SLOTS).map(([slotKey, slot]) => {
      const record = mealRecord(selectedDate, slotKey);
      const template = templateFor(record.templateId);
      const number = templateNumber(template.id);
      return `
        <article class="daily-meal-card ${record.done ? "is-done" : ""}" style="--slot-color:${slot.color}">
          <div class="slot-heading"><div><strong>${slot.icon} ${slot.name}</strong><time>${escapeHtml(state.settings.times[slotKey])}</time></div><span class="done-badge">${record.done ? "✓ 已完成" : "待完成"}</span></div>
          <div class="chosen-template tone-${number}">
            <span class="template-emoji" aria-hidden="true">${escapeHtml(template.emoji)}</span>
            <div class="chosen-copy"><strong>${escapeHtml(template.name)}</strong><p>${escapeHtml(template.foods)}</p></div>
            <span class="template-number">#${number}</span>
          </div>
          <div class="meal-actions"><button class="pick-button" type="button" data-pick="${slotKey}">换食物</button><button class="record-button" type="button" data-record="${slotKey}">${record.done ? "修改记录" : "完成这餐"}</button></div>
        </article>`;
    }).join("");

    $$('[data-pick]', refs.dailyMealList).forEach((button) => button.addEventListener("click", () => openPicker(button.dataset.pick)));
    $$('[data-record]', refs.dailyMealList).forEach((button) => button.addEventListener("click", () => openRecord(button.dataset.record)));
  }

  function calculateStreak() {
    let streak = 0;
    let key = dateKey(new Date());
    if (mealCount(key) < 3) key = addDays(key, -1);
    while (mealCount(key) === 3) {
      streak += 1;
      key = addDays(key, -1);
    }
    return streak;
  }

  function updateWeightTrend() {
    const current = Number(getDay().weight);
    const previousKey = Object.keys(state.days).filter((key) => key < selectedDate && Number(state.days[key]?.weight) > 0).sort().at(-1);
    if (!current) refs.weightTrend.textContent = "记录后可查看趋势";
    else if (!previousKey) refs.weightTrend.textContent = "已记录第一笔体重";
    else {
      const diff = current - Number(state.days[previousKey].weight);
      refs.weightTrend.textContent = Math.abs(diff) < 0.05 ? "与上次记录基本持平" : `较上次${diff > 0 ? "增加" : "减少"} ${Math.abs(diff).toFixed(1)} kg`;
    }
  }

  function renderLibrary() {
    refs.templateGrid.innerHTML = state.templates.map((template, index) => `
      <button class="template-card tone-${index + 1}" type="button" data-edit-template="${template.id}" aria-label="编辑第${index + 1}项 ${escapeHtml(template.name)}">
        <span class="template-emoji" aria-hidden="true">${escapeHtml(template.emoji)}</span><b>${escapeHtml(template.name)}</b><span>${escapeHtml(template.foods)}</span><i class="edit-label">编辑</i>
      </button>`).join("");
    $$('[data-edit-template]', refs.templateGrid).forEach((button) => button.addEventListener("click", () => openEditor(button.dataset.editTemplate)));
    Object.entries(state.settings.times).forEach(([key, value]) => {
      const input = $(`#${key}Time`);
      if (input) input.value = value;
    });
  }

  function openPicker(slotKey) {
    activeSlotKey = slotKey;
    const record = mealRecord(selectedDate, slotKey);
    refs.pickerEyebrow.textContent = `${SLOTS[slotKey].name} · 选一个常吃项`;
    refs.pickerGrid.innerHTML = state.templates.map((template, index) => `
      <button class="picker-option tone-${index + 1} ${template.id === record.templateId ? "is-selected" : ""}" type="button" data-choose-template="${template.id}">
        <i class="picker-check">✓</i><span class="template-emoji" aria-hidden="true">${escapeHtml(template.emoji)}</span><b>${index + 1}. ${escapeHtml(template.name)}</b><span>${escapeHtml(template.foods)}</span>
      </button>`).join("");
    $$('[data-choose-template]', refs.pickerGrid).forEach((button) => button.addEventListener("click", () => chooseTemplate(button.dataset.chooseTemplate)));
    showSheet(refs.pickerSheet);
  }

  function chooseTemplate(templateId) {
    if (!activeSlotKey) return;
    const day = getDay(selectedDate, true);
    const previous = mealRecord(selectedDate, activeSlotKey);
    const changed = previous.templateId !== templateId;
    day.meals[activeSlotKey] = changed
      ? { templateId, done: false, note: "", satiety: null, updatedAt: new Date().toISOString() }
      : { ...previous };
    saveState();
    closeSheets();
    renderToday();
    renderHistory();
    showToast(changed ? `${SLOTS[activeSlotKey].name}已换成「${templateFor(templateId).name}」` : "这餐已经选好了");
  }

  function openRecord(slotKey) {
    activeSlotKey = slotKey;
    const record = mealRecord(selectedDate, slotKey);
    const template = templateFor(record.templateId);
    const number = templateNumber(template.id);
    selectedSatiety = Number(record.satiety) || null;
    refs.recordEyebrow.textContent = `${record.done ? "修改" : "记录"}${SLOTS[slotKey].name}`;
    refs.recordTitle.textContent = template.name;
    refs.selectedPlan.className = `selected-plan tone-${number}`;
    refs.selectedPlan.innerHTML = `<span class="template-emoji" aria-hidden="true">${escapeHtml(template.emoji)}</span><div><strong>第${number}项 · ${escapeHtml(template.name)}</strong><p>${escapeHtml(template.foods)}</p><small>${escapeHtml(template.tip)}</small></div>`;
    refs.foodNote.value = record.note || "";
    refs.completeMealButton.textContent = record.done ? "保存修改" : "完成这餐";
    $$('button[data-value]', refs.satietyScale).forEach((button) => button.classList.toggle("is-selected", Number(button.dataset.value) === selectedSatiety));
    updateRecordFeedback();
    showSheet(refs.recordSheet);
  }

  function updateRecordFeedback() {
    const template = activeSlotKey ? templateFor(mealRecord(selectedDate, activeSlotKey).templateId) : null;
    let text = template?.tip || "七八分饱、能坚持，比饿着更重要。";
    if (selectedSatiety >= 4) text += " 这次有点撑也没关系，下一餐照常吃，不要补偿性挨饿。";
    if (selectedSatiety && selectedSatiety <= 2) text += " 如果经常吃不饱，可以适当增加蔬菜或蛋白质。";
    refs.recordFeedback.textContent = text;
  }

  function saveRecord(complete) {
    if (!activeSlotKey) return;
    const day = getDay(selectedDate, true);
    const previous = mealRecord(selectedDate, activeSlotKey);
    const wasDone = Boolean(previous.done);
    day.meals[activeSlotKey] = {
      ...previous,
      done: complete ? true : wasDone,
      note: refs.foodNote.value.trim(),
      satiety: selectedSatiety,
      updatedAt: new Date().toISOString()
    };
    saveState();
    closeSheets();
    renderToday();
    renderHistory();
    if (complete) {
      showToast(wasDone ? "这餐记录已更新" : `${SLOTS[activeSlotKey].name}已完成 ✓`);
      if (!wasDone && mealCount(selectedDate) === 3) celebrate();
    } else showToast("备注已保存");
  }

  function openEditor(templateId) {
    activeTemplateId = templateId;
    const template = templateFor(templateId);
    const number = templateNumber(templateId);
    refs.editorEyebrow.textContent = `编辑第${number}项`;
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
    showToast(`第${index + 1}项已保存`);
  }

  function renderHistory() {
    const today = dateKey(new Date());
    const dates = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
    let totalMeals = 0;
    let perfectDays = 0;
    const satietyValues = [];
    refs.weekBars.innerHTML = dates.map((key) => {
      const count = mealCount(key);
      totalMeals += count;
      if (count === 3) perfectDays += 1;
      Object.keys(SLOTS).forEach((slotKey) => {
        const value = Number(mealRecord(key, slotKey).satiety);
        if (value) satietyValues.push(value);
      });
      return `<div class="week-day ${key === today ? "is-today" : ""}"><div class="bar-track"><div class="bar-fill" style="height:${Math.max(5, (count / 3) * 100)}%"></div></div><span>${parseDate(key).toLocaleDateString("zh-CN", { weekday: "short" }).replace("周", "")}</span></div>`;
    }).join("");
    refs.weekMeals.textContent = `${totalMeals} 餐`;
    refs.weekPerfectDays.textContent = `${perfectDays} 天`;
    refs.weekSatiety.textContent = satietyValues.length ? `${(satietyValues.reduce((sum, value) => sum + value, 0) / satietyValues.length).toFixed(1)} / 5` : "--";

    const recordedDates = Object.keys(state.days).filter((key) => mealCount(key) > 0 || state.days[key]?.weight).sort().reverse().slice(0, 30);
    refs.historyList.innerHTML = recordedDates.length ? recordedDates.map((key) => {
      const count = mealCount(key);
      const chosen = Object.keys(SLOTS).filter((slotKey) => mealRecord(key, slotKey).done).map((slotKey) => `${SLOTS[slotKey].name}·${templateFor(mealRecord(key, slotKey).templateId).name}`);
      const detail = chosen.length ? chosen.join(" / ") : `体重 ${state.days[key].weight} kg`;
      return `<article class="history-item"><div class="history-date"><strong>${parseDate(key).getDate()}</strong><span>${parseDate(key).toLocaleDateString("zh-CN", { month: "short" })}</span></div><div class="history-detail"><strong>${count === 3 ? "三餐完成" : `完成 ${count} 餐`}</strong><span>${escapeHtml(detail)}</span></div><div class="history-dots" aria-label="完成 ${count} 餐">${[0,1,2].map((index) => `<i class="${index < count ? "is-done" : ""}"></i>`).join("")}</div></article>`;
    }).join("") : '<div class="empty-state">还没有记录。<br />从今天任选一餐开始，慢慢积累自己的节奏。</div>';
  }

  function navigateTo(target) {
    $$(".view").forEach((view) => view.classList.toggle("is-active", view.dataset.view === target));
    $$(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.target === target));
    if (target === "library") renderLibrary();
    if (target === "history") renderHistory();
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
    [refs.pickerSheet, refs.recordSheet, refs.editorSheet, refs.installSheet].forEach((sheet) => { sheet.hidden = true; });
    document.body.style.overflow = "";
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    refs.toast.textContent = message;
    refs.toast.classList.add("is-visible");
    toastTimer = setTimeout(() => refs.toast.classList.remove("is-visible"), 2300);
  }

  function celebrate() {
    const canvas = refs.celebrationCanvas;
    const context = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    context.scale(ratio, ratio);
    const colors = ["#28765D", "#EFBC61", "#EB745D", "#5D8FA8", "#CDE7A3"];
    const particles = Array.from({ length: 70 }, () => ({ x: window.innerWidth / 2, y: window.innerHeight * .5, vx: (Math.random() - .5) * 9, vy: -Math.random() * 8 - 3, gravity: .18 + Math.random() * .08, rotation: Math.random() * Math.PI, spin: (Math.random() - .5) * .25, size: Math.random() * 6 + 4, color: colors[Math.floor(Math.random() * colors.length)], life: 80 + Math.random() * 30 }));
    let frame = 0;
    const draw = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.rotation += p.spin; p.life -= 1; context.save(); context.globalAlpha = Math.max(0, p.life / 90); context.translate(p.x, p.y); context.rotate(p.rotation); context.fillStyle = p.color; context.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .65); context.restore(); });
      frame += 1;
      if (frame < 112) requestAnimationFrame(draw); else context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
    requestAnimationFrame(draw);
    showToast("今天三餐完成啦，稳稳的一天 ✨");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `三餐九选备份-${dateKey(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("备份文件已导出");
  }

  function resetData() {
    if (!window.confirm("确定恢复默认食物并清除全部记录吗？此操作无法撤销，建议先导出备份。")) return;
    state = defaultState();
    saveState();
    selectedDate = dateKey(new Date());
    renderAll();
    navigateTo("today");
    showToast("已恢复默认食物");
  }

  function openInstallFlow() {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.finally(() => { installPrompt = null; });
    } else showSheet(refs.installSheet);
  }

  function bindEvents() {
    $("#prevDayButton").addEventListener("click", () => { selectedDate = addDays(selectedDate, -1); renderToday(); });
    refs.nextDayButton.addEventListener("click", () => { const next = addDays(selectedDate, 1); if (next <= dateKey(new Date())) selectedDate = next; renderToday(); });
    $("#dateButton").addEventListener("click", () => { selectedDate = dateKey(new Date()); renderToday(); showToast("已回到今天"); });
    refs.weightInput.addEventListener("change", () => { const day = getDay(selectedDate, true); day.weight = refs.weightInput.value.trim(); saveState(); updateWeightTrend(); renderHistory(); showToast(day.weight ? "体重已记录" : "已删除这天体重"); });
    $$(".nav-item").forEach((button) => button.addEventListener("click", () => navigateTo(button.dataset.target)));
    refs.sheetBackdrop.addEventListener("click", closeSheets);
    $$('[data-close-sheet]').forEach((button) => button.addEventListener("click", closeSheets));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeSheets(); });
    refs.satietyScale.addEventListener("click", (event) => { const button = event.target.closest("button[data-value]"); if (!button) return; selectedSatiety = Number(button.dataset.value); $$('button[data-value]', refs.satietyScale).forEach((item) => item.classList.toggle("is-selected", item === button)); updateRecordFeedback(); });
    $("#recordForm").addEventListener("submit", (event) => { event.preventDefault(); saveRecord(true); });
    $("#saveNoteButton").addEventListener("click", () => saveRecord(false));
    $("#editorForm").addEventListener("submit", (event) => { event.preventDefault(); saveTemplate(); });
    refs.timeForm.addEventListener("submit", (event) => { event.preventDefault(); const data = new FormData(refs.timeForm); Object.keys(SLOTS).forEach((key) => { state.settings.times[key] = data.get(key) || defaultState().settings.times[key]; }); saveState(); renderToday(); showToast("用餐时间已保存"); });
    $("#exportButton").addEventListener("click", exportData);
    $("#resetButton").addEventListener("click", resetData);
    $("#installButton").addEventListener("click", openInstallFlow);
    window.addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); installPrompt = event; });
    window.addEventListener("appinstalled", () => showToast("已安装到主屏幕"));
  }

  function renderAll() {
    renderToday();
    renderLibrary();
    renderHistory();
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    try { await navigator.serviceWorker.register("./sw.js", { scope: "./" }); }
    catch (error) { console.warn("Service worker registration failed", error); }
  }

  if (migratedOnLoad) saveState();
  bindEvents();
  renderAll();
  registerServiceWorker();
})();
