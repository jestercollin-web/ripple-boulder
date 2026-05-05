import { useState, useEffect } from "react";

const INITIAL_DATA = {
  goals: [
    { id: 1, title: "Reach 300 Active Members", category: "Memberships", startDate: "2025-06-01", endDate: "2025-09-01", target: 300, current: 47, owner: "Collin", team: ["Mia", "Jordan"], status: "on-track", why: "Members are our foundation. 300 gives us a sustainable, vibrant community from day one.", notes: "" },
    { id: 2, title: "Sell 75 Founding Memberships", category: "Memberships", startDate: "2025-06-01", endDate: "2025-07-15", target: 75, current: 31, owner: "Collin", team: ["Mia"], status: "on-track", why: "Founding members create early momentum and a loyal core community before we open.", notes: "Focus on pre-launch email list" },
    { id: 3, title: "Collect 500 Local Email Leads", category: "Marketing", startDate: "2025-06-01", endDate: "2025-08-01", target: 500, current: 187, owner: "Jordan", team: ["Collin", "Sam"], status: "needs-attention", why: "Email leads are our most valuable marketing asset for the opening push.", notes: "" },
    { id: 4, title: "Build 20 Local Business Partnerships", category: "Partnerships", startDate: "2025-06-01", endDate: "2025-08-15", target: 20, current: 6, owner: "Collin", team: ["Sam"], status: "off-track", why: "Local businesses amplify our reach and create community goodwill.", notes: "Need to prioritize outreach this week" },
    { id: 5, title: "Host 4 Community Preview Events", category: "Events", startDate: "2025-06-01", endDate: "2025-08-31", target: 4, current: 1, owner: "Mia", team: ["Jordan", "Collin"], status: "on-track", why: "Preview events create buzz, collect leads, and let people fall in love with the space.", notes: "Next event July 12" },
    { id: 6, title: "Generate $5K in Retail Sales", category: "Retail", startDate: "2025-09-01", endDate: "2025-09-30", target: 5000, current: 320, owner: "Sam", team: ["Mia"], status: "on-track", why: "Opening month retail sales fund operations and build brand loyalty.", notes: "" },
    { id: 7, title: "Reach 10K Instagram Followers", category: "Marketing", startDate: "2025-06-01", endDate: "2025-09-01", target: 10000, current: 3240, owner: "Jordan", team: [], status: "needs-attention", why: "Instagram is our primary awareness channel for the Fort Wayne community.", notes: "" },
    { id: 8, title: "Book 10 Birthday/Group Events", category: "Events", startDate: "2025-07-01", endDate: "2025-09-30", target: 10, current: 2, owner: "Mia", team: ["Sam"], status: "on-track", why: "Group events create recurring revenue and introduce new climbers to Ripple.", notes: "" },
  ],
  leadMeasures: [
    { id: 1, goalId: 1, title: "Outreach contacts made", type: "number", target: 20, unit: "contacts/week" },
    { id: 2, goalId: 1, title: "Membership tours given", type: "number", target: 5, unit: "tours/week" },
    { id: 3, goalId: 2, title: "Founding member follow-ups", type: "number", target: 10, unit: "calls/week" },
    { id: 4, goalId: 3, title: "Instagram Reels posted", type: "number", target: 4, unit: "reels/week" },
    { id: 5, goalId: 3, title: "Email campaign sent", type: "checkbox", target: 1, unit: "per week" },
    { id: 6, goalId: 4, title: "Local business visits", type: "number", target: 3, unit: "visits/week" },
    { id: 7, goalId: 5, title: "Event invites sent", type: "number", target: 20, unit: "invites/event" },
    { id: 8, goalId: 7, title: "Member referral asks", type: "number", target: 10, unit: "asks/week" },
  ],
  weeklyLogs: { 1: { 1: 14, 2: 3 }, 2: { 3: 7 }, 3: { 4: 3, 5: true }, 4: { 6: 1 }, 5: { 7: 15 }, 6: {}, 7: { 8: 6 }, 8: {} },
  meetings: [
    {
      id: 1, date: "2025-06-30",
      wins: "Sold 8 founding memberships this week. First preview event had 40 attendees!",
      moved: "Personal outreach by Collin drove 6 of the 8 sales.",
      didnt: "Instagram reels only hit 2 of 4. Business partnership visits fell short.",
      commitments: [
        { person: "Jordan", commitment: "Post 4 reels this week — themes ready to go", due: "2025-07-06", done: false },
        { person: "Sam", commitment: "Visit 3 businesses on the north side", due: "2025-07-05", done: true },
        { person: "Mia", commitment: "Confirm July 12 event logistics with venue", due: "2025-07-03", done: true },
        { person: "Collin", commitment: "Follow up with 10 warm leads from the preview event", due: "2025-07-06", done: false },
      ],
      ownerNotes: "We're ahead on memberships but need to push partnerships harder. Jordan — let's talk content strategy this week.",
      followUp: "Review partnership outreach strategy in next meeting."
    }
  ],
  tasks: [
    { id: 1, title: "Design membership sign-up flow", goalId: 1, assignee: "Jordan", due: "2025-07-08", priority: "high", status: "in-progress", notes: "" },
    { id: 2, title: "Order opening month retail inventory", goalId: 6, assignee: "Sam", due: "2025-07-15", priority: "high", status: "todo", notes: "Budget approved" },
    { id: 3, title: "Create birthday party booking page", goalId: 8, assignee: "Jordan", due: "2025-07-10", priority: "medium", status: "todo", notes: "" },
    { id: 4, title: "Draft July email campaign", goalId: 3, assignee: "Jordan", due: "2025-07-05", priority: "high", status: "done", notes: "" },
    { id: 5, title: "Finalize partnership pitch deck", goalId: 4, assignee: "Collin", due: "2025-07-07", priority: "medium", status: "in-progress", notes: "" },
    { id: 6, title: "Set up BETA turnstile integration", goalId: 1, assignee: "Collin", due: "2025-07-20", priority: "low", status: "todo", notes: "" },
  ],
  currentUser: "Pineapple guy",
  viewMode: "owner",
};

