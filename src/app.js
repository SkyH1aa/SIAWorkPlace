const CONFIG = {
  url: "https://jgezpvmlnhycxslqbwcx.supabase.co",
  key: "sb_publishable_B29ClgwZagW32Ow5x6VdKQ_IL65F7dl",
  fn: "sia-auth"
};
const TZ = "Asia/Shanghai";
const COLORS = ["#6e5bd4", "#2d8bd8", "#1ca874", "#e19a35", "#db5662", "#8b5aa8", "#3b4256", "#e66f3d"];
const QUADRANTS = [
  ["urgent-important", "重要且紧急"],
  ["important-not-urgent", "重要不紧急"],
  ["urgent-not-important", "紧急不重要"],
  ["not-urgent-not-important", "不重要不紧急"]
];
const DEFAULT_CATEGORIES = [
  { id: "cat-study", name: "学习", color: "#6e5bd4", builtin: true },
  { id: "cat-work", name: "工作", color: "#2d8bd8", builtin: true },
  { id: "cat-life", name: "生活", color: "#1ca874", builtin: true }
];
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch {} },
  remove(key) { try { localStorage.removeItem(key); } catch {} }
};
const uid = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2);
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const dateKey = date => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(date);
const today = dateKey(new Date());
const addDays = (key, amount) => { const date = new Date(`${key}T12:00:00+08:00`); date.setDate(date.getDate() + amount); return dateKey(date); };
const fmt = value => new Intl.NumberFormat("zh-CN").format(Math.round(Number(value) || 0));
const freshCategories = () => DEFAULT_CATEGORIES.map(item => ({ ...item }));
const blank = () => ({ version: 5, timezone: TZ, user: null, session: null, targets: [], subtasks: [], logs: [], plans: [], reports: {}, categories: freshCategories(), notes: {}, focusLogs: [], rewards: { points: 0, unlockedThemes: ["冷白紫"] }, settings: { theme: "cold", timelineRange: "day", dailyCapacityMinutes: 480, deadlineAlertDays: 2 } });
function examples() {
  return {
    ...blank(),
    targets: [
      { id: "t1", type: "goal", name: "背英语单词（示例）", unit: "个", total: 2000, daily: 30, due: addDays(today, 84), deadline: addDays(today, 84), estimateMinutes: 30, date: today, color: COLORS[0], quadrant: "important-not-urgent", categoryId: "cat-study", startTime: "07:30", endTime: "08:00", completionMode: "detail", repeat: { mode: "daily" }, created: today },
      { id: "t2", type: "goal", name: "读《人类简史》（示例）", unit: "页", total: 440, daily: 18, due: addDays(today, 35), deadline: addDays(today, 35), estimateMinutes: 40, date: today, color: COLORS[2], quadrant: "important-not-urgent", categoryId: "cat-study", startTime: "20:00", endTime: "20:40", completionMode: "detail", repeat: { mode: "daily" }, created: today },
      { id: "t3", type: "goal", name: "Python 入门课（示例）", unit: "节", total: 30, daily: 1, due: addDays(today, 28), deadline: addDays(today, 28), estimateMinutes: 50, date: today, color: COLORS[1], quadrant: "urgent-important", categoryId: "cat-study", startTime: "19:00", endTime: "19:50", completionMode: "detail", repeat: { mode: "weekdays" }, created: today },
      { id: "d1", type: "todo", name: "整理明天的学习资料", date: today, deadline: addDays(today, 1), estimateMinutes: 20, color: COLORS[3], quadrant: "urgent-not-important", categoryId: "cat-study", startTime: "21:00", endTime: "21:20", completionMode: "quick", repeat: { mode: "none" }, created: today },
      { id: "i1", type: "todo", name: "稍后安排这条收集箱计划（示例）", date: null, deadline: addDays(today, 2), estimateMinutes: 15, color: COLORS[4], quadrant: "important-not-urgent", categoryId: "cat-life", completionMode: "quick", repeat: { mode: "none" }, created: addDays(today, -1) }
    ],
    subtasks: [{ id: "s1", targetId: "t1", name: "建立高频词表", done: true }, { id: "s2", targetId: "t1", name: "完成第一轮背诵", done: false }],
    logs: [{ id: "l1", targetId: "t1", date: addDays(today, -1), amount: 28, minutes: 25 }]
  };
}
function normalizeCategories(input) {
  const source = Array.isArray(input) && input.length ? input : freshCategories();
  const seen = new Set();
  return source.map((item, index) => {
    const name = typeof item === "string" ? item : String(item?.name || `分类 ${index + 1}`);
    const builtin = DEFAULT_CATEGORIES.find(category => category.name === name);
    let id = typeof item === "object" && item?.id ? String(item.id) : (builtin?.id || `cat-${index + 1}-${name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")}`);
    while (seen.has(id)) id = `${id}-${index + 1}`;
    seen.add(id);
    return { id, name, color: typeof item === "object" && item?.color ? item.color : (builtin?.color || COLORS[index % COLORS.length]), builtin: Boolean(typeof item === "object" ? item.builtin : builtin), createdAt: typeof item === "object" && item?.createdAt ? item.createdAt : `${today}T00:00:00+08:00` };
  });
}
function migrate(raw) {
  const source = raw && typeof raw === "object" ? raw : examples();
  const next = { ...blank(), ...source, version: 5, timezone: TZ };
  next.categories = normalizeCategories(source.categories);
  next.targets = (source.targets || []).map(item => {
    const legacyName = item.category || "学习";
    const matched = next.categories.find(category => category.id === item.categoryId || category.name === legacyName);
    const hasDate = Object.prototype.hasOwnProperty.call(item, "date");
    const legacyDeadline = item.deadline || (item.type === "goal" ? item.due : null);
    return { type: item.type || "goal", date: hasDate ? item.date : (item.created || today), categoryId: matched?.id || null, completionMode: item.completionMode || (item.type === "todo" ? "quick" : "detail"), repeat: item.repeat || { mode: "none" }, color: item.color || COLORS[0], estimateMinutes: Number(item.estimateMinutes || 0) || null, deadline: legacyDeadline || null, ...item, categoryId: matched?.id || item.categoryId || null, estimateMinutes: Number(item.estimateMinutes || 0) || null, deadline: legacyDeadline || null };
  });
  next.subtasks = source.subtasks || [];
  next.logs = source.logs || [];
  next.plans = source.plans || [];
  next.reports = source.reports || {};
  next.notes = source.notes || {};
  next.focusLogs = source.focusLogs || [];
  next.rewards = source.rewards || { points: 0, unlockedThemes: ["冷白紫"] };
  next.settings = { theme: "cold", timelineRange: "day", dailyCapacityMinutes: 480, deadlineAlertDays: 2, ...(source.settings || {}) };
  return next;
}
let state = migrate(JSON.parse(storage.get("siaworktable-data") || "null"));
let tab = "timeline";
let modal = null;
let formDraft = null;
let selectedDate = today;
let focusTimer = null;
let focusRemaining = 25 * 60;
let focusTargetId = "";
let feedbackType = "功能建议";
let feedbackContactType = "";
let openSelectId = "";
let openSelectTimer = null;
let pendingRender = false;
let pendingRenderForce = false;
let loginDraft = { username: "", password: "" };
const saveLocal = () => storage.set("siaworktable-data", JSON.stringify(state));
const targetById = id => state.targets.find(item => item.id === id);
const categoryById = id => state.categories.find(item => item.id === id);
const categoryName = target => categoryById(target.categoryId)?.name || target.category || "未分类";
const targetLogs = id => state.logs.filter(log => log.targetId === id);
const goalDone = target => targetLogs(target.id).reduce((sum, log) => sum + Number(log.amount || 0), 0);
const goalPct = target => Math.min(100, Math.round(goalDone(target) / Math.max(1, Number(target.total)) * 100));
const completion = (targetId, date) => state.logs.find(log => log.targetId === targetId && log.date === date && log.kind === "complete");
function appliesOn(target, date) {
  if (!target.date) return false;
  if (target.type === "goal") return date >= target.date && date <= (target.due || date);
  const repeat = target.repeat || { mode: "none" };
  if (repeat.mode === "none") return target.date === date;
  if (date < target.date) return false;
  const d = new Date(`${date}T12:00:00+08:00`);
  if (repeat.mode === "daily") return true;
  if (repeat.mode === "weekdays") return d.getDay() >= 1 && d.getDay() <= 5;
  if (repeat.mode === "weekly") return (repeat.days || []).includes(d.getDay());
  if (repeat.mode === "monthly") return d.getDate() === Number(repeat.monthDay || 1);
  if (repeat.mode === "interval") {
    const start = new Date(`${target.date}T12:00:00+08:00`);
    return Math.floor((d - start) / 86400000) % Math.max(1, Number(repeat.interval || 1)) === 0;
  }
  return false;
}
function tasksFor(date) { return state.targets.filter(target => target.date && appliesOn(target, date)); }
function estimateMinutes(target) {
  const explicit = Number(target.estimateMinutes || 0);
  if (explicit > 0) return explicit;
  if (target.startTime && target.endTime) {
    const [startHour, startMinute] = target.startTime.split(":").map(Number);
    const [endHour, endMinute] = target.endTime.split(":").map(Number);
    const minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    if (minutes > 0) return minutes;
  }
  return 0;
}
function isCompleteForDate(target, date) {
  return target.type === "goal" ? goalDone(target) >= Number(target.total || 0) : Boolean(completion(target.id, date));
}
function dayLoad(date) { return tasksFor(date).reduce((sum, target) => sum + estimateMinutes(target), 0); }
function capacityMinutes() {
  const value = Number(state.settings.dailyCapacityMinutes);
  return Number.isFinite(value) ? Math.max(0, value) : 480;
}
function deadlineState(target, date = today) {
  if (!target.deadline || isCompleteForDate(target, date)) return "";
  if (target.deadline < date) return "逾期";
  const alertDays = Math.max(0, Number(state.settings.deadlineAlertDays ?? 2));
  if (target.deadline <= addDays(date, alertDays)) return `截止 ${target.deadline.slice(5)}`;
  return "";
}
function replanItems() {
  return state.targets.filter(target => {
    if (!target.date || target.date >= today || (target.type === "todo" && target.repeat?.mode && target.repeat.mode !== "none") || appliesOn(target, today)) return false;
    if (target.type === "goal") return Boolean(target.deadline && target.deadline < today && !isCompleteForDate(target, today));
    return !completion(target.id, target.date);
  });
}
async function cloud(action, payload = {}) {
  if (!state.session || !state.user) return null;
  const response = await fetch(`${CONFIG.url}/functions/v1/${CONFIG.fn}`, { method: "POST", headers: { "Content-Type": "application/json", apikey: CONFIG.key, Authorization: `Bearer ${CONFIG.key}` }, body: JSON.stringify({ action, username: state.user, token: state.session, payload }) });
  const raw = await response.text();
  let output = {};
  try { output = raw ? JSON.parse(raw) : {}; } catch {}
  if (!response.ok) throw new Error(`HTTP ${response.status}：${output.detail || output.error || raw}`);
  return output;
}
async function sync() {
  saveLocal();
  if (!state.session) return;
  setSync("同步中…");
  try {
    const { user, session, ...payload } = state;
    await cloud("save", payload);
    setSync(`已同步 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`);
  } catch (error) { setSync(`同步失败：${error.message}`); }
}
function setSync(text) { document.querySelectorAll("[data-sync]").forEach(node => { node.textContent = text; }); }
function icon(name) {
  const paths = { timeline: '<path d="M5 4v16M5 6h13l-4 4 4 4H5"/>', today: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M7 2v4m10-4v4M3 9h18"/>', matrix: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>', inbox: '<path d="M4 5h16v14H4zM4 14h5l2 3h2l2-3h5"/>', focus: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', report: '<path d="M5 20V10m7 10V4m7 16v-7M3 20h18"/>', me: '<circle cx="12" cy="8" r="3"/><path d="M5 21c1-4 3-6 7-6s6 2 7 6"/>' };
  return `<svg class="icon" viewBox="0 0 24 24">${paths[name] || paths.today}</svg>`;
}
const nav = (key, label) => `<button class="${tab === key ? "active" : ""}" data-tab="${key}">${icon(key)}<span>${label}</span></button>`;
function captureLoginDraft() {
  const username = document.getElementById("login-user");
  const password = document.getElementById("login-pass");
  if (username) loginDraft.username = username.value;
  if (password) loginDraft.password = password.value;
}
function queueRenderAfterEditing(force) {
  pendingRender = true;
  pendingRenderForce = pendingRenderForce || force;
  const active = document.activeElement;
  if (active && /^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName) && !active.dataset.siaRenderRelease) {
    active.dataset.siaRenderRelease = "1";
    active.addEventListener("blur", () => {
      delete active.dataset.siaRenderRelease;
      flushPendingRender();
    }, { once: true });
  }
}
function flushPendingRender() {
  if (!pendingRender || openSelectId) return;
  const force = pendingRenderForce;
  pendingRender = false;
  pendingRenderForce = false;
  render(force);
}
function render(force = false) {
  const root = document.getElementById("app");
  if (!root) return;
  captureLoginDraft();
  const active = document.activeElement;
  const editing = active && root.contains(active) && /^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName);
  if (openSelectId || editing) {
    queueRenderAfterEditing(force);
    return;
  }
  const activeId = active?.id || null;
  const selectionStart = typeof active?.selectionStart === "number" ? active.selectionStart : null;
  root.innerHTML = state.user ? appView() : loginView();
  bind();
  restoreFormDraft();
  const restoredFocusTarget = document.getElementById("focus-target");
  if (restoredFocusTarget) restoredFocusTarget.value = focusTargetId;
  const restoredFeedbackType = document.getElementById("feedback-type");
  if (restoredFeedbackType) restoredFeedbackType.value = feedbackType;
  const restoredFeedbackContactType = document.getElementById("feedback-contact-type");
  if (restoredFeedbackContactType) restoredFeedbackContactType.value = feedbackContactType;
  if (activeId) {
    const restored = document.getElementById(activeId);
    if (restored) {
      restored.focus({ preventScroll: true });
      if (selectionStart !== null && typeof restored.setSelectionRange === "function") restored.setSelectionRange(selectionStart, selectionStart);
    }
  }
}
function loginView() {
  return `<main class="login-page"><section class="login-box panel"><div class="brand">SIAWorkTable<small>目标、计划与专注 · 北京时间</small></div><h1>登录你的工作台</h1><p class="subtle">首次登录会自动注册。全部计划和记录按账号同步。</p><label class="field">用户名<input id="login-user" autocomplete="username" value="${esc(loginDraft.username)}" placeholder="3-40 位字母、数字、下划线"></label><label class="field">密码<input id="login-pass" type="password" autocomplete="current-password" value="${esc(loginDraft.password)}" placeholder="至少 8 位"></label><button class="btn primary full" id="login-btn">登录 / 注册</button><p id="login-msg" class="subtle">北京时间：${today}</p></section></main>`;
}
function appView() {
  const content = { timeline: timelineView, today: todayView, matrix: matrixView, inbox: inboxView, focus: focusView, report: reportView, me: meView }[tab]?.() || timelineView();
  const navigation = nav("timeline", "时间轴") + nav("today", "今日") + nav("matrix", "四象限") + nav("inbox", "收集箱") + nav("focus", "专注") + nav("report", "复盘") + nav("me", "我的");
  return `<div class="app"><aside class="sidebar"><div class="brand">SIAWorkTable<small>计划管理 v5</small></div><nav class="nav">${navigation}</nav><div class="account">${esc(state.user)}<br><span data-sync>${state.session ? "已连接云端" : "离线模式"}</span></div></aside><main class="main">${content}</main><nav class="mobile-nav">${navigation}</nav>${modal ? modalView() : ""}</div>`;
}
function header(title, subtitle, actions = true) {
  return `<header class="topbar"><div><h1>${title}</h1><p>${subtitle}</p></div>${actions ? '<div class="top-actions"><button class="btn ghost" id="new-goal">新建目标</button><button class="btn primary" id="new-todo">＋ 新建计划</button></div>' : ""}</header>`;
}
function rangeDates(mode) {
  const count = mode === "day" ? 1 : mode === "3day" ? 3 : mode === "week" ? 7 : 30;
  return Array.from({ length: count }, (_, index) => addDays(selectedDate, index));
}
function timelineView() {
  const mode = state.settings.timelineRange || "day";
  const dates = rangeDates(mode);
  return header("时间轴", `${selectedDate} 起 · 中国北京时间`) + `<div class="toolbar"><input id="selected-date" type="date" value="${selectedDate}"><div class="segmented">${[["day", "日"], ["3day", "3日"], ["week", "周"], ["month", "月"]].map(([key, label]) => `<button data-range="${key}" class="${mode === key ? "active" : ""}">${label}</button>`).join("")}</div></div><div class="timeline-board">${dates.map(dateColumn).join("")}</div>`;
}
function dateColumn(date) {
  const tasks = tasksFor(date).sort((a, b) => (a.startTime || "99:99").localeCompare(b.startTime || "99:99"));
  return `<section class="day-column"><div class="day-head"><b>${date === today ? "今天" : date.slice(5)}</b><span>${tasks.length} 项</span></div><div class="day-items">${tasks.map(target => compactTask(target, date)).join("") || '<div class="empty">暂无计划</div>'}</div></section>`;
}
function compactTask(target, date) {
  const isDone = isCompleteForDate(target, date);
  const deadline = deadlineState(target, date);
  return `<article class="compact-task ${isDone ? "done" : ""}" style="--accent:${target.color}"><button class="check ${isDone ? "checked" : ""}" data-complete="${target.id}" data-date="${date}" aria-label="${isDone ? "撤销完成" : "完成计划"}">${isDone ? "✓" : ""}</button><div class="compact-body"><div><b>${esc(target.name)}</b><span class="type-tag">${target.type === "goal" ? "目标" : "计划"}</span>${deadline ? `<span class="deadline-tag ${deadline === "逾期" ? "overdue" : ""}">${deadline}</span>` : ""}</div><small>${target.startTime || "未定时间"}${target.endTime ? ` - ${target.endTime}` : ""} · ${estimateMinutes(target) ? `${estimateMinutes(target)} 分钟 · ` : ""}${esc(categoryName(target))}</small>${target.type === "goal" ? `<div class="mini-progress"><i style="width:${goalPct(target)}%"></i></div><small>${fmt(goalDone(target))}/${fmt(target.total)}${esc(target.unit)} · 今日 ${fmt(target.daily)}${esc(target.unit)}</small>` : ""}</div><button class="icon-btn" data-edit="${target.id}" title="编辑">⋯</button></article>`;
}
function todayView() {
  const tasks = tasksFor(today);
  const doneCount = tasks.filter(item => isCompleteForDate(item, today)).length;
  const load = dayLoad(today);
  const capacity = capacityMinutes();
  const remaining = Math.max(0, capacity - load);
  const overdue = tasks.filter(item => deadlineState(item, today) === "逾期").length;
  const loadClass = load > capacity ? "over-capacity" : "";
  const replan = replanItems();
  const replanSection = replan.length ? `<section class="panel replan-panel"><div class="section-head"><div><h2>需要重新安排</h2><p>有 ${replan.length} 项历史计划未完成，请为它们选择下一步。</p></div><span class="warning-count">${replan.length}</span></div><div class="replan-list">${replan.map(replanRow).join("")}</div></section>` : "";
  return header("今日计划", `${today} · 已完成 ${doneCount}/${tasks.length}`) + `<div class="today-summary"><div><b>${tasks.length}</b><span>今日计划</span></div><div><b>${doneCount}</b><span>已完成</span></div><div class="${loadClass}"><b>${load}/${capacity}</b><span>计划分钟 / 容量</span></div><div><b>${state.focusLogs.filter(x => x.date === today).reduce((a, x) => a + x.minutes, 0)}</b><span>专注分钟</span></div></div>${load > capacity ? `<div class="capacity-alert"><b>今日计划超出容量 ${load - capacity} 分钟</b><span>建议把低优先级任务延后，避免从一开始就无法完成。</span></div>` : `<div class="capacity-ok">今日还可安排约 ${remaining} 分钟${overdue ? ` · ${overdue} 项已逾期` : ""}</div>`}${replanSection}<div class="task-list">${tasks.map(target => compactTask(target, today)).join("") || '<div class="empty">今天还没有计划。</div>'}</div><section class="panel note-panel"><h2>今日复盘</h2><textarea id="daily-note" placeholder="今天完成了什么？明天需要调整什么？">${esc(state.notes[today] || "")}</textarea><button class="btn ghost" id="save-note">保存复盘</button></section>`;
}
function replanRow(target) {
  const originalDate = target.date;
  return `<article class="replan-row"><div><b>${esc(target.name)}</b><small>原计划：${originalDate}${target.deadline ? ` · 截止：${target.deadline}` : ""}${target.type === "goal" ? " · 未完成目标" : " · 未完成"}</small></div><div class="row-actions"><button class="btn ghost small" data-replan="${target.id}" data-date="${today}">今天</button><button class="btn ghost small" data-replan="${target.id}" data-date="${addDays(today, 1)}">明天</button><button class="btn ghost small" data-replan="${target.id}" data-date="">收集箱</button></div></article>`;
}
function matrixView() {
  return header("四象限", "只展示已经安排日期的任务") + `<div class="quad-grid">${QUADRANTS.map(([key, label]) => `<section class="quad"><h2>${label}</h2>${state.targets.filter(item => item.date && item.quadrant === key).map(item => `<button class="matrix-item" data-edit="${item.id}" style="--accent:${item.color}">${esc(item.name)}<small>${esc(categoryName(item))} · ${item.date}</small></button>`).join("") || '<div class="empty">暂无任务</div>'}</section>`).join("")}</div>`;
}
function inboxView() {
  const items = state.targets.filter(item => !item.date);
  return header("收集箱", "先记录，准备好后再安排日期") + `<section class="panel"><div class="quick-add inbox-add"><input id="inbox-name" placeholder="快速记录一个想法或待办"><button class="btn primary" id="add-inbox">加入收集箱</button></div><div class="inbox-list">${items.map(item => `<article class="inbox-row"><span class="color-dot" style="background:${item.color}"></span><div><b>${esc(item.name)}</b><small>${esc(categoryName(item))} · 收集于 ${item.created || today}</small></div><div class="row-actions"><button class="btn ghost small" data-schedule="${item.id}" data-date="${today}">今天</button><button class="btn ghost small" data-schedule="${item.id}" data-date="${addDays(today, 1)}">明天</button><button class="btn ghost small" data-edit="${item.id}">自选日期</button></div></article>`).join("") || '<div class="empty">收集箱是空的。</div>'}</div></section>`;
}
function focusView() {
  const minutes = Math.floor(focusRemaining / 60).toString().padStart(2, "0");
  const seconds = (focusRemaining % 60).toString().padStart(2, "0");
  return header("专注计时", "专注记录会计入今日复盘", false) + `<section class="focus-panel panel"><div class="focus-clock">${minutes}:${seconds}</div><div class="segmented focus-presets">${[15, 25, 45, 60].map(value => `<button data-focus-minutes="${value}">${value} 分钟</button>`).join("")}</div><select id="focus-target"><option value="">不关联计划</option>${tasksFor(today).map(item => `<option value="${item.id}" ${focusTargetId === item.id ? "selected" : ""}>${esc(item.name)}</option>`).join("")}</select><div class="card-actions"><button class="btn primary" id="focus-toggle">${focusTimer ? "暂停" : "开始专注"}</button><button class="btn ghost" id="focus-reset">重置</button></div></section>`;
}
function reportView() {
  const start = addDays(today, -6);
  const weekLogs = state.logs.filter(log => log.date >= start && log.date <= today);
  const focus = state.focusLogs.filter(log => log.date >= start && log.date <= today);
  return header("复盘统计", `${start} 至 ${today}`, false) + `<div class="stats-grid"><div class="metric"><b>${weekLogs.filter(x => x.kind === "complete").length}</b><span>完成计划</span></div><div class="metric"><b>${fmt(weekLogs.reduce((a, x) => a + Number(x.amount || 0), 0))}</b><span>目标完成量</span></div><div class="metric"><b>${focus.reduce((a, x) => a + Number(x.minutes || 0), 0)}</b><span>专注分钟</span></div><div class="metric"><b>${new Set(weekLogs.map(x => x.date)).size}</b><span>活跃天数</span></div></div><section class="panel"><h2>最近 7 天</h2><div class="bar-chart">${rangeDates("week").map(date => { const count = state.logs.filter(x => x.date === date).length; return `<div><i style="height:${Math.max(8, count * 24)}px"></i><span>${date.slice(8)}</span></div>`; }).join("")}</div></section><section class="panel"><h2>每日笔记</h2>${Object.entries(state.notes).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7).map(([date, note]) => `<div class="note-entry"><b>${date}</b><p>${esc(note)}</p></div>`).join("") || '<div class="empty">暂无复盘笔记</div>'}</section>`;
}
function categoryManager() {
  return `<div class="category-list">${state.categories.map(category => `<div class="category-row"><input class="category-color-input" id="category-color-${category.id}" type="color" value="${category.color}"><input id="category-name-${category.id}" value="${esc(category.name)}" aria-label="分类名称"><button class="btn ghost small" data-category-save="${category.id}">保存</button><button class="icon-btn danger-text" data-category-delete="${category.id}" title="删除分类">×</button></div>`).join("")}</div><div class="quick-add category-add"><input id="category-color" class="category-color-input" type="color" value="${COLORS[state.categories.length % COLORS.length]}"><input id="category-name" placeholder="输入新分类名称"><button class="btn primary" id="add-category">添加分类</button></div><p class="subtle">删除分类不会删除计划，相关计划会转为“未分类”。</p>`;
}
function meView() {
  const changelog = [
    ["V1", "建立目标管理基础：目标、打卡、补记、连续天数与数据导入导出。"],
    ["V2", "接入账号体系与 Supabase 云同步，支持登录后跨设备保存工作区。"],
    ["V3", "升级为目标与普通计划双模型，加入重复规则、四象限、收集箱、专注计时与复盘统计。"],
    ["V4", "支持稳定 ID 自定义分类、计划颜色，以及基础信息、执行方式、高级设置三步编辑流程。"],
    ["V5", "加入预计用时、每日容量、硬截止、逾期提醒与 Replan 遗留任务重排。"]
  ];
  return header("我的", "账号、分类、奖励与数据", false) + `<div class="settings-grid"><section class="panel"><h2>账号同步</h2><p>${esc(state.user)} · <span data-sync>${state.session ? "已连接云端" : "离线模式"}</span></p><div class="card-actions"><button class="btn ghost" id="sync-now">立即同步</button><button class="btn ghost" id="export-json">导出 JSON</button><label class="btn ghost">导入 JSON<input id="import-json" type="file" accept="application/json" hidden></label><button class="btn danger" id="logout">退出登录</button></div></section><section class="panel category-panel"><div class="section-head"><div><h2>分类管理</h2><p>用名称和颜色区分不同领域</p></div></div>${categoryManager()}</section><section class="panel"><h2>积分与装扮</h2><p class="big-number">${state.rewards.points || 0} 分</p><p class="subtle">完成普通计划 +5 分，完成一次目标记录 +3 分。</p><div class="theme-row"><button data-theme="cold" class="theme cold">冷白紫</button><button data-theme="mint" class="theme mint">薄荷绿</button><button data-theme="sunset" class="theme sunset">夕阳橙</button></div></section><section class="panel"><h2>数据管理</h2><div class="card-actions"><button class="btn ghost" id="reset-examples">恢复示例</button><button class="btn danger" id="clear-all">清空数据</button></div></section><section class="panel changelog-panel"><div class="section-head"><div><h2>更新日志</h2><p>SIAWorkTable 从 V1 到 V5 的主要更新</p></div></div><div class="changelog-list">${changelog.map(([version, text]) => `<article class="changelog-row"><b>${version}</b><p>${text}</p></article>`).join("")}</div></section><section class="panel feedback-panel"><div class="section-head"><div><h2>意见反馈</h2><p>你的建议会写入 Supabase，帮助我们持续改进。</p></div></div><div class="form-grid"><label class="field">反馈类型<select id="feedback-type"><option value="功能建议">功能建议</option><option value="bug反馈">bug反馈</option><option value="其他">其他</option></select></label><label class="field">联系方式类型<select id="feedback-contact-type"><option value="">不填写</option><option value="手机号">手机号</option><option value="微信号">微信号</option><option value="QQ">QQ</option><option value="邮箱">邮箱</option></select></label><label class="field wide">联系方式<input id="feedback-contact" maxlength="100" placeholder="可选"></label><label class="field wide">具体反馈内容<textarea id="feedback-content" maxlength="500" placeholder="请描述你的建议、问题或其他反馈（最多 500 字）"></textarea><small class="feedback-count" id="feedback-count">0 / 500</small></label></div><div class="card-actions"><button class="btn primary" id="submit-feedback">提交反馈</button><span class="subtle" id="feedback-msg" aria-live="polite"></span></div></section></div>`;
}
function draftValue(id, fallback = "") { return formDraft && Object.prototype.hasOwnProperty.call(formDraft, id) ? formDraft[id] : fallback; }
function categoryOptions(selectedId) {
  return `<option value="">未分类</option>${state.categories.map(category => `<option value="${category.id}" ${selectedId === category.id ? "selected" : ""}>${esc(category.name)}</option>`).join("")}`;
}
function repeatFields(target) {
  const repeat = target.repeat || { mode: "none" };
  const mode = draftValue("f-repeat", repeat.mode || "none");
  let detail = "";
  if (mode === "weekly") detail = `<label class="field wide">星期（0 为周日，1-6 为周一至周六）<input id="f-weekdays" value="${esc(draftValue("f-weekdays", (repeat.days || []).join(",")))}" placeholder="例如：1,3,5"></label>`;
  if (mode === "monthly") detail = `<label class="field">每月几号<input id="f-monthday" type="number" min="1" max="31" value="${esc(draftValue("f-monthday", repeat.monthDay || 1))}"></label>`;
  if (mode === "interval") detail = `<label class="field">间隔天数<input id="f-interval" type="number" min="1" value="${esc(draftValue("f-interval", repeat.interval || 2))}"></label>`;
  return `<label class="field wide">重复规则<select id="f-repeat"><option value="none" ${mode === "none" ? "selected" : ""}>不重复</option><option value="daily" ${mode === "daily" ? "selected" : ""}>每天</option><option value="weekdays" ${mode === "weekdays" ? "selected" : ""}>工作日</option><option value="weekly" ${mode === "weekly" ? "selected" : ""}>指定星期</option><option value="monthly" ${mode === "monthly" ? "selected" : ""}>每月日期</option><option value="interval" ${mode === "interval" ? "selected" : ""}>自定义间隔</option></select></label>${detail}`;
}
function editorStep(target, step) {
  const type = draftValue("f-type", target.type || "todo");
  const selectedCategory = draftValue("f-category", target.categoryId || "");
  if (step === 1) {
    const initialDate = target.id ? (target.date || "") : (target.date ?? today);
    const chosenDate = draftValue("f-date", initialDate);
    return `<div class="form-grid"><label class="field wide">计划名称<input id="f-name" value="${esc(draftValue("f-name", target.name || ""))}" placeholder="例如：完成产品需求文档" autofocus></label><label class="field wide">计划类型<select id="f-type"><option value="todo" ${type === "todo" ? "selected" : ""}>每日计划 / 待办</option><option value="goal" ${type === "goal" ? "selected" : ""}>可累计的总量目标</option></select><small>普通计划可以点击完成；总量目标用于累计页数、次数或时长。</small></label><label class="field wide">分类<div class="inline-select"><select id="f-category">${categoryOptions(selectedCategory)}</select><button type="button" class="btn ghost" id="toggle-inline-category">新建分类</button></div></label><div class="inline-category ${modal.showCategoryCreator ? "show" : ""}"><input id="f-new-category-color" class="category-color-input" type="color" value="${COLORS[state.categories.length % COLORS.length]}"><input id="f-new-category" placeholder="分类名称"><button type="button" class="btn primary" id="add-category-inline">创建并选中</button></div><div class="field wide"><span>安排日期</span><div class="date-shortcuts"><button type="button" class="choice ${chosenDate === today ? "active" : ""}" data-date-choice="${today}">今天</button><button type="button" class="choice ${chosenDate === addDays(today, 1) ? "active" : ""}" data-date-choice="${addDays(today, 1)}">明天</button><button type="button" class="choice ${!chosenDate ? "active" : ""}" data-date-choice="">放入收集箱</button></div><input id="f-date" type="date" value="${esc(chosenDate)}"></div></div>`;
  }
  if (step === 2 && type === "goal") {
    return `<div class="step-intro"><b>设置目标节奏</b><span>只填写和总量目标有关的内容</span></div><div class="form-grid"><label class="field">目标总量<input id="f-total" type="number" min="1" value="${esc(draftValue("f-total", target.total || ""))}" placeholder="例如：2000"></label><label class="field">单位<input id="f-unit" value="${esc(draftValue("f-unit", target.unit || "次"))}" placeholder="个、页、分钟"></label><label class="field">每日计划量<input id="f-daily" type="number" min="1" value="${esc(draftValue("f-daily", target.daily || 1))}"></label><label class="field">硬截止日期<input id="f-deadline" type="date" value="${esc(draftValue("f-deadline", target.deadline || target.due || target.date || today))}"></label><label class="field">预计用时（分钟）<input id="f-estimate" type="number" min="0" step="5" value="${esc(draftValue("f-estimate", target.estimateMinutes || ""))}" placeholder="例如：30"></label><label class="field">开始时间<input id="f-start" type="time" value="${esc(draftValue("f-start", target.startTime || ""))}"></label><label class="field">结束时间<input id="f-end" type="time" value="${esc(draftValue("f-end", target.endTime || ""))}"></label>${repeatFields(target)}<input id="f-completion" type="hidden" value="detail"></div>`;
  }
  if (step === 2) {
    return `<div class="step-intro"><b>设置执行方式</b><span>不确定时保持默认即可</span></div><div class="form-grid"><label class="field">预计用时（分钟）<input id="f-estimate" type="number" min="0" step="5" value="${esc(draftValue("f-estimate", target.estimateMinutes || ""))}" placeholder="例如：30"></label><label class="field">硬截止日期<input id="f-deadline" type="date" value="${esc(draftValue("f-deadline", target.deadline || ""))}"></label><label class="field">开始时间<input id="f-start" type="time" value="${esc(draftValue("f-start", target.startTime || ""))}"></label><label class="field">结束时间<input id="f-end" type="time" value="${esc(draftValue("f-end", target.endTime || ""))}"></label><label class="field wide">完成方式<select id="f-completion"><option value="quick" ${draftValue("f-completion", target.completionMode || "quick") === "quick" ? "selected" : ""}>点击即完成</option><option value="detail" ${draftValue("f-completion", target.completionMode || "quick") === "detail" ? "selected" : ""}>完成时填写分钟与备注</option></select></label>${repeatFields(target)}<input id="f-total" type="hidden" value=""><input id="f-unit" type="hidden" value="次"><input id="f-daily" type="hidden" value="1"></div>`;
  }
  return `<div class="step-intro"><b>高级设置</b><span>用于排序、辨识和补充说明</span></div><div class="form-grid"><label class="field">每日可用容量（分钟）<input id="f-capacity" type="number" min="0" step="15" value="${esc(draftValue("f-capacity", state.settings.dailyCapacityMinutes || 480))}"></label><label class="field">硬截止提醒<select id="f-deadline-alert"><option value="2" ${String(draftValue("f-deadline-alert", state.settings.deadlineAlertDays ?? 2)) === "2" ? "selected" : ""}>提前 2 天</option><option value="1" ${String(draftValue("f-deadline-alert", state.settings.deadlineAlertDays ?? 2)) === "1" ? "selected" : ""}>提前 1 天</option><option value="0" ${String(draftValue("f-deadline-alert", state.settings.deadlineAlertDays ?? 2)) === "0" ? "selected" : ""}>只提醒当天</option></select></label><label class="field wide">四象限<select id="f-quadrant">${QUADRANTS.map(([value, label]) => `<option value="${value}" ${draftValue("f-quadrant", target.quadrant || "important-not-urgent") === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><div class="field wide"><span>计划颜色</span><div class="color-picker">${COLORS.map(color => `<button type="button" class="color-swatch ${draftValue("f-color", target.color || COLORS[0]) === color ? "selected" : ""}" data-color="${color}" style="--swatch:${color}" aria-label="选择颜色 ${color}"></button>`).join("")}</div><input id="f-color" type="hidden" value="${esc(draftValue("f-color", target.color || COLORS[0]))}"></div><label class="field wide">备注<textarea id="f-note" placeholder="补充资料、执行标准或提醒">${esc(draftValue("f-note", target.note || ""))}</textarea></label></div>`;
}
function modalView() {
  if (modal.type === "edit") {
    const target = modal.target || { type: modal.taskType || "todo", color: COLORS[0], quadrant: "important-not-urgent", categoryId: state.categories[0]?.id || null, completionMode: "quick", repeat: { mode: "none" }, date: today };
    const step = modal.step || 1;
    return `<div class="modal"><section class="modal-card editor-card"><div class="modal-head"><div><h2>${target.id ? "编辑" : "新建"}${draftValue("f-type", target.type) === "goal" ? "目标" : "计划"}</h2><p>第 ${step} 步，共 3 步</p></div><button type="button" class="icon-btn" id="close-modal" aria-label="关闭">×</button></div><div class="stepper">${[1, 2, 3].map(number => `<span class="${number <= step ? "active" : ""}"><i>${number}</i>${["基础信息", "执行方式", "高级设置"][number - 1]}</span>`).join("")}</div><div class="editor-body">${editorStep(target, step)}</div><div class="modal-actions">${target.id && step === 1 ? '<button type="button" class="btn danger" id="delete-target">删除</button>' : '<span></span>'}<div>${step > 1 ? '<button type="button" class="btn ghost" id="editor-prev">上一步</button>' : ""}${step < 3 ? '<button type="button" class="btn primary" id="editor-next">下一步</button>' : '<button type="button" class="btn primary" id="save-target">保存计划</button>'}</div></div></section></div>`;
  }
  if (modal.type === "complete") {
    const target = modal.target;
    return `<div class="modal"><section class="modal-card small-modal"><div class="modal-head"><h2>记录完成</h2><button type="button" class="icon-btn" id="close-modal">×</button></div>${target.type === "goal" ? `<label class="field">完成数量<input id="c-amount" type="number" min="1" value="${target.daily || 1}"></label>` : '<input id="c-amount" type="hidden" value="1">'}<label class="field">投入分钟<input id="c-minutes" type="number" min="0" value=""></label><label class="field">备注<textarea id="c-note"></textarea></label><button class="btn primary full" id="save-complete">确认完成</button></section></div>`;
  }
  return "";
}
function bind() {
  document.querySelectorAll("[data-tab]").forEach(button => button.onclick = () => { tab = button.dataset.tab; render(true); });
  document.querySelectorAll("#new-todo").forEach(button => button.onclick = () => openEditor(null, "todo"));
  document.querySelectorAll("#new-goal").forEach(button => button.onclick = () => openEditor(null, "goal"));
  document.querySelectorAll("[data-edit]").forEach(button => button.onclick = () => openEditor(button.dataset.edit));
  document.querySelectorAll("[data-complete]").forEach(button => button.onclick = () => toggleComplete(button.dataset.complete, button.dataset.date));
  document.querySelectorAll("[data-schedule]").forEach(button => button.onclick = () => scheduleTarget(button.dataset.schedule, button.dataset.date));
  document.querySelectorAll("[data-replan]").forEach(button => button.onclick = () => replanTarget(button.dataset.replan, button.dataset.date));
  document.querySelector(".modal-card")?.addEventListener("click", event => event.stopPropagation());
  document.getElementById("close-modal")?.addEventListener("click", () => { modal = null; formDraft = null; render(true); });
  document.getElementById("editor-next")?.addEventListener("click", nextEditorStep);
  document.getElementById("editor-prev")?.addEventListener("click", () => { captureFormDraft(); modal.step = Math.max(1, modal.step - 1); render(true); });
  document.getElementById("save-target")?.addEventListener("click", saveTarget);
  document.getElementById("delete-target")?.addEventListener("click", deleteTarget);
  document.getElementById("save-complete")?.addEventListener("click", saveCompletion);
  document.getElementById("login-user")?.addEventListener("input", captureLoginDraft);
  document.getElementById("login-pass")?.addEventListener("input", captureLoginDraft);
  document.getElementById("login-btn")?.addEventListener("click", event => { event.preventDefault(); captureLoginDraft(); handleLogin(); });
  document.getElementById("selected-date")?.addEventListener("change", event => { selectedDate = event.target.value; render(true); });
  document.querySelectorAll("[data-range]").forEach(button => button.onclick = () => { state.settings.timelineRange = button.dataset.range; saveLocal(); render(true); });
  document.querySelectorAll("[data-color]").forEach(button => button.onclick = event => { event.preventDefault(); event.stopPropagation(); document.getElementById("f-color").value = button.dataset.color; captureFormDraft(); document.querySelectorAll("[data-color]").forEach(x => x.classList.toggle("selected", x === button)); });
  document.querySelectorAll("[data-date-choice]").forEach(button => button.onclick = () => { document.getElementById("f-date").value = button.dataset.dateChoice; captureFormDraft(); render(true); });
  document.querySelectorAll(".modal-card input,.modal-card select,.modal-card textarea").forEach(control => { control.addEventListener("click", event => event.stopPropagation()); control.addEventListener("input", captureFormDraft); control.addEventListener("change", event => { captureFormDraft(); if (event.target.id === "f-repeat") render(true); }); });
  document.getElementById("toggle-inline-category")?.addEventListener("click", () => { captureFormDraft(); modal.showCategoryCreator = !modal.showCategoryCreator; render(true); });
  document.getElementById("add-category-inline")?.addEventListener("click", addCategoryInline);
  document.getElementById("save-note")?.addEventListener("click", async () => { state.notes[today] = document.getElementById("daily-note").value.trim(); await sync(); render(true); });
  document.getElementById("add-inbox")?.addEventListener("click", addInbox);
  document.getElementById("add-category")?.addEventListener("click", addCategory);
  document.querySelectorAll("[data-category-save]").forEach(button => button.onclick = () => updateCategory(button.dataset.categorySave));
  document.querySelectorAll("[data-category-delete]").forEach(button => button.onclick = () => deleteCategory(button.dataset.categoryDelete));
  document.getElementById("sync-now")?.addEventListener("click", sync);
  document.getElementById("logout")?.addEventListener("click", async () => { try { await cloud("logout"); } catch {} state.user = null; state.session = null; saveLocal(); render(true); });
  document.getElementById("export-json")?.addEventListener("click", exportJson);
  document.getElementById("import-json")?.addEventListener("change", importJson);
  const feedbackContent = document.getElementById("feedback-content");
  feedbackContent?.addEventListener("input", event => { document.getElementById("feedback-count").textContent = `${event.target.value.length} / 500`; });
  document.getElementById("submit-feedback")?.addEventListener("click", submitFeedback);
  document.querySelectorAll("#focus-target,#feedback-type,#feedback-contact-type").forEach(control => {
    const holdSelect = () => { openSelectId = control.id; clearTimeout(openSelectTimer); };
    const releaseSelect = () => { clearTimeout(openSelectTimer); openSelectTimer = setTimeout(() => { if (document.activeElement !== control) { openSelectId = ""; flushPendingRender(); } }, 0); };
    control.addEventListener("pointerdown", holdSelect, { passive: true });
    control.addEventListener("mousedown", holdSelect);
    control.addEventListener("focus", holdSelect);
    control.addEventListener("blur", releaseSelect);
    control.addEventListener("change", event => {
      if (event.target.id === "focus-target") focusTargetId = event.target.value;
      if (event.target.id === "feedback-type") feedbackType = event.target.value;
      if (event.target.id === "feedback-contact-type") feedbackContactType = event.target.value;
      openSelectId = "";
      flushPendingRender();
    });
  });
  document.getElementById("reset-examples")?.addEventListener("click", async () => { if (confirm("恢复示例会覆盖当前业务数据，确认？")) { const user = state.user, session = state.session; state = { ...examples(), user, session }; await sync(); render(true); } });
  document.getElementById("clear-all")?.addEventListener("click", async () => { if (prompt("请输入“清空”确认") === "清空") { const user = state.user, session = state.session; state = { ...blank(), user, session }; await sync(); render(true); } });
  document.querySelectorAll("[data-focus-minutes]").forEach(button => button.onclick = () => { stopFocus(); focusRemaining = Number(button.dataset.focusMinutes) * 60; render(true); });
  document.getElementById("focus-toggle")?.addEventListener("click", toggleFocus);
  document.getElementById("focus-reset")?.addEventListener("click", () => { stopFocus(); focusRemaining = 25 * 60; render(true); });
  document.querySelectorAll("[data-theme]").forEach(button => button.onclick = () => { state.settings.theme = button.dataset.theme; document.documentElement.dataset.theme = button.dataset.theme; sync(); render(true); });
}
function captureFormDraft() {
  if (modal?.type !== "edit") return;
  formDraft ||= {};
  document.querySelectorAll(".modal-card input,.modal-card select,.modal-card textarea").forEach(control => { if (control.id && !control.id.startsWith("f-new-category")) formDraft[control.id] = control.value; });
}
function restoreFormDraft() {
  if (!formDraft || modal?.type !== "edit") return;
  Object.entries(formDraft).forEach(([id, value]) => { const control = document.getElementById(id); if (control) control.value = value; });
}
function openEditor(id, taskType) { formDraft = null; modal = { type: "edit", target: id ? { ...targetById(id) } : null, taskType, step: 1, showCategoryCreator: false }; render(true); }
function validateEditorStep() {
  if (modal.step === 1 && !String(document.getElementById("f-name")?.value || formDraft?.["f-name"] || "").trim()) { alert("请先填写计划名称"); return false; }
  if (modal.step === 2 && draftValue("f-type", modal.target?.type || modal.taskType) === "goal" && Number(document.getElementById("f-total")?.value || formDraft?.["f-total"] || 0) <= 0) { alert("请填写大于 0 的目标总量"); return false; }
  return true;
}
function nextEditorStep() { captureFormDraft(); if (!validateEditorStep()) return; modal.step = Math.min(3, modal.step + 1); render(true); }
async function addCategoryInline() {
  captureFormDraft();
  const name = document.getElementById("f-new-category").value.trim();
  const color = document.getElementById("f-new-category-color").value;
  if (!name) return alert("请输入分类名称");
  if (state.categories.some(item => item.name === name)) return alert("分类名称已存在");
  const category = { id: `cat-${uid()}`, name, color, builtin: false, createdAt: new Date().toISOString() };
  state.categories.push(category);
  formDraft["f-category"] = category.id;
  modal.showCategoryCreator = false;
  await sync();
  render(true);
}
async function addCategory() {
  const input = document.getElementById("category-name");
  const name = input.value.trim();
  if (!name) return alert("请输入分类名称");
  if (state.categories.some(item => item.name === name)) return alert("分类名称已存在");
  state.categories.push({ id: `cat-${uid()}`, name, color: document.getElementById("category-color").value, builtin: false, createdAt: new Date().toISOString() });
  await sync();
  render(true);
}
async function updateCategory(id) {
  const category = categoryById(id);
  const name = document.getElementById(`category-name-${id}`).value.trim();
  if (!category || !name) return alert("分类名称不能为空");
  if (state.categories.some(item => item.id !== id && item.name === name)) return alert("分类名称已存在");
  category.name = name;
  category.color = document.getElementById(`category-color-${id}`).value;
  await sync();
  render(true);
}
async function deleteCategory(id) {
  const category = categoryById(id);
  if (!category || !confirm(`删除分类“${category.name}”？相关计划会转为未分类。`)) return;
  state.categories = state.categories.filter(item => item.id !== id);
  state.targets.forEach(target => { if (target.categoryId === id) { target.categoryId = null; target.category = "未分类"; } });
  await sync();
  render(true);
}
async function scheduleTarget(id, date) {
  const target = targetById(id);
  if (!target) return;
  target.date = date;
  if (target.type === "goal" && (!target.due || target.due < date)) { target.due = date; target.deadline = target.deadline || date; }
  await sync();
  render(true);
}
async function replanTarget(id, date) {
  const target = targetById(id);
  if (!target) return;
  target.date = date || null;
  if (target.type === "goal" && date && (!target.due || target.due < date)) target.due = date;
  await sync();
  render(true);
}
async function toggleComplete(id, date) {
  const target = targetById(id);
  if (!target) return;
  if (target.type === "goal" || target.completionMode === "detail") { modal = { type: "complete", target, date }; render(true); return; }
  const existing = completion(id, date);
  if (existing) { state.logs = state.logs.filter(log => log.id !== existing.id); state.rewards.points = Math.max(0, (state.rewards.points || 0) - 5); }
  else { state.logs.push({ id: uid(), targetId: id, date, kind: "complete", amount: 1, minutes: null }); state.rewards.points = (state.rewards.points || 0) + 5; }
  await sync(); render(true);
}
async function saveCompletion() {
  const amount = Number(document.getElementById("c-amount").value || 1);
  const minutes = Number(document.getElementById("c-minutes").value || 0) || null;
  const note = document.getElementById("c-note").value.trim();
  state.logs.push({ id: uid(), targetId: modal.target.id, date: modal.date || today, kind: modal.target.type === "goal" ? "progress" : "complete", amount, minutes, note });
  state.rewards.points = (state.rewards.points || 0) + (modal.target.type === "goal" ? 3 : 5);
  modal = null; await sync(); render(true);
}
async function saveTarget() {
  captureFormDraft();
  const id = modal.target?.id;
  const type = draftValue("f-type", modal.target?.type || modal.taskType || "todo");
  const name = String(draftValue("f-name", "")).trim();
  if (!name) return alert("请填写名称");
  const repeatMode = draftValue("f-repeat", "none");
  state.settings.dailyCapacityMinutes = Math.max(0, Number(draftValue("f-capacity", state.settings.dailyCapacityMinutes || 480)) || 0);
  state.settings.deadlineAlertDays = Math.max(0, Number(draftValue("f-deadline-alert", state.settings.deadlineAlertDays ?? 2)) || 0);
  const target = {
    ...(modal.target || {}), id: id || uid(), type, name,
    categoryId: draftValue("f-category", "") || null,
    date: draftValue("f-date", "") || null,
    due: type === "goal" ? (draftValue("f-deadline", modal.target?.due || modal.target?.deadline || "") || null) : (modal.target?.due || null),
    deadline: draftValue("f-deadline", modal.target?.deadline || modal.target?.due || "") || null,
    estimateMinutes: Number(draftValue("f-estimate", 0) || 0) || null,
    startTime: draftValue("f-start", ""), endTime: draftValue("f-end", ""),
    completionMode: type === "goal" ? "detail" : draftValue("f-completion", "quick"),
    quadrant: draftValue("f-quadrant", "important-not-urgent"),
    total: type === "goal" ? Number(draftValue("f-total", 1) || 1) : null,
    unit: type === "goal" ? String(draftValue("f-unit", "次")).trim() || "次" : "次",
    daily: type === "goal" ? Number(draftValue("f-daily", 1) || 1) : 1,
    color: draftValue("f-color", COLORS[0]), note: String(draftValue("f-note", "")).trim(),
    repeat: { mode: repeatMode, days: String(draftValue("f-weekdays", "")).split(",").map(Number).filter(value => value >= 0 && value <= 6), monthDay: Number(draftValue("f-monthday", 1) || 1), interval: Number(draftValue("f-interval", 2) || 2) },
    created: modal.target?.created || today
  };
  delete target.category;
  if (id) Object.assign(targetById(id), target); else state.targets.push(target);
  modal = null; formDraft = null; await sync(); render(true);
}
async function deleteTarget() {
  const id = modal.target.id;
  if (!confirm("确认删除任务及其记录？")) return;
  state.targets = state.targets.filter(item => item.id !== id);
  state.subtasks = state.subtasks.filter(item => item.targetId !== id);
  state.logs = state.logs.filter(item => item.targetId !== id);
  state.plans = state.plans.filter(item => item.targetId !== id);
  modal = null; formDraft = null; await sync(); render(true);
}
async function addInbox() {
  const input = document.getElementById("inbox-name");
  const name = input.value.trim();
  if (!name) return;
  state.targets.push({ id: uid(), type: "todo", name, date: null, due: null, deadline: null, estimateMinutes: null, color: COLORS[0], quadrant: "important-not-urgent", categoryId: state.categories[0]?.id || null, completionMode: "quick", repeat: { mode: "none" }, created: today });
  await sync(); render(true);
}
function toggleFocus() {
  if (focusTimer) { stopFocus(); render(true); return; }
  focusTimer = setInterval(() => { focusRemaining -= 1; const clock = document.querySelector(".focus-clock"); if (clock) clock.textContent = `${Math.floor(focusRemaining / 60).toString().padStart(2, "0")}:${(focusRemaining % 60).toString().padStart(2, "0")}`; if (focusRemaining <= 0) finishFocus(); }, 1000);
  render(true);
}
function stopFocus() { if (focusTimer) clearInterval(focusTimer); focusTimer = null; }
async function finishFocus() { stopFocus(); const select = document.getElementById("focus-target"); focusTargetId = select?.value || focusTargetId || ""; state.focusLogs.push({ id: uid(), targetId: focusTargetId || null, date: today, minutes: 25 }); focusRemaining = 25 * 60; await sync(); render(true); }
async function handleLogin() {
  const username = document.getElementById("login-user").value.trim();
  const password = document.getElementById("login-pass").value;
  const message = document.getElementById("login-msg");
  if (!/^[A-Za-z0-9_-]{3,40}$/.test(username) || password.length < 8) { message.textContent = "用户名需为 3-40 位字母、数字或下划线，密码至少 8 位。"; return; }
  message.textContent = "正在连接 Supabase…";
  try {
    const response = await fetch(`${CONFIG.url}/functions/v1/${CONFIG.fn}`, { method: "POST", headers: { "Content-Type": "application/json", apikey: CONFIG.key, Authorization: `Bearer ${CONFIG.key}` }, body: JSON.stringify({ username, password, action: "register" }) });
    const raw = await response.text(); let output = {}; try { output = JSON.parse(raw); } catch {}
    if (!response.ok) throw new Error(`HTTP ${response.status}：${output.detail || output.error || raw}`);
    const localUser = output.username || username, token = output.token;
    const cloudPayload = output.payload;
    const hasCloudData = cloudPayload && ((cloudPayload.targets?.length || 0) + (cloudPayload.logs?.length || 0) + (cloudPayload.plans?.length || 0) > 0);
    state = migrate(hasCloudData ? cloudPayload : state);
    state.user = localUser; state.session = token; loginDraft = { username: "", password: "" }; saveLocal(); render(true);
  } catch (error) { captureLoginDraft(); message.textContent = `登录失败：${error.message}`; }
}
async function submitFeedback() {
  const button = document.getElementById("submit-feedback");
  const message = document.getElementById("feedback-msg");
  const content = document.getElementById("feedback-content")?.value.trim() || "";
  if (!content) { message.textContent = "请填写具体反馈内容。"; return; }
  if (content.length > 500) { message.textContent = "反馈内容不能超过 500 字。"; return; }
  button.disabled = true;
  message.textContent = "正在提交…";
  try {
    await cloud("feedback", { feedbackType: document.getElementById("feedback-type").value, contactType: document.getElementById("feedback-contact-type").value, contact: document.getElementById("feedback-contact").value.trim(), content });
    document.getElementById("feedback-content").value = "";
    document.getElementById("feedback-contact").value = "";
    document.getElementById("feedback-count").textContent = "0 / 500";
    message.textContent = "感谢反馈，已提交。";
  } catch (error) { message.textContent = `提交失败：${error.message}`; }
  button.disabled = false;
}
function exportJson() { const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" })); link.download = `siaworktable-${today}.json`; link.click(); URL.revokeObjectURL(link.href); }
function importJson(event) { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async () => { try { const imported = migrate(JSON.parse(reader.result)); const user = state.user, session = state.session; state = { ...imported, user, session }; await sync(); render(true); } catch { alert("JSON 格式不正确"); } }; reader.readAsText(file); }
function boot() {
  if (window.__SIA_WORKTABLE_STARTED__) return;
  window.__SIA_WORKTABLE_STARTED__ = true;
  try {
    document.documentElement.dataset.theme = state.settings.theme || "cold";
    render();
  } catch (error) {
    window.__SIA_WORKTABLE_STARTED__ = false;
    const root = document.getElementById("app");
    if (root) root.innerHTML = `<main class="login-page"><section class="panel"><h1>SIAWorkTable 启动失败</h1><p>${esc(error.message || error)}</p><button type="button" class="btn primary" onclick="try{localStorage.removeItem('siaworktable-data')}catch{};location.reload()">清除本地缓存并重试</button></section></main>`;
    console.error(error);
  }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
