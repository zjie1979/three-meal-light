(() => {
  "use strict";

  const STORAGE_KEY = "three-meal-light-v1";
  const MEALS = {
    breakfast: {
      name: "早餐",
      icon: "☀",
      color: "#D9903D",
      summary: "给身体一个温和的开始",
      checks: [
        { id: "produce", short: "果蔬", name: "水果或蔬菜", hint: "一拳左右" },
        { id: "protein", short: "蛋白", name: "优质蛋白", hint: "蛋、奶或豆制品" },
        { id: "staple", short: "主食", name: "饱腹主食", hint: "燕麦、全麦或薯类" },
        { id: "drink", short: "无糖饮", name: "水或无糖饮", hint: "少喝含糖饮料" }
      ]
    },
    lunch: {
      name: "午餐",
      icon: "◐",
      color: "#2C7A61",
      summary: "半盘菜，一掌肉，一拳饭",
      checks: [
        { id: "produce", short: "½ 蔬菜", name: "半盘蔬菜", hint: "深浅颜色搭配" },
        { id: "protein", short: "¼ 蛋白", name: "一掌蛋白", hint: "鱼、肉、蛋或豆" },
        { id: "staple", short: "¼ 主食", name: "一拳主食", hint: "米饭、面或杂粮" },
        { id: "drink", short: "水/清汤", name: "水或清汤", hint: "替代含糖饮料" }
      ]
    },
    dinner: {
      name: "晚餐",
      icon: "☾",
      color: "#5D8FA8",
      summary: "吃够营养，给胃留点余地",
      checks: [
        { id: "produce", short: "蔬菜", name: "足量蔬菜", hint: "先吃几口菜" },
        { id: "protein", short: "蛋白", name: "一掌蛋白", hint: "帮助稳定饱腹" },
        { id: "staple", short: "主食", name: "适量主食", hint: "半拳到一拳" },
        { id: "drink", short: "无糖饮", name: "水或无糖饮", hint: "不靠饮料添饱" }
      ]
    }
  };

  const defaultState = () => ({
    version: 1,
    settings: {
      times: { breakfast: "08:00", lunch: "12:30", dinner: "18:30" }
    },
    days: {}
  });

  let state = loadState();
  let selectedDate = dateKey(new Date());
  let activeMealKey = null;
  let selectedChecks = new Set();
  let selectedSatiety = null;
  let installPrompt = null;
  let toastTimer = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const refs = {
    dateTitle: $("#dateTitle"),
    dateSubtitle: $("#dateSubtitle"),
    nextDayButton: $("#nextDayButton"),
    mealList: $("#mealList"),
    doneCount: $("#doneCount"),
    miniProgress: $("#miniProgress"),
    progressRing: $("#progressRing"),
    dailyHeadline: $("#dailyHeadline"),
    dailyMessage: $("#dailyMessage"),
    streakCount: $("#streakCount"),
    balanceCount: $("#balanceCount"),
    weightInput: $("#weightInput"),
    weightTrend: $("#weightTrend"),
    sheetBackdrop: $("#sheetBackdrop"),
    mealSheet: $("#mealSheet"),
    installSheet: $("#installSheet"),
    mealSheetTitle: $("#mealSheetTitle"),
    mealSheetEyebrow: $("#mealSheetEyebrow"),
    mealKeyInput: $("#mealKeyInput"),
    checkGrid: $("#checkGrid"),
    foodNote: $("#foodNote"),
    satietyScale: $("#satietyScale"),
    mealFeedback: $("#mealFeedback"),
    completeMealButton: $("#completeMealButton"),
    toast: $("#toast"),
    weekBars: $("#weekBars"),
    historyList: $("#historyList"),
    weekMeals: $("#weekMeals"),
    weekPerfectDays: $("#weekPerfectDays"),
    weekSatiety: $("#weekSatiety"),
    planForm: $("#planForm"),
    celebrationCanvas: $("#celebrationCanvas")
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || saved.version !== 1 || !saved.days) return defaultState();
      return {
        ...defaultState(),
        ...saved,
        settings: {
          ...defaultState().settings,
          ...(saved.settings || {}),
          times: { ...defaultState().settings.times, ...(saved.settings?.times || {}) }
        }
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
    if (!state.days[key] && create) {
      state.days[key] = { weight: "", meals: {} };
    }
    return state.days[key] || { weight: "", meals: {} };
  }

  function mealRecord(key, mealKey) {
    return getDay(key).meals?.[mealKey] || {
      done: false,
      checks: [],
      note: "",
      satiety: null
    };
  }

  function mealCount(key) {
    return Object.keys(MEALS).filter((mealKey) => mealRecord(key, mealKey).done).length;
  }

  function formatSelectedDate() {
    const today = dateKey(new Date());
    const yesterday = addDays(today, -1);
    if (selectedDate === today) return "今天";
    if (selectedDate === yesterday) return "昨天";
    return parseDate(selectedDate).toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
  }

  function renderToday() {
    const date = parseDate(selectedDate);
    const today = dateKey(new Date());
    const day = getDay();
    const done = mealCount(selectedDate);
    const balance = Object.keys(MEALS).reduce(
      (total, mealKey) => total + (mealRecord(selectedDate, mealKey).checks?.length || 0),
      0
    );

    refs.dateTitle.textContent = formatSelectedDate();
    refs.dateSubtitle.textContent = date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short"
    });
    refs.nextDayButton.disabled = selectedDate >= today;
    refs.doneCount.textContent = done;
    refs.miniProgress.textContent = `${done} / 3`;
    refs.progressRing.style.setProperty("--progress", Math.round((done / 3) * 100));
    refs.streakCount.textContent = calculateStreak();
    refs.balanceCount.textContent = balance;
    refs.weightInput.value = day.weight || "";
    updateWeightTrend();

    const messages = [
      ["一日三餐，稳稳完成", "不用饿，也不用追求满分，先把每一餐吃完整。"],
      ["很好的开始", "第一餐已经记下，下一餐继续照顾好自己。"],
      ["今天已经完成大半", "保持正常节奏，不需要为了减重故意少吃一餐。"],
      ["三餐都照顾到了", "今天的节奏完成了，真正有效的是一次次普通的坚持。"]
    ];
    refs.dailyHeadline.textContent = messages[done][0];
    refs.dailyMessage.textContent = messages[done][1];

    refs.mealList.innerHTML = Object.entries(MEALS)
      .map(([mealKey, meal]) => {
        const record = mealRecord(selectedDate, mealKey);
        const summary = record.note?.trim() || (record.done ? "已记录，点开可以修改" : meal.summary);
        return `
          <article class="meal-card ${record.done ? "is-done" : ""}" style="--meal-color: ${meal.color}">
            <button class="meal-button" type="button" data-meal="${mealKey}" aria-label="${record.done ? "编辑" : "记录"}${meal.name}">
              <div class="meal-top">
                <span class="meal-icon" aria-hidden="true">${meal.icon}</span>
                <div class="meal-main">
                  <div class="meal-title-row">
                    <h3>${meal.name}</h3>
                    <time>${state.settings.times[mealKey]}</time>
                  </div>
                  <p>${escapeHtml(summary)}</p>
                </div>
                <span class="meal-status" aria-hidden="true">${record.done ? "✓" : "+"}</span>
              </div>
              <div class="meal-checks">
                ${meal.checks
                  .map(
                    (check) =>
                      `<span class="${record.checks?.includes(check.id) ? "is-checked" : ""}">${check.short}</span>`
                  )
                  .join("")}
              </div>
            </button>
          </article>`;
      })
      .join("");

    $$("[data-meal]", refs.mealList).forEach((button) => {
      button.addEventListener("click", () => openMealSheet(button.dataset.meal));
    });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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
    const currentValue = Number(getDay().weight);
    const previous = Object.keys(state.days)
      .filter((key) => key < selectedDate && Number(state.days[key]?.weight) > 0)
      .sort()
      .at(-1);

    if (!currentValue) {
      refs.weightTrend.textContent = "记录后可查看趋势";
      return;
    }
    if (!previous) {
      refs.weightTrend.textContent = "已记录第一笔体重";
      return;
    }
    const diff = currentValue - Number(state.days[previous].weight);
    if (Math.abs(diff) < 0.05) {
      refs.weightTrend.textContent = "与上次记录基本持平";
    } else {
      refs.weightTrend.textContent = `较上次${diff > 0 ? "增加" : "减少"} ${Math.abs(diff).toFixed(1)} kg`;
    }
  }

  function openMealSheet(mealKey) {
    activeMealKey = mealKey;
    const meal = MEALS[mealKey];
    const record = mealRecord(selectedDate, mealKey);
    selectedChecks = new Set(record.checks || []);
    selectedSatiety = record.satiety || null;

    refs.mealSheetTitle.textContent = meal.name;
    refs.mealSheetEyebrow.textContent = record.done ? "修改这餐记录" : "记录这一餐";
    refs.mealKeyInput.value = mealKey;
    refs.foodNote.value = record.note || "";
    refs.completeMealButton.textContent = record.done ? "保存修改" : "完成这一餐";
    refs.checkGrid.innerHTML = meal.checks
      .map(
        (check) => `
          <button class="meal-check-button ${selectedChecks.has(check.id) ? "is-selected" : ""}" type="button" data-check="${check.id}" aria-pressed="${selectedChecks.has(check.id)}">
            <span class="check-circle">✓</span>
            <span><b>${check.name}</b><span>${check.hint}</span></span>
          </button>`
      )
      .join("");

    $$("[data-check]", refs.checkGrid).forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.check;
        if (selectedChecks.has(id)) selectedChecks.delete(id);
        else selectedChecks.add(id);
        button.classList.toggle("is-selected", selectedChecks.has(id));
        button.setAttribute("aria-pressed", String(selectedChecks.has(id)));
        updateMealFeedback();
      });
    });

    $$("button", refs.satietyScale).forEach((button) => {
      button.classList.toggle("is-selected", Number(button.dataset.value) === selectedSatiety);
    });
    updateMealFeedback();
    showSheet(refs.mealSheet);
  }

  function updateMealFeedback() {
    const missing = ["produce", "protein", "staple"].filter((id) => !selectedChecks.has(id));
    let message = "选好后，这里会给你一个简单建议。";
    if (selectedChecks.size > 0) {
      if (missing.length === 0) {
        message = "这一餐搭配得很完整。保持舒服的份量，就已经很好。";
      } else if (missing.includes("protein")) {
        message = "下一次可以补一份蛋、奶、豆制品或瘦肉，饱腹会更稳。";
      } else if (missing.includes("produce")) {
        message = "下一次添一拳果蔬，颜色越丰富越容易吃得均衡。";
      } else if (missing.includes("staple")) {
        message = "不用把主食完全戒掉，适量主食更容易把节奏坚持下去。";
      }
      if (selectedSatiety >= 4) {
        message += " 这次有点撑也没关系，下一餐照常吃，不用补偿性挨饿。";
      }
    }
    refs.mealFeedback.textContent = message;
  }

  function showSheet(sheet) {
    refs.sheetBackdrop.hidden = false;
    sheet.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => $("button, input, textarea", sheet)?.focus({ preventScroll: true }));
  }

  function closeSheets() {
    refs.sheetBackdrop.hidden = true;
    refs.mealSheet.hidden = true;
    refs.installSheet.hidden = true;
    document.body.style.overflow = "";
  }

  function storeMeal(done) {
    if (!activeMealKey) return;
    const day = getDay(selectedDate, true);
    const previousDone = Boolean(day.meals[activeMealKey]?.done);
    day.meals[activeMealKey] = {
      done,
      checks: [...selectedChecks],
      note: refs.foodNote.value.trim(),
      satiety: selectedSatiety,
      updatedAt: new Date().toISOString()
    };
    saveState();
    closeSheets();
    renderToday();
    renderHistory();
    if (done) {
      showToast(previousDone ? "记录已更新" : `${MEALS[activeMealKey].name}已完成 ✓`);
      if (!previousDone && mealCount(selectedDate) === 3) celebrate();
    } else {
      showToast("已保存，完成后再来打卡");
    }
  }

  function renderHistory() {
    const today = dateKey(new Date());
    const dates = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
    let totalMeals = 0;
    let perfectDays = 0;
    const satietyValues = [];

    refs.weekBars.innerHTML = dates
      .map((key) => {
        const count = mealCount(key);
        totalMeals += count;
        if (count === 3) perfectDays += 1;
        Object.keys(MEALS).forEach((mealKey) => {
          const value = Number(mealRecord(key, mealKey).satiety);
          if (value) satietyValues.push(value);
        });
        const date = parseDate(key);
        return `
          <div class="week-day ${key === today ? "is-today" : ""}">
            <div class="bar-track"><div class="bar-fill" style="height: ${Math.max(5, (count / 3) * 100)}%"></div></div>
            <span>${date.toLocaleDateString("zh-CN", { weekday: "short" }).replace("周", "")}</span>
          </div>`;
      })
      .join("");

    refs.weekMeals.textContent = `${totalMeals} 餐`;
    refs.weekPerfectDays.textContent = `${perfectDays} 天`;
    refs.weekSatiety.textContent = satietyValues.length
      ? `${(satietyValues.reduce((sum, value) => sum + value, 0) / satietyValues.length).toFixed(1)} / 5`
      : "--";

    const recordedDates = Object.keys(state.days)
      .filter((key) => {
        const day = state.days[key];
        return mealCount(key) > 0 || day.weight;
      })
      .sort()
      .reverse()
      .slice(0, 30);

    refs.historyList.innerHTML = recordedDates.length
      ? recordedDates
          .map((key) => {
            const date = parseDate(key);
            const count = mealCount(key);
            const notes = Object.keys(MEALS)
              .map((mealKey) => mealRecord(key, mealKey).note)
              .filter(Boolean)
              .join(" · ");
            const detail = notes || (state.days[key].weight ? `体重 ${state.days[key].weight} kg` : "已留下记录");
            return `
              <article class="history-item">
                <div class="history-date">
                  <strong>${date.getDate()}</strong>
                  <span>${date.toLocaleDateString("zh-CN", { month: "short" })}</span>
                </div>
                <div class="history-detail">
                  <strong>${count === 3 ? "三餐完成" : `完成 ${count} 餐`}</strong>
                  <span>${escapeHtml(detail)}</span>
                </div>
                <div class="history-dots" aria-label="完成 ${count} 餐">
                  ${[0, 1, 2].map((index) => `<i class="${index < count ? "is-done" : ""}"></i>`).join("")}
                </div>
              </article>`;
          })
          .join("")
      : '<div class="empty-state">还没有记录。<br />从今天的一餐开始，慢慢积累自己的节奏。</div>';
  }

  function renderSettings() {
    Object.entries(state.settings.times).forEach(([key, value]) => {
      const input = $(`#${key}Time`);
      if (input) input.value = value;
    });
  }

  function navigateTo(target) {
    $$(".view").forEach((view) => view.classList.toggle("is-active", view.dataset.view === target));
    $$(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.target === target));
    if (target === "history") renderHistory();
    if (target === "plan") renderSettings();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    refs.toast.textContent = message;
    refs.toast.classList.add("is-visible");
    toastTimer = setTimeout(() => refs.toast.classList.remove("is-visible"), 2200);
  }

  function celebrate() {
    const canvas = refs.celebrationCanvas;
    const context = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    context.scale(ratio, ratio);
    const colors = ["#2C7A61", "#F1BB5B", "#EF765F", "#5D8FA8", "#CDE7A3"];
    const particles = Array.from({ length: 75 }, () => ({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 100,
      y: window.innerHeight * 0.5,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 8 - 3,
      gravity: 0.18 + Math.random() * 0.08,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.25,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 80 + Math.random() * 30
    }));
    let frame = 0;
    const draw = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += particle.gravity;
        particle.rotation += particle.spin;
        particle.life -= 1;
        context.save();
        context.globalAlpha = Math.max(0, particle.life / 90);
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.fillStyle = particle.color;
        context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.65);
        context.restore();
      });
      frame += 1;
      if (frame < 115) requestAnimationFrame(draw);
      else context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
    requestAnimationFrame(draw);
    showToast("今天三餐完成啦，稳稳的一天 ✨");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `三餐轻盈备份-${dateKey(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("备份文件已导出");
  }

  function resetData() {
    const confirmed = window.confirm("确定清除全部饮食和体重记录吗？此操作无法撤销。建议先导出备份。");
    if (!confirmed) return;
    state = defaultState();
    saveState();
    selectedDate = dateKey(new Date());
    renderAll();
    navigateTo("today");
    showToast("全部记录已清除");
  }

  function openInstallFlow() {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.finally(() => {
        installPrompt = null;
      });
      return;
    }
    showSheet(refs.installSheet);
  }

  function bindEvents() {
    $("#prevDayButton").addEventListener("click", () => {
      selectedDate = addDays(selectedDate, -1);
      renderToday();
    });
    refs.nextDayButton.addEventListener("click", () => {
      const next = addDays(selectedDate, 1);
      if (next <= dateKey(new Date())) selectedDate = next;
      renderToday();
    });
    $("#dateButton").addEventListener("click", () => {
      selectedDate = dateKey(new Date());
      renderToday();
      showToast("已回到今天");
    });

    refs.weightInput.addEventListener("change", () => {
      const value = refs.weightInput.value.trim();
      const day = getDay(selectedDate, true);
      day.weight = value;
      saveState();
      updateWeightTrend();
      renderHistory();
      showToast(value ? "体重已记录" : "已删除这天体重");
    });

    $$(".nav-item").forEach((button) => {
      button.addEventListener("click", () => navigateTo(button.dataset.target));
    });

    refs.sheetBackdrop.addEventListener("click", closeSheets);
    $$('[data-close-sheet]').forEach((button) => button.addEventListener("click", closeSheets));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeSheets();
    });

    refs.satietyScale.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-value]");
      if (!button) return;
      selectedSatiety = Number(button.dataset.value);
      $$("button", refs.satietyScale).forEach((item) => item.classList.toggle("is-selected", item === button));
      updateMealFeedback();
    });

    $("#mealForm").addEventListener("submit", (event) => {
      event.preventDefault();
      storeMeal(true);
    });
    $("#saveDraftButton").addEventListener("click", () => storeMeal(false));

    refs.planForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(refs.planForm);
      Object.keys(MEALS).forEach((key) => {
        state.settings.times[key] = data.get(key) || defaultState().settings.times[key];
      });
      saveState();
      renderToday();
      showToast("三餐时间已保存");
    });

    $("#exportButton").addEventListener("click", exportData);
    $("#resetButton").addEventListener("click", resetData);
    $("#installButton").addEventListener("click", openInstallFlow);

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      installPrompt = event;
    });
    window.addEventListener("appinstalled", () => showToast("已安装到主屏幕"));
  }

  function renderAll() {
    renderToday();
    renderHistory();
    renderSettings();
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    try {
      await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    } catch (error) {
      console.warn("Service worker registration failed", error);
    }
  }

  bindEvents();
  renderAll();
  registerServiceWorker();
})();
