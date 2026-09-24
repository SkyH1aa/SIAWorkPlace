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
const ACCOUNT_KEY = "siaworktable-account";
const BACKUP_PREFIX = "siaworktable-backups-";
const MAX_BACKUPS = 12;
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
const parseDateText = (year, month, day) => { const date = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00+08:00`); return Number.isNaN(date.getTime()) ? null : dateKey(date); };
const CN_NUMBERS = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12, 十三: 13, 十四: 14, 十五: 15, 十六: 16, 十七: 17, 十八: 18, 十九: 19, 二十: 20, 二十一: 21, 二十二: 22, 二十三: 23, 二十四: 24, 二十五: 25, 二十六: 26, 二十七: 27, 二十八: 28, 二十九: 29, 三十: 30, 三十一: 31 };
function chineseNumber(value) { const text = String(value || "").trim(); if (/^\d+$/.test(text)) return Number(text); if (CN_NUMBERS[text] !== undefined) return CN_NUMBERS[text]; if (text.startsWith("二十")) return 20 + (CN_NUMBERS[text.slice(2)] || 0); if (text.startsWith("十")) return 10 + (CN_NUMBERS[text.slice(1)] || 0); return null; }
function nextWeekday(day, nextWeek = false) { const current = new Date(`${today}T12:00:00+08:00`); const offset = (day - current.getDay() + 7) % 7 || 7; return addDays(today, offset + (nextWeek ? 7 : 0)); }
function parseNaturalDate(text) {
  const source = String(text || "");
  if (/大后天/.test(source)) return addDays(today, 3);
  if (/后天/.test(source)) return addDays(today, 2);
  if (/明天/.test(source)) return addDays(today, 1);
  if (/今天|今日/.test(source)) return today;
  if (/下周末/.test(source)) return nextWeekday(6, true);
  if (/周末|星期六|星期日|礼拜六|礼拜日/.test(source)) return nextWeekday(/日|天/.test(source) ? 0 : 6);
  const dotted = source.match(/(?:(\d{4})[年.\/-])?(\d{1,2})[.\/-](\d{1,2})/);
  if (dotted) return parseDateText(Number(dotted[1] || today.slice(0, 4)), Number(dotted[2]), Number(dotted[3]));
  const absolute = source.match(/(?:(\d{4})年)?(\d{1,2})月(\d{1,2})日?/);
  if (absolute) return parseDateText(Number(absolute[1] || today.slice(0, 4)), Number(absolute[2]), Number(absolute[3]));
  const week = source.match(/(?:本周|这周|下周|下星期|下礼拜)?[一二三四五六日天]|(?:周|星期|礼拜)([1-7])/);
  if (week) { const token = week[0]; const digit = week[1] ? Number(week[1]) : ({ 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 0, 天: 0 }[token.slice(-1)]); return nextWeekday(digit, /下周|下星期|下礼拜/.test(token)); }
  return null;
}
function parseNaturalTime(text) {
  const source = String(text || "");
  const match = source.match(/(上午|早上|中午|下午|晚上|今晚|凌晨)?\s*(\d{1,2}|[一二三四五六七八九十]{1,3})(?:(?:点|时)(半|一刻|一刻钟|过\s*(?:[一二三四五六七八九十两零\d]{1,3})\s*(?:分钟?|分)?|差\s*(?:[一二三四五六七八九十两零\d]{1,3})\s*(?:分钟?|分)?|(?:(\d{1,2})分?)?)|[.:](\d{1,2}))/);
  if (!match) return null;
  let hour = chineseNumber(match[2]); if (!Number.isFinite(hour)) return null;
  const modifier = String(match[3] || "").replace(/\s+/g, "");
  const normalMinute = match[4] ? Number(match[4]) : (match[5] ? Number(match[5]) : null);
  let minute = normalMinute ?? 0;
  let addHour = 0;
  if (modifier === "半") minute = 30;
  else if (modifier === "一刻" || modifier === "一刻钟") minute = 15;
  else if (modifier.startsWith("过")) minute = chineseNumber(modifier.replace(/^过/, "").replace(/分钟?$/, ""));
  else if (modifier.startsWith("差")) {
    const gap = chineseNumber(modifier.replace(/^差/, "").replace(/分$/, ""));
    if (!Number.isFinite(gap)) return null;
    minute = 60 - gap;
  }
  if (!Number.isFinite(minute) || minute < 0 || minute > 59) return null;
  if (/下午|晚上|今晚/.test(match[1] || "") && hour < 12) hour += 12;
  if (/中午/.test(match[1] || "") && hour < 11) hour += 12;
  if (/凌晨/.test(match[1] || "") && hour === 12) hour = 0;
  hour = (hour + addHour) % 24;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
function parseNaturalDuration(text) {
  const source = String(text || "");
  const hour = source.match(/(?:预计|用时|需要|耗时)?\s*(\d+(?:\.\d+)?)\s*小时/);
  const minute = source.match(/(?:预计|用时|需要|耗时)?\s*(\d+)\s*分钟/);
  const halfHour = /半小时/.test(source);
  const hours = hour ? Number(hour[1]) * 60 : 0;
  const minutes = minute ? Number(minute[1]) : 0;
  return halfHour ? 30 : (hours + minutes > 0 ? Math.round(hours + minutes) : null);
}
function parseNaturalInput(input) {
  const source = String(input || "").trim();
  const datePattern = "(?:今天|今日|明天|后天|大后天|下周末|周末|本周末|本周[一二三四五六日天]|这周[一二三四五六日天]|下周[一二三四五六日天]|下星期[一二三四五六日天]|周[一二三四五六日天]|星期[一二三四五六日天]|\\d{1,4}[年.\\/-]\\d{1,2}[月.\\/-]\\d{1,2}日?|\\d{1,2}[月.\\/-]\\d{1,2}日?)";
  const deadlineMatch = source.match(new RegExp("(?:截止|截至|最晚|不晚于)(?:日期)?\\s*(" + datePattern + ")")) || source.match(new RegExp("(" + datePattern + ")\\s*(?:之前|前)"));
  const deadline = deadlineMatch ? parseNaturalDate(deadlineMatch[1]) : null;
  const deadlinePhrase = deadlineMatch ? deadlineMatch[0] : "";
  const datePhrase = source.match(new RegExp(datePattern));
  const dateText = datePhrase ? datePhrase[0] : "";
  const date = parseNaturalDate(source.replace(deadlinePhrase, ""));
  const timeSource = source.replace(deadlinePhrase, "").replace(dateText, "");
  const startTime = parseNaturalTime(timeSource);
  const estimateMinutes = parseNaturalDuration(source);
  let name = source.replace(new RegExp("(?:截止|截至|最晚|不晚于)(?:日期)?\\s*" + datePattern, "g"), "").replace(new RegExp(datePattern + "\\s*(?:之前|前)", "g"), "").replace(/(?:(?:预计|用时|需要|耗时)\s*)?\d+(?:\.\d+)?\s*(?:小时|分钟)/g, "").replace(/半小时/g, "").replace(/(?:上午|早上|中午|下午|晚上|今晚|凌晨)?\s*(?:\d{1,2}|[一二三四五六七八九十]{1,3})(?:(?:点|时)(?:半|一刻钟?|过\s*(?:[一二三四五六七八九十两零\d]{1,3})\s*(?:分钟?|分)?|差\s*(?:[一二三四五六七八九十两零\d]{1,3})\s*(?:分钟?|分)?|\d{1,2}分?)?|[.:]\d{1,2})/g, "").replace(new RegExp(datePattern, "g"), "").replace(/[，,。；;]+/g, " ").replace(/^(处理|安排|开始)\s*/g, "").replace(/\s+/g, " ").trim();
  return { raw: source, name: name || source, date, startTime, estimateMinutes, deadline, deadlineOnly: Boolean(deadline && !date) };
}
const fmt = value => new Intl.NumberFormat("zh-CN").format(Math.round(Number(value) || 0));
const freshCategories = () => DEFAULT_CATEGORIES.map(item => ({ ...item }));
const BUILTIN_TEMPLATES = [
  { id: "exam-review", name: "考试复习", categoryName: "学习", description: "拆分复习范围、练习与错题回顾。", tasks: [{ name: "整理考试范围", offset: 0, estimateMinutes: 30 }, { name: "分章节复习", offset: 1, estimateMinutes: 90, dependency: 0 }, { name: "模拟练习与复盘", offset: 3, estimateMinutes: 60, dependency: 1 }] },
  { id: "thesis-writing", name: "论文写作", categoryName: "学习", description: "从资料整理到初稿、修改和提交。", tasks: [{ name: "整理资料与提纲", offset: 0, estimateMinutes: 60 }, { name: "完成论文初稿", offset: 2, estimateMinutes: 120, dependency: 0 }, { name: "修改并提交论文", offset: 5, estimateMinutes: 90, dependency: 1 }] },
  { id: "product-development", name: "产品开发", categoryName: "工作", description: "需求、实现、测试和发布。", tasks: [{ name: "确认需求与验收标准", offset: 0, estimateMinutes: 60 }, { name: "完成核心开发", offset: 2, estimateMinutes: 180, dependency: 0 }, { name: "测试与发布", offset: 5, estimateMinutes: 90, dependency: 1 }] },
  { id: "fitness", name: "健身", categoryName: "生活", description: "建立训练、恢复和复盘节奏。", tasks: [{ name: "制定训练计划", offset: 0, estimateMinutes: 30 }, { name: "完成训练", offset: 1, estimateMinutes: 60, dependency: 0 }, { name: "记录训练复盘", offset: 2, estimateMinutes: 15, dependency: 1 }] },
  { id: "skill-learning", name: "学习新技能", categoryName: "学习", description: "从入门资料、练习到项目输出。", tasks: [{ name: "准备学习资料", offset: 0, estimateMinutes: 30 }, { name: "完成基础练习", offset: 2, estimateMinutes: 60, dependency: 0 }, { name: "完成一个小项目", offset: 5, estimateMinutes: 120, dependency: 1 }] },
  { id: "content-creation", name: "内容创作", categoryName: "工作", description: "选题、创作、编辑和发布内容。", tasks: [{ name: "确定选题与大纲", offset: 0, estimateMinutes: 45 }, { name: "完成内容初稿", offset: 1, estimateMinutes: 120, dependency: 0 }, { name: "编辑并发布", offset: 3, estimateMinutes: 60, dependency: 1 }] },
  { id: "job-search", name: "求职准备", categoryName: "工作", description: "完善材料、准备面试并复盘。", tasks: [{ name: "更新简历", offset: 0, estimateMinutes: 60 }, { name: "准备面试题", offset: 2, estimateMinutes: 90, dependency: 0 }, { name: "模拟面试与复盘", offset: 4, estimateMinutes: 60, dependency: 1 }] },
  { id: "reading", name: "读书", categoryName: "学习", description: "设定阅读、笔记与总结节点。", tasks: [{ name: "确定阅读计划", offset: 0, estimateMinutes: 20 }, { name: "完成核心章节", offset: 2, estimateMinutes: 90, dependency: 0 }, { name: "整理读书笔记", offset: 4, estimateMinutes: 45, dependency: 1 }] }
];
const blank = () => ({ version: 9, timezone: TZ, user: null, session: null, targets: [], subtasks: [], logs: [], plans: [], reports: {}, templates: [], history: [], notifications: [], trash: [], conflicts: [], syncMeta: { pending: false, lastSyncedAt: null, revision: null, snapshot: null }, categories: freshCategories(), notes: {}, focusLogs: [], rewards: { points: 0, unlockedThemes: ["冷白紫"] }, settings: { theme: "cold", timelineRange: "day", dailyCapacityMinutes: 60, legacyDailyCapacityMinutes: 480, capacityDefaultSince: today, deadlineAlertDays: 2, allowWeekendReplan: false, reminderLeadDays: 1, reminderEnabled: true, syncMode: "prompt", conflictResolution: "ask" } });
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
function normalizeTargetTree(targets, legacySubtasks = []) {
  const unique = [];
  const seen = new Set();
  targets.forEach(target => { if (target?.id && !seen.has(target.id)) { seen.add(target.id); unique.push(target); } });
  targets = unique;
  const byId = new Map(targets.map(target => [target.id, target]));
  const parentIds = new Set(targets.map(target => target.id));
  targets.forEach(target => {
    if (target.parentId && !parentIds.has(target.parentId)) target.parentId = null;
  });
  (legacySubtasks || []).forEach(item => {
    const explicitChild = item.childId || item.subtaskId;
    const legacyChild = explicitChild ? byId.get(explicitChild) : (item.id && byId.has(item.id) && item.targetId && byId.has(item.targetId) ? byId.get(item.id) : null);
    const child = legacyChild || (item.parentId || item.parentTargetId ? byId.get(item.targetId) : null);
    const parentId = item.parentId || item.parentTargetId || (legacyChild ? item.targetId : null);
    if (child && parentId && parentIds.has(parentId) && child.id !== parentId) child.parentId = parentId;
  });
  const visiting = new Set();
  const resolveLevel = target => {
    if (!target.parentId) { target.childLevel = 0; return 0; }
    if (visiting.has(target.id)) { target.parentId = null; target.childLevel = 0; return 0; }
    visiting.add(target.id);
    const parent = byId.get(target.parentId);
    const level = parent ? Math.min(2, resolveLevel(parent) + 1) : 0;
    if (!parent) target.parentId = null;
    target.childLevel = target.parentId ? level : 0;
    visiting.delete(target.id);
    return target.childLevel;
  };
  targets.forEach(resolveLevel);
  return targets;
}
function migrate(raw) {
  const source = raw && typeof raw === "object" ? raw : examples();
  const next = { ...blank(), ...source, version: 9, timezone: TZ };
  next.categories = normalizeCategories(source.categories);
  next.templates = Array.isArray(source.templates) ? source.templates : [];
  next.history = Array.isArray(source.history) ? source.history.slice(-100) : [];
  next.notifications = Array.isArray(source.notifications) ? source.notifications.slice(0, 50) : [];
  next.trash = Array.isArray(source.trash) ? source.trash : [];
  next.conflicts = Array.isArray(source.conflicts) ? source.conflicts.slice(-20) : [];
  next.syncMeta = { ...blank().syncMeta, ...(source.syncMeta || {}) };
  next.settings = { ...blank().settings, ...(source.settings || {}) };
  next.targets = (source.targets || []).map(item => {
    const legacyName = item.category || "学习";
    const matched = next.categories.find(category => category.id === item.categoryId || category.name === legacyName);
    const hasDate = Object.prototype.hasOwnProperty.call(item, "date");
    const legacyDeadline = item.deadline || (item.type === "goal" ? item.due : null);
    return { type: item.type || "goal", date: hasDate ? item.date : (item.created || today), categoryId: matched?.id || null, completionMode: item.completionMode || (item.type === "todo" ? "quick" : "detail"), repeat: item.repeat || { mode: "none" }, color: item.color || COLORS[0], estimateMinutes: Number(item.estimateMinutes || 0) || null, deadline: legacyDeadline || null, dependsOn: Array.isArray(item.dependsOn) ? item.dependsOn : [], dependencyMode: item.dependencyMode || "blocks", parentId: item.parentId || null, childLevel: Math.min(2, Math.max(0, Number(item.childLevel || 0))), autoReplanned: Boolean(item.autoReplanned), ...item, categoryId: matched?.id || item.categoryId || null, estimateMinutes: Number(item.estimateMinutes || 0) || null, deadline: legacyDeadline || null, dependsOn: Array.isArray(item.dependsOn) ? item.dependsOn : [], dependencyMode: item.dependencyMode || "blocks", parentId: item.parentId || null, childLevel: Math.min(2, Math.max(0, Number(item.childLevel || 0))), createdAt: item.createdAt || (item.created ? `${item.created}T00:00:00+08:00` : new Date().toISOString()), updatedAt: item.updatedAt || (item.createdAt || (item.created ? `${item.created}T00:00:00+08:00` : new Date().toISOString())), postponeCount: Math.max(0, Number(item.postponeCount || 0)), goalPostponeCount: item.type === "goal" ? Math.max(0, Number(item.goalPostponeCount ?? item.postponeCount ?? 0)) : Math.max(0, Number(item.goalPostponeCount || 0)), actualMinutes: Number(item.actualMinutes || 0) || null };
  });
  next.subtasks = source.subtasks || [];
  next.targets = normalizeTargetTree(next.targets, next.subtasks);
  next.logs = source.logs || [];
  next.plans = source.plans || [];
  next.reports = source.reports || {};
  next.notes = source.notes || {};
  next.focusLogs = source.focusLogs || [];
  next.rewards = source.rewards || { points: 0, unlockedThemes: ["冷白紫"] };
  next.settings = { ...blank().settings, ...(source.settings || {}) };
  if (!Object.prototype.hasOwnProperty.call(source.settings || {}, "capacityDefaultSince")) {
    next.settings.legacyDailyCapacityMinutes = Number(source.settings?.dailyCapacityMinutes ?? source.dailyCapacityMinutes ?? 480);
    next.settings.dailyCapacityMinutes = 60;
    next.settings.capacityDefaultSince = today;
  }
  next.dailyCapacities = source.dailyCapacities && typeof source.dailyCapacities === "object" ? source.dailyCapacities : {};
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
let browserNotificationKeys = new Set();
let notificationCenterExpanded = false;
let notificationSetupMessage = "";
let matrixRange = "day";
let reportRange = "day";
let taskHistoryExpanded = false;
let pendingRender = false;
let pendingRenderForce = false;
let editingInteractionUntil = 0;
let editingInteractionTimer = null;
let quickCaptureMessage = "";
let quickCaptureDraft = "";
let quickCaptureBusy = false;
let pageInputDrafts = {};
let templateDraft = null;
let loginDraft = { username: "", password: "" };
let loginBusy = false;
let loginMessage = "请输入账号登录";
let offlineQueue = false;
let syncInFlight = null;
let syncAgain = false;
let touchStart = null;
let syncConflictMessage = "";
function backupStorageKey(user = state.user || storage.get(ACCOUNT_KEY) || "local") { return `${BACKUP_PREFIX}${user}`; }
function readBackups(user = state.user || storage.get(ACCOUNT_KEY) || "local") { try { const value = JSON.parse(storage.get(backupStorageKey(user)) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } }
function createBackup(reason = "自动备份") {
  const payload = JSON.parse(JSON.stringify(workspacePayload()));
  const backups = readBackups();
  const latest = backups[0];
  if (latest && equivalent(latest.payload, payload) && reason === "自动备份") return latest;
  const backup = { id: uid(), createdAt: nowIso(), reason, payload };
  storage.set(backupStorageKey(), JSON.stringify([backup, ...backups].slice(0, MAX_BACKUPS)));
  return backup;
}
function saveLocal() { createBackup(); storage.set("siaworktable-data", JSON.stringify(state)); }
const targetById = id => state.targets.find(item => item.id === id);
const categoryById = id => state.categories.find(item => item.id === id);
const categoryName = target => categoryById(target.categoryId)?.name || target.category || "未分类";
const targetLogs = id => state.logs.filter(log => log.targetId === id);
const goalDone = target => targetLogs(target.id).reduce((sum, log) => sum + Number(log.amount || 0), 0);
const goalPct = target => Math.min(100, Math.round(goalDone(target) / Math.max(1, Number(target.total)) * 100));
function goalExpectedDate(target) {
  const remaining = Math.max(0, Number(target.total || 0) - goalDone(target));
  const daily = Number(target.daily || 0);
  return daily > 0 ? addDays(today, Math.ceil(remaining / daily)) : null;
}
function defaultGoalMilestones(total) {
  const limit = Math.max(0, Number(total) || 0);
  const thresholds = [5, 10, 50, 100, 200, 300, 400, 500];
  for (let amount = 1000; amount <= limit; amount += 500) thresholds.push(amount);
  if (limit > 0 && !thresholds.includes(limit)) thresholds.push(limit);
  const steps = [...new Set(thresholds)].filter(amount => amount <= limit).sort((a, b) => a - b);
  return steps.map((amount, index) => ({ amount, name: `达到 ${fmt(amount)}`, done: false, ...(index ? { previous: steps[index - 1] } : {}) }));
}
function goalMilestonesFor(target, total = target.total) {
  return defaultGoalMilestones(total).map(item => ({ ...item, done: goalDone(target) >= item.amount }));
}
function newlyReachedMilestones(target, previousAmount, currentAmount) {
  return goalMilestonesFor(target).filter(item => item.amount > previousAmount && item.amount <= currentAmount);
}
function closeFutureGoalOccurrences(target, completionDate) {
  if (!target || target.type !== "goal" || !completionDate) return false;
  const futureEnd = target.due || target.deadline;
  if (!futureEnd || futureEnd <= completionDate) return false;
  const before = { due: target.due || null, deadline: target.deadline || null };
  target.due = completionDate;
  target.deadline = completionDate;
  touchTarget(target, "提前完成并结束未来目标");
  recordHistory(target.id, "删除未来目标 occurrence", before, { due: completionDate, deadline: completionDate });
  return true;
}
function goalProgressTrend(target) {
  const daily = new Map();
  targetLogs(target.id).filter(log => log.kind === "progress").forEach(log => daily.set(log.date, (daily.get(log.date) || 0) + Number(log.amount || 0)));
  let cumulative = 0;
  return [...daily].sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => { cumulative += amount; return { date, amount, cumulative }; });
}
function goalDetails(target) {
  const children = childrenOf(target.id);
  const linked = state.targets.filter(item => item.type === "todo" && item.goalId === target.id);
  const trends = goalProgressTrend(target);
  const milestones = goalMilestonesFor(target);
  return `<section class="goal-details"><div class="goal-detail-meta"><span>预计完成：${goalExpectedDate(target) || "未设置每日计划量"}</span><span>延期 ${Number(target.goalPostponeCount ?? target.postponeCount ?? 0)} 次</span>${target.postponeReasons?.length ? `<span>最近原因：${esc(target.postponeReasons.at(-1).reason)}</span>` : ""}</div>${milestones.length ? `<div class="goal-milestones"><b>里程碑</b>${milestones.map(item => `<span class="milestone ${item.done ? "done" : ""}">${esc(item.name)} · ${fmt(item.amount)} ${esc(target.unit || "次")}${item.done ? ` · 已达成${item.previous ? `（${fmt(item.previous)}→${fmt(item.amount)}）` : ""}` : ""}</span>`).join("")}</div>` : ""}${trends.length ? `<div class="goal-trend"><b>进度趋势</b>${trends.slice(-8).map(item => `<span title="${esc(item.date)}：+${fmt(item.amount)}，累计 ${fmt(item.cumulative)}">${esc(item.date.slice(5))} +${fmt(item.amount)}（${fmt(item.cumulative)}）</span>`).join("")}</div>` : ""}${children.length ? `<div class="goal-children"><b>子目标</b>${children.map(item => `<button type="button" class="goal-child-link" data-edit="${item.id}">${esc(item.name)} · ${goalPct(item)}%</button>`).join("")}</div>` : ""}${linked.length ? `<div class="goal-links"><b>关联计划</b>${linked.map(item => `<button type="button" class="goal-child-link" data-edit="${item.id}">${esc(item.name)}</button>`).join("")}</div>` : ""}${target.summary ? `<div class="goal-summary"><b>完成总结</b><p>${esc(target.summary.achievement || "")}</p><p>${esc(target.summary.learning || "")}</p><small>${esc(target.summary.note || "")}</small></div>` : ""}</section>`;
}
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
function rootTasksFor(date) { return tasksFor(date).filter(target => !target.parentId); }
function isInboxTarget(target) { return !target.date; }
function canUseAsDependency(target, currentId) {
  return Boolean(target.date && target.date >= today && target.id !== currentId && !isCompleteForDate(target, today));
}
function canUseAsParent(target, currentId) {
  return Boolean(target.date && target.date >= today && target.id !== currentId && Number(target.childLevel || 0) < 2 && !isCompleteForDate(target, today));
}
function relationDateFor(target, dependencyIds, parentId) {
  const related = [
    ...(Array.isArray(dependencyIds) ? dependencyIds : []).map(targetById),
    parentId ? targetById(parentId) : null
  ].filter(item => item?.date && item.date >= today);
  const futureDates = related.map(item => item.date).filter(date => date > today).sort();
  return futureDates.length ? futureDates[futureDates.length - 1] : null;
}
let expandedTaskIds = new Set();
function childrenOf(targetId) { return state.targets.filter(target => target.parentId === targetId); }
function descendantsOf(targetId) { const result = []; const visit = id => childrenOf(id).forEach(child => { result.push(child); visit(child.id); }); visit(targetId); return result; }
function dependencyStatus(target, date = target.date || today) {
  const dependencies = (target.dependsOn || []).map(targetById).filter(Boolean);
  const blockedBy = dependencies.filter(item => !isCompleteForDate(item, date));
  return { blocked: blockedBy.length > 0, blockedBy };
}
function dependencyLabel(target, date = target.date || today) {
  const status = dependencyStatus(target, date);
  return status.blocked ? `前置未完成：${status.blockedBy.map(item => item.name).join("、")}` : "";
}
function nextAllowedWorkday(date) {
  if (state.settings.allowWeekendReplan) return date;
  const day = new Date(`${date}T12:00:00+08:00`).getDay();
  return day === 6 ? addDays(date, 2) : day === 0 ? addDays(date, 1) : date;
}
function autoReplanDependents(completedId, completedDate) {
  const changes = [];
  state.targets.filter(target => (target.dependsOn || []).includes(completedId) && target.date && target.date < completedDate && !isCompleteForDate(target, completedDate)).forEach(target => {
    const next = nextAllowedWorkday(addDays(completedDate, 1));
    if (next > target.date) {
      changes.push({ targetId: target.id, date: target.date, autoReplanned: Boolean(target.autoReplanned) });
        target.date = next;
      target.autoReplanned = true;
    }
  });
  return changes;
}
function estimateMinutes(target) {
  const explicit = Number(target.estimateMinutes || 0);
  const childMinutes = childrenOf(target.id).reduce((sum, child) => sum + estimateMinutes(child), 0);
  if (explicit > 0 || childMinutes > 0) return explicit + childMinutes;
  if (target.startTime && target.endTime) {
    const [startHour, startMinute] = target.startTime.split(":").map(Number);
    const [endHour, endMinute] = target.endTime.split(":").map(Number);
    const minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    if (minutes > 0) return minutes;
  }
  return 0;
}
function isCompleteForDate(target, date) {
  if (target.type === "goal") return state.logs.some(log => log.targetId === target.id && log.kind === "progress" && log.date === date);
  return Boolean(completion(target.id, date));
}
function dayLoad(date) { return tasksFor(date).reduce((sum, target) => sum + estimateMinutes(target), 0); }
function capacityMinutes(date = selectedDate) {
  state.dailyCapacities ||= {};
  if (state.dailyCapacities[date] !== undefined) {
    const value = Number(state.dailyCapacities[date]);
    return Number.isFinite(value) ? Math.max(0, value) : 60;
  }
  const effectiveDate = state.settings.capacityDefaultSince || today;
  const legacyDefault = Number(state.settings.legacyDailyCapacityMinutes ?? 480);
  const currentDefault = Number(state.settings.dailyCapacityMinutes ?? 60);
  return Math.max(0, Number(date < effectiveDate ? legacyDefault : currentDefault) || 0);
}
function setDailyCapacity(date, value) {
  state.dailyCapacities ||= {};
  state.dailyCapacities[date] = Math.max(0, Number(value) || 0);
}
function nowIso() { return new Date().toISOString(); }
function recordHistory(targetId, action, before, after) {
  state.history ||= [];
  state.history.push({ id: uid(), targetId, action, before: before || null, after: after || null, at: nowIso() });
  state.history = state.history.slice(-100);
}
function touchTarget(target, action = "更新") {
  const before = target.updatedAt;
  target.updatedAt = nowIso();
  recordHistory(target.id, action, before, target.updatedAt);
}
function notification(title, message, kind = "info", targetId = null) {
  state.notifications ||= [];
  const item = { id: uid(), title, message, kind, targetId, date: today, createdAt: nowIso(), read: false };
  state.notifications.unshift(item);
  state.notifications = state.notifications.slice(0, 50);
  return item;
}
function reminderItems() {
  const lead = Math.max(0, Number(state.settings.reminderLeadDays ?? 1));
  const result = [];
  tasksFor(today).forEach(target => {
    if (!isCompleteForDate(target, today)) result.push({ key: `today-${target.id}`, title: "今日计划", message: target.name, kind: "today", targetId: target.id });
  });
  state.targets.filter(target => target.deadline && !isCompleteForDate(target, today) && target.deadline >= today && target.deadline <= addDays(today, lead)).forEach(target => result.push({ key: `deadline-${target.id}`, title: "截止日期临近", message: `${target.name} · 截止 ${target.deadline}`, kind: "deadline", targetId: target.id }));
  state.targets.filter(target => target.deadline && target.deadline < today && !isCompleteForDate(target, today)).forEach(target => result.push({ key: `overdue-${target.id}`, title: "任务已逾期", message: target.name, kind: "overdue", targetId: target.id }));
  state.targets.filter(target => target.date && target.date < today && !isCompleteForDate(target, today) && target.date < addDays(today, -7)).forEach(target => result.push({ key: `stale-${target.id}`, title: "长时间未处理", message: target.name, kind: "stale", targetId: target.id }));
  state.targets.filter(target => dependencyStatus(target).blocked && target.date === today).forEach(target => result.push({ key: `blocked-${target.id}`, title: "前置任务未完成", message: dependencyLabel(target), kind: "blocked", targetId: target.id }));
  return result;
}
function syncReminders() {
  if (!state.settings.reminderEnabled) return [];
  const existing = new Set((state.notifications || []).filter(item => item.date === today).map(item => item.key));
  const fresh = reminderItems().filter(item => !existing.has(item.key));
  fresh.forEach(item => { const created = notification(item.title, item.message, item.kind, item.targetId); created.key = item.key; });
  if (fresh.length) saveLocal();
  return fresh;
}
function actualMinutesForCompletion(target) {
  const createdAt = new Date(target.createdAt || `${target.created || today}T00:00:00+08:00`).getTime();
  return Math.max(0, Math.round((Date.now() - createdAt) / 60000));
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
    if (!target.date || target.date >= today || appliesOn(target, today)) return false;
    if (target.type === "goal") return Boolean(target.deadline && target.deadline < today && !isCompleteForDate(target, today));
    if (target.repeat?.mode && target.repeat.mode !== "none") {
      return !isCompleteForDate(target, target.date);
    }
    return !isCompleteForDate(target, target.date);
  });
}
function quickTarget(parsed) {
  return { id: uid(), type: "todo", name: parsed.name, date: parsed.date || null, due: null, deadline: parsed.deadline || null, estimateMinutes: parsed.estimateMinutes || null, color: COLORS[0], quadrant: "important-not-urgent", categoryId: state.categories[0]?.id || null, completionMode: "quick", repeat: { mode: "none" }, startTime: parsed.startTime || "", endTime: parsed.estimateMinutes && parsed.startTime ? addMinutesToTime(parsed.startTime, parsed.estimateMinutes) : "", created: today };
}
function addMinutesToTime(time, minutes) {
  const [hour, minute] = String(time || "00:00").split(":").map(Number);
  const total = hour * 60 + minute + Number(minutes || 0);
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
function openNaturalEditor(parsed) {
  document.activeElement?.blur?.();
  formDraft = { "f-name": parsed.name, "f-date": parsed.date || "", "f-deadline": parsed.deadline || "", "f-estimate": parsed.estimateMinutes || "", "f-start": parsed.startTime || "", "f-end": parsed.estimateMinutes && parsed.startTime ? addMinutesToTime(parsed.startTime, parsed.estimateMinutes) : "" };
  modal = { type: "edit", target: null, taskType: "todo", step: 1, showCategoryCreator: false };
  render(true);
}
async function createFromNaturalInput(input) {
  const parsed = parseNaturalInput(input);
  if (!parsed.name) return false;
  if (parsed.deadlineOnly) {
    const putInInbox = confirm(`已识别截止日期 ${parsed.deadline}，但没有识别到执行日期。\n\n确定放入收集箱并只保存截止日期吗？\n点击“取消”可打开编辑页面补充执行日期。`);
    if (!putInInbox) { openNaturalEditor(parsed); return "editor"; }
  }
  const target = quickTarget(parsed);
  state.targets.push(target);
  if (target.date) {
    selectedDate = target.date;
    state.settings.timelineRange = "day";
    tab = "timeline";
    quickCaptureMessage = `已添加到 ${target.date}${target.startTime ? ` ${target.startTime}` : ""}：${target.name}`;
  } else {
    tab = "inbox";
    quickCaptureMessage = `已加入收集箱：${target.name}`;
  }
  saveLocal();
  await sync();
  return true;
}
async function submitQuickCapture() {
  if (quickCaptureBusy) return;
  const input = document.getElementById("quick-capture");
  const button = document.getElementById("quick-capture-submit");
  const value = (input?.value || quickCaptureDraft).trim();
  quickCaptureDraft = value;
  if (!value) { quickCaptureMessage = "请输入计划内容。"; input?.focus(); render(true); return; }
  quickCaptureBusy = true;
  if (button) button.disabled = true;
  try {
    const result = await createFromNaturalInput(value);
    if (result === true) {
      quickCaptureDraft = "";
      if (input) input.value = "";
      input?.blur();
      render(true);
    } else if (result === "editor") {
      input?.blur();
    }
  } catch (error) {
    quickCaptureMessage = `添加失败：${error.message || error}`;
    render(true);
  } finally {
    quickCaptureBusy = false;
    const currentButton = document.getElementById("quick-capture-submit");
    if (currentButton) currentButton.disabled = false;
  }
}
async function cloud(action, payload = {}, baseRevision) {
  if (!state.session || !state.user) return null;
  const response = await fetch(`${CONFIG.url}/functions/v1/${CONFIG.fn}`, { method: "POST", headers: { "Content-Type": "application/json", apikey: CONFIG.key, Authorization: `Bearer ${CONFIG.key}` }, body: JSON.stringify({ action, username: state.user, token: state.session, payload, baseRevision }) });
  const raw = await response.text();
  let output = {};
  try { output = raw ? JSON.parse(raw) : {}; } catch {}
  if (!response.ok) throw new Error(response.status === 409 ? "云端已由其他设备更新，请重新同步后再试" : `HTTP ${response.status}：${output.detail || output.error || raw}`);
  return output;
}
const SYNC_COLLECTIONS = ["targets", "subtasks", "logs", "plans", "history", "notifications", "focusLogs", "trash", "categories", "templates"];
const SYNC_OBJECTS = ["reports", "notes", "dailyCapacities", "settings", "rewards"];
function workspacePayload(source = state) {
  const { user, session, conflicts, syncMeta, ...payload } = source;
  const settings = { ...(payload.settings || {}) };
  delete settings.syncMode;
  delete settings.conflictResolution;
  return { ...payload, settings };
}
function devicePreferences() { return { syncMode: state.settings.syncMode, conflictResolution: state.settings.conflictResolution }; }
function applyPreferences(preferences) { state.settings = { ...state.settings, ...preferences }; }
function rememberRemote(remote, revision) {
  state.syncMeta = { pending: false, lastSyncedAt: nowIso(), revision, snapshot: workspacePayload(remote) };
  saveLocal();
}
function syncCanonical(value) {
  if (Array.isArray(value)) return value.map(syncCanonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, syncCanonical(value[key])]));
  return value ?? null;
}
function equivalent(a, b) { return JSON.stringify(syncCanonical(a)) === JSON.stringify(syncCanonical(b)); }
function mergeCloudPayload(remote, options = {}) {
  const base = state.syncMeta.snapshot;
  const local = workspacePayload();
  const merged = { ...remote };
  const conflicts = [];
  const dirtyWithoutBase = !base && ((local.targets?.length || 0) + (local.logs?.length || 0) + (local.plans?.length || 0) + (local.trash?.length || 0) > 0);
  if (dirtyWithoutBase) {
    return { merged: remote, conflicts: [{ id: "workspace:initial", key: "workspace", itemId: "initial", local, remote, createdAt: nowIso() }] };
  }
  const resolution = options.resolution || state.settings.conflictResolution || "ask";
  const resolve = (key, id, localValue, remoteValue, baseValue, put) => {
    const changedLocal = !equivalent(localValue, baseValue);
    const changedRemote = !equivalent(remoteValue, baseValue);
    if (!changedLocal) return;
    if (!changedRemote || equivalent(localValue, remoteValue)) { put(localValue); return; }
    if (key === "settings" && (id === "syncMode" || id === "conflictResolution")) return;
    const localTime = Date.parse(localValue?.updatedAt || localValue?.deletedAt || "") || 0;
    const remoteTime = Date.parse(remoteValue?.updatedAt || remoteValue?.deletedAt || "") || 0;
    if (resolution === "newest" && localTime && remoteTime && localTime !== remoteTime) {
      if (localTime > remoteTime) put(localValue);
      return;
    }
    conflicts.push({ id: `${key}:${id}`, key, itemId: id, local: localValue, remote: remoteValue, createdAt: nowIso() });
  };
  for (const key of SYNC_COLLECTIONS) {
    const list = new Map((remote[key] || []).filter(item => item?.id).map(item => [item.id, item]));
    const before = new Map((base?.[key] || []).filter(item => item?.id).map(item => [item.id, item]));
    const current = new Map((local[key] || []).filter(item => item?.id).map(item => [item.id, item]));
    for (const id of new Set([...list.keys(), ...current.keys(), ...before.keys()])) {
      resolve(key, id, current.get(id), list.get(id), before.get(id), value => { if (value === undefined) list.delete(id); else list.set(id, value); });
    }
    merged[key] = [...list.values()];
  }
  for (const key of SYNC_OBJECTS) {
    const localObject = local[key] || {};
    const remoteObject = remote[key] || {};
    const baseObject = base?.[key] || {};
    const result = { ...remoteObject };
    for (const id of new Set([...Object.keys(localObject), ...Object.keys(remoteObject), ...Object.keys(baseObject)])) {
      if (key === "settings" && (id === "syncMode" || id === "conflictResolution")) continue;
      resolve(key, id, localObject[id], remoteObject[id], baseObject[id], value => { if (value === undefined) delete result[id]; else result[id] = value; });
    }
    merged[key] = result;
  }
  const activeIds = new Set((merged.targets || []).map(item => item.id));
  merged.trash = (merged.trash || []).filter(item => !activeIds.has(item.id));
  return { merged, conflicts };
}
function replaceWithCloudPayload(remote, revision) {
  const user = state.user;
  const session = state.session;
  const preferences = devicePreferences();
  state = migrate(remote);
  state.user = user;
  state.session = session;
  applyPreferences(preferences);
  state.conflicts = [];
  rememberRemote(remote, revision);
}
async function pullCloudData() {
  const remote = await cloud("load");
  if (!remote?.payload || !Number.isSafeInteger(remote.revision)) throw new Error("云端版本不可用，请先部署最新的 SQL 和 Edge Function");
  replaceWithCloudPayload(remote.payload, remote.revision);
  syncConflictMessage = "已从云端拉取最新工作区。";
  render(true);
}
async function pushCloudData(baseRevision = state.syncMeta.revision) {
  if (!Number.isSafeInteger(baseRevision)) throw new Error("云端版本未知，请先拉取云端");
  if ((state.conflicts || []).length) throw new Error("请先处理所有同步冲突");
  const payload = workspacePayload();
  const result = await cloud("save", payload, baseRevision);
  if (!Number.isSafeInteger(result?.revision)) throw new Error("服务端未返回版本号，请部署最新的 Edge Function");
  const changedDuringSave = !equivalent(payload, workspacePayload());
  rememberRemote(payload, result.revision);
  if (changedDuringSave) { state.syncMeta.pending = true; saveLocal(); if (syncInFlight) syncAgain = true; }
  setSync(changedDuringSave ? "有新修改，继续同步中" : "已上传至云端");
}
async function sync() {
  if (syncInFlight) { syncAgain = true; saveLocal(); return syncInFlight; }
  syncInFlight = performSync();
  try { await syncInFlight; } finally { syncInFlight = null; if (syncAgain) { syncAgain = false; return sync(); } }
}
async function performSync() {
  saveLocal();
  if (!state.session || !navigator.onLine) { offlineQueue = Boolean(state.session); state.syncMeta.pending = Boolean(state.session && (!state.syncMeta.snapshot || !equivalent(workspacePayload(), state.syncMeta.snapshot))); saveLocal(); setSync(state.session ? "离线已保存，联网后同步" : "离线模式"); return; }
  setSync("同步中…");
  try {
    const mode = state.settings.syncMode || "prompt";
    if (mode === "local") { state.syncMeta.pending = !equivalent(workspacePayload(), state.syncMeta.snapshot); saveLocal(); setSync("本地已保存 · 可手动上传云端"); return; }
    if ((state.conflicts || []).length) { setSync("待处理同步冲突"); return; }
    const localBeforeLoad = workspacePayload();
    const remote = await cloud("load");
    if (!remote?.payload || !Number.isSafeInteger(remote.revision)) throw new Error("云端版本不可用，请先部署最新的 SQL 和 Edge Function");
    const localChanged = state.syncMeta.snapshot ? !equivalent(workspacePayload(), state.syncMeta.snapshot) : Boolean(state.syncMeta.pending || (state.targets?.length || 0) + (state.logs?.length || 0) + (state.plans?.length || 0) + (state.trash?.length || 0));
    if (!localChanged) {
      if (equivalent(localBeforeLoad, workspacePayload())) replaceWithCloudPayload(remote.payload, remote.revision);
      else syncAgain = true;
    } else {
      const { merged, conflicts } = mergeCloudPayload(remote.payload);
      if (!equivalent(localBeforeLoad, workspacePayload())) { syncAgain = true; return; }
      state.conflicts = conflicts;
      state.syncMeta.pending = true;
      if (conflicts.length) {
        state.syncMeta.remoteRevision = remote.revision;
        state.syncMeta.remotePayload = remote.payload;
        state.syncMeta.mergedPayload = merged;
        saveLocal();
        setSync("发现冲突，请选择本地或云端版本");
        render(true);
        return;
      }
      const user = state.user, session = state.session, preferences = devicePreferences();
      state = migrate(merged);
      state.user = user; state.session = session; applyPreferences(preferences);
      state.syncMeta = { pending: true, revision: remote.revision, snapshot: workspacePayload(remote.payload), lastSyncedAt: null };
      saveLocal();
      if (!equivalent(workspacePayload(), workspacePayload(remote.payload))) await pushCloudData(remote.revision);
      else rememberRemote(remote.payload, remote.revision);
      render(true);
    }
    offlineQueue = false;
    setSync(`已同步 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`);
  } catch (error) { offlineQueue = true; state.syncMeta.pending = true; saveLocal(); setSync(`同步未完成：${error.message}`); }
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
function capturePageInputDrafts() {
  document.querySelectorAll("#app input[id],#app textarea[id],#app select[id]").forEach(control => {
    if (control.closest(".modal-card") || control.id === "quick-capture") return;
    pageInputDrafts[control.id] = control.multiple ? Array.from(control.selectedOptions).map(option => option.value) : control.value;
  });
  document.querySelectorAll("#app [data-capacity-date]").forEach(control => {
    pageInputDrafts[`capacity-${control.dataset.capacityDate}`] = control.value;
  });
  const quick = document.getElementById("quick-capture");
  if (quick) quickCaptureDraft = quick.value;
}
function restorePageInputDrafts() {
  Object.entries(pageInputDrafts).forEach(([id, value]) => {
    const control = document.getElementById(id);
    if (control) {
      if (control.multiple && Array.isArray(value)) Array.from(control.options).forEach(option => { option.selected = value.includes(option.value); });
      else control.value = value;
      return;
    }
    if (id.startsWith("capacity-")) {
      const capacity = document.querySelector(`[data-capacity-date="${id.slice(9)}"]`);
      if (capacity) capacity.value = value;
    }
  });
  const quick = document.getElementById("quick-capture");
  if (quick) quick.value = quickCaptureDraft;
}
function holdEditingInteraction(duration = 900) {
  editingInteractionUntil = Math.max(editingInteractionUntil, Date.now() + duration);
  clearTimeout(editingInteractionTimer);
  editingInteractionTimer = setTimeout(flushPendingRender, duration + 20);
}
function queueRenderAfterEditing(force) {
  capturePageInputDrafts();
  pendingRender = true;
  pendingRenderForce = pendingRenderForce || force;
  flushPendingRender();
}
function flushPendingRender() {
  if (!pendingRender || openSelectId || Date.now() < editingInteractionUntil) {
    if (pendingRender && Date.now() < editingInteractionUntil) {
      clearTimeout(editingInteractionTimer);
      editingInteractionTimer = setTimeout(flushPendingRender, Math.max(20, editingInteractionUntil - Date.now() + 20));
    }
    return;
  }
  const active = document.activeElement;
  if (active?.closest?.("#app") && /^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName)) {
    if (!active.dataset.siaRenderRelease) {
      active.dataset.siaRenderRelease = "1";
      active.addEventListener("blur", () => {
        delete active.dataset.siaRenderRelease;
        setTimeout(flushPendingRender, active.type === "date" ? 250 : 0);
      }, { once: true });
    }
    return;
  }
  const force = pendingRenderForce;
  pendingRender = false;
  pendingRenderForce = false;
  render(force);
}
function notificationSupportState() {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return "default";
}
function browserReminder(item, force = false) {
  if (!state.settings.reminderEnabled || !item || typeof Notification === "undefined" || Notification.permission !== "granted") return false;
  const key = item.key || item.id;
  if (!force && browserNotificationKeys.has(key)) return false;
  try {
    new Notification(item.title, { body: item.message, tag: key });
    browserNotificationKeys.add(key);
    return true;
  } catch {
    return false;
  }
}
async function enableBrowserReminders() {
  if (typeof Notification === "undefined") {
    notificationSetupMessage = "当前浏览器环境不支持系统通知。请使用 HTTPS 站点或 localhost，并用 Chrome/Edge 打开。";
    render(true);
    return;
  }
  if (Notification.permission === "denied") {
    notificationSetupMessage = "通知权限已被拒绝。请点击地址栏左侧的站点权限图标，将“通知”改为允许；并检查 Windows 设置 → 系统 → 通知中是否允许当前浏览器。";
    render(true);
    return;
  }
  notificationSetupMessage = "正在请求通知权限…";
  render(true);
  try {
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") {
      notificationSetupMessage = permission === "denied" ? "权限被拒绝。请在站点权限和 Windows 通知设置中允许此浏览器发送通知。" : "尚未授予通知权限。请再次点击并在浏览器提示框中选择“允许”。";
      render(true);
      return;
    }
    state.settings.reminderEnabled = true;
    syncReminders();
    const pending = (state.notifications || []).filter(item => item.date === today && item.kind !== "system");
    pending.forEach(item => browserReminder(item, true));

    let testNotification;
    try {
      testNotification = new Notification("SIAWorkTable 通知测试", { body: "授权成功。如果你看到了这条消息，系统通知已可用。", tag: `sia-notification-test-${Date.now()}` });
    } catch (error) {
      notificationSetupMessage = `浏览器已授权，但创建系统通知失败：${error.message || error}。请用 HTTPS/localhost 打开，并检查 Windows 通知设置。`;
      await sync();
      render(true);
      return;
    }
    let settled = false;
    const onShown = () => {
      if (settled) return;
      settled = true;
      notificationSetupMessage = "授权成功，测试通知已交给 Windows。若桌面未显示，请检查 Windows 通知中心、专注助手/勿扰模式，以及 Chrome/Edge 的系统通知权限。";
      notification("系统通知已开启", "浏览器通知权限已授权。", "system");
      sync();
      render(true);
    };
    const onError = () => {
      if (settled) return;
      settled = true;
      notificationSetupMessage = "浏览器未能显示测试通知。请检查 Windows 设置 → 系统 → 通知，允许 Chrome/Edge 通知，并关闭专注助手/勿扰模式。";
      render(true);
    };
    testNotification.addEventListener("show", onShown, { once: true });
    testNotification.addEventListener("error", onError, { once: true });
    setTimeout(() => {
      if (settled) return;
      settled = true;
      notificationSetupMessage = "授权成功，测试通知已发送；Windows 未回报显示状态。请在通知中心检查，或检查系统通知/勿扰模式设置。";
      notification("系统通知已开启", "浏览器通知权限已授权。", "system");
      sync();
      render(true);
    }, 1200);
    await sync();
  } catch (error) {
    notificationSetupMessage = `启用通知失败：${error.message || error}`;
    render(true);
  }
}
function requestBrowserReminderPermission() {
  // 权限请求必须由用户手势触发；页面加载时只读取权限状态，不主动弹权限框。
  return notificationSupportState();
}
function render(force = false) {
  const root = document.getElementById("app");
  if (!root) return;
  const freshReminders = state.user ? syncReminders() : [];
  if (state.user) requestBrowserReminderPermission();
  freshReminders.forEach(browserReminder);
  captureLoginDraft();
  const active = document.activeElement;
  const editing = state.user && active && root.contains(active) && /^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName);
  if (editing) {
    capturePageInputDrafts();
    captureFormDraft();
  }
  if (openSelectId || editing) {
    queueRenderAfterEditing(force);
    return;
  }
  const activeId = active?.id || null;
  const selectionStart = typeof active?.selectionStart === "number" ? active.selectionStart : null;
  root.innerHTML = state.user ? appView() : loginView();
  bind();
  restoreFormDraft();
  restorePageInputDrafts();
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
  const buttonLabel = loginBusy ? "正在登录…" : "登录 / 注册";
  return `<main class="login-page"><section class="login-box panel"><div class="brand">SIAWorkTable<small>目标、计划与专注</small><small>由新哲文院算法社开发</small></div><h1>登录你的工作台</h1><p class="subtle">首次登录会自动注册。全部计划和记录按账号同步。</p><label class="field">用户名<input id="login-user" autocomplete="username" value="${esc(loginDraft.username)}" placeholder="3-40 位字母、数字、下划线" ${loginBusy ? "disabled" : ""}></label><label class="field">密码<input id="login-pass" type="password" autocomplete="current-password" value="${esc(loginDraft.password)}" placeholder="至少 8 位" ${loginBusy ? "disabled" : ""}></label><button class="btn primary full" id="login-btn" ${loginBusy ? "disabled aria-busy=\"true\"" : ""}>${buttonLabel}</button><p id="login-msg" class="subtle" aria-live="polite">${esc(loginMessage)}</p></section></main>`;
}
function syncConflictLabel(item) {
  if (item.key === "workspace") return "首次同步工作区";
  const value = item.local || item.remote || {};
  const type = { targets: "任务/目标", subtasks: "子任务", logs: "进度日志", plans: "计划", history: "历史", notifications: "通知", focusLogs: "专注记录", trash: "回收站", categories: "分类", templates: "模板", reports: "复盘", notes: "笔记", dailyCapacities: "每日配额", settings: "设置", rewards: "奖励" }[item.key] || item.key || "工作区数据";
  return `${type} · ${value.name || value.title || item.itemId || "配置"}`;
}
const SYNC_FIELD_LABELS = {
  id: "编号", name: "名称", title: "标题", type: "类型", date: "执行日期", due: "目标日期", deadline: "截止日期",
  startTime: "开始时间", endTime: "结束时间", estimateMinutes: "预计用时", actualMinutes: "实际用时", completionMode: "完成方式", repeat: "重复规则",
  done: "完成状态", completed: "完成状态", amount: "完成数量", total: "目标总量", daily: "每日计划量", unit: "计量单位", categoryId: "分类",
  quadrant: "四象限", parentId: "父任务", targetId: "关联任务", dependsOn: "前置任务", dependencyMode: "依赖方式", note: "备注", content: "内容",
  createdAt: "创建时间", updatedAt: "最后修改时间", created: "创建日期", color: "颜色", childLevel: "子任务层级", goalId: "关联目标",
  milestones: "里程碑", postponeReasons: "延期原因", postponeCount: "延期次数", goalPostponeCount: "目标延期次数", summary: "总结",
  learning: "学习收获", achievement: "完成成果", completedAt: "完成时间", before: "修改前", after: "修改后", mode: "记录方式",
  minutes: "分钟数", actualMinutesMode: "实际用时记录方式", kind: "记录类型", item: "项目", tasks: "模板任务", repeatMode: "重复方式", frequency: "重复频率",
  reports: "复盘报告", notes: "笔记", dailyCapacities: "每日配额", settings: "设置", rewards: "奖励", targets: "任务和目标", subtasks: "子任务",
  logs: "进度日志", plans: "计划", history: "修改历史", notifications: "通知", focusLogs: "专注记录", trash: "回收站", categories: "分类", templates: "模板"
};
function syncFieldLabel(key) {
  if (SYNC_FIELD_LABELS[key]) return SYNC_FIELD_LABELS[key];
  const normalized = String(key).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return `其他字段（${normalized}）`;
}
const SYNC_TYPE_LABELS = {
  goal: "目标", todo: "普通计划", true: "已完成", false: "未完成", quick: "快速完成", detail: "详细完成",
  manual: "手动记录", complete: "完成记录", progress: "进度记录", postpone: "延期记录", important: "重要且紧急",
  "important-not-urgent": "重要不紧急", "urgent-not-important": "紧急不重要", neither: "不重要不紧急",
  blocks: "阻塞后续任务", requires: "需要前置任务", none: "不重复", daily: "每天", weekly: "每周", monthly: "每月"
};
function syncEnumValue(key, value) {
  if (typeof value !== "string") return null;
  if (["type", "completionMode", "mode", "kind", "quadrant", "dependencyMode", "repeatMode", "frequency"].includes(key)) return SYNC_TYPE_LABELS[value] || value;
  return null;
}
function syncDisplayValue(key, value) {
  if (value === null || value === undefined || value === "") return "未设置";
  const enumValue = syncEnumValue(key, value);
  if (enumValue) return enumValue;
  if (["done", "completed"].includes(key)) return value ? "已完成" : "未完成";
  if (key === "repeat" && typeof value === "object") return value.mode === "none" ? "不重复" : `重复：${value.mode || "已设置"}`;
  if (Array.isArray(value)) {
    if (!value.length) return "无";
    return `${value.length} 项：${value.map((item, index) => typeof item === "object" && item !== null ? `第${index + 1}项（${syncDisplayValue("item", item)}）` : syncDisplayValue("item", item)).join("、")}`;
  }
  if (typeof value === "object") return Object.entries(value).map(([childKey, childValue]) => `${syncFieldLabel(childKey)}：${syncDisplayValue(childKey, childValue)}`).join("；");
  return String(value);
}
function syncReadableRecord(value, title = "数据") {
  if (!value || typeof value !== "object") return `<p class="sync-empty">${esc(value == null ? "无数据" : String(value))}</p>`;
  const preferred = ["name", "title", "type", "date", "due", "deadline", "startTime", "endTime", "estimateMinutes", "actualMinutes", "completionMode", "repeat", "done", "completed", "amount", "total", "daily", "unit", "categoryId", "quadrant", "parentId", "targetId", "dependsOn", "dependencyMode", "note", "content", "createdAt", "updatedAt", "created"];
  const keys = [...preferred.filter(key => Object.prototype.hasOwnProperty.call(value, key)), ...Object.keys(value).filter(key => !preferred.includes(key) && !["id", "color"].includes(key))];
  return `<div class="sync-readable-record"><strong>${esc(title)}</strong><dl>${keys.map(key => `<div><dt>${esc(syncFieldLabel(key))}</dt><dd>${esc(syncDisplayValue(key, value[key]))}</dd></div>`).join("")}</dl></div>`;
}
function syncReadableWorkspace(value, side) {
  if (!value || typeof value !== "object") return `<p class="sync-empty">${side}没有数据</p>`;
  const sections = [{ key: "targets", label: "任务和目标" }, { key: "subtasks", label: "子任务" }, { key: "logs", label: "进度日志" }, { key: "plans", label: "计划" }, { key: "focusLogs", label: "专注记录" }, { key: "history", label: "修改历史" }, { key: "notifications", label: "通知" }, { key: "trash", label: "回收站" }, { key: "categories", label: "分类" }, { key: "templates", label: "模板" }];
  const blocks = sections.filter(section => Array.isArray(value[section.key]) && value[section.key].length).map(section => `<section class="sync-readable-section"><h4>${esc(section.label)}（${value[section.key].length} 条）</h4>${value[section.key].slice(0, 8).map((record, index) => syncReadableRecord(record, `${section.label} ${index + 1}`)).join("")}${value[section.key].length > 8 ? `<p class="sync-empty">其余 ${value[section.key].length - 8} 条请以数量为准，避免冲突页面过长。</p>` : ""}</section>`);
  if (value.notes && Object.keys(value.notes).length) blocks.push(`<section class="sync-readable-section"><h4>笔记（${Object.keys(value.notes).length} 项）</h4>${Object.entries(value.notes).slice(0, 8).map(([date, note]) => syncReadableRecord({ date, content: note }, `笔记 ${date}`)).join("")}</section>`);
  return blocks.join("") || `<p class="sync-empty">${side}是空工作区</p>`;
}
function syncRecordKey(value, index) {
  return value?.id || value?.date || value?.name || value?.title || `第 ${index + 1} 条`;
}
function syncRecordTitle(value, index) {
  return value?.name || value?.title || value?.content || value?.date || `第 ${index + 1} 条记录`;
}
function syncValueEqual(left, right) {
  return JSON.stringify(syncCanonical(left)) === JSON.stringify(syncCanonical(right));
}
function syncChangedFields(local, remote) {
  const paths = new Set();
  const visit = (left, right, prefix = "") => {
    if (syncValueEqual(left, right)) return;
    const leftObject = left && typeof left === "object" && !Array.isArray(left);
    const rightObject = right && typeof right === "object" && !Array.isArray(right);
    if (leftObject || rightObject) {
      for (const key of new Set([...Object.keys(left || {}), ...Object.keys(right || {})])) {
        if (!["id", "color"].includes(key)) visit(left?.[key], right?.[key], prefix ? `${prefix}.${key}` : key);
      }
      return;
    }
    if (prefix) paths.add(prefix);
  };
  visit(local, remote);
  return [...paths];
}
function syncPathValue(value, path) {
  return path.split(".").reduce((current, part) => current?.[part], value);
}
function syncPathLabel(path) {
  return path.split(".").map(part => /^\d+$/.test(part) ? `第${Number(part) + 1}项` : syncFieldLabel(part)).join(" · ");
}
function syncWorkspaceDiff(local, remote) {
  const sections = [{ key: "targets", label: "任务和目标" }, { key: "subtasks", label: "子任务" }, { key: "logs", label: "进度日志" }, { key: "plans", label: "计划" }, { key: "focusLogs", label: "专注记录" }, { key: "history", label: "修改历史" }, { key: "notifications", label: "通知" }, { key: "trash", label: "回收站" }, { key: "categories", label: "分类" }, { key: "templates", label: "模板" }];
  const blocks = [];
  for (const section of sections) {
    const cloudItems = Array.isArray(remote?.[section.key]) ? remote[section.key] : [];
    const localItems = Array.isArray(local?.[section.key]) ? local[section.key] : [];
    const cloudMap = new Map(cloudItems.map((record, index) => [syncRecordKey(record, index), record]));
    const localMap = new Map(localItems.map((record, index) => [syncRecordKey(record, index), record]));
    const cloudOnly = cloudItems.filter((record, index) => !localMap.has(syncRecordKey(record, index)));
    const localOnly = localItems.filter((record, index) => !cloudMap.has(syncRecordKey(record, index)));
    const changed = cloudItems.map((record, index) => ({ cloud: record, local: localMap.get(syncRecordKey(record, index)), index })).filter(item => item.local && syncChangedFields(item.local, item.cloud).length);
    if (!cloudOnly.length && !localOnly.length && !changed.length) continue;
    const lines = [];
    if (cloudOnly.length) lines.push(`<div class="sync-diff-group"><b>云端有， 本地没有</b>${cloudOnly.slice(0, 8).map((record, index) => `<p>云端新增：${esc(syncRecordTitle(record, index))}</p>`).join("")}</div>`);
    if (localOnly.length) lines.push(`<div class="sync-diff-group"><b>本地有， 云端没有</b>${localOnly.slice(0, 8).map((record, index) => `<p>本地新增：${esc(syncRecordTitle(record, index))}</p>`).join("")}</div>`);
    for (const item of changed.slice(0, 8)) {
      const title = syncRecordTitle(item.cloud, item.index);
      const fields = syncChangedFields(item.local, item.cloud).slice(0, 8).map(path => `<p><b>${esc(syncPathLabel(path))}</b>：云端为“${esc(syncDisplayValue(path.split(".").pop(), syncPathValue(item.cloud, path)))}”，本地为“${esc(syncDisplayValue(path.split(".").pop(), syncPathValue(item.local, path)))}”</p>`).join("");
      lines.push(`<div class="sync-diff-group"><b>同一条${esc(section.label)}有不同</b><p>${esc(title)}</p>${fields}</div>`);
    }
    const omitted = Math.max(0, cloudOnly.length - 8) + Math.max(0, localOnly.length - 8) + Math.max(0, changed.length - 8);
    if (omitted) lines.push(`<p class="sync-empty">${section.label}还有 ${omitted} 项差异未展开，请先选择保留本地或采用云端。</p>`);
    blocks.push(`<section class="sync-readable-section"><h4>${esc(section.label)}</h4>${lines.join("")}</section>`);
  }
  return blocks.join("") || `<p class="sync-empty">云端和本地没有发现可读的字段差异。</p>`;
}
function syncConflictDetails(item) {
  if (item.key === "workspace") return `<div class="sync-readable-diff"><p class="subtle">下面只列出两边不同的内容，便于判断应保留哪一份。</p>${syncWorkspaceDiff(item.local, item.remote)}</div>`;
  return `<div class="sync-readable-columns"><section><h3>云端有</h3>${syncReadableRecord(item.remote, "云端版本")}</section><section><h3>本地有</h3>${syncReadableRecord(item.local, "本地版本")}</section></div>`;
}
function syncConflictSummary(value) {
  if (!value || typeof value !== "object") return "无数据";
  const parts = [];
  for (const key of SYNC_COLLECTIONS) if (Array.isArray(value[key]) && value[key].length) parts.push(`${syncFieldLabel(key)} ${value[key].length} 条`);
  for (const key of SYNC_OBJECTS) if (value[key] && typeof value[key] === "object" && Object.keys(value[key]).length) parts.push(`${syncFieldLabel(key)} ${Object.keys(value[key]).length} 项`);
  return parts.length ? parts.join("、") : "空工作区";
}
function appView() {
  syncReminders();
  const content = { timeline: timelineView, today: todayView, matrix: matrixView, inbox: inboxView, focus: focusView, report: reportView, me: meView }[tab]?.() || timelineView();
  const alerts = tab === "today" || tab === "me" ? notificationCenter() : "";
  const navigation = nav("timeline", "时间轴") + nav("today", "今日") + nav("matrix", "四象限") + nav("inbox", "收集箱") + nav("focus", "专注") + nav("report", "复盘") + nav("me", "我的");
  return `<div class="app"><aside class="sidebar"><div class="brand">SIAWorkTable<small>由新哲文院算法社开发</small></div><nav class="nav">${navigation}</nav><div class="account">${esc(state.user)}<br><span data-sync>${state.session ? (!navigator.onLine ? "离线已保存" : state.settings.syncMode === "local" ? "本地优先 · 未自动同步" : state.syncMeta.pending || state.conflicts.length ? "待同步" : "已同步") : "离线模式"}</span></div></aside><main class="main">${syncConflictMessage ? `<div class="sync-conflict" role="status">${esc(syncConflictMessage)}<button class="icon-btn" data-dismiss-sync-conflict title="关闭提示">×</button></div>` : ""}${(state.conflicts || []).length && state.settings.syncMode === "prompt" ? `<section class="sync-conflict-list"><b>发现 ${state.conflicts.length} 条本地／云端冲突</b><p class="subtle">请逐条选择保留本地或采用云端。选择前不会上传或覆盖任何一方。</p>${state.conflicts.map(item => `<div class="sync-conflict-row"><div class="sync-conflict-detail"><strong>${esc(syncConflictLabel(item))}</strong>${item.key === "workspace" ? `<small>本地：${esc(syncConflictSummary(item.local))}</small><small>云端：${esc(syncConflictSummary(item.remote))}</small>` : ""}<details open><summary>查看云端和本地的详细内容</summary>${syncConflictDetails(item)}</details></div><button class="btn ghost small" data-conflict-choice="local" data-conflict-id="${esc(item.id)}">保留本地</button><button class="btn ghost small" data-conflict-choice="remote" data-conflict-id="${esc(item.id)}">采用云端</button></div>`).join("")}</section>` : ""}${alerts}<div class="quick-capture-bar"><input id="quick-capture" value="${esc(quickCaptureDraft)}" placeholder="快速添加或记录，例如：明天下午三点完成产品方案，预计 60 分钟"><button class="btn primary" id="quick-capture-submit">快速添加</button>${quickCaptureMessage ? `<span class="quick-capture-message" aria-live="polite">${esc(quickCaptureMessage)}</span>` : ""}</div>${content}</main><nav class="mobile-nav">${navigation}</nav>${modal ? modalView() : ""}</div>`;
}
function header(title, subtitle, actions = true) {
  return `<header class="topbar"><div><h1>${title}</h1><p>${subtitle}</p></div>${actions ? '<div class="top-actions"><button class="btn ghost" id="new-goal">新建目标</button><button class="btn primary" id="new-todo">＋ 新建计划</button></div>' : ""}</header>`;
}
function rangeDates(mode) {
  if (mode === "month") return monthDates(selectedDate).filter(date => date.slice(0, 7) === selectedDate.slice(0, 7));
  const count = mode === "day" ? 1 : mode === "3day" ? 3 : 7;
  const start = mode === "week" ? addDays(selectedDate, -((new Date(`${selectedDate}T12:00:00+08:00`).getDay() + 6) % 7)) : selectedDate;
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}
function monthDates(date) {
  const [year, month] = date.split("-").map(Number);
  const first = new Date(`${year}-${String(month).padStart(2, "0")}-01T12:00:00+08:00`);
  const startOffset = (first.getDay() + 6) % 7;
  const days = new Date(year, month, 0).getDate();
  const total = Math.ceil((startOffset + days) / 7) * 7;
  return Array.from({ length: total }, (_, index) => addDays(`${year}-${String(month).padStart(2, "0")}-01`, index - startOffset));
}
function capacityControl(date) {
  const draft = pageInputDrafts[`capacity-${date}`];
  return `<label class="capacity-control">当日可用时间<input type="number" min="0" step="15" data-capacity-date="${date}" value="${esc(draft ?? capacityMinutes(date))}" aria-label="${date} 当日可用分钟"></label>`;
}
function weekBlock(date) {
  const tasks = rootTasksFor(date).sort((a, b) => (a.startTime || "99:99").localeCompare(b.startTime || "99:99"));
  return `<section class="week-block"><div class="week-block-head"><div><b>${date === today ? "今天" : date.slice(5)}</b><span>${tasks.length} 项</span></div>${capacityControl(date)}</div><div class="week-timeblocks">${tasks.map(target => `<button class="time-block" data-edit="${target.id}" style="--accent:${target.color}"><b>${target.startTime || "未定时间"}</b><span>${esc(target.name)}</span><small>${estimateMinutes(target) ? `${estimateMinutes(target)} 分钟` : "未设置时长"}</small></button>`).join("") || '<div class="empty">暂无时间块</div>'}</div></section>`;
}
function monthView(date) {
  const dates = monthDates(date);
  return `<div class="month-grid-head">${["一", "二", "三", "四", "五", "六", "日"].map(label => `<b>${label}</b>`).join("")}</div><div class="month-grid">${dates.map(item => `<button class="month-day ${item.slice(0, 7) === date.slice(0, 7) ? "current-month" : "muted-day"} ${item === today ? "today" : ""}" data-month-date="${item}"><b>${Number(item.slice(8))}</b><span>${tasksFor(item).length ? `${tasksFor(item).length} 项` : ""}</span></button>`).join("")}</div>`;
}
function timelineView() {
  const mode = state.settings.timelineRange || "day";
  const dates = mode === "month" ? [] : rangeDates(mode);
  const content = mode === "month" ? monthView(selectedDate) : mode === "week" ? `<div class="week-board">${dates.map(weekBlock).join("")}</div>` : `<div class="timeline-board">${dates.map(dateColumn).join("")}</div>`;
  return header("时间轴", `${selectedDate} 起 · 中国北京时间`) + `<div class="toolbar"><input id="selected-date" type="date" value="${selectedDate}"><div class="segmented">${[["day", "日"], ["3day", "3日"], ["week", "周"], ["month", "月"]].map(([key, label]) => `<button data-range="${key}" class="${mode === key ? "active" : ""}">${label}</button>`).join("")}</div></div>${content}`;
}
function dateColumn(date) {
  const tasks = rootTasksFor(date).sort((a, b) => (a.startTime || "99:99").localeCompare(b.startTime || "99:99"));
  return `<section class="day-column"><div class="day-head"><div><b>${date === today ? "今天" : date.slice(5)}</b><span>${tasksFor(date).length} 项</span></div>${capacityControl(date)}</div><div class="day-items">${tasks.map(target => compactTask(target, date)).join("") || '<div class="empty">暂无计划</div>'}</div></section>`;
}
function compactTask(target, date, level = 0) {
  const isDone = isCompleteForDate(target, date);
  const deadline = deadlineState(target, date);
  const blocked = dependencyStatus(target, date).blocked;
  const children = childrenOf(target.id).filter(child => child.date && appliesOn(child, date));
  const expanded = expandedTaskIds.has(target.id);
  const toggle = children.length ? `<button class="tree-toggle" data-toggle-task="${target.id}" title="${expanded ? "折叠子任务" : "展开子任务"}">${expanded ? "−" : "+"}</button>` : "<span class=\"tree-spacer\"></span>";
  const childMarkup = expanded ? children.map(child => compactTask(child, date, level + 1)).join("") : "";
  return `<div class="task-tree-node level-${level}"><article class="compact-task ${isDone ? "done" : ""} ${blocked ? "blocked" : ""}" data-swipe-task="${target.id}" data-swipe-date="${date}" style="--accent:${target.color}">${toggle}<button class="check ${isDone ? "checked" : ""}" data-complete="${target.id}" data-date="${date}" aria-label="${target.type === "goal" && isDone ? "再次登记打卡" : isDone ? "撤销完成" : "完成计划"}">${isDone ? "✓" : ""}</button><div class="compact-body"><div><b>${esc(target.name)}</b><span class="type-tag">${target.type === "goal" ? "目标" : "计划"}</span>${blocked ? `<span class="deadline-tag overdue">${esc(dependencyLabel(target, date))}</span>` : ""}${deadline ? `<span class="deadline-tag ${deadline === "逾期" ? "overdue" : ""}">${deadline}</span>` : ""}</div><small>${target.startTime || "未定时间"}${target.endTime ? ` - ${target.endTime}` : ""} · ${estimateMinutes(target) ? `${estimateMinutes(target)} 分钟 · ` : ""}${esc(categoryName(target))}${children.length ? ` · ${children.length} 个子任务` : ""}</small>${target.type === "goal" ? `<div class="mini-progress"><i style="width:${goalPct(target)}%"></i></div><small>${fmt(goalDone(target))}/${fmt(target.total)}${esc(target.unit)} · 今日 ${fmt(target.daily)}${esc(target.unit)}</small>${goalDetails(target)}` : ""}</div>${date === today && !isDone ? `<button class="icon-btn quick-focus" data-quick-focus="${target.id}" title="开始专注：${esc(target.name)}" aria-label="开始专注：${esc(target.name)}">${icon("focus")}</button>` : ""}<button class="icon-btn" data-edit="${target.id}" title="编辑">⋯</button></article>${childMarkup}</div>`;
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
  const rootTasks = rootTasksFor(today);
  return header("今日计划", `${today} · 已完成 ${doneCount}/${tasks.length}`) + `<div class="today-summary"><div><b>${tasks.length}</b><span>今日计划</span></div><div><b>${doneCount}</b><span>已完成</span></div><div class="${loadClass}"><b>${load}/${capacity}</b><span>计划分钟 / 容量</span></div><div><b>${state.focusLogs.filter(x => x.date === today).reduce((a, x) => a + x.minutes, 0)}</b><span>专注分钟</span></div></div>${load > capacity ? `<div class="capacity-alert"><b>今日计划超出容量 ${load - capacity} 分钟</b><span>建议把低优先级任务延后，避免从一开始就无法完成。</span></div>` : `<div class="capacity-ok">今日还可安排约 ${remaining} 分钟${overdue ? ` · ${overdue} 项已逾期` : ""}</div>`}${replanSection}<div class="task-list">${rootTasks.map(target => compactTask(target, today)).join("") || '<div class="empty">今天还没有计划。</div>'}</div><section class="panel note-panel"><h2>今日复盘</h2><textarea id="daily-note" placeholder="今天完成了什么？">${esc(pageInputDrafts["daily-note"] ?? (state.notes[today] || ""))}</textarea><button class="btn ghost" id="save-note">保存复盘</button></section>`;
}
function replanRow(target) {
  const originalDate = target.date;
  return `<article class="replan-row"><div><b>${esc(target.name)}</b><small>原计划：${originalDate}${target.deadline ? ` · 截止：${target.deadline}` : ""}${target.type === "goal" ? " · 未完成目标" : " · 未完成"}</small></div><div class="row-actions"><button class="btn ghost small" data-replan="${target.id}" data-date="${today}">今天</button><button class="btn ghost small" data-replan="${target.id}" data-date="${addDays(today, 1)}">明天</button><button class="btn ghost small" data-replan="${target.id}" data-date="">收集箱</button></div></article>`;
}
function matrixView() {
  const range = matrixRange;
  const dates = range === "month" ? monthDates(selectedDate).filter(date => date.slice(0, 7) === selectedDate.slice(0, 7)) : rangeDates(range);
  const dateSet = new Set(dates);
  const tasks = state.targets.flatMap(item => {
    if (!item.date || !item.quadrant) return [];
    return dates.filter(date => appliesOn(item, date) && !isCompleteForDate(item, date)).map(pendingDate => ({ item, pendingDate }));
  });
  const rangeLabel = range === "day" ? selectedDate : range === "month" ? selectedDate.slice(0, 7) : `${dates[0]} 至 ${dates[dates.length - 1]}`;
  return header("四象限", `${rangeLabel} · 仅显示所选范围内未完成的任务`) + `<div class="toolbar"><input id="matrix-date" type="date" value="${selectedDate}"><div class="segmented">${[["day", "日"], ["3day", "3日"], ["week", "周"], ["month", "月"]].map(([key, label]) => `<button data-matrix-range="${key}" class="${range === key ? "active" : ""}">${label}</button>`).join("")}</div></div><div class="quad-grid">${QUADRANTS.map(([key, label]) => `<section class="quad"><h2>${label}</h2>${tasks.filter(entry => entry.item.quadrant === key).map(({ item, pendingDate }) => `<div class="matrix-item" style="--accent:${item.color};display:flex;align-items:center;gap:8px"><button class="check" data-complete="${item.id}" data-date="${pendingDate}" aria-label="完成 ${esc(item.name)}" title="完成计划"> </button><button data-edit="${item.id}" style="min-width:0;flex:1;text-align:left;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer">${esc(item.name)}<small>${esc(categoryName(item))} · ${pendingDate}</small></button></div>`).join("") || '<div class="empty">暂无任务</div>'}</section>`).join("")}</div>`;
}
function inboxView() {
  const items = state.targets.filter(item => !item.date);
  return header("收集箱", "先记录，准备好后再安排日期") + `<section class="panel"><div class="quick-add inbox-add"><input id="inbox-name" placeholder="快速记录一个想法或待办"><button class="btn primary" id="add-inbox">加入收集箱</button></div><div class="inbox-list">${items.map(item => `<article class="inbox-row"><span class="color-dot" style="background:${item.color}"></span><div><b>${esc(item.name)}</b><small>${esc(categoryName(item))} · 收集于 ${item.created || today}</small></div><div class="row-actions"><button class="btn ghost small" data-schedule="${item.id}" data-date="${today}">今天</button><button class="btn ghost small" data-schedule="${item.id}" data-date="${addDays(today, 1)}">明天</button><button class="btn ghost small" data-edit="${item.id}">自选日期</button></div></article>`).join("") || '<div class="empty">收集箱是空的。</div>'}</div></section>`;
}
function focusTasksForToday() {
  const tasks = tasksFor(today).filter(item => item.type === "goal" ? !isCompleteForDate(item, today) : !completion(item.id, today));
  if (focusTargetId && !tasks.some(item => item.id === focusTargetId)) focusTargetId = "";
  return tasks;
}
function focusView() {
  const minutes = Math.floor(focusRemaining / 60).toString().padStart(2, "0");
  const seconds = (focusRemaining % 60).toString().padStart(2, "0");
  const focusTasks = focusTasksForToday();
  return header("专注计时", "专注记录会计入今日复盘", false) + `<section class="focus-panel panel ${focusTimer ? "focus-fullscreen-ready" : ""}"><div class="focus-clock">${minutes}:${seconds}</div><div class="segmented focus-presets">${[15, 25, 45, 60].map(value => `<button data-focus-minutes="${value}">${value} 分钟</button>`).join("")}</div><select id="focus-target"><option value="">不关联计划</option>${focusTasks.map(item => `<option value="${item.id}" ${focusTargetId === item.id ? "selected" : ""}>${esc(item.name)}</option>`).join("")}</select><div class="card-actions"><button class="btn primary" id="focus-toggle">${focusTimer ? "暂停" : "开始专注"}</button><button class="btn ghost" id="focus-reset">重置</button><button class="btn ghost" id="focus-fullscreen">全屏</button></div></section>`;
}
function reportView() {
  requestBrowserReminderPermission();
  const mode = reportRange;
  const dates = mode === "month" ? monthDates(selectedDate).filter(date => date.slice(0, 7) === selectedDate.slice(0, 7)) : rangeDates(mode);
  const start = dates[0] || selectedDate;
  const end = dates.at(-1) || selectedDate;
  const dateSet = new Set(dates);
  const weekLogs = state.logs.filter(log => dateSet.has(log.date));
  const focus = state.focusLogs.filter(log => dateSet.has(log.date));
  const completed = weekLogs.filter(log => log.kind === "complete");
  const totalEstimate = completed.reduce((sum, log) => sum + Number(log.estimateMinutes ?? targetById(log.targetId)?.estimateMinutes ?? 0), 0) + weekLogs.filter(log => log.kind === "progress").reduce((sum, log) => sum + Number(log.estimateMinutes ?? targetById(log.targetId)?.estimateMinutes ?? 0), 0);
  const totalActual = weekLogs.reduce((sum, log) => sum + Number(log.minutes || 0), 0);
  const totalCapacity = dates.reduce((sum, date) => sum + capacityMinutes(date), 0);
  const history = (state.history || []).slice().reverse().slice(0, 100);
  const visibleHistory = taskHistoryExpanded ? history : history.slice(0, 3);
  const historyPanel = `<section class="panel history-panel"><div class="section-head"><h2>任务历史</h2>${history.length > 3 ? `<button class="btn ghost small" id="toggle-task-history">${taskHistoryExpanded ? "收起" : `展开其余 ${history.length - 3} 条`}</button>` : ""}</div>${visibleHistory.map(item => `<article class="history-row"><b>${esc(item.action)}</b><span>${esc(targetById(item.targetId)?.name || "已删除任务")}</span><small>${item.at ? new Date(item.at).toLocaleString("zh-CN") : ""}</small></article>`).join("") || '<div class="empty">暂无任务修改记录</div>'}</section>`;
  const rangeToolbar = `<div class="toolbar"><input id="report-date" type="date" value="${selectedDate}"><div class="segmented">${[["day", "日"], ["3day", "3日"], ["week", "周"], ["month", "月"]].map(([key, label]) => `<button data-report-range="${key}" class="${mode === key ? "active" : ""}">${label}</button>`).join("")}</div></div>`;
  const dailyRows = dates.map(date => { const dayLogs = weekLogs.filter(log => log.date === date); const dayCompleted = dayLogs.filter(log => log.kind === "complete"); const estimate = dayLogs.filter(log => log.kind === "complete" || log.kind === "progress").reduce((sum, log) => sum + Number(log.estimateMinutes ?? targetById(log.targetId)?.estimateMinutes ?? 0), 0); const actual = dayLogs.reduce((sum, log) => sum + Number(log.minutes || 0), 0); return `<tr><th>${date}</th><td>${fmt(actual)}</td><td>${fmt(estimate)}</td><td>${fmt(capacityMinutes(date))}</td></tr>`; }).join("");
  return header("复盘统计", `${start} 至 ${end}`, false) + rangeToolbar + `<div class="stats-grid"><div class="metric"><b>${weekLogs.filter(x => x.kind === "complete").length}</b><span>完成计划</span></div><div class="metric"><b>${fmt(weekLogs.reduce((a, x) => a + Number(x.amount || 0), 0))}</b><span>目标完成量</span></div><div class="metric"><b>${focus.reduce((a, x) => a + Number(x.minutes || 0), 0)}</b><span>专注分钟</span></div><div class="metric"><b>${new Set(weekLogs.map(x => x.date)).size}</b><span>活跃天数</span></div><div class="metric"><b>${fmt(totalEstimate)}</b><span>计划用时（分钟）</span></div><div class="metric"><b>${fmt(totalActual)}</b><span>实际用时（分钟）</span></div><div class="metric"><b>${fmt(totalCapacity)}</b><span>当日配额（分钟）</span></div><div class="metric"><b>${completed.length ? fmt(totalActual / completed.length) : 0}</b><span>平均耗时</span></div><div class="metric"><b>${fmt(state.targets.reduce((sum, item) => sum + Number(item.postponeCount || 0), 0))}</b><span>延期次数</span></div></div><section class="panel"><h2>每日用时与配额</h2><div class="daily-review-table-wrap"><table class="daily-review-table"><thead><tr><th>日期</th><th>实际用时</th><th>计划用时</th><th>当日配额</th></tr></thead><tbody>${dailyRows}</tbody></table></div></section><section class="panel"><h2>${mode === "month" ? selectedDate.slice(0, 7) : `${start} 至 ${end}`} 完成记录</h2><div class="bar-chart">${dates.map(date => { const dayLogs = state.logs.filter(x => x.date === date); const count = dayLogs.length; const completeCount = dayLogs.filter(x => x.kind === "complete").length; const goalAmount = dayLogs.filter(x => x.kind === "progress").reduce((sum, item) => sum + Number(item.amount || 0), 0); const focusMinutes = focus.filter(x => x.date === date).reduce((sum, item) => sum + Number(item.minutes || 0), 0); const details = `${date}：${count} 条记录，完成 ${completeCount} 项，目标进度 ${goalAmount}，专注 ${focusMinutes} 分钟`; return `<div class="chart-bar" tabindex="0" title="${esc(details)}" aria-label="${esc(details)}"><i style="height:${Math.max(8, count * 24)}px"></i><span>${date.slice(8)}</span><small class="chart-tooltip">${esc(details)}</small></div>`; }).join("")}</div></section><section class="panel"><h2>每日笔记</h2>${Object.entries(state.notes).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7).map(([date, note]) => `<div class="note-entry"><b>${date}</b><p>${esc(note)}</p></div>`).join("") || '<div class="empty">暂无复盘笔记</div>'}</section>${historyPanel}`;
}
function categoryManager() {
  return `<div class="category-list">${state.categories.map(category => `<div class="category-row"><input class="category-color-input" id="category-color-${category.id}" type="color" value="${category.color}"><input id="category-name-${category.id}" value="${esc(category.name)}" aria-label="分类名称"><button class="btn ghost small" data-category-save="${category.id}">保存</button><button class="icon-btn danger-text" data-category-delete="${category.id}" title="删除分类">×</button></div>`).join("")}</div><div class="quick-add category-add"><input id="category-color" class="category-color-input" type="color" value="${COLORS[state.categories.length % COLORS.length]}"><input id="category-name" placeholder="输入新分类名称"><button class="btn primary" id="add-category">添加分类</button></div><p class="subtle">删除分类不会删除计划，相关计划会转为“未分类”。</p>`;
}
function templateManager() {
  const custom = state.templates || [];
  return `<div class="template-grid">${BUILTIN_TEMPLATES.map(template => `<article class="template-card"><div><b>${esc(template.name)}</b><p>${esc(template.description)}</p><small>${template.tasks.length} 个阶段 · 内置模板</small></div><button class="btn primary small" data-template-apply="${template.id}">使用模板</button></article>`).join("")}${custom.map(template => `<article class="template-card"><div><b>${esc(template.name)}</b><p>${esc(template.description || "自定义模板")}</p><small>自定义模板 · ${template.tasks?.length || 0} 个阶段</small></div><div class="card-actions"><button class="btn primary small" data-template-apply="${template.id}">使用</button><button class="btn ghost small" data-template-edit="${template.id}">编辑</button><button class="btn ghost small" data-template-delete="${template.id}">删除</button></div></article>`).join("")}</div><div class="quick-add template-add"><button class="btn primary" id="new-template">新建模板</button></div>`;
}
function notificationCenter() {
  const items = (state.notifications || []).slice(0, 50);
  const expanded = Boolean(notificationCenterExpanded);
  const visibleItems = expanded ? items : items.slice(0, 3);
  return `<section class="panel notification-panel"><div class="section-head"><div><h2>提醒中心</h2><p>保留最新 ${items.length}/50 条提醒</p></div><div class="card-actions"><button class="btn ghost small" id="mark-notifications-read">全部已读</button>${items.length > 3 ? `<button class="btn ghost small" id="toggle-notifications">${expanded ? "收起" : `展开其余 ${items.length - 3} 条`}</button>` : ""}</div></div><div class="notification-list">${visibleItems.map(item => `<article class="notification-row ${item.read ? "read" : "unread"}"><span class="notification-dot ${item.kind}"></span><div><b>${esc(item.title)}</b><p>${esc(item.message)}</p><small>${item.createdAt ? new Date(item.createdAt).toLocaleString("zh-CN") : ""}</small></div></article>`).join("") || '<div class="empty">暂无提醒</div>'}</div></section>`;
}
async function restoreTrashBatch(batchId) {
  const entries = (state.trash || []).filter(item => (item.restoreBatchId || item.id) === batchId);
  if (!entries.length) return;
  const duplicates = entries.filter(item => state.targets.some(target => target.id === item.id));
  if (duplicates.length) { alert(`已有 ${duplicates.length} 个同 ID 任务，恢复已取消，请先处理重复任务。`); return; }
  const targetIds = new Set(entries.map(item => item.id));
  const relatedKeys = ["logs", "plans", "focusLogs", "notifications", "history", "subtasks"];
  const relatedDuplicates = relatedKeys.flatMap(key => entries.flatMap(item => (item.related?.[key] || []).filter(record => (state[key] || []).some(existing => existing.id === record.id)).map(record => `${key}:${record.id}`)));
  if (relatedDuplicates.length && !confirm(`关联记录有 ${relatedDuplicates.length} 条 ID 冲突，将保留当前记录，跳过同 ID 的恢复记录。继续吗？`)) return;
  const restoreUnique = (key, items) => {
    const existing = new Set((state[key] || []).map(item => item.id));
    state[key] = [...(state[key] || []), ...(items || []).filter(item => { if (!item?.id || existing.has(item.id)) return false; existing.add(item.id); return true; })];
  };
  restoreUnique("targets", entries.map(({ related, deletedAt, deletedFrom, restoreBatchId, ...target }) => target));
  relatedKeys.forEach(key => restoreUnique(key, entries.flatMap(item => item.related?.[key] || [])));
  state.trash = (state.trash || []).filter(item => (item.restoreBatchId || item.id) !== batchId);
  state.targets = normalizeTargetTree(state.targets, state.subtasks);
  const dependencySnapshots = entries.flatMap(item => item.related?.dependencySnapshots || []);
  state.targets.forEach(target => {
    const snapshot = dependencySnapshots.find(item => item.id === target.id);
    if (snapshot) target.dependsOn = [...new Set([...(target.dependsOn || []), ...snapshot.dependsOn.filter(id => targetIds.has(id))])];
  });
  state.history = (state.history || []).slice(-100);
  state.notifications = (state.notifications || []).slice(0, 50);
  saveLocal();
  await sync();
  syncConflictMessage = `已恢复 ${targetIds.size} 个任务及其关联记录。`;
  render(true);
}
function meView() {
  const changelog = [
    ["V1", "建立目标管理基础：目标、打卡、补记、连续天数与数据导入导出。"],
    ["V2", "接入账号体系与 Supabase 云同步，支持登录后跨设备保存工作区。"],
    ["V3", "升级为目标与普通计划双模型，加入重复规则、四象限、收集箱、专注计时与复盘统计。"],
    ["V4", "支持稳定 ID 自定义分类、计划颜色，以及基础信息、执行方式、高级设置三步编辑流程。"],
    ["V5", "加入预计用时、每日容量、硬截止、逾期提醒与 Replan 遗留任务重排。"],
    ["V6", "加入自然语言快速添加、全局收集箱入口、月视图和周视图时间块。"],
    ["V6.1", "加入前置/后置依赖、阻塞提示、自动顺延、两级子任务容量汇总和八类任务模板。"],
    ["V6.2", "加入页面提醒、提醒中心、任务历史、实际用时选择和延期统计。"]
  ];
  const trashItems = (state.trash || []).slice().sort((a, b) => String(b.deletedAt || "").localeCompare(String(a.deletedAt || "")));
  const trashBatches = [...new Map(trashItems.map(item => [item.restoreBatchId || item.id, item])).values()];
  const trashPanel = `<section class="panel"><h2>回收站 · ${trashItems.length}</h2><p class="subtle">恢复会一并恢复任务、日志、专注记录、历史、子任务和依赖关系。</p><div class="trash-list">${trashBatches.map(item => `<div class="trash-row"><div><b>${esc(item.name)}</b><span>${esc(item.deletedAt ? new Date(item.deletedAt).toLocaleString("zh-CN") : "历史删除")}</span></div><button class="btn ghost small" data-restore-trash="${esc(item.restoreBatchId || item.id)}">恢复</button></div>`).join("") || '<div class="empty">回收站为空</div>'}</div></section>`;
  const backups = readBackups();
  const backupPanel = `<section class="panel"><div class="section-head"><div><h2>本地备份</h2><p>自动保留最近 ${MAX_BACKUPS} 个版本，恢复前会先创建当前数据备份。</p></div><button class="btn ghost small" id="backup-now">立即备份</button></div><div class="backup-list">${backups.map(item => `<div class="trash-row"><div><b>${esc(item.reason)}</b><span>${new Date(item.createdAt).toLocaleString("zh-CN")} · ${item.payload.targets?.length || 0} 个任务/目标</span></div><button class="btn ghost small" data-restore-backup="${esc(item.id)}">恢复</button></div>`).join("") || '<div class="empty">暂时没有备份</div>'}</div></section>`;
  return header("我的", "账号、分类、模板、奖励与数据", false) + trashPanel + backupPanel + `<div class="settings-grid"><section class="panel sync-account-panel"><h2>账号同步</h2><p>${esc(state.user)} · <span data-sync>${state.session ? (state.settings.syncMode === "local" ? "本地优先 · 可手动上传" : state.syncMeta.pending || state.conflicts.length ? "待同步" : "已同步") : "离线模式"}</span></p><div class="card-actions"><button class="btn ghost" id="sync-now">立即同步</button><button class="btn ghost" id="pull-cloud">拉取云端</button><button class="btn ghost" id="push-cloud">上传云端</button><button class="btn ghost" id="export-json">导出 JSON</button><button class="btn ghost" id="export-csv">导出 CSV</button><button class="btn ghost" id="export-md">导出 Markdown</button><button class="btn ghost" id="export-ics">导出日历 ICS</button><label class="btn ghost">导入 JSON<input id="import-json" type="file" accept="application/json" hidden></label><button class="btn danger" id="delete-account">删除账号</button><button class="btn danger" id="logout">退出登录</button></div></section><section class="panel category-panel"><div class="section-head"><div><h2>分类管理</h2><p>用名称和颜色区分不同领域</p></div></div>${categoryManager()}</section><section class="panel template-panel"><div class="section-head"><div><h2>任务模板</h2><p>选择起始日期后，一次生成阶段、依赖和预计用时</p></div></div>${templateManager()}</section><section class="panel"><h2>积分与装扮</h2><p class="big-number">${state.rewards.points || 0} 分</p><p class="subtle">完成普通计划 +5 分，完成一次目标记录 +3 分。</p><div class="theme-row"><button data-theme="cold" class="theme cold">冷白紫</button><button data-theme="mint" class="theme mint">薄荷绿</button><button data-theme="sunset" class="theme sunset">夕阳橙</button></div></section><section class="panel"><h2>云端同步方式</h2><p class="subtle">本地优先不会主动读取云端；云端优先联网后以云端为准，掉线时使用本地备份。</p><label class="field"><span>同步策略</span><select id="sync-mode"><option value="local" ${state.settings.syncMode === "local" ? "selected" : ""}>本地优先</option><option value="prompt" ${state.settings.syncMode === "prompt" ? "selected" : ""}>冲突时询问</option><option value="cloud" ${state.settings.syncMode === "cloud" ? "selected" : ""}>云端优先</option></select></label><label class="field"><span>同时修改时</span><select id="conflict-resolution"><option value="ask" ${state.settings.conflictResolution !== "newest" ? "selected" : ""}>对比后选择</option><option value="newest" ${state.settings.conflictResolution === "newest" ? "selected" : ""}>采用更新时间较新的版本</option></select></label></section><section class="panel"><h2>自动顺延</h2><label class="field"><span>允许自动顺延到周末</span><select id="allow-weekend-replan"><option value="false" ${state.settings.allowWeekendReplan ? "" : "selected"}>否，默认避开周末</option><option value="true" ${state.settings.allowWeekendReplan ? "selected" : ""}>是，允许排到周末</option></select></label></section><section class="panel"><div class="section-head"><div><h2>提醒设置</h2><p id="browser-notification-status">${esc(notificationSetupMessage || (notificationSupportState() === "granted" ? "Windows 系统通知已允许" : notificationSupportState() === "denied" ? "系统通知被浏览器或 Windows 拒绝" : notificationSupportState() === "unsupported" ? "当前浏览器不支持系统通知" : "需要点击按钮授权 Windows 系统通知"))}</p></div><button class="btn ghost small" id="enable-browser-notifications" ${notificationSupportState() === "unsupported" ? "disabled" : ""}>${notificationSupportState() === "granted" ? "发送测试通知" : "启用系统通知"}</button></div><label class="field"><span>页面提醒</span><select id="reminder-enabled"><option value="false" ${state.settings.reminderEnabled ? "" : "selected"}>关闭</option><option value="true" ${state.settings.reminderEnabled ? "selected" : ""}>开启</option></select></label><label class="field"><span>截止日期提前提醒</span><select id="reminder-lead-days"><option value="0" ${Number(state.settings.reminderLeadDays) === 0 ? "selected" : ""}>当天</option><option value="1" ${Number(state.settings.reminderLeadDays) === 1 ? "selected" : ""}>提前 1 天</option><option value="2" ${Number(state.settings.reminderLeadDays) === 2 ? "selected" : ""}>提前 2 天</option><option value="3" ${Number(state.settings.reminderLeadDays) === 3 ? "selected" : ""}>提前 3 天</option></select></label></section><section class="panel"><h2>数据管理</h2><div class="card-actions"><button class="btn ghost" id="reset-examples">恢复示例</button><button class="btn danger" id="clear-all">清空数据</button></div></section><section class="panel changelog-panel"><div class="section-head"><div><h2>更新日志</h2><p>SIAWorkTable 从 V1 到 V6 的主要更新</p></div></div><div class="changelog-list">${changelog.map(([version, text]) => `<article class="changelog-row"><b>${version}</b><p>${text}</p></article>`).join("")}</div></section><section class="panel feedback-panel"><div class="section-head"><div><h2>意见反馈</h2><p>你的建议会写入 Supabase，帮助我们持续改进。</p></div></div><div class="form-grid"><label class="field">反馈类型<select id="feedback-type"><option value="功能建议">功能建议</option><option value="bug反馈">bug反馈</option><option value="其他">其他</option></select></label><label class="field">联系方式类型<select id="feedback-contact-type"><option value="">不填写</option><option value="手机号">手机号</option><option value="微信号">微信号</option><option value="QQ">QQ</option><option value="邮箱">邮箱</option></select></label><label class="field wide">联系方式<input id="feedback-contact" maxlength="100" placeholder="可选"></label><label class="field wide">具体反馈内容<textarea id="feedback-content" maxlength="500" placeholder="请描述你的建议、问题或其他反馈（最多 500 字）"></textarea><small class="feedback-count" id="feedback-count">0 / 500</small></label></div><div class="card-actions"><button class="btn primary" id="submit-feedback">提交反馈</button><span class="subtle" id="feedback-msg" aria-live="polite"></span></div></section><footer class="site-footer">新哲文院算法社官网：<a href="https://ada.nz/r/sfs" target="_blank" rel="noopener noreferrer">https://ada.nz/r/sfs</a></footer></div>`;
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
    const initialDate = modal.templateTaskId ? "" : (target.id ? (target.date || "") : (target.date ?? today));
    const chosenDate = draftValue("f-date", initialDate);
    return `<div class="form-grid"><label class="field wide">计划名称<input id="f-name" value="${esc(draftValue("f-name", target.name || ""))}" placeholder="例如：完成产品需求文档" autofocus></label><label class="field wide">计划类型<select id="f-type"><option value="todo" ${type === "todo" ? "selected" : ""}>每日计划 / 待办</option><option value="goal" ${type === "goal" ? "selected" : ""}>可累计的总量目标</option></select><small>普通计划可以点击完成；总量目标用于累计页数、次数或时长。</small></label><label class="field wide">分类<div class="inline-select"><select id="f-category">${categoryOptions(selectedCategory)}</select><button type="button" class="btn ghost" id="toggle-inline-category">新建分类</button></div></label><div class="inline-category ${modal.showCategoryCreator ? "show" : ""}"><input id="f-new-category-color" class="category-color-input" type="color" value="${COLORS[state.categories.length % COLORS.length]}"><input id="f-new-category" placeholder="分类名称"><button type="button" class="btn primary" id="add-category-inline">创建并选中</button></div><div class="field wide"><span>安排日期</span><div class="date-shortcuts"><button type="button" class="choice ${chosenDate === today ? "active" : ""}" data-date-choice="${today}">今天</button><button type="button" class="choice ${chosenDate === addDays(today, 1) ? "active" : ""}" data-date-choice="${addDays(today, 1)}">明天</button><button type="button" class="choice ${!chosenDate ? "active" : ""}" data-date-choice="">放入收集箱</button></div><input id="f-date" type="date" value="${esc(chosenDate)}"></div></div>`;
  }
  if (step === 2 && type === "goal") {
    const planOptions = state.targets.filter(item => item.type === "todo" && item.id !== target.id).map(item => `<option value="${item.id}" ${(draftValue("f-linked-plans", target.id ? state.targets.filter(plan => plan.type === "todo" && plan.goalId === target.id).map(plan => plan.id) : []).includes(item.id)) ? "selected" : ""}>${esc(item.name)} · ${esc(item.date || "收集箱")}</option>`).join("");
    const milestoneRows = goalMilestonesFor({ ...target, milestones: draftValue("f-milestones", target.milestones || []) }, Number(draftValue("f-total", target.total || 0))).map(item => `<div class="milestone-editor-row"><span class="milestone-name">${esc(item.name)}</span><span>${fmt(item.amount)} ${esc(draftValue("f-unit", target.unit || "次"))}</span></div>`).join("");
    return `<div class="step-intro"><b>设置目标节奏</b><span>达到设定累计量时记录里程碑</span></div><div class="form-grid"><label class="field">目标总量<input id="f-total" type="number" min="1" value="${esc(draftValue("f-total", target.total || ""))}" placeholder="例如：2000"></label><label class="field">单位<input id="f-unit" value="${esc(draftValue("f-unit", target.unit || "次"))}" placeholder="个、页、分钟"></label><label class="field">每日计划量<input id="f-daily" type="number" min="1" value="${esc(draftValue("f-daily", target.daily || 1))}"></label><label class="field">硬截止日期<input id="f-deadline" type="date" value="${esc(draftValue("f-deadline", target.deadline || target.due || target.date || today))}"></label>${target.id && target.deadline ? `<label class="field wide">本次延期原因<input id="f-postpone-reason" value="${esc(draftValue("f-postpone-reason", ""))}" placeholder="仅截止日期后移时必填"></label>` : ""}<div class="field wide"><span>默认里程碑</span><div id="milestone-list">${milestoneRows}</div><small>按目标总量自动生成累计节点；达到对应数量时自动标记完成。</small></div><label class="field wide">关联普通计划<select id="f-linked-plans" multiple size="${Math.min(5, Math.max(2, state.targets.filter(item => item.type === "todo").length))}">${planOptions}</select><small>一个目标可关联多个普通计划。</small></label><label class="field">预计用时（分钟）<input id="f-estimate" type="number" min="0" step="5" value="${esc(draftValue("f-estimate", target.estimateMinutes || ""))}" placeholder="例如：30"></label><label class="field">开始时间<input id="f-start" type="time" value="${esc(draftValue("f-start", target.startTime || ""))}"></label><label class="field">结束时间<input id="f-end" type="time" value="${esc(draftValue("f-end", target.endTime || ""))}"></label>${repeatFields(target)}<input id="f-completion" type="hidden" value="detail"></div>`;
  }
  if (step === 2) {
    const templateDependencies = modal.templateTaskId && templateDraft ? templateDraft.tasks.filter(item => item.id !== modal.templateTaskId).map(item => ({ ...item, date: "template" })) : [];
    const possibleDependencies = [...(modal.templateTaskId ? [] : state.targets.filter(item => canUseAsDependency(item, target.id) && item.id !== target.parentId && !descendantsOf(target.id).some(child => child.id === item.id))), ...templateDependencies];
    const selectedDependencies = Array.isArray(draftValue("f-depends", target.dependsOn || [])) ? draftValue("f-depends", target.dependsOn || []).filter(id => possibleDependencies.some(item => item.id === id)) : [];
    const goalOptions = state.targets.filter(item => item.type === "goal" && item.id !== target.id).map(item => `<option value="${item.id}" ${draftValue("f-goal-id", target.goalId || "") === item.id ? "selected" : ""}>${esc(item.name)} · ${goalPct(item)}%</option>`).join("");
    return `<div class="step-intro"><b>设置执行方式</b><span>不确定时保持默认即可</span></div><div class="form-grid"><label class="field wide">主要目标<select id="f-goal-id"><option value="">不关联目标</option>${goalOptions}</select><small>每个普通计划最多关联一个主要目标。</small></label><label class="field">预计用时（分钟）<input id="f-estimate" type="number" min="0" step="5" value="${esc(draftValue("f-estimate", target.estimateMinutes || ""))}" placeholder="例如：30"></label><label class="field wide">前置任务<select id="f-depends" multiple size="${Math.min(5, Math.max(2, possibleDependencies.length))}">${possibleDependencies.map(item => `<option value="${item.id}" ${selectedDependencies.includes(item.id) ? "selected" : ""}>${esc(item.name)} · ${item.date === "template" ? "模板序列" : `安排于 ${item.date}`}</option>`).join("")}</select><small>前置任务未完成时，本任务显示阻塞提醒。</small></label><label class="field">父任务<select id="f-parent"><option value="">无父任务</option>${state.targets.filter(item => canUseAsParent(item, target.id) && !descendantsOf(target.id).some(child => child.id === item.id)).map(item => `<option value="${item.id}" ${draftValue("f-parent", target.parentId || "") === item.id ? "selected" : ""}>${esc(item.name)} · 安排于 ${item.date}</option>`).join("")}</select></label><label class="field">硬截止日期<input id="f-deadline" type="date" value="${esc(draftValue("f-deadline", target.deadline || ""))}"></label><label class="field">开始时间<input id="f-start" type="time" value="${esc(draftValue("f-start", target.startTime || ""))}"></label><label class="field">结束时间<input id="f-end" type="time" value="${esc(draftValue("f-end", target.endTime || ""))}"></label><label class="field wide">完成方式<select id="f-completion"><option value="quick" ${draftValue("f-completion", target.completionMode || "quick") === "quick" ? "selected" : ""}>点击即完成</option><option value="detail" ${draftValue("f-completion", target.completionMode || "quick") === "detail" ? "selected" : ""}>完成时填写分钟与备注</option></select></label>${repeatFields(target)}<input id="f-total" type="hidden" value=""><input id="f-unit" type="hidden" value="次"><input id="f-daily" type="hidden" value="1"></div>`;
  }
  return `<div class="step-intro"><b>高级设置</b><span>用于排序、辨识和补充说明</span></div><div class="form-grid">${modal.templateTaskId ? `<label class="field">模板日期偏移（天）<input id="f-offset" type="number" min="0" value="${esc(draftValue("f-offset", target.offset || 0))}"><small>使用模板时，从用户选择的起始日期计算。</small></label>` : ""}<label class="field">硬截止提醒<select id="f-deadline-alert"><option value="2" ${String(draftValue("f-deadline-alert", state.settings.deadlineAlertDays ?? 2)) === "2" ? "selected" : ""}>提前 2 天</option><option value="1" ${String(draftValue("f-deadline-alert", state.settings.deadlineAlertDays ?? 2)) === "1" ? "selected" : ""}>提前 1 天</option><option value="0" ${String(draftValue("f-deadline-alert", state.settings.deadlineAlertDays ?? 2)) === "0" ? "selected" : ""}>只提醒当天</option></select></label><label class="field wide">四象限<select id="f-quadrant">${QUADRANTS.map(([value, label]) => `<option value="${value}" ${draftValue("f-quadrant", target.quadrant || "important-not-urgent") === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><div class="field wide"><span>计划颜色</span><div class="color-picker">${COLORS.map(color => `<button type="button" class="color-swatch ${draftValue("f-color", target.color || COLORS[0]) === color ? "selected" : ""}" data-color="${color}" style="--swatch:${color}" aria-label="选择颜色 ${color}"></button>`).join("")}</div><input id="f-color" type="hidden" value="${esc(draftValue("f-color", target.color || COLORS[0]))}"></div><label class="field wide">备注<textarea id="f-note" placeholder="补充资料、执行标准或提醒">${esc(draftValue("f-note", target.note || ""))}</textarea></label></div>`;
}
function templateSequenceView() {
  const draft = templateDraft || { name: "", description: "", categoryName: "学习", tasks: [] };
  return `<div class="modal"><section class="modal-card template-editor-card"><div class="modal-head"><div><h2>${draft.id ? "编辑" : "新建"}模板</h2><p>先设置模板信息，再编排模板任务序列</p></div><button type="button" class="icon-btn" id="close-modal" aria-label="关闭">×</button></div><div class="form-grid"><label class="field">模板名称<input id="template-draft-name" value="${esc(draft.name)}" placeholder="例如：期末考试复习"></label><label class="field">所属分类<select id="template-draft-category">${state.categories.map(category => `<option value="${esc(category.name)}" ${draft.categoryName === category.name ? "selected" : ""}>${esc(category.name)}</option>`).join("")}</select></label><label class="field wide">模板说明<textarea id="template-draft-description" placeholder="说明模板适合什么场景">${esc(draft.description || "")}</textarea></label></div><div class="template-sequence-head"><div><h3>模板任务序列</h3><p>模板任务不会立即加入你的计划，保存模板后使用时才生成正式任务。</p></div><div class="card-actions"><button class="btn primary" id="template-add-task">新建任务</button><button class="btn ghost" id="template-add-goal">新建目标</button></div></div><div class="template-sequence-list">${draft.tasks.map((task, index) => `<article class="template-task-row"><span class="template-task-index">${index + 1}</span><div><b>${esc(task.name)}</b><small>${task.type === "goal" ? "目标" : "计划"} · ${task.estimateMinutes || 0} 分钟 · ${task.offset || 0} 天后</small></div><div class="card-actions"><button class="btn ghost small" data-template-task-edit="${task.id}">编辑</button><button class="btn ghost small" data-template-task-delete="${task.id}">删除</button></div></article>`).join("") || '<div class="empty">还没有模板任务，请新建第一个任务。</div>'}</div><div class="modal-actions"><button class="btn ghost" id="template-cancel">取消</button><button class="btn primary" id="template-save">保存模板</button></div></section></div>`;
}
function modalView() {
  if (modal.type === "template") return templateSequenceView();
  if (modal.type === "edit") {
    const target = modal.target || { type: modal.taskType || "todo", color: COLORS[0], quadrant: "important-not-urgent", categoryId: state.categories[0]?.id || null, completionMode: "quick", repeat: { mode: "none" }, date: today };
    const step = modal.step || 1;
    return `<div class="modal"><section class="modal-card editor-card"><div class="modal-head"><div><h2>${target.id ? "编辑" : "新建"}${draftValue("f-type", target.type) === "goal" ? "目标" : "计划"}</h2><p>第 ${step} 步，共 3 步</p></div><button type="button" class="icon-btn" id="close-modal" aria-label="关闭">×</button></div><div class="stepper">${[1, 2, 3].map(number => `<span class="${number <= step ? "active" : ""}"><i>${number}</i>${["基础信息", "执行方式", "高级设置"][number - 1]}</span>`).join("")}</div><div class="editor-body">${editorStep(target, step)}</div><div class="modal-actions">${target.id && step === 1 ? '<button type="button" class="btn danger" id="delete-target">删除</button>' : '<span></span>'}<div>${step > 1 ? '<button type="button" class="btn ghost" id="editor-prev">上一步</button>' : ""}${step < 3 ? '<button type="button" class="btn primary" id="editor-next">下一步</button>' : '<button type="button" class="btn primary" id="save-target">保存计划</button>'}</div></div></section></div>`;
  }
  if (modal.type === "goal-summary") {
    return `<div class="modal"><section class="modal-card small-modal"><div class="modal-head"><div><h2>目标已完成</h2><p>${esc(modal.target.name)}</p></div><button type="button" class="icon-btn" id="close-modal" aria-label="跳过总结">×</button></div><label class="field">成果<textarea id="summary-achievement" placeholder="完成了什么"></textarea></label><label class="field">心得<textarea id="summary-learning" placeholder="有什么收获"></textarea></label><label class="field">备注<textarea id="summary-note" placeholder="可选"></textarea></label><div class="modal-actions"><button class="btn ghost" id="skip-goal-summary">跳过</button><button class="btn primary" id="save-goal-summary">保存总结</button></div></section></div>`;
  }
  if (modal.type === "complete") {
    const target = modal.target;
    return `<div class="modal"><section class="modal-card small-modal"><div class="modal-head"><h2>记录完成</h2><button type="button" class="icon-btn" id="close-modal">×</button></div>${target.type === "goal" ? `<label class="field">完成数量<input id="c-amount" type="number" min="1" value="${target.daily || 1}"></label>` : '<input id="c-amount" type="hidden" value="1">'}<label class="field wide">实际用时来源<select id="c-minutes-mode"><option value="manual">手动输入实际投入分钟</option><option value="elapsed">使用创建到完成的时间</option></select></label><label class="field" id="manual-minutes-field">投入分钟<input id="c-minutes" type="number" min="0" value=""></label><p class="subtle">不会自动合并专注计时和这里填写的分钟。</p><label class="field">备注<textarea id="c-note"></textarea></label><button class="btn primary full" id="save-complete">确认完成</button></section></div>`;
  }
  return "";
}
function refreshMilestonePreview() {
  const list = document.getElementById("milestone-list");
  if (!list || modal?.type !== "edit") return;
  captureFormDraft();
  const target = modal.target || {};
  const milestones = goalMilestonesFor({ ...target, milestones: formDraft?.["f-milestones"] || target.milestones || [] }, Number(draftValue("f-total", target.total || 0)));
  const unit = String(draftValue("f-unit", target.unit || "次"));
  list.innerHTML = milestones.map(item => `<div class="milestone-editor-row"><span class="milestone-name">${esc(item.name)}</span><span>${fmt(item.amount)} ${esc(unit)}</span></div>`).join("");
}
function bind() {
  document.querySelectorAll("[data-tab]").forEach(button => button.onclick = () => { tab = button.dataset.tab; render(true); });
  document.querySelectorAll("#new-todo").forEach(button => button.onclick = () => openEditor(null, "todo"));
  document.querySelectorAll("#new-goal").forEach(button => button.onclick = () => openEditor(null, "goal"));
  document.querySelectorAll("[data-edit]").forEach(button => button.onclick = () => openEditor(button.dataset.edit));
  document.querySelectorAll("[data-toggle-task]").forEach(button => button.onclick = event => { event.stopPropagation(); const id = button.dataset.toggleTask; if (expandedTaskIds.has(id)) expandedTaskIds.delete(id); else expandedTaskIds.add(id); render(true); });
  document.querySelectorAll("[data-complete]").forEach(button => button.onclick = () => toggleComplete(button.dataset.complete, button.dataset.date));
  document.querySelectorAll("[data-quick-focus]").forEach(button => button.onclick = () => { focusTargetId = button.dataset.quickFocus; tab = "focus"; render(true); if (!focusTimer) toggleFocus(); });
  document.querySelectorAll("[data-swipe-task]").forEach(card => {
    card.addEventListener("touchstart", event => { const touch = event.changedTouches[0]; touchStart = { id: card.dataset.swipeTask, date: card.dataset.swipeDate, x: touch.clientX, y: touch.clientY }; }, { passive: true });
    card.addEventListener("touchend", event => { if (!touchStart || touchStart.id !== card.dataset.swipeTask) return; const touch = event.changedTouches[0]; const dx = touch.clientX - touchStart.x; const dy = touch.clientY - touchStart.y; const swipe = Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy); const data = { ...touchStart }; touchStart = null; if (!swipe) return; if (dx < 0) toggleComplete(data.id, data.date); else replanTarget(data.id, addDays(data.date, 1)); });
  });
  document.querySelectorAll("[data-schedule]").forEach(button => button.onclick = () => scheduleTarget(button.dataset.schedule, button.dataset.date));
  document.querySelectorAll("[data-replan]").forEach(button => button.onclick = () => replanTarget(button.dataset.replan, button.dataset.date));
  document.querySelector(".modal-card")?.addEventListener("click", event => event.stopPropagation());
  document.getElementById("close-modal")?.addEventListener("click", () => { if (modal?.type === "goal-summary") { modal = null; sync().then(() => render(true)); return; } if (templateDraft && modal.type === "edit" && modal.templateTaskId !== undefined) { modal = { type: "template" }; formDraft = null; render(true); return; } modal = null; formDraft = null; templateDraft = null; render(true); });
  document.getElementById("editor-next")?.addEventListener("click", nextEditorStep);
  document.getElementById("editor-prev")?.addEventListener("click", () => { captureFormDraft(); modal.step = Math.max(1, modal.step - 1); render(true); });
  document.getElementById("save-target")?.addEventListener("click", saveTarget);
  document.getElementById("delete-target")?.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); deleteTarget(); });
  document.getElementById("save-complete")?.addEventListener("click", saveCompletion);
  document.getElementById("save-goal-summary")?.addEventListener("click", async () => { const target = modal.target; target.summary = { achievement: document.getElementById("summary-achievement").value.trim(), learning: document.getElementById("summary-learning").value.trim(), note: document.getElementById("summary-note").value.trim(), completedAt: nowIso() }; touchTarget(target, "完成目标总结"); modal = null; await sync(); render(true); });
  document.getElementById("skip-goal-summary")?.addEventListener("click", async () => { modal = null; await sync(); render(true); });
  document.getElementById("c-minutes-mode")?.addEventListener("change", event => { const field = document.getElementById("manual-minutes-field"); if (field) field.hidden = event.target.value === "elapsed"; });
  document.getElementById("enable-browser-notifications")?.addEventListener("click", enableBrowserReminders);
  document.getElementById("mark-notifications-read")?.addEventListener("click", async () => { (state.notifications || []).forEach(item => { item.read = true; }); await sync(); render(true); });
  const quickCaptureButton = document.getElementById("quick-capture-submit");
  quickCaptureButton?.addEventListener("pointerdown", () => {
    const input = document.getElementById("quick-capture");
    if (input) quickCaptureDraft = input.value;
  }, { passive: true });
  quickCaptureButton?.addEventListener("click", event => { event.preventDefault(); submitQuickCapture(); });
  document.getElementById("quick-capture")?.addEventListener("input", event => { quickCaptureDraft = event.target.value; });
  document.querySelectorAll("#app input[id],#app textarea[id],#app select[id]").forEach(control => {
    if (control.id === "quick-capture" || control.closest(".modal-card")) return;
    control.addEventListener("input", event => { pageInputDrafts[event.target.id] = event.target.value; });
    control.addEventListener("change", event => { pageInputDrafts[event.target.id] = event.target.multiple ? Array.from(event.target.selectedOptions).map(option => option.value) : event.target.value; });
  });
  document.getElementById("quick-capture")?.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); submitQuickCapture(); } });
  document.querySelectorAll("[data-month-date]").forEach(button => button.addEventListener("click", () => { selectedDate = button.dataset.monthDate; state.settings.timelineRange = "day"; render(true); }));
  document.getElementById("login-user")?.addEventListener("input", captureLoginDraft);
  document.getElementById("login-pass")?.addEventListener("input", captureLoginDraft);
  document.getElementById("login-btn")?.addEventListener("click", event => { event.preventDefault(); if (loginBusy) return; captureLoginDraft(); handleLogin(); });
  document.querySelectorAll("[data-capacity-date]").forEach(input => {
    input.addEventListener("pointerdown", () => holdEditingInteraction(1400), { passive: true });
    input.addEventListener("focus", () => holdEditingInteraction(1400));
    input.addEventListener("input", event => { holdEditingInteraction(700); pageInputDrafts[`capacity-${input.dataset.capacityDate}`] = event.target.value; });
    input.addEventListener("change", async event => {
      const date = input.dataset.capacityDate;
      const value = event.target.value;
      pageInputDrafts[`capacity-${date}`] = value;
      setDailyCapacity(date, value);
      saveLocal();
      await sync();
    });
  });
  document.querySelectorAll('#app input[type="date"]').forEach(input => {
    input.addEventListener("pointerdown", () => holdEditingInteraction(1800), { passive: true });
    input.addEventListener("focus", () => holdEditingInteraction(1800));
    input.addEventListener("change", () => holdEditingInteraction(500));
  });
  document.getElementById("selected-date")?.addEventListener("change", event => { selectedDate = event.target.value || today; queueRenderAfterEditing(true); });
  document.querySelectorAll("[data-range]").forEach(button => button.onclick = () => { state.settings.timelineRange = button.dataset.range; saveLocal(); render(true); });
  document.getElementById("matrix-date")?.addEventListener("change", event => { selectedDate = event.target.value || today; queueRenderAfterEditing(true); });
  document.getElementById("report-date")?.addEventListener("change", event => { selectedDate = event.target.value || today; queueRenderAfterEditing(true); });
  document.querySelectorAll("[data-report-range]").forEach(button => button.onclick = () => { reportRange = button.dataset.reportRange; render(true); });
  document.getElementById("toggle-task-history")?.addEventListener("click", () => { taskHistoryExpanded = !taskHistoryExpanded; render(true); });
  document.querySelectorAll("[data-matrix-range]").forEach(button => button.onclick = () => { matrixRange = button.dataset.matrixRange; render(true); });
  document.getElementById("toggle-notifications")?.addEventListener("click", () => { notificationCenterExpanded = !notificationCenterExpanded; render(true); });
  document.querySelectorAll("[data-color]").forEach(button => button.onclick = event => { event.preventDefault(); event.stopPropagation(); document.getElementById("f-color").value = button.dataset.color; captureFormDraft(); document.querySelectorAll("[data-color]").forEach(x => x.classList.toggle("selected", x === button)); });
  document.querySelectorAll("[data-date-choice]").forEach(button => button.onclick = () => { document.getElementById("f-date").value = button.dataset.dateChoice; captureFormDraft(); render(true); });
  document.querySelectorAll(".modal-card input,.modal-card select,.modal-card textarea").forEach(control => { control.addEventListener("click", event => event.stopPropagation()); control.addEventListener("input", event => { captureFormDraft(); if (["f-total", "f-unit"].includes(event.target.id)) refreshMilestonePreview(); }); control.addEventListener("change", event => { captureFormDraft(); if (event.target.id === "f-repeat") render(true); if (["f-total", "f-unit"].includes(event.target.id)) refreshMilestonePreview(); }); });
  document.getElementById("toggle-inline-category")?.addEventListener("click", () => { captureFormDraft(); modal.showCategoryCreator = !modal.showCategoryCreator; render(true); });
  document.getElementById("add-category-inline")?.addEventListener("click", addCategoryInline);
  document.querySelectorAll("[data-restore-trash]").forEach(button => button.onclick = () => restoreTrashBatch(button.dataset.restoreTrash));
  document.querySelectorAll("[data-template-apply]").forEach(button => button.onclick = () => applyTemplate(button.dataset.templateApply));
  document.querySelectorAll("[data-template-edit]").forEach(button => button.onclick = () => openTemplateModal(button.dataset.templateEdit));
  document.querySelectorAll("[data-template-delete]").forEach(button => button.onclick = () => deleteTemplate(button.dataset.templateDelete));
  document.getElementById("new-template")?.addEventListener("click", () => openTemplateModal());
  document.getElementById("template-add-task")?.addEventListener("click", () => openTemplateTaskEditor(undefined, "todo"));
  document.getElementById("template-add-goal")?.addEventListener("click", () => openTemplateTaskEditor(undefined, "goal"));
  document.querySelectorAll("[data-template-task-edit]").forEach(button => button.onclick = () => openTemplateTaskEditor(button.dataset.templateTaskEdit));
  document.querySelectorAll("[data-template-task-delete]").forEach(button => button.onclick = () => deleteTemplateTask(button.dataset.templateTaskDelete));
  document.getElementById("template-save")?.addEventListener("click", saveTemplateDraft);
  document.getElementById("template-cancel")?.addEventListener("click", () => { templateDraft = null; modal = null; render(true); });
  document.getElementById("save-note")?.addEventListener("click", async () => { state.notes[today] = document.getElementById("daily-note").value.trim(); delete pageInputDrafts["daily-note"]; await sync(); render(true); });
  document.getElementById("add-inbox")?.addEventListener("click", addInbox);
  document.getElementById("add-category")?.addEventListener("click", addCategory);
  document.querySelectorAll("[data-category-save]").forEach(button => button.onclick = () => updateCategory(button.dataset.categorySave));
  document.querySelectorAll("[data-category-delete]").forEach(button => button.onclick = () => deleteCategory(button.dataset.categoryDelete));
  document.getElementById("sync-now")?.addEventListener("click", sync);
  document.querySelectorAll("[data-dismiss-sync-conflict]").forEach(button => button.onclick = () => { syncConflictMessage = ""; render(true); });
  document.getElementById("pull-cloud")?.addEventListener("click", async () => { if (!confirm("拉取云端将覆盖当前本地工作区及未上传的修改。确定继续吗？")) return; try { setSync("正在拉取云端…"); await pullCloudData(); } catch (error) { setSync(`拉取失败：${error.message}`); } });
  document.getElementById("push-cloud")?.addEventListener("click", async () => { if (!confirm("上传云端将用当前本地工作区替换云端内容。确定继续吗？")) return; try { setSync("正在上传云端…"); const remote = await cloud("load"); if (!Number.isSafeInteger(remote?.revision)) throw new Error("云端版本不可用"); await pushCloudData(remote.revision); render(true); } catch (error) { setSync(`上传失败：${error.message}`); } });
  document.getElementById("sync-mode")?.addEventListener("change", async event => { const mode = event.target.value; if (mode === "cloud" && !confirm("切换云端优先会读取云端工作区。本地未上传修改将先尝试合并，冲突时暂停等待选择。继续吗？")) { event.target.value = state.settings.syncMode; return; } state.settings.syncMode = mode; saveLocal(); render(true); if (mode !== "local" && navigator.onLine) await sync(); });
  document.getElementById("conflict-resolution")?.addEventListener("change", event => { state.settings.conflictResolution = event.target.value; saveLocal(); });
  document.querySelectorAll("[data-conflict-choice]").forEach(button => button.onclick = async () => {
    const conflict = (state.conflicts || []).find(item => item.id === button.dataset.conflictId);
    if (!conflict || !state.syncMeta.mergedPayload) return;
    const merged = state.syncMeta.mergedPayload;
    const value = button.dataset.conflictChoice === "local" ? conflict.local : conflict.remote;
    if (conflict.key === "workspace") {
      state.syncMeta.mergedPayload = value;
    } else if (SYNC_COLLECTIONS.includes(conflict.key)) {
      merged[conflict.key] = (merged[conflict.key] || []).filter(item => item.id !== conflict.itemId);
      if (value !== undefined) merged[conflict.key].push(value);
    } else if (value === undefined) delete merged[conflict.key][conflict.itemId];
    else merged[conflict.key][conflict.itemId] = value;
    state.conflicts = state.conflicts.filter(item => item.id !== conflict.id);
    if (!state.conflicts.length) {
      const user = state.user, session = state.session, preferences = devicePreferences();
      const remotePayload = state.syncMeta.remotePayload, revision = state.syncMeta.remoteRevision;
      state = migrate(state.syncMeta.mergedPayload);
      state.user = user; state.session = session; applyPreferences(preferences);
      state.syncMeta = { pending: true, revision, snapshot: workspacePayload(remotePayload), lastSyncedAt: null };
      saveLocal();
      await sync();
    } else saveLocal();
    render(true);
  });
  document.getElementById("logout")?.addEventListener("click", async () => { try { await cloud("logout"); } catch {} state.user = null; state.session = null; saveLocal(); render(true); });
  document.getElementById("export-json")?.addEventListener("click", exportJson);
  document.getElementById("export-csv")?.addEventListener("click", exportCsv);
  document.getElementById("export-md")?.addEventListener("click", exportMarkdown);
  document.getElementById("export-ics")?.addEventListener("click", exportIcs);
  document.querySelectorAll("[data-restore-backup]").forEach(button => button.onclick = () => restoreBackup(button.dataset.restoreBackup));
  document.getElementById("backup-now")?.addEventListener("click", () => { createBackup("手动备份"); render(true); });
  document.getElementById("delete-account")?.addEventListener("click", async () => { try { await deleteAccount(); } catch (error) { alert(`删除账号失败：${error.message}`); } });
  document.getElementById("import-json")?.addEventListener("change", importJson);
  const feedbackContent = document.getElementById("feedback-content");
  feedbackContent?.addEventListener("input", event => { document.getElementById("feedback-count").textContent = `${event.target.value.length} / 500`; });
  document.getElementById("submit-feedback")?.addEventListener("click", submitFeedback);
  document.querySelectorAll("#app select[id]").forEach(control => {
    const holdSelect = () => { openSelectId = control.id; clearTimeout(openSelectTimer); };
    const releaseSelect = () => {
      clearTimeout(openSelectTimer);
      openSelectTimer = setTimeout(() => {
        if (document.activeElement !== control) {
          openSelectId = "";
          flushPendingRender();
        }
      }, 0);
    };
    control.addEventListener("pointerdown", holdSelect, { passive: true });
    control.addEventListener("mousedown", holdSelect);
    control.addEventListener("focus", holdSelect);
    control.addEventListener("blur", releaseSelect);
    control.addEventListener("change", async event => {
      const id = event.target.id;
      if (id === "focus-target") focusTargetId = event.target.value;
      if (id === "feedback-type") feedbackType = event.target.value;
      if (id === "feedback-contact-type") feedbackContactType = event.target.value;
      if (id === "allow-weekend-replan") state.settings.allowWeekendReplan = event.target.value === "true";
      if (id === "reminder-enabled") state.settings.reminderEnabled = event.target.value === "true";
      if (id === "reminder-lead-days") state.settings.reminderLeadDays = Number(event.target.value);
      if (["allow-weekend-replan", "reminder-enabled", "reminder-lead-days"].includes(id)) await sync();
    });
  });
  document.getElementById("reset-examples")?.addEventListener("click", async () => { if (confirm("恢复示例会覆盖当前业务数据，确认？")) { const user = state.user, session = state.session; state = { ...examples(), user, session }; await sync(); render(true); } });
  document.getElementById("clear-all")?.addEventListener("click", async () => { if (prompt("请输入“清空”确认") === "清空") { const user = state.user, session = state.session; state = { ...blank(), user, session }; await sync(); render(true); } });
  document.querySelectorAll("[data-focus-minutes]").forEach(button => button.onclick = () => { stopFocus(); focusRemaining = Number(button.dataset.focusMinutes) * 60; render(true); });
  document.getElementById("focus-toggle")?.addEventListener("click", toggleFocus);
  document.getElementById("focus-reset")?.addEventListener("click", () => { stopFocus(); focusRemaining = 25 * 60; render(true); });
  document.getElementById("focus-fullscreen")?.addEventListener("click", async () => { const panel = document.querySelector(".focus-panel"); if (!panel) return; try { if (document.fullscreenElement) await document.exitFullscreen(); else await panel.requestFullscreen(); } catch { notificationSetupMessage = "当前浏览器不支持全屏专注。"; render(true); } });
  document.addEventListener("keydown", event => { if (event.altKey && event.key.toLowerCase() === "f" && !event.repeat) { if (tab !== "focus") { tab = "focus"; render(true); } toggleFocus(); } });
  document.querySelectorAll("[data-theme]").forEach(button => button.onclick = () => { state.settings.theme = button.dataset.theme; document.documentElement.dataset.theme = button.dataset.theme; sync(); render(true); });
}
function captureFormDraft() {
  if (modal?.type !== "edit") return;
  formDraft ||= {};
  document.querySelectorAll(".modal-card input,.modal-card select,.modal-card textarea").forEach(control => { if (control.id && !control.id.startsWith("f-new-category")) formDraft[control.id] = control.multiple ? Array.from(control.selectedOptions).map(option => option.value) : control.value; });
  if (modal.step === 2 && (modal.target?.type === "goal" || modal.taskType === "goal")) formDraft["f-milestones"] = modal.target?.milestones || [];
}
function restoreFormDraft() {
  if (!formDraft || modal?.type !== "edit") return;
  Object.entries(formDraft).forEach(([id, value]) => { const control = document.getElementById(id); if (!control) return; if (control.multiple && Array.isArray(value)) Array.from(control.options).forEach(option => { option.selected = value.includes(option.value); }); else control.value = value; });
}
function openEditor(id, taskType) { formDraft = null; modal = { type: "edit", target: id ? { ...targetById(id) } : null, taskType, step: 1, showCategoryCreator: false }; render(true); }
function openTemplateModal(id) {
  const existing = (state.templates || []).find(template => template.id === id);
  templateDraft = existing ? JSON.parse(JSON.stringify(existing)) : { id: null, name: "", description: "", categoryName: state.categories[0]?.name || "学习", tasks: [] };
  modal = { type: "template" };
  render(true);
}
function captureTemplateDraft() {
  if (!templateDraft) return;
  const name = document.getElementById("template-draft-name");
  const description = document.getElementById("template-draft-description");
  const category = document.getElementById("template-draft-category");
  if (name) templateDraft.name = name.value;
  if (description) templateDraft.description = description.value;
  if (category) templateDraft.categoryName = category.value;
}
function openTemplateTaskEditor(taskId, taskType = "todo") {
  captureTemplateDraft();
  const task = templateDraft?.tasks.find(item => item.id === taskId);
  formDraft = null;
  modal = { type: "edit", target: task ? { ...task, date: null, repeat: task.repeat || { mode: "none" }, categoryId: state.categories.find(category => category.name === templateDraft.categoryName)?.id || state.categories[0]?.id || null } : null, taskType, step: 1, showCategoryCreator: false, templateTaskId: taskId || null };
  render(true);
}
function saveTemplateTask(task) {
  const normalized = { ...task, id: task.id || `template-task-${uid()}`, date: null, parentId: null, childLevel: 0, dependsOn: Array.isArray(task.dependsOn) ? task.dependsOn : [] };
  const index = templateDraft.tasks.findIndex(item => item.id === normalized.id);
  if (index >= 0) templateDraft.tasks[index] = normalized; else templateDraft.tasks.push(normalized);
}
function deleteTemplateTask(id) {
  templateDraft.tasks = templateDraft.tasks.filter(item => item.id !== id);
  render(true);
}
function saveTemplateDraft() {
  captureTemplateDraft();
  capturePageInputDrafts();
  const name = document.getElementById("template-draft-name")?.value.trim() || "";
  const description = document.getElementById("template-draft-description")?.value.trim() || "";
  const categoryName = document.getElementById("template-draft-category")?.value || state.categories[0]?.name || "学习";
  if (!name) return alert("请输入模板名称");
  const saved = { ...templateDraft, id: templateDraft.id || `custom-${uid()}`, name, description, categoryName, tasks: templateDraft.tasks || [], updatedAt: new Date().toISOString() };
  state.templates = (state.templates || []).filter(item => item.id !== saved.id).concat(saved);
  templateDraft = null;
  modal = null;
  sync().then(() => render(true));
}
function validateEditorStep() {
  if (modal.step === 1 && !String(document.getElementById("f-name")?.value || formDraft?.["f-name"] || "").trim()) { alert("请先填写计划名称"); return false; }
  if (modal.step === 2 && draftValue("f-type", modal.target?.type || modal.taskType) === "goal" && Number(document.getElementById("f-total")?.value || formDraft?.["f-total"] || 0) <= 0) { alert("请填写大于 0 的目标总量"); return false; }
  if (modal.step === 2 && modal.target?.type === "goal" && modal.target.deadline && draftValue("f-deadline", modal.target.deadline) > modal.target.deadline && !String(draftValue("f-postpone-reason", "")).trim()) { alert("请填写本次延期原因"); return false; }
  if (modal.step === 2 && modal.target?.type === "goal" && modal.target.deadline && draftValue("f-deadline", modal.target.deadline) <= modal.target.deadline && String(draftValue("f-postpone-reason", "")).trim()) formDraft["f-postpone-reason"] = "";
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
async function deleteTemplate(id) {
  if (!confirm("确认删除这个自定义模板？已生成的任务不会被删除。")) return;
  state.templates = (state.templates || []).filter(template => template.id !== id);
  await sync();
  render(true);
}
async function applyTemplate(id) {
  const template = BUILTIN_TEMPLATES.find(item => item.id === id) || (state.templates || []).find(item => item.id === id);
  if (!template) return;
  const start = prompt("请输入模板起始日期（YYYY-MM-DD）", selectedDate || today);
  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return;
  const category = state.categories.find(item => item.name === template.categoryName) || state.categories[0];
  const generated = template.tasks.map((item, index) => ({ id: uid(), type: item.type || "todo", name: item.name, date: addDays(start, Number(item.offset || 0)), due: item.type === "goal" ? addDays(start, Number(item.offset || 0)) : null, deadline: null, estimateMinutes: Number(item.estimateMinutes || 0) || null, total: item.total || null, unit: item.unit || "次", daily: item.daily || 1, color: COLORS[index % COLORS.length], quadrant: "important-not-urgent", categoryId: category?.id || null, completionMode: item.type === "goal" ? "detail" : "quick", repeat: item.repeat || { mode: "none" }, dependsOn: [], dependencyMode: "blocks", created: today }));
  template.tasks.forEach((item, index) => {
    const dependencyIds = Array.isArray(item.dependsOn) ? item.dependsOn : (item.dependency !== undefined && template.tasks[item.dependency] ? [template.tasks[item.dependency].id] : []);
    generated[index].dependsOn = dependencyIds.map(id => { const dependencyIndex = template.tasks.findIndex(task => task.id === id); return dependencyIndex >= 0 ? generated[dependencyIndex].id : null; }).filter(Boolean);
  });
  state.targets.push(...generated);
  selectedDate = start;
  state.settings.timelineRange = "day";
  tab = "timeline";
  quickCaptureMessage = `已使用模板“${template.name}”，生成 ${generated.length} 个任务`;
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
  const beforeDate = target.date;
  target.date = date;
  if (target.type === "goal") target.postponeCount = Number(target.goalPostponeCount ?? target.postponeCount ?? 0);
  else if (date && beforeDate && date > beforeDate) target.postponeCount = Math.max(0, Number(target.postponeCount || 0)) + 1;
  touchTarget(target, "安排日期");
  recordHistory(id, "安排日期", { date: beforeDate }, { date, postponeCount: target.postponeCount || 0 });
  if (target.type === "goal" && (!target.due || target.due < date)) { target.due = date; target.deadline = target.deadline || date; }
  await sync();
  render(true);
}
async function replanTarget(id, date) {
  const target = targetById(id);
  if (!target) return;
  const beforeDate = target.date;
  target.date = date || null;
  if (target.type === "goal") target.postponeCount = Number(target.goalPostponeCount ?? target.postponeCount ?? 0);
  else if (date && beforeDate && date > beforeDate) target.postponeCount = Math.max(0, Number(target.postponeCount || 0)) + 1;
  touchTarget(target, "重新安排");
  recordHistory(id, "重新安排", { date: beforeDate }, { date: target.date, postponeCount: target.postponeCount || 0 });
  if (target.type === "goal" && date && (!target.due || target.due < date)) target.due = date;
  await sync();
  render(true);
}
async function toggleComplete(id, date) {
  const target = targetById(id);
  if (!target) return;
  if (target.type === "goal") {
    const completedToday = state.logs.some(log => log.targetId === id && log.kind === "progress" && log.date === date);
    if (completedToday && !confirm(`“${target.name}”在 ${date} 已有打卡记录。是否再登记一次打卡？`)) return;
    modal = { type: "complete", target, date, repeatCheckin: completedToday };
    render(true);
    return;
  }
  const existing = completion(id, date);
  if (existing) {
    state.logs = state.logs.filter(log => log.id !== existing.id);
    state.rewards.points = Math.max(0, (state.rewards.points || 0) - 5);
    if (target.actualMinutes === existing.minutes) target.actualMinutes = existing.previousActualMinutes ?? null;
    (existing.replannedDependents || []).forEach(change => {
      const dependent = targetById(change.targetId);
      if (dependent && dependent.date === change.replannedDate) {
        dependent.date = change.date;
        dependent.autoReplanned = change.autoReplanned;
      }
    });
    recordHistory(id, "撤销完成", existing, null);
    saveLocal();
    await sync();
    render(true);
    return;
  }
  modal = { type: "complete", target, date };
  render(true);
}
async function saveCompletion() {
  const amount = Number(document.getElementById("c-amount").value || 1);
  if (!Number.isFinite(amount) || amount <= 0) return alert("完成数量必须大于 0");
  const previousAmount = modal.target.type === "goal" ? goalDone(modal.target) : 0;
  const mode = document.getElementById("c-minutes-mode")?.value || "manual";
  const minutes = mode === "elapsed" ? actualMinutesForCompletion(modal.target) : (Number(document.getElementById("c-minutes").value || 0) || null);
  const note = document.getElementById("c-note").value.trim();
  const previousActualMinutes = modal.target.actualMinutes ?? null;
  const log = { id: uid(), targetId: modal.target.id, date: modal.date || today, kind: modal.target.type === "goal" ? "progress" : "complete", amount, minutes, previousActualMinutes, estimateMinutes: estimateMinutes(modal.target), actualMinutesMode: mode, note, createdAt: nowIso() };
  state.logs.push(log);
  modal.target.actualMinutes = minutes;
  touchTarget(modal.target, "完成任务");
  state.rewards.points = (state.rewards.points || 0) + (modal.target.type === "goal" ? 3 : 5);
  recordHistory(modal.target.id, "完成任务", null, { minutes, mode });
  if (modal.target.type === "goal") {
    const currentAmount = goalDone(modal.target);
    const reached = newlyReachedMilestones(modal.target, previousAmount, currentAmount);
    modal.target.milestones = goalMilestonesFor(modal.target);
    if (reached.length) notification("目标里程碑达成", `${modal.target.name}：${reached.map(item => `${fmt(item.amount)} ${modal.target.unit || "次"}`).join("、")}`, "milestone");
  }
  if (modal.target.type !== "goal") {
    log.replannedDependents = autoReplanDependents(modal.target.id, modal.date || today).map(change => {
      const dependent = targetById(change.targetId);
      return { ...change, replannedDate: dependent?.date || null };
    });
  }
  if (modal.target.type === "goal" && goalDone(modal.target) >= Number(modal.target.total || 0)) {
    const completionDate = modal.date || today;
    const futureEnd = modal.target.due || modal.target.deadline;
    if (futureEnd && futureEnd > completionDate) {
      const removeFuture = confirm(`“${modal.target.name}”已提前完成目标总量。\n\n是否删除 ${completionDate} 之后的所有未来目标 occurrence？\n\n点击“确定”将结束未来计划；已完成的打卡、历史记录和当前总结不会删除。点击“取消”则保留原定日期。`);
      if (removeFuture) closeFutureGoalOccurrences(modal.target, completionDate);
    }
    if (!modal.target.summary) { modal = { type: "goal-summary", target: modal.target }; render(true); return; }
  }
  modal = null; await sync(); render(true);
}
async function saveTarget() {
  captureFormDraft();
  const id = modal.target?.id;
  const originalType = modal.target?.type || modal.taskType || "todo";
  const type = draftValue("f-type", originalType);
  const name = String(draftValue("f-name", "")).trim();
  if (modal.step === 3) {
    const originalDeadline = modal.target?.deadline || null;
    const editedDeadline = draftValue("f-deadline", originalDeadline || "") || null;
    if (modal.target?.type === "goal" && originalDeadline && editedDeadline > originalDeadline && !String(draftValue("f-postpone-reason", "")).trim()) return alert("请返回目标节奏步骤填写延期原因");
  }
  if (!name) return alert("请填写名称");
  const repeatMode = draftValue("f-repeat", "none");
  const dependencyIds = Array.isArray(draftValue("f-depends", [])) ? draftValue("f-depends", []) : (draftValue("f-depends", "") ? [draftValue("f-depends", "")] : []);
  const rawParentId = draftValue("f-parent", "") || null;
  const validDependencyIds = modal.templateTaskId
    ? dependencyIds.filter(value => templateDraft?.tasks.some(item => item.id === value && item.id !== modal.templateTaskId))
    : dependencyIds.filter(value => {
      const dependency = targetById(value);
      return dependency && canUseAsDependency(dependency, id) && dependency.id !== rawParentId && !descendantsOf(id || "").some(child => child.id === dependency.id);
    });
  const parentId = modal.templateTaskId ? null : (rawParentId && targetById(rawParentId) && canUseAsParent(targetById(rawParentId), id) && !descendantsOf(id || "").some(child => child.id === rawParentId) ? rawParentId : null);
  const selectedRelationDate = modal.templateTaskId ? null : relationDateFor(null, validDependencyIds, parentId);
  state.settings.deadlineAlertDays = Math.max(0, Number(draftValue("f-deadline-alert", state.settings.deadlineAlertDays ?? 2)) || 0);
  const target = {
    ...(modal.target || {}), id: id || uid(), type, name,
    categoryId: draftValue("f-category", "") || null,
    date: selectedRelationDate || draftValue("f-date", "") || null,
    due: type === "goal" ? (draftValue("f-deadline", modal.target?.due || modal.target?.deadline || "") || null) : (modal.target?.due || null),
    deadline: draftValue("f-deadline", modal.target?.deadline || modal.target?.due || "") || null,
    estimateMinutes: Number(draftValue("f-estimate", 0) || 0) || null,
    startTime: draftValue("f-start", ""), endTime: draftValue("f-end", ""),
    completionMode: type === "goal" ? "detail" : draftValue("f-completion", "quick"),
    quadrant: draftValue("f-quadrant", "important-not-urgent"),
    total: type === "goal" ? Number(draftValue("f-total", 1) || 1) : null,
    unit: type === "goal" ? String(draftValue("f-unit", "次")).trim() || "次" : "次",
    daily: type === "goal" ? Number(draftValue("f-daily", 1) || 1) : 1,
    milestones: type === "goal" ? goalMilestonesFor({ ...(modal.target || { id: "" }), total: Number(draftValue("f-total", 1) || 1) }) : [],
    postponeCount: type === "goal" ? Math.max(0, Number(modal.target?.goalPostponeCount ?? modal.target?.postponeCount ?? 0)) + (originalType === "goal" && modal.target?.deadline && draftValue("f-deadline", modal.target.deadline) > modal.target.deadline ? 1 : 0) : Number(modal.target?.postponeCount || 0),
    goalPostponeCount: type === "goal" ? Math.max(0, Number(modal.target?.goalPostponeCount ?? modal.target?.postponeCount ?? 0)) + (originalType === "goal" && modal.target?.deadline && draftValue("f-deadline", modal.target.deadline) > modal.target.deadline ? 1 : 0) : (modal.target?.goalPostponeCount ?? (originalType === "goal" ? modal.target?.postponeCount : 0) ?? 0),
    postponeReasons: type === "goal" ? [...(originalType === "goal" ? modal.target?.postponeReasons || [] : []), ...(originalType === "goal" && modal.target?.deadline && draftValue("f-deadline", modal.target.deadline) > modal.target.deadline ? [{ date: today, from: modal.target.deadline, to: draftValue("f-deadline", modal.target.deadline), reason: String(draftValue("f-postpone-reason", "")).trim() }] : [])] : (modal.target?.postponeReasons || []),
    goalId: type === "todo" ? (draftValue("f-goal-id", "") || null) : null,
    color: draftValue("f-color", COLORS[0]), note: String(draftValue("f-note", "")).trim(),
    repeat: { mode: repeatMode, days: String(draftValue("f-weekdays", "")).split(",").map(Number).filter(value => value >= 0 && value <= 6), monthDay: Number(draftValue("f-monthday", 1) || 1), interval: Number(draftValue("f-interval", 2) || 2) },
    dependsOn: dependencyIds,
    dependencyMode: "blocks",
    parentId,
    childLevel: parentId ? Math.min(2, Number(targetById(parentId)?.childLevel || 0) + 1) : 0,
    created: modal.target?.created || today
  };
  delete target.category;
  if (modal.templateTaskId || (templateDraft && modal.templateTaskId === null)) {
    target.offset = Math.max(0, Number(draftValue("f-offset", target.offset || 0)) || 0);
    target.id = modal.templateTaskId || target.id;
    target.date = null;
    saveTemplateTask(target);
    modal = { type: "template" };
    formDraft = null;
    render(true);
    return;
  }
  if (id) { const current = targetById(id); const before = { ...current }; Object.assign(current, target); touchTarget(current, "编辑任务"); recordHistory(id, "编辑任务", before, current); }
  else { target.createdAt = nowIso(); target.updatedAt = target.createdAt; state.targets.push(target); recordHistory(target.id, "创建任务", null, target); }
  if (type === "goal") {
    const linkedIds = Array.isArray(draftValue("f-linked-plans", [])) ? draftValue("f-linked-plans", []) : [];
    state.targets.filter(item => item.type === "todo" && (linkedIds.includes(item.id) || item.goalId === target.id)).forEach(item => { item.goalId = linkedIds.includes(item.id) ? target.id : null; });
    linkedIds.map(targetById).filter(Boolean).forEach(item => { item.updatedAt = nowIso(); });
  }
  if (type === "todo") {
    const previousGoalId = modal.target?.goalId || null;
    const nextGoalId = target.goalId || null;
    if (previousGoalId && previousGoalId !== nextGoalId) {
      const previousGoal = targetById(previousGoalId);
      if (previousGoal) previousGoal.updatedAt = nowIso();
    }
    if (nextGoalId) {
      state.targets.filter(item => item.type === "todo" && item.goalId === nextGoalId && item.id !== target.id).forEach(item => { item.goalId = null; });
      const nextGoal = targetById(nextGoalId);
      if (nextGoal) nextGoal.updatedAt = nowIso();
    }
  } else if (originalType === "todo" && modal.target?.goalId) {
    const previousGoal = targetById(modal.target.goalId);
    if (previousGoal) previousGoal.updatedAt = nowIso();
  }
  modal = null; formDraft = null; await sync(); render(true);
}
function dependencyDescendantsOf(targetIds) {
  const roots = Array.isArray(targetIds) ? targetIds : [targetIds];
  const rootSet = new Set(roots);
  const result = new Set();
  const queue = [...roots];
  while (queue.length) {
    const currentId = queue.shift();
    state.targets.filter(item => (item.dependsOn || []).includes(currentId) && !rootSet.has(item.id) && !result.has(item.id)).forEach(item => {
      result.add(item.id);
      queue.push(item.id);
    });
  }
  return [...result];
}
function removeTargetsByIds(ids) {
  const removing = new Set(ids);
  const restoreBatchId = uid();
  const removedTargets = state.targets.filter(item => removing.has(item.id)).map(item => ({ ...item, deletedAt: nowIso(), deletedFrom: "targets" }));
  const related = key => (state[key] || []).filter(item => removing.has(item.targetId) || removing.has(item.parentId) || removing.has(item.childId));
  const dependencySnapshots = state.targets.filter(item => !removing.has(item.id) && (item.dependsOn || []).some(id => removing.has(id))).map(item => ({ id: item.id, dependsOn: [...(item.dependsOn || [])] }));
  const deletedAt = nowIso();
  state.trash = [...(state.trash || []), ...removedTargets.map(target => ({ ...target, restoreBatchId, deletedAt, related: { logs: related("logs").filter(item => item.targetId === target.id), plans: related("plans").filter(item => item.targetId === target.id), focusLogs: related("focusLogs").filter(item => item.targetId === target.id), notifications: related("notifications").filter(item => item.targetId === target.id), history: related("history").filter(item => item.targetId === target.id), subtasks: related("subtasks").filter(item => item.targetId === target.id || item.parentId === target.id || item.childId === target.id), dependencySnapshots } }))];
  state.targets = state.targets.filter(item => !removing.has(item.id));
  state.subtasks = (state.subtasks || []).filter(item => !removing.has(item.targetId) && !removing.has(item.parentId) && !removing.has(item.childId));
  state.logs = (state.logs || []).filter(item => !removing.has(item.targetId));
  state.plans = (state.plans || []).filter(item => !removing.has(item.targetId));
  state.focusLogs = (state.focusLogs || []).filter(item => !removing.has(item.targetId));
  state.notifications = (state.notifications || []).filter(item => !removing.has(item.targetId));
  state.history = (state.history || []).filter(item => !removing.has(item.targetId));
  state.targets.forEach(item => { item.dependsOn = (item.dependsOn || []).filter(dependencyId => !removing.has(dependencyId)); if (removing.has(item.goalId)) item.goalId = null; });
  if (focusTargetId && removing.has(focusTargetId)) focusTargetId = "";
}
async function deleteTarget() {
  const id = modal?.target?.id;
  const target = targetById(id);
  if (!target) {
    alert("找不到要删除的任务，请关闭编辑框后重新打开。");
    return;
  }
  const childIds = descendantsOf(id).map(item => item.id);
  const removing = new Set([id, ...childIds]);
  const dependentIds = dependencyDescendantsOf([...removing]);
  const remainingDependents = dependentIds.filter(dependentId => !removing.has(dependentId));
  if (remainingDependents.length) {
    const shouldDeleteDependents = confirm(`删除任务“${target.name}”${childIds.length ? `及其 ${childIds.length} 个子任务/次子任务` : ""}？\n\n另有 ${remainingDependents.length} 个后置依赖任务：点“确定”将一并删除，点“取消”将保留后置任务并解除它们对被删任务的依赖。`);
    if (shouldDeleteDependents) dependentIds.forEach(dependentId => removing.add(dependentId));
  } else {
    const message = childIds.length
      ? `确定删除“${target.name}”及其 ${childIds.length} 个子任务/次子任务吗？相关记录也会一并清除。`
      : `确定删除任务“${target.name}”吗？相关记录也会一并清除。`;
    if (!confirm(message)) return;
  }
  removeTargetsByIds([...removing]);
  state.targets.filter(item => item.type === "todo" && item.goalId === id).forEach(item => { item.goalId = null; });
  modal = null;
  formDraft = null;
  saveLocal();
  render(true);
  await sync();
}
async function addInbox() {
  const input = document.getElementById("inbox-name");
  const name = input.value.trim();
  if (!name) return;
  state.targets.push({ id: uid(), type: "todo", name, date: null, due: null, deadline: null, estimateMinutes: null, color: COLORS[0], quadrant: "important-not-urgent", categoryId: state.categories[0]?.id || null, completionMode: "quick", repeat: { mode: "none" }, created: today });
  await sync(); render(true);
}
function toggleFocus() {
  if (focusTimer) { stopFocus(); notification("专注结束", "专注计时已结束，请记录本次投入。", "focus"); render(true); return; }
  const selectedFocusTask = document.getElementById("focus-target");
  focusTargetId = selectedFocusTask?.value || focusTargetId || "";
  notification("专注开始", "专注计时已开始。", "focus");
  requestBrowserReminderPermission();
  focusTimer = setInterval(() => { focusRemaining -= 1; const clock = document.querySelector(".focus-clock"); if (clock) clock.textContent = `${Math.floor(focusRemaining / 60).toString().padStart(2, "0")}:${(focusRemaining % 60).toString().padStart(2, "0")}`; if (focusRemaining <= 0) finishFocus(); }, 1000);
  render(true);
}
function stopFocus() { if (focusTimer) clearInterval(focusTimer); focusTimer = null; }
async function finishFocus() { stopFocus(); const select = document.getElementById("focus-target"); focusTargetId = select?.value || focusTargetId || ""; state.focusLogs.push({ id: uid(), targetId: focusTargetId || null, date: today, minutes: 25 }); focusRemaining = 25 * 60; await sync(); render(true); }
async function handleLogin() {
  if (loginBusy) return;
  const username = document.getElementById("login-user").value.trim();
  const password = document.getElementById("login-pass").value;
  if (!/^[A-Za-z0-9_-]{3,40}$/.test(username) || password.length < 8) { loginMessage = "用户名需为 3-40 位字母、数字或下划线，密码至少 8 位。"; render(true); return; }
  loginBusy = true;
  loginMessage = "正在加载用户信息中 0%";
  render(true);
  try {
    loginMessage = "正在加载用户信息中 20%";
    render(true);
    const response = await fetch(`${CONFIG.url}/functions/v1/${CONFIG.fn}`, { method: "POST", headers: { "Content-Type": "application/json", apikey: CONFIG.key, Authorization: `Bearer ${CONFIG.key}` }, body: JSON.stringify({ username, password, action: "register" }) });
    loginMessage = "正在加载用户信息中 60%";
    render(true);
    const raw = await response.text(); let output = {}; try { output = JSON.parse(raw); } catch {}
    if (!response.ok) throw new Error(response.status === 409 ? "云端已由其他设备更新，请重新同步后再试" : `HTTP ${response.status}：${output.detail || output.error || raw}`);
    const localUser = output.username || username, token = output.token;
    loginMessage = "正在加载用户信息中 80%";
    render(true);
    const previousUser = storage.get(ACCOUNT_KEY) || state.user;
    const preferences = devicePreferences();
    if (previousUser && previousUser !== localUser) state = blank();
    if (!previousUser && state.syncMeta.revision !== null) state = blank();
    state.user = localUser; state.session = token; applyPreferences(preferences);
    storage.set(ACCOUNT_KEY, localUser);
    loginDraft = { username: "", password: "" };
    const hasLocalWork = (state.targets?.length || 0) + (state.logs?.length || 0) + (state.plans?.length || 0) + (state.trash?.length || 0) > 0;
    const unchangedBackup = state.syncMeta.snapshot && equivalent(workspacePayload(), state.syncMeta.snapshot);
    if (state.settings.syncMode !== "local" && (!hasLocalWork || unchangedBackup) && !state.syncMeta.pending && !(state.conflicts || []).length && output.payload && Number.isSafeInteger(output.revision)) {
      replaceWithCloudPayload(output.payload, output.revision);
    }
    saveLocal();
    loginMessage = "正在加载用户信息中 95%";
    render(true);
    if (navigator.onLine && state.settings.syncMode !== "local") await sync();
    loginBusy = false;
    loginMessage = "登录成功";
    render(true);
  } catch (error) {
    loginBusy = false;
    captureLoginDraft();
    loginMessage = `登录失败：${error.message}`;
    render(true);
  }
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
function downloadFile(name, content, type) { const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([content], { type })); link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 0); }
function exportJson() { createBackup("手动导出"); downloadFile(`siaworktable-${today}.json`, JSON.stringify(state, null, 2), "application/json"); }
function csvCell(value) { return `"${String(value ?? "").replace(/"/g, '""')}"`; }
function exportCsv() { createBackup("CSV 导出"); const rows = [["类型", "名称", "执行日期", "截止日期", "预计用时", "完成状态", "分类", "四象限", "最后修改时间"]]; state.targets.forEach(item => rows.push([item.type === "goal" ? "目标" : "普通计划", item.name, item.date, item.deadline, item.estimateMinutes, item.type === "goal" ? `${goalDone(item)}/${item.total}${item.unit || ""}` : (isCompleteForDate(item, item.date || today) ? "已完成" : "未完成"), categoryName(item), QUADRANTS.find(([key]) => key === item.quadrant)?.[1] || item.quadrant, item.updatedAt])); downloadFile(`siaworktable-${today}.csv`, rows.map(row => row.map(csvCell).join(",")).join("\\r\\n"), "text/csv;charset=utf-8"); }
function exportMarkdown() { createBackup("Markdown 导出"); const lines = [`# SIAWorkTable 工作区`, ``, `导出日期：${today}`, ``, `## 任务与目标`, ``]; state.targets.forEach(item => lines.push(`- **${item.name}**（${item.type === "goal" ? "目标" : "普通计划"}）｜执行日期：${item.date || "未安排"}｜截止日期：${item.deadline || "未设置"}｜预计用时：${item.estimateMinutes || "未设置"} 分钟`)); lines.push(``, `## 进度记录`, ``); state.logs.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).forEach(log => lines.push(`- ${log.date}｜${targetById(log.targetId)?.name || "已删除任务"}｜${log.kind === "complete" ? "完成" : "进度"}｜${log.minutes || 0} 分钟`)); downloadFile(`siaworktable-${today}.md`, lines.join("\\n"), "text/markdown;charset=utf-8"); }
function exportIcs() { createBackup("日历导出"); const events = state.targets.filter(item => item.date).map(item => { const start = `${item.date.replace(/-/g, "")}T${(item.startTime || "09:00").replace(":", "")}00`; const end = `${item.date.replace(/-/g, "")}T${(item.endTime || item.startTime || "10:00").replace(":", "")}00`; return [`BEGIN:VEVENT`, `UID:${item.id}@siaworktable`, `DTSTART;TZID=Asia/Shanghai:${start}`, `DTEND;TZID=Asia/Shanghai:${end}`, `SUMMARY:${String(item.name || "计划").replace(/[\\r\\n]/g, " ")}`, `DESCRIPTION:${String(item.type === "goal" ? "目标" : "普通计划").replace(/[\\r\\n]/g, " ")}`, `END:VEVENT`].join("\\r\\n"); }); downloadFile(`siaworktable-${today}.ics`, `BEGIN:VCALENDAR\\r\\nVERSION:2.0\\r\\nPRODID:-//SIAWorkTable//CN\\r\\n${events.join("\\r\\n")}\\r\\nEND:VCALENDAR`, "text/calendar;charset=utf-8"); }
function restoreBackup(id) { const backup = readBackups().find(item => item.id === id); if (!backup || !confirm(`确定恢复 ${new Date(backup.createdAt).toLocaleString("zh-CN")} 的备份吗？当前数据会先自动备份。`)) return; createBackup("恢复前备份"); const user = state.user, session = state.session, preferences = devicePreferences(); state = migrate(backup.payload); state.user = user; state.session = session; applyPreferences(preferences); state.syncMeta.pending = Boolean(session); saveLocal(); sync().finally(() => render(true)); }
async function deleteAccount() { if (!state.user || !state.session) return; createBackup("删除账号前备份"); exportJson(); if (!confirm("已开始导出当前数据。确认继续删除账号吗？此操作不可撤销。")) return; if (!confirm(`再次确认：永久删除账号“${state.user}”及其云端工作区？`)) return; await cloud("delete-account"); storage.remove(backupStorageKey()); storage.remove(ACCOUNT_KEY); storage.remove("siaworktable-data"); state = blank(); render(true); }
function importJson(event) { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async () => { try { const imported = migrate(JSON.parse(reader.result)); const user = state.user, session = state.session, preferences = devicePreferences(), syncMeta = state.syncMeta; state = { ...imported, user, session, syncMeta: { ...syncMeta, pending: true } }; applyPreferences(preferences); await sync(); render(true); } catch { alert("JSON 格式不正确"); } }; reader.readAsText(file); }
function boot() {
  window.addEventListener("online", () => { offlineQueue = false; sync(); });
  window.addEventListener("offline", () => { offlineQueue = true; setSync("离线已保存，联网后同步"); });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
  if (window.__SIA_WORKTABLE_STARTED__) return;
  window.__SIA_WORKTABLE_STARTED__ = true;
  try {
    document.documentElement.dataset.theme = state.settings.theme || "cold";
    render();
    if (state.session && state.settings.syncMode !== "local" && navigator.onLine) sync();
  } catch (error) {
    window.__SIA_WORKTABLE_STARTED__ = false;
    const root = document.getElementById("app");
    if (root) root.innerHTML = `<main class="login-page"><section class="panel"><h1>SIAWorkTable 启动失败</h1><p>${esc(error.message || error)}</p><button type="button" class="btn primary" onclick="try{localStorage.removeItem('siaworktable-data')}catch{};location.reload()">清除本地缓存并重试</button></section></main>`;
    console.error(error);
  }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
