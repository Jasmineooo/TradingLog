(() => {
  "use strict";

  const STORAGE_KEY = "shouze.trading.journal.v1";
  const APP_VERSION = "1.0.0";

  const ASSET_TYPES = {
    stock: { label: "个股", short: "股", cls: "stock" },
    etf: { label: "ETF", short: "ETF", cls: "etf" },
    option: { label: "ETF期权", short: "期权", cls: "option" }
  };

  const DIRECTIONS = {
    long: "做多",
    short: "做空",
    hedge: "对冲"
  };

  const STRATEGIES = {
    trend: { label: "趋势跟随", desc: "顺着趋势，等回调结束再进" },
    pullback: { label: "回调低吸", desc: "强势结构中等待回踩支撑" },
    breakout: { label: "突破", desc: "关键位放量突破后跟进" },
    meanrev: { label: "均值回归", desc: "极端偏离后等待修复" },
    event: { label: "事件驱动", desc: "围绕明确事件与预期差" },
    hedge: { label: "对冲", desc: "为已有仓位买保险或降风险" },
    other: { label: "其他", desc: "不属于以上类型" }
  };

  const RISK_OPTIONS = [0.5, 1, 2];
  const RR_OPTIONS = [1, 2, 3, 4];

  const POSITION_OPTIONS = [5, 10, 20, 30, 50];
  const MAX_POSITION_OPTIONS = [20, 30, 50];

  const FIRST_TRANCHE = {
    full: { label: "一次建满", short: "建满", desc: "计划仓位一次到位，不给自己留加仓的借口" },
    half: { label: "1/2 首仓", short: "1/2", desc: "先建一半，走势确认后再补另一半" },
    third: { label: "1/3 首仓", short: "1/3", desc: "先建三分之一，分批推进，留出容错空间" }
  };

  const ADD_RULES = {
    none: { label: "不加仓", short: "不加仓", desc: "一次建仓，只减不加" },
    onProfit: { label: "盈利后加", short: "盈利后加", desc: "只有这笔已浮盈，才允许加仓" },
    onConfirm: { label: "确认后加", short: "确认后加", desc: "出现新的确认信号后才加仓" }
  };

  const RESULTS = {
    bigWin: { label: "显著盈利", short: "大赚", score: 2, tone: "win", desc: "达到或超过计划目标" },
    win: { label: "小幅盈利", short: "小赚", score: 1, tone: "win", desc: "盈利，但未走完计划目标" },
    flat: { label: "基本打平", short: "打平", score: 0, tone: "flat", desc: "结果接近成本，或计划失效后平出" },
    loss: { label: "小幅亏损", short: "小亏", score: -1, tone: "loss", desc: "亏损，但未超过计划止损" },
    bigLoss: { label: "显著亏损", short: "大亏", score: -2, tone: "loss", desc: "超过计划最大亏损或出现失控" }
  };

  const ADHERENCE = {
    full: { label: "完全遵守", short: "遵守", desc: "入场、仓位、退出都按计划执行" },
    partial: { label: "部分偏离", short: "部分偏离", desc: "有偏离，但没有让风险性质失控" },
    major: { label: "严重偏离", short: "严重偏离", desc: "风险失控、无计划交易或明显情绪化" }
  };

  const EMOTIONS = {
    calm: { label: "平静", tone: "good" },
    confident: { label: "自信", tone: "good" },
    anxious: { label: "焦虑", tone: "warn" },
    fomo: { label: "FOMO", tone: "bad" },
    revenge: { label: "报复", tone: "bad" },
    hesitant: { label: "犹豫", tone: "warn" },
    greedy: { label: "贪婪", tone: "bad" },
    fear: { label: "恐惧", tone: "warn" }
  };

  const TAG_GROUPS = [
    { id: "position", label: "仓位" },
    { id: "entry", label: "入场" },
    { id: "exit", label: "退出" },
    { id: "emotion", label: "情绪" },
    { id: "process", label: "流程" }
  ];

  const TAGS = [
    { id: "over_size", group: "position", label: "仓位超出计划" },
    { id: "risk_over", group: "position", label: "单笔风险超限" },
    { id: "add_loser", group: "position", label: "亏损加仓" },
    { id: "under_size", group: "position", label: "仓位过轻" },
    { id: "first_tranche_off", group: "position", label: "首仓比例不符" },
    { id: "add_rule_break", group: "position", label: "加仓违背规则" },
    { id: "early_entry", group: "entry", label: "提前入场" },
    { id: "chase", group: "entry", label: "追涨杀跌" },
    { id: "no_confirm", group: "entry", label: "未等确认" },
    { id: "off_plan", group: "entry", label: "计划外标的" },
    { id: "no_stop", group: "exit", label: "未执行止损" },
    { id: "widen_stop", group: "exit", label: "扩大止损" },
    { id: "early_stop", group: "exit", label: "提前止损" },
    { id: "early_profit", group: "exit", label: "提前止盈" },
    { id: "skip_exit", group: "exit", label: "未按条件退出" },
    { id: "fomo_trade", group: "emotion", label: "FOMO 追单" },
    { id: "revenge_trade", group: "emotion", label: "报复交易" },
    { id: "overconfidence", group: "emotion", label: "过度自信" },
    { id: "fear_trade", group: "emotion", label: "恐惧犹豫" },
    { id: "news_trade", group: "emotion", label: "受消息影响" },
    { id: "no_plan", group: "process", label: "无计划交易" },
    { id: "change_strategy", group: "process", label: "盘中改策略" },
    { id: "skip_review", group: "process", label: "事后美化记录" }
  ];

  const TAG_MAP = Object.fromEntries(TAGS.map((tag) => [tag.id, tag]));
  const EMOTION_MAP = EMOTIONS;

  const REVIEW_VERDICTS = {
    stable: { label: "节奏稳定", cls: "" },
    slipping: { label: "出现滑坡", cls: "slipping" },
    pause: { label: "主动暂停", cls: "pause" }
  };

  const REMINDERS = [
    { text: "入场之前，先写下退出条件。", source: "《以交易为生》 · 交易计划" },
    { text: "先避免破产，再谈复利。", source: "塔勒布式风险观 · 生存优先" },
    { text: "亏损有限，盈利开放，才值得下注。", source: "非对称收益 · 凸性" },
    { text: "一笔盈利可能只是运气，一笔亏损也可能是正确决策。", source: "不因结果改写过程" },
    { text: "市场没有义务给你机会。没有优势时，空仓也是仓位。", source: "Elder · 耐心等待" },
    { text: "不要用更大的仓位，证明一个已经错误的判断。", source: "不摊平亏损" },
    { text: "每一笔交易，都是你与自己规则的一次对话。", source: "守则" }
  ];

  const ICONS = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4.2 4.2L19 6.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 19 6v5.2c0 4.4-2.9 7.6-7 9.3-4.1-1.7-7-4.9-7-9.3V6z"/><path d="m9 12 2 2 4-4"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 10.5v5M12 7.5h.01"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 21 20H3z"/><path d="M12 9v4.5M12 17h.01"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5c3-1 6-1 8 .5 2-1.5 5-1.5 8-.5v13c-3-1-6-1-8 .5-2-1.5-5-1.5-8-.5z"/><path d="M12 6v13"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5h16"/><path d="M7 16V9M12 16V5M17 16v-4"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v10M8 10l4 4 4-4"/><path d="M5 19h14"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V5M8 9l4-4 4 4"/><path d="M5 19h14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14M9 7V5h6v2M7 7l1 12h8l1-12"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>'
  };

  let DB = createDefaultState();
  const UI = {
    tab: "log",
    period: "30",
    breakdown: "strategy",
    showAllLog: false,
    sheetType: null,
    sheetData: {},
    planStep: 1,
    execStep: 1,
    unplannedStep: 1,
    planDraft: null,
    execDraft: null,
    unplannedDraft: null,
    reviewDraft: null,
    confirmCallback: null,
    lastFocus: null,
    sheetScrollTop: 0
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function createDefaultState() {
    return {
      version: 1,
      settings: {
        riskCap: 1,
        minRR: 2,
        maxPosition: 30,
        defaultTranche: "third",
        defaultAddRule: "none",
        commonSymbols: {
          stock: [],
          etf: ["科创50ETF", "创业板ETF", "沪深300ETF"],
          option: ["科创50ETF", "创业板ETF", "沪深300ETF"]
        }
      },
      plans: [],
      reviews: [],
      createdAt: new Date().toISOString()
    };
  }

  function uid(prefix = "id") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function fmtDay(date = new Date()) {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "short"
    }).format(date);
  }

  function fmtDateCN(date) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(d);
  }

  function fmtShort(date) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
  }

  function fmtTime(date) {
    const d = new Date(date);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function fmtPct(value) {
    if (!Number.isFinite(value)) return "—";
    return `${Math.round(value)}%`;
  }

  function fmtScore(value) {
    if (!Number.isFinite(value)) return "—";
    const rounded = Math.round(value * 10) / 10;
    return `${rounded > 0 ? "+" : ""}${rounded}`;
  }

  function daysAgoISO(days) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - days + 1);
    return d;
  }

  function getDayIndex() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now - start) / 86400000);
  }

  function reminderForToday() {
    return REMINDERS[getDayIndex() % REMINDERS.length];
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      const parsed = JSON.parse(raw);
      return normalizeState(parsed);
    } catch (error) {
      console.warn("无法读取本地数据", error);
      return createDefaultState();
    }
  }

  function normalizeSymbolList(list) {
    if (!Array.isArray(list)) return [];
    return [...new Set(list.filter((s) => typeof s === "string").map((s) => s.trim().slice(0, 24)).filter(Boolean))];
  }

  function normalizeSymbolMap(value) {
    const map = value && typeof value === "object" ? value : {};
    return {
      stock: normalizeSymbolList(map.stock),
      etf: normalizeSymbolList(map.etf),
      option: normalizeSymbolList(map.option)
    };
  }

  function normalizeState(data) {
    const base = createDefaultState();
    if (!data || typeof data !== "object") return base;
    const settings = data.settings && typeof data.settings === "object" ? data.settings : {};
    const plans = Array.isArray(data.plans) ? data.plans : [];
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];
    return {
      ...base,
      ...data,
      settings: {
        riskCap: Number(settings.riskCap) || 1,
        minRR: Number(settings.minRR) || 2,
        maxPosition: Number(settings.maxPosition) || 30,
        defaultTranche: FIRST_TRANCHE[settings.defaultTranche] ? settings.defaultTranche : "third",
        defaultAddRule: ADD_RULES[settings.defaultAddRule] ? settings.defaultAddRule : "none",
        commonSymbols: settings.commonSymbols === undefined ? base.settings.commonSymbols : normalizeSymbolMap(settings.commonSymbols)
      },
      plans: plans.filter(Boolean).map(normalizePlan).filter(Boolean),
      reviews: reviews.filter(Boolean)
    };
  }

  function normalizePlan(plan) {
    if (!plan || !plan.id) return null;
    const execution = plan.execution && typeof plan.execution === "object" ? plan.execution : null;
    return {
      ...plan,
      status: ["planned", "completed", "cancelled"].includes(plan.status) ? plan.status : "planned",
      assetType: ASSET_TYPES[plan.assetType] ? plan.assetType : "etf",
      direction: DIRECTIONS[plan.direction] ? plan.direction : "long",
      strategy: STRATEGIES[plan.strategy] ? plan.strategy : "other",
      positionPct: plan.positionPct == null || plan.positionPct === "" ? null : Number(plan.positionPct) || null,
      firstTranche: FIRST_TRANCHE[plan.firstTranche] ? plan.firstTranche : "full",
      addRule: ADD_RULES[plan.addRule] ? plan.addRule : "none",
      tags: Array.isArray(plan.tags) ? plan.tags.filter((tag) => TAG_MAP[tag]) : [],
      execution: execution
        ? {
            ...execution,
            tags: Array.isArray(execution.tags) ? execution.tags.filter((tag) => TAG_MAP[tag]) : []
          }
        : null
    };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
    } catch (error) {
      console.warn("无法保存本地数据", error);
      toast("本地存储失败，请先导出备份");
    }
  }

  function getPlan(id) {
    return DB.plans.find((plan) => plan.id === id);
  }

  function completedPlans() {
    return DB.plans
      .filter((plan) => plan.status === "completed" && plan.execution)
      .sort((a, b) => new Date(b.execution.completedAt || b.createdAt) - new Date(a.execution.completedAt || a.createdAt));
  }

  function pendingPlans() {
    return DB.plans
      .filter((plan) => plan.status === "planned")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function plansInPeriod(days) {
    const all = completedPlans();
    if (!days) return all;
    const threshold = daysAgoISO(days);
    return all.filter((plan) => {
      const date = new Date(plan.execution.completedAt || plan.createdAt);
      return date >= threshold;
    });
  }

  function isFollowed(plan) {
    return !plan.isUnplanned && plan.execution && plan.execution.adherence === "full";
  }

  function getStats(plans) {
    const n = plans.length;
    const followed = plans.filter(isFollowed);
    const deviated = plans.filter((plan) => !isFollowed(plan));
    const adherenceRate = n ? (followed.length / n) * 100 : 0;
    const wins = plans.filter((plan) => plan.execution.result === "bigWin" || plan.execution.result === "win");
    const winRate = n ? (wins.length / n) * 100 : 0;
    const avgScore = n
      ? plans.reduce((sum, plan) => sum + (RESULTS[plan.execution.result]?.score || 0), 0) / n
      : NaN;

    const matrix = {
      followedWin: 0,
      followedLoss: 0,
      deviatedWin: 0,
      deviatedLoss: 0
    };
    plans.forEach((plan) => {
      const isWin = plan.execution.result === "bigWin" || plan.execution.result === "win";
      if (isFollowed(plan)) {
        if (isWin) matrix.followedWin += 1;
        else matrix.followedLoss += 1;
      } else if (isWin) {
        matrix.deviatedWin += 1;
      } else {
        matrix.deviatedLoss += 1;
      }
    });

    const unplanned = plans.filter((plan) => plan.isUnplanned).length;

    return {
      plans,
      n,
      followed,
      deviated,
      adherenceRate,
      winRate,
      avgScore,
      matrix,
      unplanned,
      followedWinRate: followed.length ? (followed.filter(isWinPlan).length / followed.length) * 100 : NaN,
      deviatedWinRate: deviated.length ? (deviated.filter(isWinPlan).length / deviated.length) * 100 : NaN,
      followedAvg: followed.length ? averageScore(followed) : NaN,
      deviatedAvg: deviated.length ? averageScore(deviated) : NaN
    };
  }

  function isWinPlan(plan) {
    return plan.execution.result === "bigWin" || plan.execution.result === "win";
  }

  function averageScore(plans) {
    if (!plans.length) return NaN;
    return plans.reduce((sum, plan) => sum + (RESULTS[plan.execution.result]?.score || 0), 0) / plans.length;
  }

  function groupStats(plans, getKey, labelGetter) {
    const groups = new Map();
    plans.forEach((plan) => {
      const key = getKey(plan);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(plan);
    });
    return Array.from(groups.entries())
      .map(([key, items]) => ({
        key,
        label: labelGetter(key, items),
        n: items.length,
        winRate: (items.filter(isWinPlan).length / items.length) * 100,
        avg: averageScore(items)
      }))
      .sort((a, b) => b.n - a.n || b.winRate - a.winRate);
  }

  function tagStats(plans) {
    const map = new Map();
    plans.forEach((plan) => {
      (plan.execution.tags || []).forEach((tagId) => {
        if (!map.has(tagId)) map.set(tagId, []);
        map.get(tagId).push(plan);
      });
    });
    return Array.from(map.entries())
      .map(([tagId, items]) => ({
        key: tagId,
        label: TAG_MAP[tagId]?.label || tagId,
        n: items.length,
        winRate: (items.filter(isWinPlan).length / items.length) * 100,
        avg: averageScore(items)
      }))
      .sort((a, b) => b.n - a.n || b.winRate - a.winRate);
  }

  function currentStreak() {
    const plans = completedPlans();
    let count = 0;
    for (const plan of plans) {
      if (isFollowed(plan)) count += 1;
      else break;
    }
    return count;
  }

  function autoChecks(draft) {
    const risk = Number(draft.riskPct);
    const rr = Number(draft.rr);
    const position = Number(draft.positionPct);
    return [
      { id: "risk", label: `单笔风险 ≤ ${DB.settings.riskCap}%`, ok: Number.isFinite(risk) && risk <= DB.settings.riskCap },
      { id: "position", label: `计划仓位 ≤ ${DB.settings.maxPosition}%`, ok: Number.isFinite(position) && position > 0 && position <= DB.settings.maxPosition },
      { id: "rr", label: `计划盈亏比 ≥ ${DB.settings.minRR}R`, ok: Number.isFinite(rr) && rr >= DB.settings.minRR },
      { id: "trigger", label: "入场触发条件已写明", ok: String(draft.trigger || "").trim().length >= 2 },
      { id: "stop", label: "止损 / 失效条件已写明", ok: String(draft.stop || "").trim().length >= 2 },
      { id: "exit", label: "止盈 / 退出条件已写明", ok: String(draft.exit || "").trim().length >= 2 },
      { id: "thesis", label: "交易逻辑与优势已说明", ok: String(draft.thesis || "").trim().length >= 4 }
    ];
  }

  const MANUAL_CHECKS = [
    "我现在平静，不是由 FOMO、报复或无聊驱动。",
    "仓位由风险预算决定，不是由信心或冲动决定；亏损绝不加仓。",
    "我接受亏损可能发生，并对这笔决定负责。"
  ];

  function render() {
    renderLog();
    if (UI.tab === "stats") renderStats();
    if (UI.tab === "principles") renderPrinciples();
    if (UI.tab === "settings") renderSettings();
    updateNav();
  }

  function updateNav() {
    $$(".nav-item[data-tab]").forEach((button) => {
      button.classList.toggle("active", button.dataset.tab === UI.tab);
    });
  }

  function switchTab(tab) {
    if (!["log", "stats", "principles", "settings"].includes(tab)) return;
    UI.tab = tab;
    $$(".view").forEach((view) => view.classList.remove("active"));
    const target = $(`#view-${tab}`);
    if (target) target.classList.add("active");
    if (tab === "log") renderLog();
    if (tab === "stats") renderStats();
    if (tab === "principles") renderPrinciples();
    if (tab === "settings") renderSettings();
    updateNav();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toast(message) {
    const node = $("#toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove("show"), 2300);
  }

  function showConfirm({ title, desc, okText = "确认", danger = false, onConfirm }) {
    const dialog = $("#confirm-dialog");
    if (!dialog) return;
    $("#confirm-title").textContent = title;
    $("#confirm-desc").textContent = desc;
    const ok = $("#confirm-ok");
    ok.textContent = okText;
    ok.classList.toggle("rust", danger);
    ok.classList.toggle("primary", !danger);
    UI.confirmCallback = onConfirm;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeConfirm() {
    const dialog = $("#confirm-dialog");
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    UI.confirmCallback = null;
  }

  function renderIcon(name, cls = "") {
    return `<span class="${cls}">${ICONS[name] || ""}</span>`;
  }

  function resultTag(plan) {
    if (!plan.execution) return "";
    const result = RESULTS[plan.execution.result];
    if (!result) return "";
    const cls = result.score > 0 ? "win" : result.score < 0 ? "loss" : "";
    return `<span class="result-tag ${cls}">${result.short}</span>`;
  }

  function renderLog() {
    const view = $("#view-log");
    const reminder = reminderForToday();
    const pending = pendingPlans();
    const recent = completedPlans();
    const s30 = getStats(plansInPeriod(30));
    const streak = currentStreak();
    const shown = UI.showAllLog ? recent : recent.slice(0, 5);

    const activeHTML = pending.length
      ? pending.map((plan, index) => planCard(plan, index)).join("")
      : `<div class="empty-card">
          <div class="empty-icon">${ICONS.target}</div>
          <h3>还没有进行中的计划</h3>
          <p>开仓前先写下这笔交易为什么值得做、错在哪里退出。计划是这笔交易的第一道风控。</p>
          <button class="btn primary" data-action="new-plan">${ICONS.plus} 新建交易计划</button>
        </div>`;

    const recentHTML = shown.length
      ? shown.map((plan) => logRow(plan)).join("")
      : `<div class="empty-card">
          <div class="empty-icon">${ICONS.book}</div>
          <h3>执行后，回来封存记录</h3>
          <p>结果只记五个档位，不记金额和价格。真正重要的是：你有没有按自己写的规则做。</p>
        </div>`;

    view.innerHTML = `
      <section class="hero">
        <div class="hero-top">
          <span class="hero-date">${escapeHTML(fmtDay())}</span>
          <span class="hero-rate"><b>过程</b> 比结果重要</span>
        </div>
        <h2>先写规则，<br>再开始<em>交易</em>。</h2>
        <div class="hero-quote">
          <i class="quote-stroke"></i>
          <div>
            <p>${escapeHTML(reminder.text)}</p>
            <small>${escapeHTML(reminder.source)}</small>
          </div>
        </div>
        <div class="hero-metrics">
          <div><b>${pending.length}</b><span>待执行计划</span></div>
          <div class="metric-divider"></div>
          <div><b>${s30.n ? fmtPct(s30.adherenceRate) : "—"}</b><span>近30天遵守率</span></div>
          <div class="metric-divider"></div>
          <div><b>${streak}</b><span>连续遵守笔数</span></div>
        </div>
      </section>

      <div class="section-head">
        <div>
          <h2>进行中的计划 <span class="count">${pending.length}</span></h2>
          <p>每笔交易只能从一份写好的计划开始</p>
        </div>
        <button class="text-link" data-action="new-plan">新建 ${ICONS.arrow}</button>
      </div>
      <div class="plan-stack">${activeHTML}</div>

      <div class="section-head">
        <div>
          <h2>最近记录 <span class="count">${recent.length}</span></h2>
          <p>先看过程，再看结果</p>
        </div>
        ${recent.length > 5 ? `<button class="text-link" data-action="toggle-all-log">${UI.showAllLog ? "收起" : "全部"}</button>` : ""}
      </div>
      ${shown.length ? `<div class="log-list">${recentHTML}</div>` : recentHTML}

      <div class="unplanned-link">
        已经做了计划外交易？<button data-action="unplanned">诚实补记一笔无计划交易</button>
      </div>

      <p class="disclaimer-note">不记录价格、金额与成交数量；只记录原则、条件、过程与结果档位。所有数据仅保存在当前浏览器。</p>
    `;
  }

  function planCard(plan) {
    const asset = ASSET_TYPES[plan.assetType] || ASSET_TYPES.etf;
    const strategy = STRATEGIES[plan.strategy] || STRATEGIES.other;
    return `
      <article class="plan-card" data-plan-id="${escapeHTML(plan.id)}">
        <div class="plan-top">
          <div class="asset-badge ${asset.cls}">${asset.short}</div>
          <div class="plan-title">
            <h3>${escapeHTML(plan.symbol)}</h3>
            <p>${strategy.label} · ${DIRECTIONS[plan.direction]} · ${fmtShort(plan.createdAt)} 创建</p>
          </div>
          <span class="status-badge">待执行</span>
        </div>
        <p class="plan-thesis">${escapeHTML(plan.thesis)}</p>
        <div class="plan-facts">
          <span class="fact">仓位 <strong>${Number(plan.positionPct)}%</strong></span>
          <span class="fact">首仓 <strong>${FIRST_TRANCHE[plan.firstTranche || "full"].short}</strong></span>
          <span class="fact">风险 <strong>${Number(plan.riskPct)}%</strong></span>
          <span class="fact">目标 <strong>${Number(plan.rr)}R</strong></span>
          <span class="fact">${asset.label}</span>
        </div>
        <div class="plan-actions">
          <button class="btn flex" data-action="open-plan" data-id="${escapeHTML(plan.id)}">查看计划</button>
          <button class="btn primary flex" data-action="execute-plan" data-id="${escapeHTML(plan.id)}">记录执行 ${ICONS.arrow}</button>
        </div>
      </article>
    `;
  }

  function logRow(plan) {
    const followed = isFollowed(plan);
    const execution = plan.execution;
    const adherence = ADHERENCE[execution.adherence] || ADHERENCE.partial;
    const strategy = plan.isUnplanned ? "无计划交易" : (STRATEGIES[plan.strategy] || STRATEGIES.other).label;
    return `
      <button class="log-row" data-action="open-plan" data-id="${escapeHTML(plan.id)}">
        <span class="log-mark ${followed ? "" : "deviated"}"></span>
        <span class="log-main">
          <h4>${escapeHTML(plan.symbol)} · ${strategy}</h4>
          <p>${fmtShort(execution.completedAt || plan.createdAt)} ${fmtTime(execution.completedAt || plan.createdAt)} · ${adherence.short}${execution.tags && execution.tags.length ? ` · ${execution.tags.length} 个偏离` : ""}</p>
        </span>
        <span class="log-side">
          ${resultTag(plan)}
          <small>${followed ? "按计划" : plan.isUnplanned ? "无计划" : "有偏离"}</small>
        </span>
      </button>
    `;
  }

  function renderStats() {
    const view = $("#view-stats");
    const days = UI.period === "all" ? null : Number(UI.period);
    const plans = plansInPeriod(days);
    const stats = getStats(plans);
    const reviews = DB.reviews
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 2);

    const periodLabel = UI.period === "30" ? "近30天" : UI.period === "90" ? "近90天" : "全部记录";
    const sampleLow = stats.n > 0 && stats.n < 8;

    view.innerHTML = `
      <div class="page-head">
        <p class="eyebrow">Review & Correct</p>
        <h2>用样本校正自己</h2>
        <p>不评价单次盈亏，只观察重复出现的行为。</p>
      </div>
      <div class="segmented" role="group" aria-label="统计周期">
        <button class="${UI.period === "30" ? "active" : ""}" data-action="period" data-period="30">近30天</button>
        <button class="${UI.period === "90" ? "active" : ""}" data-action="period" data-period="90">近90天</button>
        <button class="${UI.period === "all" ? "active" : ""}" data-action="period" data-period="all">全部</button>
      </div>

      ${stats.n === 0 ? statsEmptyHTML() : `
        <div class="stats-headline">
          <span class="eyebrow">${periodLabel} · ${stats.n} 笔已执行</span>
          ${sampleLow ? `<span class="sample-note">样本不足 8 笔，先记录</span>` : ""}
        </div>

        <section class="compliance-card">
          <div class="compliance-main">
            <div class="ring" style="--p:${clamp(stats.adherenceRate, 0, 100)}">
              <div class="ring-center">
                <b>${fmtPct(stats.adherenceRate)}</b>
                <span>原则遵守率</span>
              </div>
            </div>
            <div class="compliance-copy">
              <h3>${stats.followed.length} / ${stats.n} 笔完全按计划</h3>
              <p>${stats.deviated.length} 笔存在偏离。遵守率只统计已执行交易，不评价盈亏。</p>
              ${sampleLow ? `<span class="sample-note">样本太小，不做能力判断</span>` : `<span class="badge-soft">按照 ${periodLabel}</span>`}
            </div>
          </div>
          <div class="mini-kpis">
            <div class="mini-kpi"><span>盈利占比</span><b>${fmtPct(stats.winRate)}</b><small>${stats.plans.filter(isWinPlan).length} 笔盈利</small></div>
            <div class="mini-kpi"><span>结果均值</span><b>${fmtScore(stats.avgScore)}</b><small>-2 至 +2 档位</small></div>
            <div class="mini-kpi"><span>无计划交易</span><b>${stats.unplanned}</b><small>${stats.unplanned ? "先恢复流程" : "流程完整"}</small></div>
          </div>
        </section>

        <div class="section-head">
          <div>
            <h2>遵守，真的更好吗</h2>
            <p>比较过程，不看单次运气</p>
          </div>
        </div>
        ${compareHTML(stats)}

        <div class="section-head">
          <div>
            <h2>过程 × 结果</h2>
            <p>最需要警惕的是“危险的成功”</p>
          </div>
        </div>
        ${matrixHTML(stats)}

        <div class="section-head">
          <div>
            <h2>偏离发生在哪里</h2>
            <p>结构化标签，比一段模糊反省更有用</p>
          </div>
        </div>
        ${deviationHTML(stats)}

        <div class="section-head">
          <div>
            <h2>换个角度看结果</h2>
            <p>按策略、情绪与偏离标签拆样本</p>
          </div>
        </div>
        ${breakdownHTML(stats)}

        <div class="section-head">
          <div>
            <h2>周期复盘</h2>
            <p>把一段时间的教训，压缩成一个改变</p>
          </div>
          <button class="text-link" data-action="open-review">写复盘 ${ICONS.arrow}</button>
        </div>
        ${reviewSectionHTML(reviews)}

        <p class="disclaimer-note">结果以“显著盈利 / 小幅盈利 / 打平 / 小幅亏损 / 显著亏损”五个档位记录，映射为 +2 至 -2 的过程分，不包含任何金额或收益率。小样本仅供观察，不构成投资建议。</p>
      `}
    `;
  }

  function statsEmptyHTML() {
    return `
      <div class="empty-card" style="margin-top:20px;padding:40px 24px;">
        <div class="empty-icon">${ICONS.chart}</div>
        <h3>复盘从第一笔执行开始</h3>
        <p>记录 3–5 笔后，才会出现遵守率、偏离分布和过程对比。先不要急着优化系统，先诚实地记录。</p>
        <button class="btn primary" data-action="new-plan">${ICONS.plus} 新建第一份计划</button>
      </div>
      <div class="settings-card" style="margin-top:12px;">
        <h3>这个工具不记什么</h3>
        <p>不记价格、金额、股数、账户余额，也不做收益曲线。它只关心：你有没有按原则下注，以及偏离后发生了什么。</p>
      </div>
      <div class="unplanned-link" style="margin-top:18px;">
        没有交易也值得复盘？<button data-action="open-review">写一段空仓复盘</button>
      </div>
    `;
  }

  function compareHTML(stats) {
    const insight = comparisonInsight(stats);
    return `
      <div class="panel">
        <div class="stack">
          ${compareBlock("完全遵守计划", stats.followed.length, stats.followedWinRate, stats.followedAvg, false)}
          ${compareBlock("存在偏离", stats.deviated.length, stats.deviatedWinRate, stats.deviatedAvg, true)}
        </div>
        <div class="insight">${ICONS.spark}<span>${insight}</span></div>
      </div>
    `;
  }

  function compareBlock(label, n, winRate, avg, rust) {
    const width = Number.isFinite(winRate) ? clamp(winRate, 0, 100) : 0;
    return `
      <div class="compare-block">
        <div class="compare-head">
          <span><i class="dot ${rust ? "rust" : ""}"></i>${label}</span>
          <small>n = ${n}</small>
        </div>
        <div class="compare-bar ${rust ? "rust" : ""}"><i style="width:${width}%"></i></div>
        <div class="compare-meta">
          <span>盈利占比 <b>${Number.isFinite(winRate) ? fmtPct(winRate) : "—"}</b></span>
          <span>结果均值 <b>${fmtScore(avg)}</b></span>
        </div>
      </div>
    `;
  }

  function comparisonInsight(stats) {
    if (stats.followed.length < 3 || stats.deviated.length < 3) {
      return "任一组样本不足 3 笔，先继续记录。不要用少量交易给规则下结论。";
    }
    if (stats.followedAvg > stats.deviatedAvg + 0.15) {
      return "当前样本里，按计划执行的平均结果更好。继续用稳定过程换取概率，而不是追求单次全对。";
    }
    if (stats.followedAvg < stats.deviatedAvg - 0.15) {
      return "偏离组暂时更好，这可能只是运气或样本偏差。别急着改写规则，先看下一轮样本是否重复。";
    }
    return "两组结果接近。遵守规则的价值在于可重复、可解释，而不是保证每一笔都盈利。";
  }

  function matrixHTML(stats) {
    const m = stats.matrix;
    const dangerous = m.deviatedWin;
    return `
      <div class="panel">
        <div class="matrix">
          <div class="matrix-cell good">
            <span>按计划 · 盈利</span>
            <b>${m.followedWin}</b>
            <small>纪律的正反馈</small>
          </div>
          <div class="matrix-cell correct-loss">
            <span>按计划 · 亏损</span>
            <b>${m.followedLoss}</b>
            <small>正确的失败，成本可控</small>
          </div>
          <div class="matrix-cell danger">
            <span>偏离 · 盈利</span>
            <b>${m.deviatedWin}</b>
            <small>危险的成功</small>
          </div>
          <div class="matrix-cell bad">
            <span>偏离 · 亏损</span>
            <b>${m.deviatedLoss}</b>
            <small>双重代价</small>
          </div>
        </div>
        <p class="matrix-note">${dangerous > 0
          ? `<strong>${dangerous} 次“危险的成功”</strong>：违反规则却赚钱，最容易强化坏习惯。把它们和“正确的亏损”分开看，别让运气改写你的规则。`
          : "还没有出现“偏离却盈利”的记录。继续保持：盈利应该来自可重复的过程，而不是侥幸。"
        }</p>
      </div>
    `;
  }

  function deviationHTML(stats) {
    const rows = tagStats(stats.plans).slice(0, 6);
    if (!rows.length) {
      return `<div class="panel"><div class="empty-card" style="border:0;padding:16px 8px;background:transparent;">
        <h3 style="font-size:15px;">没有结构化偏离</h3>
        <p style="margin-bottom:0;">这不一定代表完美，也可能是记录不够诚实。执行后先别急着关掉页面。</p>
      </div></div>`;
    }
    const max = Math.max(...rows.map((row) => row.n));
    return `
      <div class="panel">
        <div class="panel-head">
          <div>
            <h3>高频偏离标签</h3>
            <p>${stats.deviated.length} 笔偏离中，标签可多选</p>
          </div>
        </div>
        <div class="dist-list">
          ${rows.map((row) => `
            <div class="dist-row">
              <span title="${escapeHTML(row.label)}">${escapeHTML(row.label)}</span>
              <div class="dist-bar"><i style="width:${Math.max(8, (row.n / max) * 100)}%"></i></div>
              <b>${row.n}</b>
            </div>
          `).join("")}
        </div>
        <p class="matrix-note">先只改最高频的 1 个标签。同时修正五个问题，通常一个也坚持不下来。</p>
      </div>
    `;
  }

  function breakdownHTML(stats) {
    let rows;
    if (UI.breakdown === "emotion") {
      rows = groupStats(stats.plans, (plan) => plan.execution.emotion || "unknown", (key) => EMOTIONS[key]?.label || "未记录");
    } else if (UI.breakdown === "tag") {
      rows = tagStats(stats.plans);
    } else {
      rows = groupStats(stats.plans, (plan) => plan.isUnplanned ? "unplanned" : plan.strategy, (key) => key === "unplanned" ? "无计划交易" : (STRATEGIES[key]?.label || "其他"));
    }
    const tabs = [
      { id: "strategy", label: "策略" },
      { id: "emotion", label: "情绪" },
      { id: "tag", label: "偏离标签" }
    ];
    return `
      <div class="panel">
        <div class="breakdown-tabs" role="tablist" aria-label="结果拆分方式">
          ${tabs.map((tab) => `<button class="${UI.breakdown === tab.id ? "active" : ""}" data-action="breakdown" data-kind="${tab.id}">${tab.label}</button>`).join("")}
        </div>
        <div class="panel-head" style="margin-bottom:5px;">
          <div>
            <h3>${UI.breakdown === "strategy" ? "策略表现" : UI.breakdown === "emotion" ? "情绪与结果" : "偏离标签与结果"}</h3>
            <p>左为盈利占比，右为结果均值</p>
          </div>
        </div>
        ${rows.length ? rows.map((row) => `
          <div class="breakdown-row">
            <span class="label" title="${escapeHTML(row.label)}">${escapeHTML(row.label)}</span>
            <span class="n">${row.n} 笔</span>
            <div class="mini-bar"><i style="width:${clamp(row.winRate, 0, 100)}%"></i></div>
            <span class="score ${row.avg > 0 ? "pos" : row.avg < 0 ? "neg" : ""}">${fmtScore(row.avg)}</span>
          </div>
        `).join("") : `<p class="matrix-note" style="margin-top:12px;">这个维度还没有足够记录。</p>`}
      </div>
    `;
  }

  function reviewSectionHTML(reviews) {
    if (!reviews.length) {
      return `
        <div class="empty-card" style="text-align:left;padding:20px;">
          <h3 style="font-size:16px;text-align:left;">还没有周期复盘</h3>
          <p style="margin:4px 0 13px;text-align:left;">每周用 5 分钟回答两个问题：这周做对了什么？下周只改哪一件事？系统会自动带上本周期样本。</p>
          <button class="btn primary" data-action="open-review">${ICONS.edit} 写本期复盘</button>
        </div>
      `;
    }
    return `
      ${reviews.map((review, index) => reviewCardHTML(review, index === 0)).join("")}
      <div class="review-history">
        <button data-action="open-review"><span>${ICONS.plus} 写新的周期复盘</span><b>→</b></button>
      </div>
    `;
  }

  function reviewCardHTML(review, primary) {
    const verdict = REVIEW_VERDICTS[review.verdict] || REVIEW_VERDICTS.stable;
    return `
      <div class="review-card" style="${primary ? "" : "margin-top:9px;opacity:.86;"}">
        <div class="review-top">
          <span class="verdict ${verdict.cls}">${verdict.label}</span>
          <small>${review.period === "week" ? "近7天" : "近30天"} · ${fmtShort(review.createdAt)}</small>
        </div>
        <div class="review-statline">
          <span>${review.stats.n} 笔执行</span>
          <span>遵守率 ${fmtPct(review.stats.adherenceRate)}</span>
          <span>盈利占比 ${fmtPct(review.stats.winRate)}</span>
          ${review.topTag ? `<span>高频偏离：${escapeHTML(review.topTag)}</span>` : ""}
        </div>
        ${review.kept ? `<div class="review-q"><label>做对的一件事</label><p>${escapeHTML(review.kept)}</p></div>` : ""}
        ${review.improve ? `<div class="review-q"><label>下期只改一件事</label><p>${escapeHTML(review.improve)}</p></div>` : ""}
      </div>
    `;
  }

  function renderPrinciples() {
    const view = $("#view-principles");
    const groups = principleGroups();
    view.innerHTML = `
      <div class="page-head">
        <p class="eyebrow">Rules Before Trades</p>
        <h2>先守则，后交易</h2>
        <p>原则不是装饰，是开仓前的检查清单。</p>
      </div>

      <section class="principles-hero">
        <p class="eyebrow">交易不是预测游戏</p>
        <blockquote>而是<em>风险管理</em>的游戏。<br>活得久，才有复利。</blockquote>
        <p>受《以交易为生》与塔勒布的风险思想启发，整理为可执行的原则，而非原文摘录。</p>
      </section>

      <section class="rule-card">
        <h3>${ICONS.shield} 我的硬规则</h3>
        <div class="rule-list">
          <div><span>单笔风险上限</span><b>账户的 ${DB.settings.riskCap}%</b></div>
          <div><span>最低计划盈亏比</span><b>${DB.settings.minRR}R</b></div>
          <div><span>单标的最大仓位</span><b>${DB.settings.maxPosition}%</b></div>
          <div><span>默认首仓 / 加仓</span><b>${FIRST_TRANCHE[DB.settings.defaultTranche].label} · ${ADD_RULES[DB.settings.defaultAddRule].label}</b></div>
          <div><span>开仓前提</span><b>止损与退出条件已写清</b></div>
          <div><span>情绪前提</span><b>平静，不报复，不 FOMO</b></div>
        </div>
      </section>

      ${groups.map((group, groupIndex) => `
        <section class="principle-group">
          <div class="group-head">
            <span>${String(groupIndex + 1).padStart(2, "0")}</span>
            <h3>${group.title}</h3>
            <p>${group.subtitle}</p>
          </div>
          ${group.items.map((item, index) => `
            <article class="principle-item">
              <span class="p-index">${String(index + 1).padStart(2, "0")}</span>
              <div>
                <h4>${item.title}</h4>
                <p>${item.desc}</p>
                <span class="p-source ${item.source === "Taleb" ? "rust" : ""}">${item.source}</span>
              </div>
            </article>
          `).join("")}
        </section>
      `).join("")}

      <p class="disclaimer-note">这些原则服务于记录与自检，不构成任何投资建议。市场有风险，任何策略都可能亏损。</p>
    `;
  }

  function principleGroups() {
    return [
      {
        title: "生存优先",
        subtitle: "先不出局",
        items: [
          {
            title: "先活下来，再谈收益",
            desc: "任何单笔亏损都必须小到可以承受。先排除破产路径，复利才有意义。",
            source: "Taleb · 生存"
          },
          {
            title: "入场之前，先定义退出",
            desc: "止损、失效条件和止盈方式必须在开仓前写好。入场后再想，通常只是在为持仓找理由。",
            source: "Elder"
          },
          {
            title: "不用更大仓位证明自己",
            desc: "亏损加仓会把一次判断错误放大成账户风险。价格走反时，只执行止损，不摊平。",
            source: "Elder · 不摊平"
          },
          {
            title: "只承担可定价的风险",
            desc: "期权卖方与杠杆仓要单独做压力测试：极端行情下，亏损是否仍然可承受？",
            source: "Taleb · 尾部风险"
          }
        ]
      },
      {
        title: "交易方法",
        subtitle: "只做有优势的事",
        items: [
          {
            title: "只做计划内的机会",
            desc: "没有预设触发条件的机会，即使看起来很好，也先放过。错过不是亏损。",
            source: "Elder"
          },
          {
            title: "顺势，而不是猜顶底",
            desc: "等趋势与结构确认，不预测市场必须怎么走。你只需要处理它实际怎么走。",
            source: "Elder"
          },
          {
            title: "小注码，多次试错",
            desc: "用可承受的小风险换取开放的上行空间。不要用一次重注决定自己的交易命运。",
            source: "Taleb · 凸性"
          },
          {
            title: "说不清优势，就别下注",
            desc: "能说清这笔交易的边际在哪里，再谈仓位。说不清，通常就是没有优势。",
            source: "Elder · Edge"
          }
        ]
      },
      {
        title: "仓位管理",
        subtitle: "先算风险，再算仓位",
        items: [
          {
            title: "仓位由风险决定，不由信心决定",
            desc: "先算这笔最多亏多少可以接受，再由止损距离倒推仓位。信心越强越要警惕，它往往只是情绪的另一个名字。",
            source: "Elder · 2% 规则"
          },
          {
            title: "分批建仓，亏损不加",
            desc: "用首仓确认判断，对了再补。价格走反时只执行止损，绝不加仓摊平，也不因为“便宜了”而放大错误。",
            source: "Elder · 不摊平"
          },
          {
            title: "给单一标的设上限",
            desc: "任何一只标的的仓位都有天花板。集中可能带来收益，但也会让一次判断错误变成账户级事故。",
            source: "Taleb · 生存"
          }
        ]
      },
      {
        title: "心理与归因",
        subtitle: "不骗自己",
        items: [
          {
            title: "情绪失衡时，停止交易",
            desc: "FOMO、报复、恐惧和亢奋都会扭曲执行。先停手，再复盘，不用交易证明自己。",
            source: "Elder · 心理"
          },
          {
            title: "不以单次结果论英雄",
            desc: "盈利可能来自运气，亏损也可能来自正确过程。只根据过程与样本改进规则。",
            source: "Taleb · 随机性"
          },
          {
            title: "先排除致命错误",
            desc: "不要追求每次都做对，先确保不会因一次错误出局。否定法往往比预测更可靠。",
            source: "Taleb · 否定法"
          },
          {
            title: "为自己的决定负责",
            desc: "不把亏损归给市场、消息或他人。诚实记录自己的偏离，才有修正的入口。",
            source: "Taleb · 承担"
          }
        ]
      }
    ];
  }

  function renderSettings() {
    const view = $("#view-settings");
    const completed = completedPlans().length;
    const pending = pendingPlans().length;
    view.innerHTML = `
      <div class="page-head">
        <p class="eyebrow">Local First</p>
        <h2>设置与备份</h2>
        <p>数据只在本机，不上传服务器。</p>
      </div>

      <section class="settings-card">
        <h3>风控底线</h3>
        <p>这些数值会直接进入计划自检。超过上限的计划无法保存。</p>
        <div class="setting-row">
          <div>
            <div class="setting-label">单笔风险上限</div>
            <div class="setting-desc">占计划账户的比例，不是金额</div>
          </div>
          <div class="chip-row">
            ${RISK_OPTIONS.map((value) => `<button class="mini-chip ${DB.settings.riskCap === value ? "active" : ""}" data-action="risk-cap" data-value="${value}">${value}%</button>`).join("")}
          </div>
        </div>
        <div class="setting-row">
          <div>
            <div class="setting-label">最低盈亏比</div>
            <div class="setting-desc">计划收益 / 计划风险</div>
          </div>
          <div class="chip-row">
            ${[1.5, 2, 2.5, 3].map((value) => `<button class="mini-chip ${DB.settings.minRR === value ? "active" : ""}" data-action="min-rr" data-value="${value}">${value}R</button>`).join("")}
          </div>
        </div>
      </section>

      <section class="settings-card">
        <h3>仓位管理</h3>
        <p>先定生存边界，再决定单笔用多大仓位。计划里的仓位选项不会超过这里的上限。</p>
        <div class="setting-row">
          <div>
            <div class="setting-label">单标的最大仓位</div>
            <div class="setting-desc">任何一只标的占总资金的上限</div>
          </div>
          <div class="chip-row">
            ${MAX_POSITION_OPTIONS.map((value) => `<button class="mini-chip ${DB.settings.maxPosition === value ? "active" : ""}" data-action="max-position" data-value="${value}">${value}%</button>`).join("")}
          </div>
        </div>
        <div class="setting-row">
          <div>
            <div class="setting-label">默认首仓比例</div>
            <div class="setting-desc">新建计划时预选，仍可单笔调整</div>
          </div>
          <div class="chip-row">
            ${Object.entries(FIRST_TRANCHE).map(([key, item]) => `<button class="mini-chip ${DB.settings.defaultTranche === key ? "active" : ""}" data-action="default-tranche" data-value="${key}">${item.short}</button>`).join("")}
          </div>
        </div>
        <div class="setting-row">
          <div>
            <div class="setting-label">默认加仓原则</div>
            <div class="setting-desc">亏损加仓永远不允许</div>
          </div>
          <div class="chip-row">
            ${Object.entries(ADD_RULES).map(([key, item]) => `<button class="mini-chip ${DB.settings.defaultAddRule === key ? "active" : ""}" data-action="default-add-rule" data-value="${key}">${item.short}</button>`).join("")}
          </div>
        </div>
      </section>

      <section class="settings-card">
        <h3>常用标的</h3>
        <p>新建计划第一步点一下就能填入。按资产类别分别维护，用逗号、顿号或空格分隔，数量不限。</p>
        ${["stock", "etf", "option"].map((key) => `
          <div class="setting-row column">
            <div>
              <div class="setting-label">${ASSET_TYPES[key].label}</div>
              <div class="setting-desc">${key === "option" ? "期权对应的标的 ETF" : "经常交易的对象"}</div>
            </div>
            <input class="setting-input" data-symbols="${key}" value="${escapeHTML(DB.settings.commonSymbols[key].join(", "))}" placeholder="如 ${key === "stock" ? "贵州茅台, 宁德时代" : "科创50ETF, 创业板ETF"}" autocomplete="off">
          </div>
        `).join("")}
      </section>

      <section class="settings-card">
        <h3>数据</h3>
        <p>当前有 ${completed} 笔执行记录、${pending} 份待执行计划、${DB.reviews.length} 次周期复盘。</p>
        <div class="data-actions">
          <button class="btn" data-action="export-data">${ICONS.download} 导出备份</button>
          <button class="btn" data-action="import-data">${ICONS.upload} 导入备份</button>
          <button class="btn rust full" data-action="clear-data">${ICONS.trash} 清空所有数据</button>
        </div>
        <div class="storage-note">
          ${ICONS.lock}
          <span>浏览器本地存储可能在清理缓存或更换设备后丢失。建议每周导出一次 JSON 备份；手机可把页面添加到主屏幕。</span>
        </div>
      </section>

      <section class="settings-card">
        <h3>建议节奏</h3>
        <div class="setting-row">
          <div>
            <div class="setting-label">开仓前 · 3 分钟</div>
            <div class="setting-desc">写逻辑、仓位与首仓、触发、风险、止损与退出，通过自检才保存</div>
          </div>
        </div>
        <div class="setting-row">
          <div>
            <div class="setting-label">执行后 · 1 分钟</div>
            <div class="setting-desc">选结果档位、执行情况、偏离标签与情绪</div>
          </div>
        </div>
        <div class="setting-row">
          <div>
            <div class="setting-label">每周 · 5 分钟</div>
            <div class="setting-desc">看遵守率与高频偏离，只定一个下期改变</div>
          </div>
        </div>
      </section>

      <section class="settings-card">
        <h3>记录边界</h3>
        <p class="about-copy"><strong>不记：</strong>价格、成交金额、股数、账户余额、收益率。这里不是流水账。</p>
        <p class="about-copy"><strong>只记：</strong>资产类别、策略、仓位与首仓比例、加仓原则、风险比例、入场逻辑与触发、止损与退出条件、执行偏离、情绪、结果档位和周期复盘。</p>
        <p class="about-copy">结果档位用于观察过程，不等于真实盈亏。小样本不要过度解读。</p>
      </section>

      <section class="settings-card">
        <h3>关于</h3>
        <p class="about-copy">守则是一款个人交易纪律工具。原则受《以交易为生》与纳西姆·塔勒布的风险思想启发，文字为改写与提炼，不是原书引用。</p>
        <p class="about-copy">它不提供信号、不预测行情、不构成投资建议。任何策略都可能亏损，首要任务是避免出局。</p>
        <div class="version-row"><span>守则 v${APP_VERSION}</span><span>Local only · ${fmtDateCN(new Date())}</span></div>
      </section>
    `;
  }

  function openSheet(type, data = {}) {
    UI.sheetType = type;
    UI.sheetData = data;
    UI.sheetError = "";
    UI.lastFocus = document.activeElement;
    renderSheet();
    const sheet = $("#sheet");
    sheet.classList.add("open");
    sheet.setAttribute("aria-hidden", "false");
    $("#sheet-backdrop").classList.add("open");
    document.body.classList.add("locked");
  }

  function closeSheet() {
    const sheet = $("#sheet");
    if (!sheet) return;
    sheet.classList.remove("open");
    sheet.setAttribute("aria-hidden", "true");
    $("#sheet-backdrop").classList.remove("open");
    document.body.classList.remove("locked");
    UI.sheetType = null;
    UI.sheetData = {};
    UI.planDraft = null;
    UI.execDraft = null;
    UI.unplannedDraft = null;
    UI.reviewDraft = null;
    UI.sheetError = "";
    if (UI.lastFocus && typeof UI.lastFocus.focus === "function") {
      setTimeout(() => UI.lastFocus.focus(), 220);
    }
  }

  function renderSheet(keepScroll = false) {
    const sheetBody = $("#sheet-body");
    const scrollTop = keepScroll ? sheetBody.scrollTop : 0;
    const config = buildSheetConfig();
    if (!config) return;
    $("#sheet-title").textContent = config.title;
    $("#sheet-subtitle").textContent = config.subtitle || "";
    $("#sheet-step").textContent = config.step || "";
    sheetBody.innerHTML = config.body;
    $("#sheet-footer").innerHTML = config.footer || "";
    sheetBody.scrollTop = keepScroll ? scrollTop : 0;
  }

  function buildSheetConfig() {
    if (UI.sheetType === "plan") return planSheetConfig();
    if (UI.sheetType === "execute") return executeSheetConfig();
    if (UI.sheetType === "unplanned") return unplannedSheetConfig();
    if (UI.sheetType === "detail") return detailSheetConfig();
    if (UI.sheetType === "review") return reviewSheetConfig();
    return null;
  }

  function startPlan() {
    const cap = DB.settings.riskCap;
    const defaultRisk = RISK_OPTIONS.includes(cap) ? cap : 1;
    const defaultRR = RR_OPTIONS.find((value) => value >= DB.settings.minRR) || 4;
    const defaultPosition = POSITION_OPTIONS.filter((value) => value <= DB.settings.maxPosition).includes(20)
      ? 20
      : POSITION_OPTIONS.filter((value) => value <= DB.settings.maxPosition).pop() || 5;
    UI.planDraft = {
      assetType: "etf",
      symbol: "",
      direction: "long",
      strategy: "trend",
      thesis: "",
      positionPct: defaultPosition,
      firstTranche: DB.settings.defaultTranche,
      addRule: DB.settings.defaultAddRule,
      riskPct: defaultRisk,
      rr: defaultRR,
      trigger: "",
      stop: "",
      exit: "",
      checks: [false, false, false]
    };
    UI.planStep = 1;
    openSheet("plan");
  }

  function planChecksPass(draft) {
    const auto = autoChecks(draft);
    return auto.every((check) => check.ok) && draft.checks.every(Boolean);
  }

  function planSheetConfig() {
    const draft = UI.planDraft;
    if (!draft) return null;
    const step = UI.planStep;
    const steps = `<div class="step-bar"><i class="on"></i><i class="${step >= 2 ? "on" : ""}"></i><i class="${step >= 3 ? "on" : ""}"></i><i class="${step >= 4 ? "on" : ""}"></i></div>`;
    const title = "新建交易计划";
    const subtitle =
      step === 1 ? "先写清为什么做" :
      step === 2 ? "再算清用多大仓位" :
      step === 3 ? "最后写清怎么进、怎么退" :
      "做原则自检，才能保存";
    let body = "";
    let footer = "";

    if (step === 1) {
      const symbolList = (DB.settings.commonSymbols && DB.settings.commonSymbols[draft.assetType]) || [];
      body = `
        ${steps}
        <div class="sheet-intro">
          <h3>这笔交易，<br>为什么值得做？</h3>
          <p>不写价格和金额。只写你的优势、触发条件，以及这是不是计划内的机会。</p>
        </div>

        <div class="field">
          <div class="field-label">资产类别</div>
          <div class="asset-grid">
            ${Object.entries(ASSET_TYPES).map(([key, asset]) => `
              <button class="asset-option ${draft.assetType === key ? "active" : ""}" data-action="plan-asset" data-value="${key}">
                <b>${asset.label}</b>
                <span>${key === "stock" ? "单只股票" : key === "etf" ? "指数 / 行业" : "买方 / 卖方"}</span>
              </button>
            `).join("")}
          </div>
        </div>

        <div class="field">
          <div class="field-label">标的名或代码 <span>不必写价格</span></div>
          <input id="plan-symbol" data-plan-field="symbol" value="${escapeHTML(draft.symbol)}" placeholder="如 510300 / 贵州茅台" maxlength="24" autocomplete="off" autocapitalize="characters">
        </div>

        ${symbolList.length ? `
        <div class="field">
          <div class="field-label">常用${ASSET_TYPES[draft.assetType].label} <span>点一下填入，可在设置里维护</span></div>
          <div class="chip-grid">
            ${symbolList.map((symbol) => `<button class="chip ${draft.symbol === symbol ? "active" : ""}" data-action="plan-symbol" data-value="${escapeHTML(symbol)}">${escapeHTML(symbol)}</button>`).join("")}
          </div>
        </div>` : ""}

        <div class="field">
          <div class="field-label">方向</div>
          <div class="chip-grid three">
            ${Object.entries(DIRECTIONS).map(([key, label]) => `<button class="chip ${draft.direction === key ? "active" : ""}" data-action="plan-direction" data-value="${key}">${label}</button>`).join("")}
          </div>
        </div>

        <div class="field">
          <div class="field-label">策略类型</div>
          <div class="chip-grid">
            ${Object.entries(STRATEGIES).map(([key, item]) => `<button class="chip ${draft.strategy === key ? "active" : ""}" data-action="plan-strategy" data-value="${key}" title="${item.desc}">${item.label}</button>`).join("")}
          </div>
        </div>

        <div class="field">
          <div class="field-label">交易逻辑 / 优势 <span><b id="thesis-count">${draft.thesis.length}</b>/140</span></div>
          <textarea id="plan-thesis" data-plan-field="thesis" maxlength="140" placeholder="例如：指数中期趋势向上，回踩20日线缩量企稳，风险点清晰，盈亏比合适。">${escapeHTML(draft.thesis)}</textarea>
        </div>

        ${draft.assetType === "option" ? `<div class="tip warn">${ICONS.alert}<span>期权请把最大亏损、时间价值衰减和极端行情下的风险写进退场条件。卖方策略尤其要做尾部压力测试。</span></div>` : ""}
        ${UI.sheetError ? `<div class="tip danger">${ICONS.alert}<span>${escapeHTML(UI.sheetError)}</span></div>` : ""}
      `;
      footer = `<button class="btn primary flex" data-action="plan-next">下一步 · 仓位 ${ICONS.arrow}</button>`;
    } else if (step === 2) {
      const positionOk = Number(draft.positionPct) <= DB.settings.maxPosition;
      const allowedPositions = POSITION_OPTIONS.filter((value) => value <= DB.settings.maxPosition);
      body = `
        ${steps}
        <div class="sheet-intro">
          <h3>这笔交易，<br>用多大仓位？</h3>
          <p>仓位不是信心的刻度，而是风险预算的结果。先定总仓位，再定首仓和加仓规则。</p>
        </div>

        <div class="attention-card">
          <div class="attention-row"><span>单标的最大仓位</span><b class="${positionOk ? "" : "fail"}">${positionOk ? "通过" : "超出"} · ${DB.settings.maxPosition}%</b></div>
          <div class="attention-row"><span>首仓与加仓</span><b>${FIRST_TRANCHE[draft.firstTranche].label} · ${ADD_RULES[draft.addRule].label}</b></div>
        </div>

        <div class="field">
          <div class="field-label">计划仓位 <span>占账户总资金</span></div>
          <div class="chip-grid">
            ${allowedPositions.map((value) => `<button class="chip ${Number(draft.positionPct) === value ? "active" : ""}" data-action="plan-position" data-value="${value}">${value}%</button>`).join("")}
          </div>
          <p class="card-note">仓位上限在设置里定义，这里不能超过 ${DB.settings.maxPosition}%。轻仓不是保守，是为错误留出存活空间。</p>
        </div>

        <div class="field">
          <div class="field-label">首仓比例 <span>第一笔建多少</span></div>
          <div class="chip-grid three">
            ${Object.entries(FIRST_TRANCHE).map(([key, item]) => `<button class="chip ${draft.firstTranche === key ? "active" : ""}" data-action="plan-tranche" data-value="${key}" title="${item.desc}">${item.label}</button>`).join("")}
          </div>
          <p class="card-note">${FIRST_TRANCHE[draft.firstTranche].desc}。</p>
        </div>

        <div class="field">
          <div class="field-label">加仓原则 <span>写下来就要做到</span></div>
          <div class="chip-grid three">
            ${Object.entries(ADD_RULES).map(([key, item]) => `<button class="chip ${draft.addRule === key ? "active" : ""}" data-action="plan-add-rule" data-value="${key}" title="${item.desc}">${item.label}</button>`).join("")}
          </div>
          <p class="card-note">${ADD_RULES[draft.addRule].desc}。任何情况下都不允许亏损加仓摊平。</p>
        </div>

        <div class="tip">${ICONS.shield}<span>仓位 = 计划仓位 × 首仓比例。若首仓偏离计划，执行记录时要如实勾选“首仓比例不符”。</span></div>
        ${UI.sheetError ? `<div class="tip danger">${ICONS.alert}<span>${escapeHTML(UI.sheetError)}</span></div>` : ""}
      `;
      footer = `
        <button class="btn" data-action="plan-back">上一步</button>
        <button class="btn primary flex" data-action="plan-next">下一步 · 风险与退出 ${ICONS.arrow}</button>
      `;
    } else if (step === 3) {
      const riskOk = Number(draft.riskPct) <= DB.settings.riskCap;
      const rrOk = Number(draft.rr) >= DB.settings.minRR;
      body = `
        ${steps}
        <div class="sheet-intro">
          <h3>怎么进，怎么退，<br>都写成条件。</h3>
          <p>风险预算和盈亏比是硬约束。入场、止损与退出都请写成可执行的条件，不是模糊愿望。</p>
        </div>

        <div class="attention-card">
          <div class="attention-row"><span>单笔风险上限</span><b class="${riskOk ? "" : "fail"}">${riskOk ? "通过" : "超出"} · ${DB.settings.riskCap}%</b></div>
          <div class="attention-row"><span>最低计划盈亏比</span><b class="${rrOk ? "" : "fail"}">${rrOk ? "通过" : "不足"} · ${DB.settings.minRR}R</b></div>
        </div>

        <div class="field">
          <div class="field-label">计划风险 <span>账户百分比</span></div>
          <div class="chip-grid">
            ${RISK_OPTIONS.map((value) => `<button class="chip ${Number(draft.riskPct) === value ? "active" : ""}" data-action="plan-risk" data-value="${value}">${value}%</button>`).join("")}
          </div>
          <p class="card-note">只记录风险比例，不记录具体金额。超出上限的计划无法保存。</p>
        </div>

        <div class="field">
          <div class="field-label">计划盈亏比 <span>潜在收益 / 风险</span></div>
          <div class="chip-grid">
            ${RR_OPTIONS.map((value) => `<button class="chip ${Number(draft.rr) === value ? "active" : ""}" data-action="plan-rr" data-value="${value}">${value}R${value === 4 ? "+" : ""}</button>`).join("")}
          </div>
        </div>

        <div class="field">
          <div class="field-label">入场触发条件 <span>写条件</span></div>
          <textarea id="plan-trigger" data-plan-field="trigger" maxlength="160" placeholder="例如：回踩 20 日线缩量收阳，收盘确认后次日进场。">${escapeHTML(draft.trigger)}</textarea>
        </div>

        <div class="field">
          <div class="field-label">止损 / 失效条件 <span>写条件</span></div>
          <textarea id="plan-stop" data-plan-field="stop" maxlength="160" placeholder="例如：收盘跌破 20 日线，或逻辑被证伪即离场。">${escapeHTML(draft.stop)}</textarea>
        </div>

        <div class="field">
          <div class="field-label">止盈 / 退出条件 <span>写条件</span></div>
          <textarea id="plan-exit" data-plan-field="exit" maxlength="160" placeholder="例如：达到 2R 先减半，剩余仓位跌破 10 日线离场。">${escapeHTML(draft.exit)}</textarea>
        </div>

        ${draft.assetType === "option" ? `<div class="tip warn">${ICONS.alert}<span>检查极端行情：若波动率跳升、流动性消失或时间价值快速衰减，退出条件是否仍然有效？</span></div>` : ""}
        ${UI.sheetError ? `<div class="tip danger">${ICONS.alert}<span>${escapeHTML(UI.sheetError)}</span></div>` : ""}
      `;
      footer = `
        <button class="btn" data-action="plan-back">上一步</button>
        <button class="btn primary flex" data-action="plan-next">下一步 · 原则自检 ${ICONS.arrow}</button>
      `;
    } else {
      const auto = autoChecks(draft);
      const allAuto = auto.every((check) => check.ok);
      const canSave = planChecksPass(draft);
      const passedCount = auto.filter((check) => check.ok).length + draft.checks.filter(Boolean).length;
      body = `
        ${steps}
        <div class="sheet-intro">
          <h3>最后一遍，<br>问自己三个问题。</h3>
          <p>自动检查来自你刚填写的计划。下面三项必须由你确认，而不是系统替你确认。</p>
        </div>

        <div class="summary-block">
          <div class="summary-top">
            <div class="asset-badge ${ASSET_TYPES[draft.assetType].cls}">${ASSET_TYPES[draft.assetType].short}</div>
            <div>
              <h3>${escapeHTML(draft.symbol || "未命名标的")}</h3>
              <p>${DIRECTIONS[draft.direction]} · ${STRATEGIES[draft.strategy].label} · ${ASSET_TYPES[draft.assetType].label}</p>
            </div>
          </div>
          <div class="summary-row"><span>交易逻辑</span><b>${escapeHTML(draft.thesis)}</b></div>
          <div class="summary-row"><span>仓位 / 首仓</span><b>${Number(draft.positionPct)}% · ${FIRST_TRANCHE[draft.firstTranche].label}</b></div>
          <div class="summary-row"><span>加仓原则</span><b>${ADD_RULES[draft.addRule].label}</b></div>
          <div class="summary-row"><span>风险 / 盈亏比</span><b>${Number(draft.riskPct)}% / ${Number(draft.rr)}R</b></div>
          <div class="summary-row"><span>入场触发</span><b>${escapeHTML(draft.trigger)}</b></div>
          <div class="summary-row"><span>止损条件</span><b>${escapeHTML(draft.stop)}</b></div>
          <div class="summary-row"><span>退出条件</span><b>${escapeHTML(draft.exit)}</b></div>
        </div>

        <div class="field">
          <div class="field-label">自动检查 <span>${auto.filter((check) => check.ok).length}/${auto.length} 项通过</span></div>
          <div class="checklist">
            ${auto.map((check) => `
              <div class="check-item">
                <span class="check-icon ${check.ok ? "" : "fail"}">${check.ok ? ICONS.check : ICONS.x}</span>
                <span>${check.label}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="field">
          <div class="field-label">手动确认 <span id="plan-manual-count">${draft.checks.filter(Boolean).length}/3</span></div>
          <div class="manual-checks">
            ${MANUAL_CHECKS.map((text, index) => `
              <label class="check-toggle">
                <input type="checkbox" data-plan-check="${index}" ${draft.checks[index] ? "checked" : ""}>
                <span class="check-box">${ICONS.check}</span>
                <span>${text}</span>
              </label>
            `).join("")}
          </div>
        </div>

        ${!allAuto
          ? `<div class="tip danger">${ICONS.alert}<span>有硬规则未通过。请返回上一步调整风险或盈亏比，系统不允许保存不合规的计划。</span></div>`
          : `<div class="tip">${ICONS.shield}<span id="plan-check-tip">自检 ${passedCount}/10 项通过。计划保存后会进入“待执行”，执行结束再回来记录真实过程。</span></div>`
        }
        ${UI.sheetError ? `<div class="tip danger">${ICONS.alert}<span>${escapeHTML(UI.sheetError)}</span></div>` : ""}
      `;
      footer = `
        <button class="btn" data-action="plan-back">上一步</button>
        <button class="btn primary flex" data-action="plan-save" ${canSave ? "" : "disabled"}>保存计划 ${ICONS.check}</button>
      `;
    }

    return {
      title,
      subtitle,
      step: `${step} / 4`,
      body,
      footer
    };
  }

  function savePlan() {
    const draft = UI.planDraft;
    if (!draft) return;
    if (!planChecksPass(draft)) {
      UI.sheetError = "计划未通过全部自检，暂不能保存。请返回检查风险、盈亏比和手动确认项。";
      renderSheet();
      return;
    }
    const plan = {
      id: uid("plan"),
      createdAt: new Date().toISOString(),
      status: "planned",
      assetType: draft.assetType,
      symbol: draft.symbol.trim(),
      direction: draft.direction,
      strategy: draft.strategy,
      thesis: draft.thesis.trim(),
      positionPct: Number(draft.positionPct),
      firstTranche: draft.firstTranche,
      addRule: draft.addRule,
      riskPct: Number(draft.riskPct),
      rr: Number(draft.rr),
      trigger: draft.trigger.trim(),
      stop: draft.stop.trim(),
      exit: draft.exit.trim(),
      checks: draft.checks.map(Boolean),
      autoChecks: autoChecks(draft).map((check) => ({ id: check.id, ok: check.ok })),
      isUnplanned: false,
      execution: null
    };
    DB.plans.push(plan);
    saveState();
    closeSheet();
    UI.tab = "log";
    render();
    switchTab("log");
    toast("计划已保存，执行后回来记录");
  }

  function startExecution(planId) {
    const plan = getPlan(planId);
    if (!plan || plan.status !== "planned") return;
    UI.execDraft = {
      result: null,
      adherence: null,
      tags: [],
      emotion: null,
      note: "",
      review: ""
    };
    UI.execStep = 1;
    openSheet("execute", { planId });
  }

  function execStepTwoReady(draft) {
    return Boolean(
      draft.adherence &&
      draft.emotion &&
      (draft.adherence === "full" || draft.tags.length > 0)
    );
  }

  function executeSheetConfig() {
    const plan = getPlan(UI.sheetData.planId);
    const draft = UI.execDraft;
    if (!plan || !draft) return null;
    const step = UI.execStep;
    const steps = `<div class="step-bar"><i class="on"></i><i class="${step >= 2 ? "on" : ""}"></i><i class="${step >= 3 ? "on" : ""}"></i></div>`;
    const subtitle = step === 1 ? "记录实际结果档位" : step === 2 ? "对照计划检查执行" : "留下可复用的教训";
    let body = "";
    let footer = "";

    if (step === 1) {
      body = `
        ${steps}
        <div class="sheet-intro">
          <h3>这笔交易，<br>实际结果如何？</h3>
          <p>只选一个结果档位，不填金额、收益率或成交价。结果差不一定做错，结果好也不一定做对。</p>
        </div>
        ${execPlanSummary(plan)}
        <div class="field">
          <div class="field-label">结果档位 <span>相对计划</span></div>
          <div class="option-list">
            ${Object.entries(RESULTS).map(([key, item]) => `
              <button class="option-card ${draft.result === key ? "active" : ""}" data-action="exec-result" data-value="${key}">
                <span class="tone ${item.tone}"></span>
                <span>
                  <h4>${item.label}</h4>
                  <p>${item.desc}</p>
                </span>
                <span class="radio-mark"></span>
              </button>
            `).join("")}
          </div>
        </div>
        <div class="tip">${ICONS.info}<span>结果档位会映射为 +2 至 -2 的过程分，用于统计对比，不代表真实收益金额。</span></div>
      `;
      footer = `<button class="btn primary flex" data-action="exec-next" ${draft.result ? "" : "disabled"}>下一步 · 执行情况 ${ICONS.arrow}</button>`;
    } else if (step === 2) {
      const showTags = draft.adherence && draft.adherence !== "full";
      body = `
        ${steps}
        <div class="sheet-intro">
          <h3>这笔交易，<br>按计划做了吗？</h3>
          <p>诚实比“好看”重要。一次偏离不会毁掉系统，但漏记会让复盘失真。</p>
        </div>

        <div class="field">
          <div class="field-label">执行情况</div>
          <div class="adherence-options">
            ${Object.entries(ADHERENCE).map(([key, item]) => `
              <button class="adherence-card ${key} ${draft.adherence === key ? "active" : ""}" data-action="exec-adherence" data-value="${key}">
                <span class="a-icon">${key === "full" ? ICONS.check : key === "partial" ? "△" : "!"}</span>
                <span>
                  <h4>${item.label}</h4>
                  <p>${item.desc}</p>
                </span>
                <span class="tag-counter">${key === "full" ? "无偏离" : "需标签"}</span>
              </button>
            `).join("")}
          </div>
        </div>

        ${showTags ? `
          <div class="field">
            <div class="field-label">偏离发生在哪 <span>可多选</span></div>
            ${tagSelectorHTML(draft.tags, false)}
          </div>
          <div class="field">
            <div class="field-label">补充说明 <span>可选</span></div>
            <textarea data-exec-field="note" maxlength="180" placeholder="只写原因，不必写价格。例如：看到放量突破后怕错过，提前半天进场。">${escapeHTML(draft.note)}</textarea>
          </div>
        ` : ""}

        <div class="field">
          <div class="field-label">执行时主导情绪 <span>单选</span></div>
          <div class="chip-grid">
            ${Object.entries(EMOTIONS).map(([key, item]) => `<button class="chip ${draft.emotion === key ? "active" : ""}" data-action="exec-emotion" data-value="${key}">${item.label}</button>`).join("")}
          </div>
          <p class="card-note">情绪不是借口，是数据。它只用于找出重复出现的情境。</p>
        </div>

        ${UI.sheetError ? `<div class="tip danger">${ICONS.alert}<span>${escapeHTML(UI.sheetError)}</span></div>` : ""}
      `;
      footer = `
        <button class="btn" data-action="exec-back">上一步</button>
        <button class="btn primary flex" data-action="exec-next" ${execStepTwoReady(draft) ? "" : "disabled"}>下一步 · 复盘 ${ICONS.arrow}</button>
      `;
    } else {
      const result = RESULTS[draft.result];
      const adherence = ADHERENCE[draft.adherence];
      body = `
        ${steps}
        <div class="sheet-intro">
          <h3>封存这次执行，<br>留下一个改变。</h3>
          <p>复盘只写一句就够。不要写长篇总结，写下次真正能执行的动作。</p>
        </div>

        <div class="review-recap">
          <div><span>标的</span><b>${escapeHTML(plan.symbol)} · ${STRATEGIES[plan.strategy].label}</b></div>
          <div><span>结果</span><b>${result.label}</b></div>
          <div><span>执行</span><b>${adherence.label}</b></div>
          <div><span>情绪</span><b>${EMOTIONS[draft.emotion]?.label || "—"}</b></div>
          ${draft.tags.length ? `<div><span>偏离</span><b>${draft.tags.map((tag) => TAG_MAP[tag]?.label).filter(Boolean).join(" / ")}</b></div>` : ""}
        </div>

        <div class="field">
          <div class="field-label">下一次，只改一件什么？ <span>可选</span></div>
          <textarea data-exec-field="review" maxlength="220" placeholder="例如：下一次必须等收盘确认，不再因为盘中一根阳线追进去。">${escapeHTML(draft.review)}</textarea>
        </div>

        ${draft.adherence !== "full" ? `<div class="tip warn">${ICONS.alert}<span>这次会如实计入偏离统计。如果偏离却盈利，它会进入“危险的成功”，提醒你别把运气当能力。</span></div>` : `<div class="tip">${ICONS.shield}<span>这次计入“完全遵守”。即使结果是亏损，它也不会被当作纪律失败。</span></div>`}
      `;
      footer = `
        <button class="btn" data-action="exec-back">上一步</button>
        <button class="btn primary flex" data-action="exec-save">保存执行记录 ${ICONS.check}</button>
      `;
    }

    return {
      title: "记录执行",
      subtitle,
      step: `${step} / 3`,
      body,
      footer
    };
  }

  function execPlanSummary(plan) {
    return `
      <div class="summary-block">
        <div class="summary-top">
          <div class="asset-badge ${ASSET_TYPES[plan.assetType].cls}">${ASSET_TYPES[plan.assetType].short}</div>
          <div>
            <h3>${escapeHTML(plan.symbol)}</h3>
            <p>${STRATEGIES[plan.strategy].label} · ${DIRECTIONS[plan.direction]} · 仓位 ${Number(plan.positionPct)}% · 风险 ${Number(plan.riskPct)}%</p>
          </div>
          <span class="status-badge">计划原文</span>
        </div>
        <div class="summary-row"><span>交易逻辑</span><b>${escapeHTML(plan.thesis)}</b></div>
        <div class="summary-row"><span>仓位 / 首仓</span><b>${Number(plan.positionPct)}% · ${FIRST_TRANCHE[plan.firstTranche || "full"].label} · ${ADD_RULES[plan.addRule || "none"].label}</b></div>
        <div class="summary-row"><span>入场触发</span><b>${escapeHTML(plan.trigger || "未设定")}</b></div>
        <div class="summary-row"><span>止损条件</span><b>${escapeHTML(plan.stop || "未设定")}</b></div>
        <div class="summary-row"><span>退出条件</span><b>${escapeHTML(plan.exit || "未设定")}</b></div>
      </div>
    `;
  }

  function tagSelectorHTML(selected, includeNoPlan) {
    return TAG_GROUPS.map((group) => {
      const tags = TAGS.filter((tag) => tag.group === group.id && (includeNoPlan || tag.id !== "no_plan"));
      if (!tags.length) return "";
      return `
        <div class="tag-group">
          <div class="tag-group-label">${group.label}</div>
          <div class="chip-grid">
            ${tags.map((tag) => `<button class="tag-chip ${selected.includes(tag.id) ? "active" : ""}" data-action="exec-tag" data-value="${tag.id}">${tag.label}</button>`).join("")}
          </div>
        </div>
      `;
    }).join("");
  }

  function saveExecution() {
    const plan = getPlan(UI.sheetData.planId);
    const draft = UI.execDraft;
    if (!plan || !draft) return;
    if (!execStepTwoReady(draft)) {
      UI.sheetError = "执行情况、主导情绪和偏离标签尚未填完。";
      renderSheet();
      return;
    }
    plan.execution = {
      result: draft.result,
      adherence: draft.adherence,
      tags: draft.tags.slice(),
      emotion: draft.emotion,
      note: draft.adherence === "full" ? "" : draft.note.trim(),
      review: draft.review.trim(),
      completedAt: new Date().toISOString()
    };
    plan.status = "completed";
    saveState();
    closeSheet();
    switchTab("log");
    renderLog();
    toast("已封存这次执行");
  }

  function startUnplanned() {
    UI.unplannedDraft = {
      assetType: "etf",
      symbol: "",
      strategy: "other",
      result: null,
      emotion: null,
      tags: [],
      note: ""
    };
    UI.unplannedStep = 1;
    openSheet("unplanned");
  }

  function unplannedStepOneReady(draft) {
    return Boolean(draft.symbol.trim().length && draft.result);
  }

  function unplannedSheetConfig() {
    const draft = UI.unplannedDraft;
    if (!draft) return null;
    const step = UI.unplannedStep;
    const steps = `<div class="step-bar"><i class="on"></i><i class="${step >= 2 ? "on" : ""}"></i></div>`;
    let body = "";
    let footer = "";

    if (step === 1) {
      body = `
        ${steps}
        <div class="sheet-intro">
          <h3>这笔交易，<br>没有入场前计划。</h3>
          <p>补记不是鼓励。它是把一次失控变成数据，避免下次用“忘了”掩盖真实原因。</p>
        </div>
        <div class="tip danger">${ICONS.alert}<span>系统会把它记为严重偏离和无计划交易，并计入遵守率。诚实记录本身就是修正的起点。</span></div>

        <div class="field">
          <div class="field-label">资产类别</div>
          <div class="asset-grid">
            ${Object.entries(ASSET_TYPES).map(([key, asset]) => `
              <button class="asset-option ${draft.assetType === key ? "active" : ""}" data-action="unplanned-asset" data-value="${key}">
                <b>${asset.label}</b>
                <span>${key === "stock" ? "单只股票" : key === "etf" ? "指数 / 行业" : "买方 / 卖方"}</span>
              </button>
            `).join("")}
          </div>
        </div>

        <div class="field">
          <div class="field-label">标的名或代码</div>
          <input data-unplanned-field="symbol" value="${escapeHTML(draft.symbol)}" placeholder="如 510300 / 贵州茅台" maxlength="24" autocomplete="off">
        </div>

        <div class="field">
          <div class="field-label">事后看，属于哪类策略</div>
          <div class="chip-grid">
            ${Object.entries(STRATEGIES).map(([key, item]) => `<button class="chip ${draft.strategy === key ? "active" : ""}" data-action="unplanned-strategy" data-value="${key}">${item.label}</button>`).join("")}
          </div>
        </div>

        <div class="field">
          <div class="field-label">结果档位</div>
          <div class="option-list">
            ${Object.entries(RESULTS).map(([key, item]) => `
              <button class="option-card ${draft.result === key ? "active" : ""}" data-action="unplanned-result" data-value="${key}">
                <span class="tone ${item.tone}"></span>
                <span><h4>${item.label}</h4><p>${item.desc}</p></span>
                <span class="radio-mark"></span>
              </button>
            `).join("")}
          </div>
        </div>
        ${UI.sheetError ? `<div class="tip danger">${ICONS.alert}<span>${escapeHTML(UI.sheetError)}</span></div>` : ""}
      `;
      footer = `<button class="btn primary flex" data-action="unplanned-next" ${unplannedStepOneReady(draft) ? "" : "disabled"}>下一步 · 偏离原因 ${ICONS.arrow}</button>`;
    } else {
      body = `
        ${steps}
        <div class="sheet-intro">
          <h3>不是“手滑”，<br>是哪一个环节失守？</h3>
          <p>选最直接的标签。无法归类时，至少留下一个诚实备注。</p>
        </div>

        <div class="field">
          <div class="field-label">已标记</div>
          <div class="detail-tag-list"><span class="detail-tag">无计划交易</span></div>
        </div>

        <div class="field">
          <div class="field-label">执行时主导情绪</div>
          <div class="chip-grid">
            ${Object.entries(EMOTIONS).map(([key, item]) => `<button class="chip ${draft.emotion === key ? "active" : ""}" data-action="unplanned-emotion" data-value="${key}">${item.label}</button>`).join("")}
          </div>
        </div>

        <div class="field">
          <div class="field-label">触发这次交易的直接原因 <span>可多选</span></div>
          ${tagSelectorHTML(draft.tags, false)}
        </div>

        <div class="field">
          <div class="field-label">备注 <span>可选</span></div>
          <textarea data-unplanned-field="note" maxlength="180" placeholder="例如：盘中看到群里讨论，害怕错过，没写计划就追进去了。">${escapeHTML(draft.note)}</textarea>
        </div>
        ${UI.sheetError ? `<div class="tip danger">${ICONS.alert}<span>${escapeHTML(UI.sheetError)}</span></div>` : ""}
      `;
      footer = `
        <button class="btn" data-action="unplanned-back">上一步</button>
        <button class="btn primary flex" data-action="unplanned-save" ${draft.emotion ? "" : "disabled"}>保存补记 ${ICONS.check}</button>
      `;
    }

    return {
      title: "补记无计划交易",
      subtitle: step === 1 ? "诚实记录，不美化" : "找出流程失守点",
      step: `${step} / 2`,
      body,
      footer
    };
  }

  function saveUnplanned() {
    const draft = UI.unplannedDraft;
    if (!draft) return;
    if (!unplannedStepOneReady(draft) || !draft.emotion) {
      UI.sheetError = "请补全标的、结果和主导情绪。";
      renderSheet();
      return;
    }
    const tags = ["no_plan", ...draft.tags.filter((tag) => tag !== "no_plan")];
    const plan = {
      id: uid("plan"),
      createdAt: new Date().toISOString(),
      status: "completed",
      assetType: draft.assetType,
      symbol: draft.symbol.trim(),
      direction: "long",
      strategy: draft.strategy,
      thesis: "没有入场前计划。此为事后诚实补记。",
      positionPct: null,
      firstTranche: "full",
      addRule: "none",
      riskPct: null,
      rr: null,
      trigger: "未设定",
      stop: "未设定",
      exit: "未设定",
      checks: [],
      autoChecks: [],
      isUnplanned: true,
      execution: {
        result: draft.result,
        adherence: "major",
        tags,
        emotion: draft.emotion,
        note: draft.note.trim(),
        review: "",
        completedAt: new Date().toISOString()
      }
    };
    DB.plans.push(plan);
    saveState();
    closeSheet();
    switchTab("log");
    renderLog();
    toast("已补记。下一次先写计划再下注");
  }

  function openPlanDetail(planId) {
    if (!getPlan(planId)) return;
    openSheet("detail", { planId });
  }

  function detailSheetConfig() {
    const plan = getPlan(UI.sheetData.planId);
    if (!plan) return null;
    const asset = ASSET_TYPES[plan.assetType] || ASSET_TYPES.etf;
    const strategy = plan.isUnplanned ? "无计划交易" : STRATEGIES[plan.strategy].label;
    const completed = plan.status === "completed" && plan.execution;
    let body = "";
    let footer = "";

    body += `
      <div class="detail-hero">
        <div class="asset-badge ${asset.cls}">${asset.short}</div>
        <div style="flex:1;min-width:0;">
          <h3>${escapeHTML(plan.symbol)}</h3>
          <p>${strategy} · ${plan.isUnplanned ? "事后补记" : DIRECTIONS[plan.direction]} · ${fmtDateCN(plan.createdAt)}</p>
        </div>
        <span class="status-badge" style="${completed ? "background:var(--surface-2);color:var(--muted);" : ""}">${completed ? "已完成" : "待执行"}</span>
      </div>
    `;

    if (plan.isUnplanned) {
      body += `<div class="tip danger">${ICONS.alert}<span>这是一笔没有预先计划的交易，系统按严重偏离记录。它不是流水账，而是一面镜子。</span></div>`;
    }

    if (completed) {
      const execution = plan.execution;
      const result = RESULTS[execution.result];
      const adherence = ADHERENCE[execution.adherence] || ADHERENCE.major;
      const emotion = EMOTIONS[execution.emotion]?.label || "未记录";
      const classification = processOutcomeMessage(plan);
      body += `
        <div class="detail-section">
          <h4>执行结果</h4>
          <div class="review-recap">
            <div><span>结果档位</span><b>${result?.label || "未记录"}</b></div>
            <div><span>执行情况</span><b>${adherence.label}</b></div>
            <div><span>主导情绪</span><b>${emotion}</b></div>
            <div><span>记录时间</span><b>${fmtDateCN(execution.completedAt)} ${fmtTime(execution.completedAt)}</b></div>
          </div>
          ${execution.tags && execution.tags.length ? `<div class="detail-tag-list">${execution.tags.map((tagId) => `<span class="detail-tag">${TAG_MAP[tagId]?.label || tagId}</span>`).join("")}</div>` : `<div class="detail-tag-list"><span class="detail-tag green">无偏离标签</span></div>`}
        </div>

        ${execution.note ? `<div class="detail-section"><h4>偏离说明</h4><div class="body-text">${escapeHTML(execution.note)}</div></div>` : ""}
        ${execution.review ? `<div class="detail-section"><h4>下一次只改一件</h4><div class="detail-quote">${escapeHTML(execution.review)}</div></div>` : ""}

        <div class="detail-section">
          <h4>过程判断</h4>
          <div class="detail-quote">${classification}</div>
        </div>
      `;
    }

    body += `
      <div class="detail-section">
        <h4>${plan.isUnplanned ? "事后归类" : "交易逻辑"}</h4>
        <div class="body-text">${escapeHTML(plan.thesis)}</div>
      </div>

      <div class="detail-section">
        <h4>${completed ? "当时的计划" : "风控参数"}</h4>
        <div class="detail-facts">
          <div class="detail-fact"><span>策略 / 方向</span><b>${strategy} · ${DIRECTIONS[plan.direction]}</b></div>
          <div class="detail-fact"><span>计划仓位</span><b>${plan.positionPct == null ? "未设定" : `${Number(plan.positionPct)}%`}</b></div>
          <div class="detail-fact"><span>首仓 / 加仓</span><b>${plan.isUnplanned ? "未设定" : `${FIRST_TRANCHE[plan.firstTranche || "full"].label} · ${ADD_RULES[plan.addRule || "none"].label}`}</b></div>
          <div class="detail-fact"><span>计划风险</span><b>${plan.riskPct == null ? "未设定" : `${Number(plan.riskPct)}%`}</b></div>
          <div class="detail-fact"><span>计划盈亏比</span><b>${plan.rr == null ? "未设定" : `${Number(plan.rr)}R`}</b></div>
          <div class="detail-fact"><span>资产类别</span><b>${asset.label}</b></div>
        </div>
      </div>

      <div class="detail-section">
        <h4>入场触发条件</h4>
        <div class="body-text">${escapeHTML(plan.trigger || "未设定")}</div>
      </div>
      <div class="detail-section">
        <h4>止损 / 失效条件</h4>
        <div class="body-text">${escapeHTML(plan.stop || "未设定")}</div>
      </div>
      <div class="detail-section">
        <h4>止盈 / 退出条件</h4>
        <div class="body-text">${escapeHTML(plan.exit || "未设定")}</div>
      </div>

      ${!plan.isUnplanned ? `
        <div class="detail-section">
          <h4>原则自检</h4>
          <div class="detail-tag-list">
            <span class="detail-tag green">风险上限</span>
            <span class="detail-tag green">仓位上限</span>
            <span class="detail-tag green">盈亏比</span>
            <span class="detail-tag green">退出已定义</span>
            <span class="detail-tag green">手动确认 ${Array.isArray(plan.checks) ? plan.checks.filter(Boolean).length : 0}/3</span>
          </div>
        </div>
      ` : ""}

      ${!completed ? `<div class="tip">${ICONS.info}<span>执行结束后回来点“记录执行”。系统不会保存价格，只保存结果档位与偏离情况。</span></div>` : ""}
      ${completed ? `<div class="unplanned-link" style="margin-top:2px;">结果填错了？<button data-action="reset-execution" data-id="${escapeHTML(plan.id)}">重新记录这次执行</button></div>` : ""}
    `;

    if (!completed) {
      footer = `
        <button class="btn rust" data-action="cancel-plan" data-id="${escapeHTML(plan.id)}">放弃计划</button>
        <button class="btn primary flex" data-action="execute-plan" data-id="${escapeHTML(plan.id)}">记录执行 ${ICONS.arrow}</button>
      `;
    } else {
      footer = `
        <button class="btn rust" data-action="delete-record" data-id="${escapeHTML(plan.id)}">删除记录</button>
        <button class="btn primary flex" data-action="close-sheet">关闭详情</button>
      `;
    }

    return {
      title: "交易详情",
      subtitle: completed ? "计划 · 执行 · 复盘" : "执行前最后检查一次",
      step: completed ? "ARCHIVED" : "PLANNED",
      body,
      footer
    };
  }

  function processOutcomeMessage(plan) {
    const win = plan.execution.result === "bigWin" || plan.execution.result === "win";
    if (isFollowed(plan) && win) {
      return "纪律的正反馈。按计划执行并获得结果，保持过程，而不是追逐这一次的盈利。";
    }
    if (isFollowed(plan) && !win) {
      return "正确的失败。亏损发生在计划之内，过程仍然正确。只要成本可控，这类交易值得重复。";
    }
    if (!isFollowed(plan) && win) {
      return "危险的成功。盈利不能证明偏离正确，反而最容易强化坏习惯。把这次当作运气样本。";
    }
    return "双重代价。既有流程偏离，也产生了亏损。下一次只修复一个最直接的失守点。";
  }

  function cancelPlan(planId) {
    const plan = getPlan(planId);
    if (!plan) return;
    showConfirm({
      title: "放弃这份计划？",
      desc: "未执行的计划会从日志中移除，不进入遵守率统计。只有真正执行过的交易才计入。",
      okText: "放弃计划",
      danger: true,
      onConfirm: () => {
        plan.status = "cancelled";
        plan.cancelledAt = new Date().toISOString();
        saveState();
        closeSheet();
        render();
        toast("计划已放弃");
      }
    });
  }

  function resetExecution(planId) {
    const plan = getPlan(planId);
    if (!plan || !plan.execution) return;
    showConfirm({
      title: "重新记录这次执行？",
      desc: "原来的结果、偏离标签和复盘会被清除，计划内容保留。适用于结果或标签填错的情况。",
      okText: "重新记录",
      danger: true,
      onConfirm: () => {
        plan.execution = null;
        plan.status = "planned";
        saveState();
        closeSheet();
        render();
        setTimeout(() => startExecution(planId), 240);
      }
    });
  }

  function deleteRecord(planId) {
    const plan = getPlan(planId);
    if (!plan) return;
    showConfirm({
      title: "删除这条记录？",
      desc: "这份计划和它的执行记录会一起删除，并影响遵守率与偏离统计。此操作无法撤销。",
      okText: "删除",
      danger: true,
      onConfirm: () => {
        DB.plans = DB.plans.filter((item) => item.id !== planId);
        saveState();
        closeSheet();
        render();
        toast("记录已删除");
      }
    });
  }

  function startReview() {
    UI.reviewDraft = {
      period: "week",
      verdict: null,
      kept: "",
      improve: ""
    };
    openSheet("review");
  }

  function reviewStatsFor(period) {
    const days = period === "month" ? 30 : 7;
    const stats = getStats(plansInPeriod(days));
    const tags = tagStats(stats.plans);
    return { stats, topTag: tags[0]?.label || "" };
  }

  function reviewCanSave(draft) {
    return Boolean(draft.verdict && draft.improve.trim().length >= 2);
  }

  function reviewSheetConfig() {
    const draft = UI.reviewDraft;
    if (!draft) return null;
    const { stats, topTag } = reviewStatsFor(draft.period);
    const periodText = draft.period === "week" ? "近7天" : "近30天";
    const body = `
      <div class="sheet-intro">
        <h3>把这段时间，<br>压缩成一个改变。</h3>
        <p>复盘不是重写历史，而是决定下一步只改什么。系统自动汇总当前周期的过程数据。</p>
      </div>

      <div class="field">
        <div class="field-label">复盘周期</div>
        <div class="segmented">
          <button class="${draft.period === "week" ? "active" : ""}" data-action="review-period" data-period="week">近7天</button>
          <button class="${draft.period === "month" ? "active" : ""}" data-action="review-period" data-period="month">近30天</button>
        </div>
      </div>

      <div class="summary-block">
        <div class="summary-top">
          <div class="asset-badge" style="background:var(--accent-soft);color:var(--accent-deep);">${ICONS.chart}</div>
          <div>
            <h3>${periodText} · ${stats.n} 笔执行</h3>
            <p>数据只作为复盘背景，不用它给自己贴标签</p>
          </div>
        </div>
        <div class="summary-row"><span>原则遵守率</span><b>${stats.n ? fmtPct(stats.adherenceRate) : "—"}</b></div>
        <div class="summary-row"><span>结果盈利占比</span><b>${stats.n ? fmtPct(stats.winRate) : "—"}</b></div>
        <div class="summary-row"><span>高频偏离标签</span><b>${topTag || "暂无"}</b></div>
        <div class="summary-row"><span>无计划交易</span><b>${stats.unplanned} 笔</b></div>
      </div>

      ${stats.n === 0 ? `<div class="tip">${ICONS.info}<span>${periodText}还没有执行记录。可以复盘流程、情绪或决定暂停交易，这同样是有效复盘。</span></div>` : ""}

      <div class="field">
        <div class="field-label">本期判断</div>
        <div class="chip-grid three">
          ${Object.entries(REVIEW_VERDICTS).map(([key, item]) => `<button class="chip ${draft.verdict === key ? "active" : ""}" data-action="review-verdict" data-value="${key}">${item.label}</button>`).join("")}
        </div>
      </div>

      <div class="field">
        <div class="field-label">做对的一件事 <span>可选</span></div>
        <textarea data-review-field="kept" maxlength="180" placeholder="例如：这周有两次想追高，但我先写了计划，最后放弃了。">${escapeHTML(draft.kept)}</textarea>
      </div>

      <div class="field">
        <div class="field-label">下期只改一件事 <span>必填</span></div>
        <textarea data-review-field="improve" maxlength="180" placeholder="例如：下次偏离后，当天必须补记，不拖到周末。">${escapeHTML(draft.improve)}</textarea>
      </div>

      <div class="tip">${ICONS.shield}<span>复盘保存后会带着当前样本快照，之后的统计变化不会改写它。这样你能看到自己当时的判断。</span></div>
    `;
    return {
      title: "周期复盘",
      subtitle: periodText,
      step: "REVIEW",
      body,
      footer: `<button class="btn primary flex" data-action="review-save" ${reviewCanSave(draft) ? "" : "disabled"}>保存复盘 ${ICONS.check}</button>`
    };
  }

  function updateReviewButtonState() {
    const button = $('#sheet-footer [data-action="review-save"]');
    if (button && UI.reviewDraft) button.disabled = !reviewCanSave(UI.reviewDraft);
  }

  function saveReview() {
    const draft = UI.reviewDraft;
    if (!draft || !reviewCanSave(draft)) {
      UI.sheetError = "请选择本期判断，并写下期只改的一件事。";
      renderSheet();
      return;
    }
    const { stats, topTag } = reviewStatsFor(draft.period);
    DB.reviews.push({
      id: uid("review"),
      createdAt: new Date().toISOString(),
      period: draft.period,
      verdict: draft.verdict,
      kept: draft.kept.trim(),
      improve: draft.improve.trim(),
      stats: {
        n: stats.n,
        adherenceRate: stats.adherenceRate,
        winRate: stats.winRate
      },
      topTag
    });
    saveState();
    closeSheet();
    switchTab("stats");
    toast("周期复盘已保存");
  }

  function togglePlanTag(tagId) {
    if (UI.sheetType === "unplanned" && UI.unplannedDraft) {
      if (tagId === "no_plan") return;
      const tags = UI.unplannedDraft.tags;
      UI.unplannedDraft.tags = tags.includes(tagId) ? tags.filter((tag) => tag !== tagId) : [...tags, tagId];
      renderSheet(true);
      return;
    }
    if (!UI.execDraft) return;
    const tags = UI.execDraft.tags;
    UI.execDraft.tags = tags.includes(tagId) ? tags.filter((tag) => tag !== tagId) : [...tags, tagId];
    renderSheet(true);
  }

  function planNext() {
    const draft = UI.planDraft;
    if (!draft) return;
    UI.sheetError = "";
    if (UI.planStep === 1) {
      if (!draft.symbol.trim()) {
        UI.sheetError = "请先填写标的名或代码。";
        renderSheet();
        return;
      }
      if (draft.thesis.trim().length < 4) {
        UI.sheetError = "用一句话写清这笔交易的逻辑或优势（至少 4 个字）。";
        renderSheet();
        return;
      }
      UI.planStep = 2;
      renderSheet();
      return;
    }
    if (UI.planStep === 2) {
      if (!Number.isFinite(Number(draft.positionPct)) || Number(draft.positionPct) <= 0) {
        UI.sheetError = "请选择这笔交易的计划仓位。";
        renderSheet();
        return;
      }
      if (Number(draft.positionPct) > DB.settings.maxPosition) {
        UI.sheetError = `计划仓位 ${Number(draft.positionPct)}% 超过你设定的单标的上限 ${DB.settings.maxPosition}%。先把仓位降下来。`;
        renderSheet();
        return;
      }
      UI.planStep = 3;
      renderSheet();
      return;
    }
    if (UI.planStep === 3) {
      if (Number(draft.riskPct) > DB.settings.riskCap) {
        UI.sheetError = `计划风险 ${Number(draft.riskPct)}% 超过你设定的单笔上限 ${DB.settings.riskCap}%。先降低风险，再继续。`;
        renderSheet();
        return;
      }
      if (Number(draft.rr) < DB.settings.minRR) {
        UI.sheetError = `计划盈亏比 ${Number(draft.rr)}R 低于最低要求 ${DB.settings.minRR}R。没有足够赔率的机会，就不值得下注。`;
        renderSheet();
        return;
      }
      if (draft.trigger.trim().length < 2) {
        UI.sheetError = "请写清入场触发条件。什么情况下才允许自己进场？";
        renderSheet();
        return;
      }
      if (draft.stop.trim().length < 2) {
        UI.sheetError = "请写清止损或失效条件。没有退出条件的计划不能保存。";
        renderSheet();
        return;
      }
      if (draft.exit.trim().length < 2) {
        UI.sheetError = "请写清止盈或退出条件。入场前要先知道怎么离开。";
        renderSheet();
        return;
      }
      UI.planStep = 4;
      renderSheet();
    }
  }

  function execNext() {
    if (!UI.execDraft) return;
    UI.sheetError = "";
    if (UI.execStep === 1) {
      if (!UI.execDraft.result) return;
      UI.execStep = 2;
      renderSheet();
      return;
    }
    if (UI.execStep === 2) {
      if (!UI.execDraft.adherence) {
        UI.sheetError = "请选择这笔交易与计划的一致程度。";
        renderSheet();
        return;
      }
      if (UI.execDraft.adherence !== "full" && !UI.execDraft.tags.length) {
        UI.sheetError = "存在偏离时，至少选择一个结构化标签。";
        renderSheet();
        return;
      }
      if (!UI.execDraft.emotion) {
        UI.sheetError = "请选择执行时的主导情绪。";
        renderSheet();
        return;
      }
      UI.execStep = 3;
      renderSheet();
    }
  }

  function unplannedNext() {
    if (!UI.unplannedDraft) return;
    if (!UI.unplannedDraft.symbol.trim()) {
      UI.sheetError = "请填写标的名或代码。";
      renderSheet();
      return;
    }
    if (!UI.unplannedDraft.result) {
      UI.sheetError = "请选择结果档位。";
      renderSheet();
      return;
    }
    UI.sheetError = "";
    UI.unplannedStep = 2;
    renderSheet();
  }

  function exportData() {
    const payload = JSON.stringify(DB, null, 2);
    const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const today = new Date();
    anchor.href = url;
    anchor.download = `守则-备份-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("备份已导出");
  }

  function handleImportFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || !Array.isArray(parsed.plans)) {
          throw new Error("invalid");
        }
        const imported = normalizeState(parsed);
        showConfirm({
          title: "导入并覆盖当前数据？",
          desc: `备份中有 ${imported.plans.length} 份计划或记录、${imported.reviews.length} 次复盘。导入会覆盖当前设备上的数据。`,
          okText: "导入覆盖",
          danger: true,
          onConfirm: () => {
            DB = imported;
            saveState();
            UI.planDraft = null;
            renderSettings();
            switchTab("settings");
            toast("备份已导入");
          }
        });
      } catch (error) {
        toast("文件格式不正确，无法导入");
      }
      const input = $("#import-input");
      if (input) input.value = "";
    };
    reader.onerror = () => toast("读取文件失败");
    reader.readAsText(file);
  }

  function clearAllData() {
    showConfirm({
      title: "清空所有数据？",
      desc: "计划、执行记录和周期复盘都会被删除，无法撤销。建议先导出备份。",
      okText: "永久清空",
      danger: true,
      onConfirm: () => {
        localStorage.removeItem(STORAGE_KEY);
        DB = createDefaultState();
        saveState();
        closeSheet();
        UI.tab = "log";
        switchTab("log");
        render();
        toast("所有数据已清空");
      }
    });
  }

  function handleClick(event) {
    const tabButton = event.target.closest("[data-tab]");
    if (tabButton) {
      switchTab(tabButton.dataset.tab);
      return;
    }

    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) return;
    const action = actionElement.dataset.action;
    const id = actionElement.dataset.id;

    switch (action) {
      case "new-plan":
        startPlan();
        break;
      case "toggle-all-log":
        UI.showAllLog = !UI.showAllLog;
        renderLog();
        break;
      case "open-plan":
        openPlanDetail(id);
        break;
      case "execute-plan":
        startExecution(id);
        break;
      case "unplanned":
        startUnplanned();
        break;
      case "period":
        UI.period = actionElement.dataset.period;
        renderStats();
        break;
      case "breakdown":
        UI.breakdown = actionElement.dataset.kind;
        renderStats();
        break;
      case "open-review":
        startReview();
        break;
      case "risk-cap":
        DB.settings.riskCap = Number(actionElement.dataset.value);
        saveState();
        renderSettings();
        toast(`单笔风险上限已设为 ${DB.settings.riskCap}%`);
        break;
      case "min-rr":
        DB.settings.minRR = Number(actionElement.dataset.value);
        saveState();
        renderSettings();
        toast(`最低盈亏比已设为 ${DB.settings.minRR}R`);
        break;
      case "max-position":
        DB.settings.maxPosition = Number(actionElement.dataset.value);
        saveState();
        renderSettings();
        toast(`单标的最大仓位已设为 ${DB.settings.maxPosition}%`);
        break;
      case "default-tranche":
        DB.settings.defaultTranche = actionElement.dataset.value;
        saveState();
        renderSettings();
        toast(`默认首仓已设为 ${FIRST_TRANCHE[DB.settings.defaultTranche].label}`);
        break;
      case "default-add-rule":
        DB.settings.defaultAddRule = actionElement.dataset.value;
        saveState();
        renderSettings();
        toast(`默认加仓原则已设为 ${ADD_RULES[DB.settings.defaultAddRule].label}`);
        break;
      case "export-data":
        exportData();
        break;
      case "import-data":
        $("#import-input").click();
        break;
      case "clear-data":
        clearAllData();
        break;
      case "close-sheet":
        closeSheet();
        break;
      case "plan-asset":
        UI.planDraft.assetType = actionElement.dataset.value;
        renderSheet(true);
        break;
      case "plan-symbol":
        UI.planDraft.symbol = actionElement.dataset.value;
        {
          const input = $("#plan-symbol");
          if (input) input.value = UI.planDraft.symbol;
          $$('#sheet-body [data-action="plan-symbol"]').forEach((el) => {
            el.classList.toggle("active", el.dataset.value === UI.planDraft.symbol);
          });
        }
        break;
      case "plan-direction":
        UI.planDraft.direction = actionElement.dataset.value;
        renderSheet(true);
        break;
      case "plan-strategy":
        UI.planDraft.strategy = actionElement.dataset.value;
        renderSheet(true);
        break;
      case "plan-risk":
        UI.planDraft.riskPct = Number(actionElement.dataset.value);
        renderSheet(true);
        break;
      case "plan-position":
        UI.planDraft.positionPct = Number(actionElement.dataset.value);
        renderSheet(true);
        break;
      case "plan-tranche":
        UI.planDraft.firstTranche = actionElement.dataset.value;
        renderSheet(true);
        break;
      case "plan-add-rule":
        UI.planDraft.addRule = actionElement.dataset.value;
        renderSheet(true);
        break;
      case "plan-rr":
        UI.planDraft.rr = Number(actionElement.dataset.value);
        renderSheet(true);
        break;
      case "plan-next":
        planNext();
        break;
      case "plan-back":
        UI.sheetError = "";
        UI.planStep = Math.max(1, UI.planStep - 1);
        renderSheet();
        break;
      case "plan-save":
        savePlan();
        break;
      case "exec-result":
        UI.execDraft.result = actionElement.dataset.value;
        renderSheet(true);
        break;
      case "exec-adherence":
        UI.execDraft.adherence = actionElement.dataset.value;
        if (UI.execDraft.adherence === "full") UI.execDraft.tags = [];
        renderSheet(true);
        break;
      case "exec-emotion":
        UI.execDraft.emotion = actionElement.dataset.value;
        renderSheet(true);
        break;
      case "exec-tag":
        togglePlanTag(actionElement.dataset.value);
        break;
      case "exec-next":
        execNext();
        break;
      case "exec-back":
        UI.sheetError = "";
        UI.execStep = Math.max(1, UI.execStep - 1);
        renderSheet();
        break;
      case "exec-save":
        saveExecution();
        break;
      case "unplanned-asset":
        UI.unplannedDraft.assetType = actionElement.dataset.value;
        renderSheet(true);
        break;
      case "unplanned-strategy":
        UI.unplannedDraft.strategy = actionElement.dataset.value;
        renderSheet(true);
        break;
      case "unplanned-result":
        UI.unplannedDraft.result = actionElement.dataset.value;
        renderSheet(true);
        break;
      case "unplanned-emotion":
        UI.unplannedDraft.emotion = actionElement.dataset.value;
        renderSheet(true);
        break;
      case "unplanned-next":
        unplannedNext();
        break;
      case "unplanned-back":
        UI.unplannedStep = 1;
        UI.sheetError = "";
        renderSheet();
        break;
      case "unplanned-save":
        saveUnplanned();
        break;
      case "review-period":
        UI.reviewDraft.period = actionElement.dataset.period;
        renderSheet(true);
        break;
      case "review-verdict":
        UI.reviewDraft.verdict = actionElement.dataset.value;
        renderSheet(true);
        break;
      case "review-save":
        saveReview();
        break;
      case "cancel-plan":
        cancelPlan(id);
        break;
      case "reset-execution":
        resetExecution(id);
        break;
      case "delete-record":
        deleteRecord(id);
        break;
      case "confirm-cancel":
        closeConfirm();
        break;
      case "confirm-ok": {
        const callback = UI.confirmCallback;
        closeConfirm();
        if (typeof callback === "function") callback();
        break;
      }
      default:
        break;
    }
  }

  function parseSymbolInput(value) {
    return [...new Set(String(value || "")
      .split(/[,，、;；\s\n]+/)
      .map((s) => s.trim().slice(0, 24))
      .filter(Boolean))];
  }

  function handleSettingsChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const key = target.dataset.symbols;
    if (!key || !ASSET_TYPES[key]) return;
    const list = parseSymbolInput(target.value);
    DB.settings.commonSymbols[key] = list;
    saveState();
    target.value = list.join(", ");
    toast(`${ASSET_TYPES[key].label}常用标的已更新（${list.length} 个）`);
  }

  function handleSheetInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.planField && UI.planDraft) {
      UI.planDraft[target.dataset.planField] = target.value;
      if (target.dataset.planField === "thesis") {
        const count = $("#thesis-count");
        if (count) count.textContent = String(target.value.length);
      }
      return;
    }

    if (target.dataset.execField && UI.execDraft) {
      UI.execDraft[target.dataset.execField] = target.value;
      return;
    }

    if (target.dataset.unplannedField && UI.unplannedDraft) {
      const field = target.dataset.unplannedField;
      UI.unplannedDraft[field] = target.value;
      if (field === "symbol") {
        const button = $('#sheet-footer [data-action="unplanned-next"]');
        if (button) button.disabled = !unplannedStepOneReady(UI.unplannedDraft);
      }
      return;
    }

    if (target.dataset.reviewField && UI.reviewDraft) {
      UI.reviewDraft[target.dataset.reviewField] = target.value;
      updateReviewButtonState();
    }
  }

  function handleSheetChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.planCheck != null && UI.planDraft) {
      const index = Number(target.dataset.planCheck);
      UI.planDraft.checks[index] = target.checked;
      updatePlanCheckUI();
      const body = $("#sheet-body");
      if (body && Number.isFinite(UI.sheetScrollTop)) body.scrollTop = UI.sheetScrollTop;
    }
  }

  function updatePlanCheckUI() {
    const draft = UI.planDraft;
    if (!draft) return;
    const count = draft.checks.filter(Boolean).length;
    const countNode = $("#plan-manual-count");
    if (countNode) countNode.textContent = `${count}/3`;
    const tip = $("#plan-check-tip");
    if (tip) {
      const passed = autoChecks(draft).filter((check) => check.ok).length + count;
      tip.textContent = `自检 ${passed}/10 项通过。计划保存后会进入“待执行”，执行结束再回来记录真实过程。`;
    }
    const saveButton = $('#sheet-footer [data-action="plan-save"]');
    if (saveButton) saveButton.disabled = !planChecksPass(draft);
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      const dialog = $("#confirm-dialog");
      if (dialog && dialog.hasAttribute("open")) return;
      if (UI.sheetType) closeSheet();
    }
  }

  function init() {
    DB = loadState();
    renderLog();
    updateNav();

    document.addEventListener("click", handleClick);
    $("#sheet-body").addEventListener("input", handleSheetInput);
    $("#sheet-body").addEventListener("change", handleSheetChange);
    $("#sheet-body").addEventListener("pointerdown", () => {
      const body = $("#sheet-body");
      if (body) UI.sheetScrollTop = body.scrollTop;
    });
    $("#sheet-backdrop").addEventListener("click", closeSheet);
    $("#view-settings").addEventListener("change", handleSettingsChange);
    $("#import-input").addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      handleImportFile(file);
    });
    document.addEventListener("keydown", handleKeydown);
    const dialog = $("#confirm-dialog");
    if (dialog) {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeConfirm();
      });
      dialog.addEventListener("close", () => {
        UI.confirmCallback = null;
      });
    }
  }

  init();
})();