const CATEGORIES = ["Memberships","Marketing","Community","Events","Retail","Operations","Staff","Retention","Partnerships"];
const TEAM = ["Collin","Jordan","Mia","Sam"];

const sc = {
  "on-track":        { bg: "#EEFAF4", text: "#1E7A4A", bar: "#2ECC71", dot: "#2ECC71" },
  "needs-attention": { bg: "#FFF8EC", text: "#9A6200", bar: "#F5A623", dot: "#F5A623" },
  "off-track":       { bg: "#FFF0F0", text: "#C0392B", bar: "#E74C3C", dot: "#E74C3C" },
};
const pc = {
  high:   { bg: "#FFF0F0", text: "#C0392B" },
  medium: { bg: "#FFF8EC", text: "#9A6200" },
  low:    { bg: "#EEFAF4", text: "#1E7A4A" },
};

function pct(current, target) { return Math.min(100, Math.round((current / target) * 100)); }
function fmt(n) { return n >= 1000 ? "$" + (n / 1000).toFixed(1) + "K" : String(n); }

export default function App() {
  const [data, setData] = useState(() => {
    try { const s = localStorage.getItem("ripple-4dx-v3"); return s ? JSON.parse(s) : INITIAL_DATA; } catch { return INITIAL_DATA; }
  });
  const [nav, setNav] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("ripple-4dx-v3", JSON.stringify(data)); } catch {}
  }, [data]);

  const updateGoal = (id, f, v) => setData(d => ({ ...d, goals: d.goals.map(g => g.id === id ? { ...g, [f]: v } : g) }));
  const updateLog  = (gid, mid, v) => setData(d => ({ ...d, weeklyLogs: { ...d.weeklyLogs, [gid]: { ...d.weeklyLogs[gid], [mid]: v } } }));
  const updateCommitment = (mid, idx, f, v) => setData(d => ({ ...d, meetings: d.meetings.map(m => m.id === mid ? { ...m, commitments: m.commitments.map((c, i) => i === idx ? { ...c, [f]: v } : c) } : m) }));
  const updateTask = (id, f, v) => setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, [f]: v } : t) }));
  const wigGoal = data.goals.reduce((a, b) => pct(b.current, b.target) < pct(a.current, a.target) ? b : a, data.goals[0]);

  const navItems = [
    { key: "dashboard", label: "Home" },
    { key: "goals", label: "Goals" },
    { key: "scoreboard", label: "Scoreboard" },
    { key: "leads", label: "Lead Measures" },
    { key: "meetings", label: "Check-ins" },
    { key: "tasks", label: "Tasks" },
  ];

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#fff", minHeight: "100vh", color: "#1a1a1a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; }
        .lora { font-family: 'Lora', Georgia, serif; }
        .inter { font-family: 'Inter', system-ui, sans-serif; }
        .nav-link { background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; padding: 6px 14px; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; color: #666; transition: all 0.12s; }
        .nav-link:hover { color: #1a1a1a; }
        .nav-link.active { color: #005764; border-bottom-color: #005764; }
        .card { background: #fff; border: 1px solid #ebebeb; border-radius: 12px; padding: 24px; }
        .card-teal { background: #f4fbfb; border: 1px solid #c8e8e8; border-radius: 12px; padding: 24px; }
        .badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-family: 'Inter', sans-serif; font-weight: 600; letter-spacing: 0.02em; }
        .btn { border: 1px solid #e0e0e0; background: #fff; border-radius: 8px; padding: 9px 18px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.12s; color: #333; }
        .btn:hover { background: #f5f5f5; }
        .btn-teal { background: #005764; color: #fff; border-color: #005764; }
        .btn-teal:hover { background: #004450; }
        .pbar { height: 6px; border-radius: 99px; background: #f0f0f0; overflow: hidden; }
        .pfill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
        input[type=number], input[type=text], input[type=date], select, textarea { border: 1px solid #e0e0e0; border-radius: 8px; padding: 9px 12px; font-family: 'Inter', sans-serif; font-size: 13px; background: #fff; color: #1a1a1a; outline: none; width: 100%; }
        input:focus, select:focus, textarea:focus { border-color: #005764; box-shadow: 0 0 0 3px rgba(0,87,100,0.08); }
        input[type=checkbox] { width: 16px; height: 16px; cursor: pointer; accent-color: #005764; flex-shrink: 0; }
        .lbl { font-size: 11px; color: #444; font-family: 'Inter', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 10px; }
        .metric { background: #f4f4f4; border-radius: 10px; padding: 18px 20px; }
        hr { border: none; border-top: 1px solid #ebebeb; margin: 18px 0; }
        @media(max-width:680px){ .g4{grid-template-columns:1fr 1fr!important} .g2{grid-template-columns:1fr!important} }
      `}</style>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #ebebeb", padding: "0 28px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img src="/logo.svg" alt="Ripple Boulder" style={{ height: 42, width: "auto" }} />
            <span className="inter" style={{ fontSize: 10, color: "#005764", background: "#e6f4f5", padding: "3px 9px", borderRadius: 99, fontWeight: 700, letterSpacing: "0.06em" }}>
              {data.viewMode === "owner" ? "OWNER" : "STAFF"}
            </span>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {navItems.map(item => (
              <button key={item.key} className={`nav-link${nav === item.key ? " active" : ""}`} onClick={() => setNav(item.key)}>{item.label}</button>
            ))}
            <div style={{ width: 1, height: 18, background: "#e8e8e8", margin: "0 10px" }} />
            <button onClick={() => setData(d => ({ ...d, viewMode: d.viewMode === "owner" ? "staff" : "owner" }))}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#333", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
              Switch view
            </button>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "44px 28px" }}>
        {nav === "dashboard"  && <Dashboard data={data} wigGoal={wigGoal} setNav={setNav} updateGoal={updateGoal} />}
        {nav === "goals"      && <Goals data={data} setData={setData} updateGoal={updateGoal} />}
        {nav === "scoreboard" && <Scoreboard data={data} />}
        {nav === "leads"      && <LeadMeasures data={data} updateLog={updateLog} />}
        {nav === "meetings"   && <Meetings data={data} updateCommitment={updateCommitment} setData={setData} />}
        {nav === "tasks"      && <Tasks data={data} updateTask={updateTask} setData={setData} />}
      </main>

      <footer style={{ borderTop: "1px solid #ebebeb", padding: "28px", textAlign: "center", marginTop: 40 }}>
        <p className="inter" style={{ fontSize: 12, color: "#222" }}>Ripple Boulder · Fort Wayne, Indiana</p>
      </footer>
    </div>
  );
}

function Dashboard({ data, wigGoal: autoWig, setNav, updateGoal }) {
  const overallPct = Math.round(data.goals.reduce((s, g) => s + pct(g.current, g.target), 0) / data.goals.length);
  const onTrack   = data.goals.filter(g => g.status === "on-track").length;
  const atRisk    = data.goals.filter(g => g.status !== "on-track").length;
  const openTasks = data.tasks.filter(t => t.status !== "done").length;
  const lastMeeting = data.meetings[data.meetings.length - 1];
  const [wigId, setWigId] = useState(autoWig.id);
  const wigGoal = data.goals.find(g => g.id === wigId) || autoWig;

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <h1 className="lora" style={{ fontSize: 34, fontWeight: 600, color: "#111", lineHeight: 1.2, marginBottom: 8 }}>
          Good morning, {data.currentUser}.
        </h1>
        <p className="inter" style={{ fontSize: 15, color: "#222", fontWeight: 400 }}>Here's where things stand this week.</p>
      </div>

      {/* WIG */}
      <div style={{ background: "#005764", borderRadius: 14, padding: "28px 32px", marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div className="inter" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.8)", textTransform: "uppercase" }}>Wildly Important Goal</div>
          <select value={wigId} onChange={e => setWigId(Number(e.target.value))}
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#fff", fontFamily: "Inter, sans-serif", cursor: "pointer", outline: "none", maxWidth: 220 }}>
            {data.goals.map(g => <option key={g.id} value={g.id} style={{ background: "#005764", color: "#fff" }}>{g.title}</option>)}
          </select>
        </div>
        <div className="lora" style={{ fontSize: 22, color: "#fff", fontStyle: "italic", marginBottom: 6 }}>{wigGoal.title}</div>
        <div className="inter" style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 20, lineHeight: 1.65 }}>{wigGoal.why}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 99 }}>
            <div style={{ width: `${pct(wigGoal.current, wigGoal.target)}%`, height: "100%", background: "#5DCAA5", borderRadius: 99 }} />
          </div>
          <span className="inter" style={{ fontSize: 13, color: "#5DCAA5", fontWeight: 600, whiteSpace: "nowrap" }}>
            {fmt(wigGoal.current)} / {fmt(wigGoal.target)} · {pct(wigGoal.current, wigGoal.target)}%
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="g4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Overall Progress", value: overallPct + "%", note: "all goals" },
          { label: "On Track",         value: onTrack,          note: "going well" },
          { label: "Need Attention",   value: atRisk,           note: "require action" },
          { label: "Open Tasks",       value: openTasks,        note: "this week" },
        ].map(m => (
          <div key={m.label} className="metric">
            <div className="inter" style={{ fontSize: 10, color: "#222", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{m.label}</div>
            <div className="lora" style={{ fontSize: 30, color: "#1a1a1a", lineHeight: 1, marginBottom: 4 }}>{m.value}</div>
            <div className="inter" style={{ fontSize: 12, color: "#222" }}>{m.note}</div>
          </div>
        ))}
      </div>

      <div className="g2" style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="lbl">All Goals</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {data.goals.map(g => {
              const p = pct(g.current, g.target);
              const s = sc[g.status];
              return (
                <div key={g.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <span className="inter" style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{g.title}</span>
                    <span className="badge" style={{ background: s.bg, color: s.text }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
                      {g.status === "on-track" ? "On track" : g.status === "needs-attention" ? "Heads up" : "Off track"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="pbar" style={{ flex: 1 }}>
                      <div className="pfill" style={{ width: `${p}%`, background: s.bar }} />
                    </div>
                    <span className="inter" style={{ fontSize: 11, color: "#222", minWidth: 28, textAlign: "right" }}>{p}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {lastMeeting && (
            <div className="card">
              <div className="lbl">Last Check-in · {lastMeeting.date}</div>
              {lastMeeting.wins && <p className="inter" style={{ fontSize: 13, color: "#222", fontStyle: "italic", marginBottom: 14, lineHeight: 1.65 }}>"{lastMeeting.wins}"</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lastMeeting.commitments.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.done ? "#2ECC71" : "#222", marginTop: 4, flexShrink: 0 }} />
                    <span className="inter" style={{ fontSize: 12, color: "#222", lineHeight: 1.5 }}><strong>{c.person}</strong> — {c.commitment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="card">
            <div className="lbl">Open Tasks</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {data.tasks.filter(t => t.status !== "done").slice(0, 5).map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge" style={{ background: pc[t.priority].bg, color: pc[t.priority].text, fontSize: 10 }}>{t.priority}</span>
                  <span className="inter" style={{ fontSize: 12, color: "#333", flex: 1 }}>{t.title}</span>
                  <span className="inter" style={{ fontSize: 11, color: "#222" }}>{t.assignee}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {lastMeeting?.ownerNotes && (
        <div style={{ background: "#f9f9f9", borderRadius: 10, padding: "18px 22px", borderLeft: "3px solid #005764" }}>
          <div className="lbl" style={{ color: "#005764" }}>Owner Note</div>
          <p className="inter" style={{ fontSize: 13, color: "#333", fontStyle: "italic", lineHeight: 1.7 }}>{lastMeeting.ownerNotes}</p>
        </div>
      )}
    </div>
  );
}

function Goals({ data, setData, updateGoal }) {
  const [adding, setAdding] = useState(false);
  const [ng, setNg] = useState({ title: "", category: "Memberships", startDate: "", endDate: "", target: "", current: 0, owner: "Collin", team: [], status: "on-track", why: "", notes: "" });
  const save = () => {
    if (!ng.title || !ng.target) return;
    const id = Math.max(...data.goals.map(g => g.id)) + 1;
    setData(d => ({ ...d, goals: [...d.goals, { ...ng, id, target: Number(ng.target) }] }));
    setAdding(false);
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h1 className="lora" style={{ fontSize: 30, fontWeight: 600, color: "#111" }}>Goals</h1>
          <p className="inter" style={{ fontSize: 14, color: "#333", marginTop: 4 }}>What we're working toward and why it matters.</p>
        </div>
        <button className="btn btn-teal" onClick={() => setAdding(true)}>+ New Goal</button>
      </div>
      {adding && (
        <div className="card-teal" style={{ marginBottom: 20 }}>
          <div className="lbl">New Goal</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <input placeholder="Goal title" value={ng.title} onChange={e => setNg(g => ({ ...g, title: e.target.value }))} />
            <select value={ng.category} onChange={e => setNg(g => ({ ...g, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
            <input type="number" placeholder="Target number" value={ng.target} onChange={e => setNg(g => ({ ...g, target: e.target.value }))} />
            <select value={ng.owner} onChange={e => setNg(g => ({ ...g, owner: e.target.value }))}>{TEAM.map(t => <option key={t}>{t}</option>)}</select>
            <input type="date" value={ng.startDate} onChange={e => setNg(g => ({ ...g, startDate: e.target.value }))} />
            <input type="date" value={ng.endDate} onChange={e => setNg(g => ({ ...g, endDate: e.target.value }))} />
          </div>
          <textarea placeholder="Why does this goal matter?" rows={2} value={ng.why} onChange={e => setNg(g => ({ ...g, why: e.target.value }))} style={{ marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-teal" onClick={save}>Save Goal</button>
            <button className="btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.goals.map(g => <GoalCard key={g.id} goal={g} updateGoal={updateGoal} />)}
      </div>
    </div>
  );
}

function GoalCard({ goal: g, updateGoal }) {
  const [open, setOpen] = useState(false);
  const p = pct(g.current, g.target);
  const s = sc[g.status];
  return (
    <div className="card" style={{ cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ flex: 1, paddingRight: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
            <span className="inter" style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{g.title}</span>
            <span style={{ fontSize: 11, color: "#333", fontFamily: "Inter, sans-serif" }}>{g.category}</span>
          </div>
          <span className="inter" style={{ fontSize: 12, color: "#222" }}>Owner: {g.owner}{g.endDate ? ` · Due ${g.endDate}` : ""}</span>
        </div>
        <span className="badge" style={{ background: s.bg, color: s.text, flexShrink: 0 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }} />
          {g.status === "on-track" ? "On track" : g.status === "needs-attention" ? "Heads up" : "Off track"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="pbar" style={{ flex: 1 }}>
          <div className="pfill" style={{ width: `${p}%`, background: s.bar }} />
        </div>
        <span className="inter" style={{ fontSize: 13, color: "#222", fontWeight: 500, minWidth: 90, textAlign: "right" }}>{fmt(g.current)} / {fmt(g.target)}</span>
      </div>
      {open && (
        <div onClick={e => e.stopPropagation()} style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid #f0f0f0" }}>
          {g.why && <p className="inter" style={{ fontSize: 13, color: "#222", fontStyle: "italic", marginBottom: 14, lineHeight: 1.7 }}>{g.why}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div className="lbl">Current number</div>
              <input type="number" value={g.current} onChange={e => updateGoal(g.id, "current", Number(e.target.value))} onClick={e => e.stopPropagation()} />
            </div>
            <div>
              <div className="lbl">Status</div>
              <select value={g.status} onChange={e => updateGoal(g.id, "status", e.target.value)} onClick={e => e.stopPropagation()}>
                <option value="on-track">On track</option>
                <option value="needs-attention">Needs attention</option>
                <option value="off-track">Off track</option>
              </select>
            </div>
          </div>
          <textarea placeholder="Notes..." rows={2} value={g.notes} onChange={e => updateGoal(g.id, "notes", e.target.value)} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function Scoreboard({ data }) {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="lora" style={{ fontSize: 30, fontWeight: 600, color: "#111" }}>Scoreboard</h1>
        <p className="inter" style={{ fontSize: 14, color: "#333", marginTop: 4 }}>Are we winning? The honest picture.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 28 }}>
        {data.goals.map(g => {
          const p = pct(g.current, g.target);
          const s = sc[g.status];
          return (
            <div key={g.id} className="card" style={{ borderTop: `3px solid ${s.bar}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <span className="inter" style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", flex: 1, paddingRight: 8, lineHeight: 1.45 }}>{g.title}</span>
                <span className="badge" style={{ background: s.bg, color: s.text, flexShrink: 0 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }} />
                  {g.status === "on-track" ? "On track" : g.status === "needs-attention" ? "Heads up" : "Off track"}
                </span>
              </div>
              <div className="lora" style={{ fontSize: 28, color: "#1a1a1a", marginBottom: 10 }}>
                {fmt(g.current)}<span className="inter" style={{ fontSize: 14, color: "#222", fontWeight: 400 }}> / {fmt(g.target)}</span>
              </div>
              <div className="pbar" style={{ marginBottom: 10 }}>
                <div className="pfill" style={{ width: `${p}%`, background: s.bar }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="inter" style={{ fontSize: 11, color: "#222" }}>{g.category}</span>
                <span className="inter" style={{ fontSize: 11, color: "#222" }}>{p}% · {g.owner}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="card">
        <div className="lbl">By Category</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {[...new Set(data.goals.map(g => g.category))].map(cat => {
            const cg = data.goals.filter(g => g.category === cat);
            const avg = Math.round(cg.reduce((s, g) => s + pct(g.current, g.target), 0) / cg.length);
            const worst = cg.find(g => g.status === "off-track") ? "off-track" : cg.find(g => g.status === "needs-attention") ? "needs-attention" : "on-track";
            return (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="inter" style={{ fontSize: 13, color: "#333", minWidth: 130, fontWeight: 500 }}>{cat}</span>
                <div className="pbar" style={{ flex: 1 }}>
                  <div className="pfill" style={{ width: `${avg}%`, background: sc[worst].bar }} />
                </div>
                <span className="inter" style={{ fontSize: 12, color: "#222", minWidth: 34, textAlign: "right" }}>{avg}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LeadMeasures({ data, updateLog }) {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="lora" style={{ fontSize: 30, fontWeight: 600, color: "#111" }}>Lead Measures</h1>
        <p className="inter" style={{ fontSize: 14, color: "#333", marginTop: 4 }}>The weekly actions that predict your results. Track these every week.</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {data.goals.map(g => {
          const measures = data.leadMeasures.filter(m => m.goalId === g.id);
          if (!measures.length) return null;
          const p = pct(g.current, g.target);
          return (
            <div key={g.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div className="inter" style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 3 }}>{g.title}</div>
                  <div className="inter" style={{ fontSize: 12, color: "#222" }}>{g.category} · {p}% complete</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="inter" style={{ fontSize: 12, color: "#222", marginBottom: 5 }}>{fmt(g.current)} / {fmt(g.target)}</div>
                  <div className="pbar" style={{ width: 72 }}>
                    <div className="pfill" style={{ width: `${p}%`, background: sc[g.status].bar }} />
                  </div>
                </div>
              </div>
              <hr />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {measures.map(m => {
                  const val = data.weeklyLogs[g.id]?.[m.id] ?? (m.type === "checkbox" ? false : 0);
                  const done = m.type === "checkbox" ? val : val >= m.target;
                  return (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: done ? "#eefaf4" : "#fafafa", borderRadius: 8, border: `1px solid ${done ? "#c5e8d8" : "#f0f0f0"}` }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: done ? "#2ECC71" : "#ddd", flexShrink: 0 }} />
                      <span className="inter" style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#333" }}>{m.title}</span>
                      <span className="inter" style={{ fontSize: 11, color: "#222" }}>{m.unit}</span>
                      {m.type === "checkbox"
                        ? <input type="checkbox" checked={!!val} onChange={e => updateLog(g.id, m.id, e.target.checked)} />
                        : <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input type="number" value={val} min={0} style={{ width: 60 }} onChange={e => updateLog(g.id, m.id, Number(e.target.value))} />
                            <span className="inter" style={{ fontSize: 11, color: "#222" }}>/ {m.target}</span>
                          </div>
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Meetings({ data, updateCommitment, setData }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ date: "", wins: "", moved: "", didnt: "", ownerNotes: "", followUp: "", commitments: [{ person: "Collin", commitment: "", due: "", done: false }] });
  const save = () => {
    if (!form.date) return;
    const id = Math.max(...data.meetings.map(m => m.id), 0) + 1;
    setData(d => ({ ...d, meetings: [...d.meetings, { ...form, id }] }));
    setAdding(false);
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h1 className="lora" style={{ fontSize: 30, fontWeight: 600, color: "#111" }}>Weekly Check-ins</h1>
          <p className="inter" style={{ fontSize: 14, color: "#333", marginTop: 4 }}>Wins, misses, and what we're committing to this week.</p>
        </div>
        <button className="btn btn-teal" onClick={() => setAdding(true)}>+ New Check-in</button>
      </div>
      {adding && (
        <div className="card-teal" style={{ marginBottom: 20 }}>
          <div className="lbl">New Check-in</div>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ maxWidth: 180, marginBottom: 10 }} />
          <textarea placeholder="Wins from last week..." rows={2} value={form.wins} onChange={e => setForm(f => ({ ...f, wins: e.target.value }))} style={{ marginBottom: 8 }} />
          <textarea placeholder="What moved the goal forward?" rows={2} value={form.moved} onChange={e => setForm(f => ({ ...f, moved: e.target.value }))} style={{ marginBottom: 8 }} />
          <textarea placeholder="What didn't happen?" rows={2} value={form.didnt} onChange={e => setForm(f => ({ ...f, didnt: e.target.value }))} style={{ marginBottom: 14 }} />
          <div className="lbl">Commitments This Week</div>
          {form.commitments.map((c, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 8, marginBottom: 8 }}>
              <select value={c.person} onChange={e => setForm(f => ({ ...f, commitments: f.commitments.map((x, j) => j === i ? { ...x, person: e.target.value } : x) }))}>{TEAM.map(t => <option key={t}>{t}</option>)}</select>
              <input placeholder="I'll..." value={c.commitment} onChange={e => setForm(f => ({ ...f, commitments: f.commitments.map((x, j) => j === i ? { ...x, commitment: e.target.value } : x) }))} />
              <input type="date" value={c.due} onChange={e => setForm(f => ({ ...f, commitments: f.commitments.map((x, j) => j === i ? { ...x, due: e.target.value } : x) }))} />
            </div>
          ))}
          <button className="btn" style={{ marginBottom: 14 }} onClick={() => setForm(f => ({ ...f, commitments: [...f.commitments, { person: "Collin", commitment: "", due: "", done: false }] }))}>+ Add commitment</button>
          <textarea placeholder="Owner notes..." rows={2} value={form.ownerNotes} onChange={e => setForm(f => ({ ...f, ownerNotes: e.target.value }))} style={{ marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-teal" onClick={save}>Save</button>
            <button className="btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}
      {[...data.meetings].reverse().map(m => (
        <div key={m.id} className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span className="lora" style={{ fontSize: 18, fontStyle: "italic", color: "#1a1a1a" }}>Check-in ·</span>
            <input type="date" value={m.date}
              onChange={e => setData(d => ({ ...d, meetings: d.meetings.map(x => x.id === m.id ? { ...x, date: e.target.value } : x) }))}
              style={{ fontSize: 16, fontFamily: "Lora, Georgia, serif", fontStyle: "italic", border: "none", borderBottom: "1px solid #ddd", borderRadius: 0, padding: "2px 4px", background: "transparent", width: "auto", color: "#1a1a1a" }} />
          </div>
          {m.wins && <div style={{ background: "#eefaf4", border: "1px solid #c5e8d8", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
            <span className="inter" style={{ fontSize: 13, color: "#1E7A4A" }}>🌱 {m.wins}</span>
          </div>}
          {m.moved && <p className="inter" style={{ fontSize: 13, color: "#222", marginBottom: 7, lineHeight: 1.65 }}><strong>What worked:</strong> {m.moved}</p>}
          {m.didnt  && <p className="inter" style={{ fontSize: 13, color: "#222", marginBottom: 14, lineHeight: 1.65 }}><strong>What didn't:</strong> {m.didnt}</p>}
          <hr />
          <div className="lbl">Commitments</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {m.commitments.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <input type="checkbox" checked={c.done} onChange={e => updateCommitment(m.id, i, "done", e.target.checked)} style={{ marginTop: 2 }} />
                <span className="inter" style={{ fontSize: 13, color: c.done ? "#222" : "#333", textDecoration: c.done ? "line-through" : "none", flex: 1, lineHeight: 1.5 }}>
                  <strong>{c.person}</strong> — {c.commitment}
                </span>
                {c.due && <input type="date" value={c.due}
                  onChange={e => updateCommitment(m.id, i, "due", e.target.value)}
                  style={{ fontSize: 11, color: "#555", border: "none", borderBottom: "1px solid #ddd", borderRadius: 0, padding: "1px 4px", background: "transparent", width: "auto", fontFamily: "Inter, sans-serif" }} />}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, background: "#f9f9f9", borderRadius: 8, padding: "14px 18px", borderLeft: "3px solid #005764" }}>
            <div className="lbl" style={{ color: "#005764", marginBottom: 8 }}>Owner Note</div>
            <textarea
              value={m.ownerNotes || ""}
              onChange={e => setData(d => ({ ...d, meetings: d.meetings.map(x => x.id === m.id ? { ...x, ownerNotes: e.target.value } : x) }))}
              placeholder="Add an owner note..."
              rows={3}
              style={{ fontSize: 13, fontStyle: "italic", lineHeight: 1.7, color: "#333", background: "transparent", border: "none", padding: 0, resize: "vertical", outline: "none", width: "100%", fontFamily: "Lora, Georgia, serif" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Tasks({ data, updateTask, setData }) {
  const [filter, setFilter] = useState("all");
  const tasks = filter === "all" ? data.tasks : data.tasks.filter(t => t.assignee === filter);
  const addTask = () => {
    const id = Math.max(...data.tasks.map(t => t.id), 0) + 1;
    setData(d => ({ ...d, tasks: [...d.tasks, { id, title: "New task", goalId: data.goals[0].id, assignee: "Collin", due: "", priority: "medium", status: "todo", notes: "" }] }));
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h1 className="lora" style={{ fontSize: 30, fontWeight: 600, color: "#111" }}>Tasks</h1>
          <p className="inter" style={{ fontSize: 14, color: "#333", marginTop: 4 }}>Connected to goals, owned by people.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: "auto" }}>
            <option value="all">All team</option>
            {TEAM.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn btn-teal" onClick={addTask}>+ Task</button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tasks.map(t => {
          const goal = data.goals.find(g => g.id === t.goalId);
          return (
            <div key={t.id} className="card" style={{ display: "grid", gridTemplateColumns: "20px 1fr auto", gap: 14, alignItems: "center", opacity: t.status === "done" ? 0.4 : 1, padding: "14px 20px" }}>
              <input type="checkbox" checked={t.status === "done"} onChange={e => updateTask(t.id, "status", e.target.checked ? "done" : "todo")} />
              <div>
                <input type="text" value={t.title} onChange={e => updateTask(t.id, "title", e.target.value)}
                  style={{ border: "none", padding: 0, fontSize: 14, background: "transparent", width: "100%", fontFamily: "Inter, sans-serif", fontWeight: 600, color: "#1a1a1a", textDecoration: t.status === "done" ? "line-through" : "none" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                  {goal && <span className="inter" style={{ fontSize: 11, color: "#222" }}>{goal.title}</span>}
                  <span className="badge" style={{ background: pc[t.priority].bg, color: pc[t.priority].text, fontSize: 10 }}>{t.priority}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <select value={t.assignee} onChange={e => updateTask(t.id, "assignee", e.target.value)} style={{ width: "auto", fontSize: 12 }}>{TEAM.map(p => <option key={p}>{p}</option>)}</select>
                <input type="date" value={t.due} onChange={e => updateTask(t.id, "due", e.target.value)} style={{ width: 130, fontSize: 12 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
