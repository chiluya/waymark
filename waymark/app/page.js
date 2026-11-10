"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { STAGES, END, ACCOUNTS, TOTAL_COURSES, END_GOAL_ID } from "../lib/plan";
import { applyOp } from "../lib/ops";

/* ---------- helpers ---------- */
const fmt = (n) => Math.round(n).toLocaleString("en-US");
const cap = (n) => Math.max(0, Math.min(1, n));
const pad = (n) => String(n).padStart(2, "0");
const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const prettyDate = (s) =>
  new Date(s + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

async function request(pass, method = "GET", body) {
  const res = await fetch("/api/state", {
    method,
    headers: { "content-type": "application/json", "x-passcode": pass },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong.");
  return json;
}

function sumLogs(logs) {
  const t = { upper: 0, lower: 0, ug: 0, sr: 0 };
  for (const d in logs) for (const k in t) t[k] += logs[d][k] || 0;
  return t;
}

function stageParts(s, t, data) {
  const parts = [t.upper / s.reps, t.lower / s.reps, t.ug / s.posts, t.sr / s.posts].map(cap);
  s.money.forEach((m) => parts.push(data.goals[m.id] ? 1 : 0));
  s.courses.forEach((c) => parts.push(data.courses[c.id]?.done ? 1 : 0));
  return parts;
}

function streakOf(logs) {
  let n = 0;
  const d = new Date();
  if (!logs[dateStr(d)]) d.setDate(d.getDate() - 1); // today not logged yet doesn't break it
  while (logs[dateStr(d)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/* ---------- small pieces ---------- */
function Cairn({ size = 26 }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 32 37" aria-hidden="true">
      <ellipse cx="16" cy="31" rx="14" ry="5" fill="#14261f" />
      <ellipse cx="16" cy="22" rx="10" ry="4.5" fill="#1e6b4b" />
      <ellipse cx="16" cy="14" rx="7" ry="4" fill="#14261f" />
      <ellipse cx="16" cy="7" rx="4" ry="3.5" fill="#1e6b4b" />
    </svg>
  );
}

function Bar({ value }) {
  return (
    <div className="bar" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${cap(value) * 100}%` }} />
    </div>
  );
}

function Check({ checked, onChange, label }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={checked ? "done-text" : ""}>{label}</span>
    </label>
  );
}

/* ---------- the winding path (hero visual) ---------- */
const PATH_D =
  "M0 150 C90 142 170 160 260 152 C350 144 400 168 470 158 C560 146 620 128 700 112 C770 98 830 96 900 84 C950 76 980 68 1000 64";

function PathBand({ progress, doneFlags, current }) {
  const ref = useRef(null);
  const [pts, setPts] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const L = el.getTotalLength();
    const at = (f) => {
      const p = el.getPointAtLength(L * f);
      return { x: p.x, y: p.y };
    };
    setPts({
      dots: STAGES.map((_, i) => at((i + 1) / (STAGES.length + 1))),
      cairn: at(Math.max(0.025, Math.min(0.975, progress))),
    });
  }, [progress]);

  return (
    <svg className="path-svg" viewBox="0 0 1000 230" role="img" aria-label={`Overall progress ${Math.round(progress * 100)} percent`}>
      <path d={`${PATH_D} L1000 230 L0 230 Z`} fill="#f1f3ed" />
      <path ref={ref} d={PATH_D} fill="none" stroke="#c4cabd" strokeWidth="2" />
      {pts &&
        pts.dots.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="7" fill={doneFlags[i] ? "#1e6b4b" : "#fff"} stroke="#1e6b4b" strokeWidth="3" />
            <text x={p.x} y={p.y + 30} textAnchor="middle" fontSize="15" fill={i === current ? "#14261f" : "#6b766f"} fontWeight={i === current ? 600 : 400}>
              Stage {i + 1}
            </text>
          </g>
        ))}
      {pts && (
        <g transform={`translate(${pts.cairn.x - 20} ${pts.cairn.y - 47}) scale(1.25)`}>
          <ellipse cx="16" cy="31" rx="14" ry="5" fill="#14261f" />
          <ellipse cx="16" cy="22" rx="10" ry="4.5" fill="#1e6b4b" />
          <ellipse cx="16" cy="14" rx="7" ry="4" fill="#14261f" />
          <ellipse cx="16" cy="7" rx="4" ry="3.5" fill="#1e6b4b" />
        </g>
      )}
    </svg>
  );
}

/* ---------- forms ---------- */
function LogForm({ date, log, onSave }) {
  const [v, setV] = useState({
    upper: log.upper || "",
    lower: log.lower || "",
    ug: log.ug || "",
    sr: log.sr || "",
  });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const num = (id, label, k) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="number" inputMode="numeric" min="0" placeholder="0" value={v[k]} onChange={set(k)} />
    </div>
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(date, v);
      }}
    >
      <p className="group-title">Reps</p>
      <div className="grid2">
        {num("f-upper", "Upper body", "upper")}
        {num("f-lower", "Lower body", "lower")}
      </div>
      <p className="group-title">Posts</p>
      <div className="grid2">
        {num("f-ug", ACCOUNTS.ug, "ug")}
        {num("f-sr", ACCOUNTS.sr, "sr")}
      </div>
      <button className="btn" type="submit">Save this day</button>
    </form>
  );
}

function CourseRow({ c, st, dispatch }) {
  const saved = st?.hours ?? 0;
  const [h, setH] = useState(saved);
  useEffect(() => setH(saved), [saved]);
  const commit = () => {
    if (Number(h || 0) !== saved) dispatch({ type: "course", id: c.id, hours: h || 0 });
  };
  return (
    <div className="course">
      <Check checked={!!st?.done} onChange={(done) => dispatch({ type: "course", id: c.id, done })} label={c.label} />
      <div className="hrs">
        <input
          type="number"
          min="0"
          step="0.5"
          inputMode="decimal"
          aria-label={`Hours spent on ${c.label}`}
          value={h}
          onChange={(e) => setH(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
        hrs
      </div>
    </div>
  );
}

function Stage({ s, index, t, data, dispatch, isCurrent, frac, complete }) {
  const mini = (label, value, target) => (
    <div className="mini">
      <div className="row">
        <span>{label}</span>
        <span>{fmt(Math.min(value, target))} / {fmt(target)}</span>
      </div>
      <Bar value={value / target} />
    </div>
  );
  return (
    <details className="stage" open={isCurrent}>
      <summary>
        <h3>{s.name}</h3>
        <div className="sum-bar"><Bar value={frac} /></div>
        <div className="sum-meta">
          {complete ? <span className="pill">Complete</span> : isCurrent ? <span className="pill now">You are here</span> : <span>{Math.round(frac * 100)}%</span>}
          <span className="chev" />
        </div>
      </summary>
      <div className="stage-body">
        <div>
          <h4>Reps by the end of this stage</h4>
          {mini("Upper body", t.upper, s.reps)}
          {mini("Lower body", t.lower, s.reps)}
          <h4 style={{ marginTop: 26 }}>Posts</h4>
          {mini(ACCOUNTS.ug, t.ug, s.posts)}
          {mini(ACCOUNTS.sr, t.sr, s.posts)}
        </div>
        <div>
          <h4>Money · {s.cash} cash</h4>
          {s.money.map((m) => (
            <div className="tick-row" key={m.id}>
              <Check checked={!!data.goals[m.id]} onChange={(done) => dispatch({ type: "goal", id: m.id, done })} label={m.label} />
            </div>
          ))}
        </div>
        <div>
          <h4>Courses</h4>
          {s.courses.map((c) => (
            <CourseRow key={c.id} c={c} st={data.courses[c.id]} dispatch={dispatch} />
          ))}
        </div>
      </div>
    </details>
  );
}

/* ---------- lock screen ---------- */
function Lock({ onUnlock, error, busy }) {
  const [p, setP] = useState("");
  return (
    <main className="lock">
      <form
        className="lock-card"
        onSubmit={(e) => {
          e.preventDefault();
          onUnlock(p);
        }}
      >
        <Cairn size={34} />
        <h1>Waymark</h1>
        <p>Enter your passcode to open your tracker.</p>
        <div className="field">
          <label htmlFor="pc">Passcode</label>
          <input id="pc" type="password" autoFocus value={p} onChange={(e) => setP(e.target.value)} />
        </div>
        {error && <p className="err" role="alert">{error}</p>}
        <p style={{ marginTop: 20, marginBottom: 0 }}>
          <button className="btn" type="submit" disabled={busy || !p}>{busy ? "Opening…" : "Open tracker"}</button>
        </p>
      </form>
    </main>
  );
}

/* ---------- page ---------- */
export default function Page() {
  const [pass, setPass] = useState(null);
  const [data, setData] = useState(null);
  const [persistent, setPersistent] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [toast, setToast] = useState("");
  const [date, setDate] = useState("");

  const flash = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  async function unlock(p) {
    setBusy(true);
    try {
      const r = await request(p);
      setData(r.state);
      setPersistent(r.persistent);
      setPass(p);
      setError("");
      localStorage.setItem("wm-pass", p);
    } catch (e) {
      setError(e.message);
      localStorage.removeItem("wm-pass");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    setDate(dateStr(new Date()));
    const p = localStorage.getItem("wm-pass");
    if (p) unlock(p);
    else setBusy(false);
  }, []);

  async function dispatch(op, message) {
    setData((d) => applyOp(d, op));
    try {
      await request(pass, "POST", op);
      if (message) flash(message);
    } catch (e) {
      flash("Couldn't save — check your connection.");
      request(pass).then((r) => setData(r.state)).catch(() => {});
    }
  }

  const calc = useMemo(() => {
    if (!data) return null;
    const t = sumLogs(data.logs);
    const stages = STAGES.map((s) => {
      const parts = stageParts(s, t, data);
      return { frac: parts.reduce((a, b) => a + b, 0) / parts.length, complete: parts.every((x) => x === 1) };
    });
    let current = stages.findIndex((s) => !s.complete);
    if (current === -1) current = STAGES.length - 1;

    const goalIds = [...STAGES.flatMap((s) => s.money.map((m) => m.id)), END_GOAL_ID];
    const courseDone = Object.values(data.courses).filter((c) => c.done).length;
    const hours = Object.values(data.courses).reduce((a, c) => a + (c.hours || 0), 0);
    const fitness = (cap(t.upper / END.upper) + cap(t.lower / END.lower)) / 2;
    const business = (cap(t.ug / END.ug) + cap(t.sr / END.sr)) / 2;
    const money = goalIds.filter((id) => data.goals[id]).length / goalIds.length;
    const career = courseDone / TOTAL_COURSES;
    return {
      t, stages, current, courseDone, hours,
      overall: (fitness + business + money + career) / 4,
      streak: streakOf(data.logs),
    };
  }, [data]);

  if (!data || !calc) return <Lock onUnlock={unlock} error={error} busy={busy} />;

  const { t, stages, current, courseDone, hours, overall, streak } = calc;
  const log = data.logs[date] || {};
  const today = dateStr(new Date());
  const days = Object.keys(data.logs).sort().reverse().slice(0, 14);

  const meter = (name, value, target) => (
    <div className="meter">
      <div className="row">
        <span className="name">{name}</span>
        <span className="val">{fmt(value)} <small>of {fmt(target)}</small></span>
      </div>
      <Bar value={value / target} />
    </div>
  );

  return (
    <>
      {!persistent && (
        <div className="banner">
          No database connected — changes reset when the server restarts. See the README to connect Upstash Redis.
        </div>
      )}
      <div className="wrap">
        <nav className="nav">
          <a className="brand" href="#top"><Cairn /> Waymark</a>
          <div className="nav-links">
            <a href="#today">Today</a>
            <a href="#targets">Targets</a>
            <a href="#stages">Stages</a>
            <a href="#history">History</a>
            <a className="btn dark small" href="#today">Log today</a>
          </div>
        </nav>

        <header className="hero" id="top">
          <h1>Small days. A bigger leap.</h1>
          <p>
            Log your reps, posts and study hours. Tick off the money goals as they land.
            Every entry moves the marker along the path to K100,000, 400,000 reps and a full-stack career.
          </p>
          <a className="btn" href="#today">Log today</a>
        </header>
      </div>

      <div className="path-band">
        <div className="wrap">
          <PathBand progress={overall} doneFlags={stages.map((s) => s.complete)} current={current} />
          <div className="path-meter">
            <span><b>{Math.round(overall * 100)}%</b>of the way</span>
            <span><b>Stage {current + 1}</b>of {STAGES.length}</span>
            <span><b>{streak}</b>{streak === 1 ? "day streak" : "day streak"}</span>
          </div>
        </div>
      </div>

      <main className="wrap">
        <section id="today">
          <div className="log">
            <div className="log-side">
              <div className="section-head">
                <h2>{date === today ? "Today" : prettyDate(date)}</h2>
                <p>Enter the totals for the day. Saving again replaces that day, so you can correct a number any time.</p>
              </div>
              <div className="field">
                <label htmlFor="d">Date</label>
                <input id="d" type="date" max={today} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
              </div>
            </div>
            <LogForm
              key={date + JSON.stringify(log)}
              date={date}
              log={log}
              onSave={(d, values) => dispatch({ type: "log", date: d, values }, "Saved")}
            />
          </div>
        </section>

        <section id="targets">
          <div className="section-head">
            <h2>End targets</h2>
            <p>Where everything adds up.</p>
          </div>
          <div className="meters">
            {meter("Upper body reps", t.upper, END.upper)}
            {meter("Lower body reps", t.lower, END.lower)}
            {meter(`${ACCOUNTS.ug} posts`, t.ug, END.ug)}
            {meter(`${ACCOUNTS.sr} posts`, t.sr, END.sr)}
            <div className="meter">
              <div className="row">
                <span className="name">Career courses</span>
                <span className="val">{courseDone} <small>of {TOTAL_COURSES} · {fmt(hours)} hrs watched</small></span>
              </div>
              <Bar value={courseDone / TOTAL_COURSES} />
            </div>
            <div className="meter">
              <div className="row">
                <span className="name">Financial target</span>
                <span className="val"><small>{END.cash} cash</small></span>
              </div>
              <div className="tick-row" style={{ paddingTop: 2 }}>
                <Check
                  checked={!!data.goals[END_GOAL_ID]}
                  onChange={(done) => dispatch({ type: "goal", id: END_GOAL_ID, done })}
                  label={`${END.cash} in cash reached`}
                />
              </div>
            </div>
          </div>
        </section>

        <section id="stages">
          <div className="section-head">
            <h2>Stages</h2>
            <p>Rep and post totals carry over between stages, so the bars fill as your running total grows.</p>
          </div>
          <div>
            {STAGES.map((s, i) => (
              <Stage
                key={s.id}
                s={s}
                index={i}
                t={t}
                data={data}
                dispatch={dispatch}
                isCurrent={i === current}
                frac={stages[i].frac}
                complete={stages[i].complete}
              />
            ))}
          </div>
        </section>

        <section id="history">
          <div className="section-head">
            <h2>Recent days</h2>
          </div>
          {days.length === 0 ? (
            <p className="empty">Nothing logged yet. Your first entry will show up here.</p>
          ) : (
            <div className="history-wrap">
              <table className="history">
                <thead>
                  <tr>
                    <th>Day</th><th>Upper</th><th>Lower</th><th>{ACCOUNTS.ug}</th><th>{ACCOUNTS.sr}</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((d) => (
                    <tr key={d}>
                      <td>{prettyDate(d)}</td>
                      <td>{fmt(data.logs[d].upper)}</td>
                      <td>{fmt(data.logs[d].lower)}</td>
                      <td>{fmt(data.logs[d].ug)}</td>
                      <td>{fmt(data.logs[d].sr)}</td>
                      <td>
                        <a href="#today" onClick={() => setDate(d)}>Edit</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer>
          <button
            className="btn ghost small"
            onClick={() => {
              localStorage.removeItem("wm-pass");
              setData(null);
              setPass(null);
            }}
          >
            Lock
          </button>
        </footer>
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
