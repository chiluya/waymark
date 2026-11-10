import { ALL_GOAL_IDS, ALL_COURSE_IDS } from "./plan";

const num = (v, max) => Math.min(max, Math.max(0, Math.round(Number(v) * 100) / 100 || 0));
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Pure function used on BOTH the server (to save) and the client (instant UI).
export function applyOp(state, op) {
  const next = {
    logs: { ...state.logs },
    courses: { ...state.courses },
    goals: { ...state.goals },
  };
  if (op.type === "log" && DATE.test(op.date)) {
    const v = op.values || {};
    const entry = {
      upper: Math.floor(num(v.upper, 1e6)),
      lower: Math.floor(num(v.lower, 1e6)),
      ug: Math.floor(num(v.ug, 1e5)),
      sr: Math.floor(num(v.sr, 1e5)),
    };
    if (entry.upper || entry.lower || entry.ug || entry.sr) next.logs[op.date] = entry;
    else delete next.logs[op.date];
  } else if (op.type === "course" && ALL_COURSE_IDS.includes(op.id)) {
    const cur = next.courses[op.id] || { hours: 0, done: false };
    next.courses[op.id] = {
      hours: op.hours !== undefined ? num(op.hours, 10000) : cur.hours,
      done: op.done !== undefined ? !!op.done : cur.done,
    };
  } else if (op.type === "goal" && ALL_GOAL_IDS.includes(op.id)) {
    if (op.done) next.goals[op.id] = true;
    else delete next.goals[op.id];
  }
  return next;
}
