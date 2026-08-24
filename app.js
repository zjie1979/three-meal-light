(() => {
  "use strict";

  const STORAGE_KEY = "three-meal-light-v1";
  const CUSTOM_PRESET_LIMIT = 12;
  const DEFAULT_TEMPLATES = [
    { id: "meal-1", emoji: "🥔", name: "土豆", foods: "蒸土豆、烤土豆或少油土豆块", tip: "当主食吃，别再叠加太多米饭面条。" },
    { id: "meal-2", emoji: "🥣", name: "酸奶+燕麦", foods: "无糖酸奶，可以加少量水果或燕麦", tip: "优先选无糖，太甜的酸奶按甜品看。" },
    { id: "meal-3", emoji: "🐔", name: "鸡胸肉", foods: "鸡胸肉、鸡腿去皮或低油鸡肉", tip: "蛋白质够了，饱腹会更稳。" },
    { id: "meal-4", emoji: "🥚", name: "豆腐干", foods: "水煮蛋、蒸蛋或少油煎蛋", tip: "简单好执行，一餐配1到2个就够用。" },
    { id: "meal-5", emoji: "🌽", name: "玉米红薯", foods: "玉米、红薯、南瓜等粗粮主食", tip: "这类也算主食，份量适中就行。" },
    { id: "meal-6", emoji: "🥬", name: "蔬菜沙拉/汁", foods: "青菜、番茄、黄瓜、菌菇等", tip: "用来补体积和饱腹，不要只吃菜。" },
    { id: "meal-7", emoji: "🐟", name: "鱼虾牛肉", foods: "鱼、虾、瘦牛肉或豆腐", tip: "换着吃，别把一餐弄得太复杂。" },
    { id: "meal-8", emoji: "🥖", name: "馒头/面包", foods: "苹果、橙子、莓果等一小份水果", tip: "完整水果可以，果汁不算。" },
    { id: "meal-9", emoji: "🍚", name: "香蕉", foods: "正常吃一小份饭菜，少油少汤", tip: "外食时就选这一项，吃到七八分饱。" }
  ];
  const LEGACY_DEFAULT_TEMPLATE_NAMES = [
    "控糖早餐", "高蛋白早餐", "轻食早餐", "家常均衡餐", "清爽蒸煮餐",
    "外卖减负餐", "面食搭配餐", "火锅聪明餐", "自由满足餐"
  ];
  const PREVIOUS_DEFAULT_TEMPLATES = [
    { name: "土豆", foods: "蒸土豆、烤土豆或少油土豆块" },
    { name: "无糖酸奶", foods: "无糖酸奶，可以加少量水果或燕麦" },
    { name: "鸡胸肉", foods: "鸡胸肉、鸡腿去皮或低油鸡肉" },
    { name: "鸡蛋", foods: "水煮蛋、蒸蛋或少油煎蛋" },
    { name: "玉米红薯", foods: "玉米、红薯、南瓜等粗粮主食" },
    { name: "蔬菜", foods: "青菜、番茄、黄瓜、菌菇等" },
    { name: "鱼虾牛肉", foods: "鱼、虾、瘦牛肉或豆腐" },
    { name: "水果", foods: "苹果、橙子、莓果等一小份水果" },
    { name: "正常饭菜", foods: "正常吃一小份饭菜，少油少汤" }
  ];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const cloneTemplates = () => DEFAULT_TEMPLATES.map((item) => ({ ...item }));
  const templateSummary = (templates) => templates.slice(0, 3).map((item) => item.name).join("、");
  function clonePreset(templates) {
    return templates.map((item) => ({
      emoji: item.emoji,
      name: item.name,
      foods: item.foods,
      tip: item.tip
    }));
  }
  const defaultState = () => ({
    version: 5,
    templates: cloneTemplates(),
    customPresets: [],
    loop: {
      roundsCompleted: 0,
      currentRound: 1,
      checkedIds: [],
      events: []
    }
  });

  let state = loadState();
  let activeTemplateId = null;
  let activeRecipeSource = "";
  let activeRecipeSeries = "";
  let activeRecipeId = "";
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
    saveCustomPresetButton: $("#saveCustomPresetButton"),
    exportTemplatesButton: $("#exportTemplatesButton"),
    importTemplatesButton: $("#importTemplatesButton"),
    importTemplatesInput: $("#importTemplatesInput"),
    myPresetGrid: $("#myPresetGrid"),
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
    recipeSourceTabs: $("#recipeSourceTabs"),
    recipeSeriesTabs: $("#recipeSeriesTabs"),
    recipeCount: $("#recipeCount"),
    recipeList: $("#recipeList"),
    recipeSheet: $("#recipeSheet"),
    recipeSheetSource: $("#recipeSheetSource"),
    recipeSheetTitle: $("#recipeSheetTitle"),
    recipeSheetSummary: $("#recipeSheetSummary"),
    recipeNineList: $("#recipeNineList"),
    recipeRules: $("#recipeRules"),
    applyRecipeButton: $("#applyRecipeButton"),
    toast: $("#toast"),
    celebrationCanvas: $("#celebrationCanvas")
  };
  const recipeLibrary = Array.isArray(window.RECIPE_LIBRARY) ? window.RECIPE_LIBRARY : [];
  const recipeSources = [...new Map(recipeLibrary.map((recipe) => [recipe.sourceApp, recipe.sourceLabel])).entries()]
    .map(([id, name]) => ({ id, name, count: recipeLibrary.filter((recipe) => recipe.sourceApp === id).length }));
  activeRecipeSource = recipeSources[0]?.id || "";

  function normalizeTemplateItem(item, fallback) {
    return {
      id: fallback.id,
      emoji: String(item?.emoji || fallback.emoji).slice(0, 4),
      name: String(item?.name || fallback.name).slice(0, 12),
      foods: String(item?.foods || fallback.foods).slice(0, 80),
      tip: String(item?.tip || fallback.tip).slice(0, 60)
    };
  }

  function normalizeTemplates(savedTemplates) {
    return DEFAULT_TEMPLATES.map((fallback, index) => {
      const saved = Array.isArray(savedTemplates)
        ? savedTemplates.find((item) => item?.id === fallback.id) || savedTemplates[index]
        : null;
      const previous = PREVIOUS_DEFAULT_TEMPLATES[index];
      const wasPreviousDefault = previous && saved?.name === previous.name && saved?.foods === previous.foods;
      const wasLegacyDefault = !saved || LEGACY_DEFAULT_TEMPLATE_NAMES.includes(saved.name) || wasPreviousDefault;
      const source = wasLegacyDefault ? fallback : { ...fallback, ...saved };
      return normalizeTemplateItem(source, fallback);
    });
  }

  function normalizeCustomPresets(savedPresets) {
    if (!Array.isArray(savedPresets)) return [];
    return savedPresets.slice(0, CUSTOM_PRESET_LIMIT).map((preset, index) => ({
      id: String(preset?.id || `custom-${Date.now()}-${index}`).slice(0, 40),
      name: String(preset?.name || `我的模板${index + 1}`).slice(0, 16),
      createdAt: preset?.createdAt || new Date().toISOString(),
      templates: normalizeTemplates(preset?.templates)
    }));
  }

  function migrateLegacy(saved) {
    const next = defaultState();
    next.templates = normalizeTemplates(saved?.templates);
    next.customPresets = normalizeCustomPresets(saved?.customPresets);
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
      if (saved.version >= 4 && saved.loop) {
        const fallback = defaultState();
        const checkedIds = Array.isArray(saved.loop.checkedIds)
          ? saved.loop.checkedIds.filter((id) => DEFAULT_TEMPLATES.some((item) => item.id === id)).slice(0, 9)
          : [];
        return {
          version: 5,
          templates: normalizeTemplates(saved.templates),
          customPresets: normalizeCustomPresets(saved.customPresets),
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
    renderMyPresets();

    refs.templateGrid.innerHTML = state.templates.map((template, index) => `
      <button class="template-card tone-${index + 1}" type="button" data-edit-template="${template.id}" aria-label="编辑第${index + 1}顿 ${escapeHtml(template.name)}">
        <span class="template-emoji" aria-hidden="true">${escapeHtml(template.emoji)}</span>
        <b>${escapeHtml(template.name)}</b>
        <span>${escapeHtml(template.foods)}</span>
        <i class="edit-label">编辑</i>
      </button>`).join("");
    $$("[data-edit-template]", refs.templateGrid).forEach((button) => button.addEventListener("click", () => openEditor(button.dataset.editTemplate)));
  }

  function renderMyPresets() {
    refs.myPresetGrid.innerHTML = state.customPresets.length
      ? state.customPresets.map((preset) => `
        <article class="my-preset-card">
          <header>
            <div><strong>${escapeHtml(preset.name)}</strong><small>${escapeHtml(formatDateTime(preset.createdAt))}</small></div>
          </header>
          <p>${escapeHtml(templateSummary(preset.templates))} 等9顿</p>
          <div class="my-preset-actions">
            <button class="secondary-button" type="button" data-apply-custom-preset="${preset.id}">套用</button>
            <button class="text-button danger" type="button" data-delete-custom-preset="${preset.id}">删除</button>
          </div>
        </article>`).join("")
      : '<div class="empty-state">还没有保存自己的模板。<br />先把当前9顿改好，再点“保存当前9顿”。</div>';
    $$("[data-apply-custom-preset]", refs.myPresetGrid).forEach((button) => button.addEventListener("click", () => applyCustomPreset(button.dataset.applyCustomPreset)));
    $$("[data-delete-custom-preset]", refs.myPresetGrid).forEach((button) => button.addEventListener("click", () => deleteCustomPreset(button.dataset.deleteCustomPreset)));
  }

  function applyTemplates(templates) {
    state.templates = DEFAULT_TEMPLATES.map((fallback, index) => normalizeTemplateItem(templates[index], fallback));
  }

  function saveCurrentAsCustomPreset() {
    const defaultName = `我的9顿 ${new Date().toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}`;
    const name = window.prompt("给这套9顿起个名字", defaultName);
    if (name === null) return;
    const cleanName = name.trim().slice(0, 16) || defaultName;
    const preset = {
      id: `custom-${Date.now()}`,
      name: cleanName,
      createdAt: new Date().toISOString(),
      templates: clonePreset(state.templates)
    };
    state.customPresets = [preset, ...state.customPresets].slice(0, CUSTOM_PRESET_LIMIT);
    saveState();
    renderLibrary();
    showToast(`已保存：${cleanName}`);
  }

  function applyCustomPreset(presetId) {
    const preset = state.customPresets.find((item) => item.id === presetId);
    if (!preset) return;
    const message = `确定把9顿替换成「${preset.name}」吗？\n\n只替换卡片内容，不会清空已完成轮数。`;
    if (!window.confirm(message)) return;
    applyTemplates(preset.templates);
    saveState();
    renderAll();
    showToast(`已套用：${preset.name}`);
  }

  function deleteCustomPreset(presetId) {
    const preset = state.customPresets.find((item) => item.id === presetId);
    if (!preset) return;
    if (!window.confirm(`确定删除「${preset.name}」吗？当前9顿和统计不会受影响。`)) return;
    state.customPresets = state.customPresets.filter((item) => item.id !== presetId);
    saveState();
    renderLibrary();
    showToast("模板已删除");
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
    if (target === "recipes") renderRecipes();
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
    [refs.editorSheet, refs.installSheet, refs.recipeSheet].forEach((sheet) => { sheet.hidden = true; });
    document.body.style.overflow = "";
  }

  function renderRecipes() {
    if (!recipeLibrary.length) {
      refs.recipeSourceTabs.innerHTML = "";
      refs.recipeSeriesTabs.innerHTML = "";
      refs.recipeCount.textContent = "";
      refs.recipeList.innerHTML = '<div class="empty-state">还没有导入旧App食谱。</div>';
      return;
    }
    if (!recipeSources.some((source) => source.id === activeRecipeSource)) activeRecipeSource = recipeSources[0].id;
    const sourceRecipes = recipeLibrary.filter((recipe) => recipe.sourceApp === activeRecipeSource);
    const seriesNames = [...new Set(sourceRecipes.map((recipe) => recipe.series || "其他"))];
    if (!seriesNames.includes(activeRecipeSeries)) activeRecipeSeries = seriesNames[0] || "";
    const visibleRecipes = sourceRecipes.filter((recipe) => (recipe.series || "其他") === activeRecipeSeries);

    refs.recipeSourceTabs.innerHTML = recipeSources.map((source) => `
      <button class="recipe-chip ${source.id === activeRecipeSource ? "is-active" : ""}" type="button" data-recipe-source="${source.id}">
        ${escapeHtml(source.name)} ${source.count}
      </button>`).join("");
    refs.recipeSeriesTabs.innerHTML = seriesNames.map((series) => {
      const count = sourceRecipes.filter((recipe) => (recipe.series || "其他") === series).length;
      return `<button class="recipe-chip ${series === activeRecipeSeries ? "is-active" : ""}" type="button" data-recipe-series="${escapeHtml(series)}">${escapeHtml(series)} ${count}</button>`;
    }).join("");
    refs.recipeCount.textContent = `${recipeSources.find((source) => source.id === activeRecipeSource)?.name || ""} / ${activeRecipeSeries}：${visibleRecipes.length} 个食谱`;
    refs.recipeList.innerHTML = visibleRecipes.map((recipe) => `
      <button class="recipe-card" type="button" data-open-recipe="${recipe.id}">
        <span>${escapeHtml(recipe.sourceLabel)} · ${escapeHtml(recipe.series)}</span>
        <strong>${escapeHtml(recipe.title)}</strong>
        <p>${escapeHtml(recipe.summary || recipe.fit || "点开查看整理后的9格详情。")}</p>
      </button>`).join("");

    $$("[data-recipe-source]", refs.recipeSourceTabs).forEach((button) => button.addEventListener("click", () => {
      activeRecipeSource = button.dataset.recipeSource;
      activeRecipeSeries = "";
      renderRecipes();
    }));
    $$("[data-recipe-series]", refs.recipeSeriesTabs).forEach((button) => button.addEventListener("click", () => {
      activeRecipeSeries = button.dataset.recipeSeries;
      renderRecipes();
    }));
    $$("[data-open-recipe]", refs.recipeList).forEach((button) => button.addEventListener("click", () => openRecipe(button.dataset.openRecipe)));
  }

  function hasFoodSignal(text) {
    return /(蛋|鸡|牛|鱼|虾|肉|豆腐|豆干|豆浆|酸奶|牛奶|奶咖|咖啡|黑咖|茶|乌龙|红茶|绿茶|抹茶|可可|dirty|厚乳|芝士|生酪|奶酪|米饭|饭|粥|面|粉|吐司|面包|馒头|贝果|三明治|汉堡|水饺|云吞|土豆|红薯|紫薯|玉米|南瓜|芋头|燕麦|水果|苹果|香蕉|梨|蓝莓|莓|番茄|黄瓜|蔬菜|青菜|菠菜|菌菇|香菇|木耳|白菜|娃娃菜|丝瓜|冬瓜|包菜|洋葱|椰子水)/i.test(text);
  }

  function isHydrationOnly(text) {
    const value = text.replace(/\s/g, "");
    if (/(咖啡|黑咖|奶咖|牛奶|酸奶|豆浆|茶|乌龙|红茶|绿茶|抹茶|可可|椰子水)/.test(value)) return false;
    return /^(全天)?(约|喝|饮)?(温水|清水|水|柠檬水|饮水)[\d.一二三四五六七八九十\-~到左右杯升lL毫mlML，,。；;]*$/.test(value)
      || /全天喝水|喝水\d|饮水\d/.test(value);
  }

  function isRuleOnly(text) {
    if (isHydrationOnly(text)) return true;
    if (/^(短期|不要|不建议|不主动|不替代|遵循|按原|当天手动|这是短期|原文|低血糖|胃不舒服)/.test(text)) return true;
    if (/(不用刻意|不要因为|不额外加|不加零食|不加薯片|少酱更稳|停止进食|连续\s*1-2\s*天|不列入打卡|可适当加|不舒服时不要硬撑)/.test(text)) return true;
    if (/^(规则|提醒|口径|补充)$/.test(text)) return true;
    return false;
  }

  function emojiForFood(food) {
    if (/(咖啡|黑咖|奶咖|茶|乌龙|红茶|绿茶|抹茶|可可|dirty)/i.test(food)) return "☕";
    if (/(牛奶|酸奶|豆浆|厚乳|芝士|生酪|奶酪)/.test(food)) return "🥛";
    if (/蛋/.test(food)) return "🥚";
    if (/(鸡胸|鸡腿|鸡肉|黄焖鸡|鸡)/.test(food)) return "🐔";
    if (/(虾|鱼|三文鱼)/.test(food)) return "🐟";
    if (/(牛|肉)/.test(food)) return "🥩";
    if (/(米饭|饭|粥|面|粉|吐司|面包|馒头|贝果|三明治|汉堡|水饺|云吞)/.test(food)) return "🍚";
    if (/(土豆|红薯|紫薯|玉米|南瓜|芋头|燕麦)/.test(food)) return "🍠";
    if (/(苹果|香蕉|梨|蓝莓|莓|水果|火龙果)/.test(food)) return "🍌";
    if (/(番茄|黄瓜|蔬菜|青菜|菠菜|菌菇|香菇|木耳|白菜|娃娃菜|丝瓜|冬瓜|包菜|洋葱)/.test(food)) return "🥬";
    return "🍽️";
  }

  function recipeRules(recipe) {
    return [
      ...recipe.meals
        .filter((meal) => meal.slot === "全天" || isRuleOnly(meal.food))
        .map((meal) => `${meal.slot || "提醒"}：${meal.food}`),
      ...(Array.isArray(recipe.rules) ? recipe.rules : [])
    ].filter(Boolean);
  }

  function mealCategory(meal) {
    const slot = String(meal?.slot || "");
    const food = String(meal?.food || "");
    if (isRuleOnly(food) || !hasFoodSignal(food)) return "rule";
    if (/(早|早餐|起床|第一餐|白天主饮|白天固体)/.test(slot)) return "breakfast";
    if (/(午|中午|中$|12\s*点|12点)/.test(slot)) return "lunch";
    if (/(晚|傍晚|晚上|18[:：]?\d*|5\s*点|5点半|21[:：]?\d*)/.test(slot)) return "dinner";
    if (/(加餐|下午|补充|不够饱|饿了)/.test(slot)) return "snack";
    if (/(咖啡|黑咖|牛奶|豆浆|酸奶|吐司|面包|鸡蛋)/.test(food)) return "breakfast";
    if (/(米饭|饭|午餐|牛肉|鸡腿|鸡胸|鱼|虾)/.test(food)) return "lunch";
    return "snack";
  }

  function relatedRecipes(recipe) {
    const groups = [
      [recipe],
      recipeLibrary.filter((item) => item.id !== recipe.id && item.sourceApp === recipe.sourceApp && item.series === recipe.series),
      recipeLibrary.filter((item) => item.id !== recipe.id && item.sourceApp === recipe.sourceApp && item.series !== recipe.series),
      recipeLibrary.filter((item) => item.id !== recipe.id && item.sourceApp !== recipe.sourceApp)
    ];
    const seen = new Set();
    return groups.flat().filter((item) => {
      if (!item || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  function wholeMealItems(recipe) {
    return relatedRecipes(recipe).flatMap((sourceRecipe) => sourceRecipe.meals.map((meal) => {
      const category = mealCategory(meal);
      return {
        category,
        sourceRecipe,
        slot: meal.slot || "餐次",
        food: String(meal.food || "").trim(),
        tip: sourceRecipe.title || sourceRecipe.series || sourceRecipe.sourceLabel,
        key: `${sourceRecipe.id}:${meal.slot}:${meal.food}`
      };
    })).filter((item) => item.category !== "rule");
  }

  function takeMeals(pool, category, count, used) {
    const taken = [];
    for (const item of pool) {
      if (item.category !== category || used.has(item.key)) continue;
      used.add(item.key);
      taken.push(item);
      if (taken.length === count) break;
    }
    return taken;
  }

  function fillMeals(pool, count, used) {
    const taken = [];
    for (const item of pool) {
      if (used.has(item.key)) continue;
      used.add(item.key);
      taken.push(item);
      if (taken.length === count) break;
    }
    return taken;
  }

  function recipeToNine(recipe) {
    const pool = wholeMealItems(recipe);
    if (!pool.length) {
      return DEFAULT_TEMPLATES.map((item) => ({ ...item, fullFood: item.foods }));
    }
    const used = new Set();
    const breakfasts = takeMeals(pool, "breakfast", 3, used);
    const lunches = takeMeals(pool, "lunch", 3, used);
    const dinners = takeMeals(pool, "dinner", 3, used);
    const plan = [];
    for (let index = 0; index < 3; index += 1) {
      if (breakfasts[index]) plan.push({ ...breakfasts[index], label: `早餐${index + 1}` });
      if (lunches[index]) plan.push({ ...lunches[index], label: `午餐${index + 1}` });
      if (dinners[index]) plan.push({ ...dinners[index], label: `晚餐${index + 1}` });
    }
    fillMeals(pool, 9 - plan.length, used).forEach((item, index) => plan.push({ ...item, label: `可选${index + 1}` }));
    const originalPlanCount = plan.length;
    while (plan.length < 9) {
      const item = plan[plan.length % originalPlanCount];
      plan.push({ ...item, label: `可选${plan.length + 1}` });
    }
    return plan.slice(0, 9).map((item, index) => ({
      emoji: emojiForFood(item.food),
      name: String(item.label || item.slot || `第${index + 1}顿`).slice(0, 12),
      foods: String(item.food || "").slice(0, 80),
      tip: String(item.tip || recipe.title || "").slice(0, 60),
      fullFood: String(item.food || "")
    }));
  }

  function openRecipe(recipeId) {
    const recipe = recipeLibrary.find((item) => item.id === recipeId);
    if (!recipe) return;
    activeRecipeId = recipe.id;
    const nine = recipeToNine(recipe);
    refs.recipeSheetSource.textContent = `${recipe.sourceLabel} · ${recipe.series}`;
    refs.recipeSheetTitle.textContent = recipe.title;
    refs.recipeSheetSummary.textContent = recipe.summary || recipe.fit || "已整理成9格，方便查看和套用。";
    refs.recipeNineList.innerHTML = nine.map((item, index) => `
      <article class="recipe-nine-item">
        <b>${index + 1}</b>
        <div><strong>${escapeHtml(item.name)}</strong><p>${escapeHtml(item.fullFood || item.foods)}</p></div>
      </article>`).join("");
    const rules = recipeRules(recipe);
    refs.recipeRules.hidden = !rules.length;
    refs.recipeRules.innerHTML = rules.length
      ? `<strong>原食谱提醒</strong><ul>${rules.slice(0, 4).map((rule) => `<li>${escapeHtml(rule)}</li>`).join("")}</ul>`
      : "";
    showSheet(refs.recipeSheet);
  }

  function applyActiveRecipe() {
    const recipe = recipeLibrary.find((item) => item.id === activeRecipeId);
    if (!recipe) return;
    if (!window.confirm(`确定把当前9顿替换成「${recipe.title}」吗？\n\n只替换卡片内容，不会清空已完成轮数。`)) return;
    applyTemplates(recipeToNine(recipe));
    saveState();
    closeSheets();
    renderAll();
    showToast(`已套用：${recipe.title}`);
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

  function exportTemplates() {
    const now = new Date().toISOString();
    const payload = {
      type: "three-meal-light-templates",
      version: 1,
      exportedAt: now,
      presets: [
        { id: `current-${Date.now()}`, name: "当前9顿", createdAt: now, templates: clonePreset(state.templates) },
        ...state.customPresets.map((preset) => ({
          id: preset.id,
          name: preset.name,
          createdAt: preset.createdAt,
          templates: clonePreset(preset.templates)
        }))
      ].slice(0, CUSTOM_PRESET_LIMIT)
    };
    downloadJson(payload, `三餐九选模板-${new Date().toISOString().slice(0, 10)}.json`);
    showToast("模板文件已导出");
  }

  function downloadJson(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function openTemplateImport() {
    refs.importTemplatesInput.value = "";
    refs.importTemplatesInput.click();
  }

  async function importTemplatesFromFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const incoming = Array.isArray(payload?.presets)
        ? payload.presets
        : Array.isArray(payload?.customPresets)
          ? payload.customPresets
          : Array.isArray(payload?.templates)
            ? [{ id: `import-${Date.now()}`, name: payload?.name || "导入模板", createdAt: new Date().toISOString(), templates: payload.templates }]
            : [];
      const normalized = normalizeCustomPresets(incoming).map((preset, index) => ({
        ...preset,
        id: `import-${Date.now()}-${index}`,
        name: preset.name === "当前9顿" ? "导入的当前9顿" : preset.name
      }));
      if (!normalized.length) throw new Error("No templates found");
      if (normalized.length + state.customPresets.length > CUSTOM_PRESET_LIMIT) {
        const message = `最多保存${CUSTOM_PRESET_LIMIT}套模板，导入后会保留最新${CUSTOM_PRESET_LIMIT}套。继续吗？`;
        if (!window.confirm(message)) return;
      }
      state.customPresets = [...normalized, ...state.customPresets].slice(0, CUSTOM_PRESET_LIMIT);
      saveState();
      renderLibrary();
      showToast(`已导入${Math.min(normalized.length, CUSTOM_PRESET_LIMIT)}套模板`);
    } catch {
      showToast("导入失败，请选择三餐九选模板文件");
    }
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
    lockViewportScale();
    $$(".nav-item").forEach((button) => button.addEventListener("click", () => navigateTo(button.dataset.target)));
    $("#undoLastButton").addEventListener("click", undoLastMeal);
    $("#resetRoundButton").addEventListener("click", resetCurrentRound);
    $("#editorForm").addEventListener("submit", (event) => { event.preventDefault(); saveTemplate(); });
    refs.saveCustomPresetButton.addEventListener("click", saveCurrentAsCustomPreset);
    refs.exportTemplatesButton.addEventListener("click", exportTemplates);
    refs.importTemplatesButton.addEventListener("click", openTemplateImport);
    refs.importTemplatesInput.addEventListener("change", importTemplatesFromFile);
    refs.applyRecipeButton.addEventListener("click", applyActiveRecipe);
    $("#exportButton").addEventListener("click", exportData);
    $("#resetButton").addEventListener("click", resetAllData);
    $("#installButton").addEventListener("click", openInstallFlow);
    refs.sheetBackdrop.addEventListener("click", closeSheets);
    $$("[data-close-sheet]").forEach((button) => button.addEventListener("click", closeSheets));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeSheets(); });
    window.addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); installPrompt = event; });
    window.addEventListener("appinstalled", () => showToast("已安装到主屏幕"));
  }

  function lockViewportScale() {
    let lastTouchEnd = 0;
    document.addEventListener("gesturestart", (event) => event.preventDefault(), { passive: false });
    document.addEventListener("gesturechange", (event) => event.preventDefault(), { passive: false });
    document.addEventListener("gestureend", (event) => event.preventDefault(), { passive: false });
    document.addEventListener("touchend", (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 350) event.preventDefault();
      lastTouchEnd = now;
    }, { passive: false });
  }

  saveState();
  bindEvents();
  renderAll();
  registerServiceWorker();
})();
