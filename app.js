(() => {
  "use strict";

  const STORAGE_KEY = "three-meal-light-v1";
  const CUSTOM_PRESET_LIMIT = 12;
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
  const PRESET_SETS = [
    {
      id: "simple",
      name: "基础简单版",
      source: "三餐九选",
      desc: "回到土豆、酸奶、鸡胸肉这些最简单的常吃项。",
      templates: clonePreset(DEFAULT_TEMPLATES)
    },
    {
      id: "strawberry-binge",
      name: "草莓暴食恢复",
      source: "草莓暴食后餐单",
      desc: "从暴食后恢复 A/B/C 和恢复 3.0 里压缩成 9 顿。",
      templates: [
        { emoji: "☕", name: "温水黑咖", foods: "温水分开喝；可加黑咖或少量奶咖", tip: "这是恢复节奏，不是补偿性挨饿。" },
        { emoji: "🥚", name: "鸡蛋餐", foods: "鸡蛋 1-2 个，水煮、蒸蛋或番茄炒蛋", tip: "先把蛋白质吃稳。" },
        { emoji: "🐔", name: "鸡胸鸡腿", foods: "鸡胸、鸡腿或鸡肉 150-250g", tip: "做法清淡，别额外叠加甜饮。" },
        { emoji: "🥒", name: "黄瓜番茄", foods: "黄瓜、番茄、半个苹果任选", tip: "饿了用来过渡，不要只靠它撑一天。" },
        { emoji: "🥣", name: "无糖酸奶", foods: "无糖酸奶 1 杯，可配少量水果", tip: "太甜的酸奶按甜品看。" },
        { emoji: "🍠", name: "红薯南瓜", foods: "红薯、紫薯、老南瓜约 100-150g", tip: "恢复日也可以有主食。" },
        { emoji: "🥩", name: "牛肉虾仁", foods: "牛肉、虾仁或鱼肉 150g 左右", tip: "晚餐用蛋白质收住。" },
        { emoji: "🍗", name: "鸡腿玉米", foods: "烤鸡腿 1 个，或鸡腿配玉米/紫薯", tip: "饱腹版用，别硬饿。" },
        { emoji: "🍽️", name: "聚餐8分饱", foods: "有聚餐时正常吃一餐，到8分饱停", tip: "聚餐当天不再叠加夜宵甜饮。" }
      ]
    },
    {
      id: "strawberry-daily",
      name: "草莓平常稳餐",
      source: "草莓饮食-平常的饮食",
      desc: "适合普通控饮食日，蛋奶、米饭、蔬菜和蛋白质更均衡。",
      templates: [
        { emoji: "🥚", name: "蛋奶坚果", foods: "鸡蛋 2 个 + 牛奶 100ml + 少量坚果", tip: "适合普通早餐，不用断碳。" },
        { emoji: "🌽", name: "玉米番茄", foods: "半根玉米，或番茄 1 个", tip: "饿了再加，不饿可跳过。" },
        { emoji: "🍚", name: "米饭牛肉", foods: "米饭 100-150g + 牛肉/鸡腿/三文鱼 + 蔬菜", tip: "正常吃饭，份量清楚。" },
        { emoji: "🍅", name: "番茄蛋菜", foods: "番茄蛋 + 木耳、娃娃菜、香菇或丝瓜", tip: "晚餐清淡但别只吃菜。" },
        { emoji: "🐔", name: "鸡肉蔬菜", foods: "鸡肉或牛肉 100-150g + 蔬菜 250g", tip: "中午或晚上都能用。" },
        { emoji: "🥣", name: "酸奶牛肉", foods: "牛肉 100g + 无糖酸奶 100g", tip: "轻一点但保留蛋白质。" },
        { emoji: "🍠", name: "红薯蛋白", foods: "红薯/紫薯/玉米 + 鸡胸或牛肉", tip: "粗粮和蛋白质一起吃更稳。" },
        { emoji: "🍞", name: "吐司鸡蛋", foods: "全麦吐司 + 鸡蛋 + 豆浆或牛奶", tip: "想吃面包时用这一顿。" },
        { emoji: "🍎", name: "低糖水果", foods: "苹果、蓝莓、梨等 100g 左右", tip: "水果是加餐，不替代正餐蛋白质。" }
      ]
    },
    {
      id: "mashu-reset",
      name: "麻薯大餐后",
      source: "麻薯小狗",
      desc: "提炼大餐后高盐、高碳、高油恢复和基础外卖安全日。",
      templates: [
        { emoji: "🥚", name: "鸡蛋酸奶", foods: "鸡蛋 1 个 + 酸奶香蕉拌豆浆粉", tip: "适合高盐后第一餐。" },
        { emoji: "🥥", name: "椰水肉饭", foods: "椰子水煮肉 + 米饭约 150g", tip: "不要因为恢复就完全断主食。" },
        { emoji: "🥬", name: "菠菜冬瓜", foods: "菠菜烧冬瓜，配芋头或土豆", tip: "补钾排钠方向，少盐。" },
        { emoji: "🥪", name: "三明治", foods: "三明治 1 个，便利店或外卖半个到一个", tip: "适合想稳血糖的一顿。" },
        { emoji: "🥣", name: "豆乳燕麦", foods: "鸡蛋 + 豆乳燕麦，燕麦约 35g", tip: "高碳后用来稳住食欲。" },
        { emoji: "🦐", name: "虾菜燕麦", foods: "水煮虾 + 白菜木耳菠菜金针菇 + 少量燕麦", tip: "高油后想清爽时用。" },
        { emoji: "🍱", name: "家常食堂", foods: "一荤两素 + 米饭一拳或馒头 1 个", tip: "长期更稳的基础版。" },
        { emoji: "🥘", name: "懒人焖菜", foods: "番茄包菜洋葱 + 鸡蛋/牛肉 + 少量主食", tip: "一锅端，少油少浓酱。" },
        { emoji: "🥡", name: "外卖拌饭", foods: "轻食拌饭：杂粮饭 + 肉类 + 豆泥，少酱", tip: "必须点外卖时用。" }
      ]
    },
    {
      id: "yizhibai-outside",
      name: "一只白外食",
      source: "一只白",
      desc: "偏外食和快餐的低负担版本，适合不做饭时套用。",
      templates: [
        { emoji: "☕", name: "黑咖鸡蛋", foods: "黑咖或无糖茶 + 鸡蛋 1 个", tip: "简单开头，不加糖。" },
        { emoji: "🍌", name: "香蕉鸡蛋", foods: "香蕉 1 根 + 鸡蛋 1 个", tip: "短期轻一点，不长期连续用。" },
        { emoji: "🥛", name: "牛奶咖啡", foods: "牛奶 1 杯 + 黑咖或美式", tip: "适合早餐外带。" },
        { emoji: "🥪", name: "鸡肉三明治", foods: "板烧鸡腿三明治或同类鸡肉三明治", tip: "不额外加薯条甜品。" },
        { emoji: "🥯", name: "贝果汉堡", foods: "三明治、汉堡或贝果堡 1 个，少酱", tip: "快餐日用一顿解决。" },
        { emoji: "🥩", name: "牛腱鸡蛋", foods: "卤牛腱子肉约 130g + 鸡蛋 1 个", tip: "高蛋白收住。" },
        { emoji: "🍠", name: "红薯牛肉", foods: "半块红薯 + 清淡牛肉", tip: "大餐后补钾方向。" },
        { emoji: "🍗", name: "椰子鸡", foods: "半只椰子鸡，只吃鸡肉，不喝汤", tip: "想吃一顿正餐恢复时用。" },
        { emoji: "🥟", name: "云吞分餐", foods: "鲜虾/牛肉云吞 5-10 颗，少汤或不喝汤", tip: "外食方便，但别加甜饮。" }
      ]
    }
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
    presetGrid: $("#presetGrid"),
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
    toast: $("#toast"),
    celebrationCanvas: $("#celebrationCanvas")
  };

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
      const wasLegacyDefault = !saved || LEGACY_DEFAULT_TEMPLATE_NAMES.includes(saved.name);
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
    refs.presetGrid.innerHTML = PRESET_SETS.map((preset) => `
      <button class="preset-card" type="button" data-apply-preset="${preset.id}" aria-label="套用${escapeHtml(preset.name)}">
        <strong>${escapeHtml(preset.name)}</strong>
        <span>${escapeHtml(preset.source)}</span>
        <p>${escapeHtml(preset.desc)}</p>
      </button>`).join("");
    $$("[data-apply-preset]", refs.presetGrid).forEach((button) => button.addEventListener("click", () => applyPreset(button.dataset.applyPreset)));
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

  function applyPreset(presetId) {
    const preset = PRESET_SETS.find((item) => item.id === presetId);
    if (!preset) return;
    const message = `确定把9顿替换成「${preset.name}」吗？\n\n只替换卡片内容，不会清空已完成轮数。`;
    if (!window.confirm(message)) return;
    state.templates = DEFAULT_TEMPLATES.map((fallback, index) => {
      const item = preset.templates[index] || fallback;
      return {
        id: fallback.id,
        emoji: String(item.emoji || fallback.emoji).slice(0, 4),
        name: String(item.name || fallback.name).slice(0, 12),
        foods: String(item.foods || fallback.foods).slice(0, 80),
        tip: String(item.tip || fallback.tip).slice(0, 60)
      };
    });
    saveState();
    renderAll();
    showToast(`已套用：${preset.name}`);
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
