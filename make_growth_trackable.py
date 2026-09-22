path = "/Users/collinjester/ripple-boulder/src/App.jsx"
with open(path) as f:
    src = f.read()

def do_replace(old, new, label):
    global src
    count = src.count(old)
    if count != 1:
        print(f"SKIPPED ({label}): found {count} matches, expected 1")
        return
    src = src.replace(old, new)
    print(f"OK: {label}")

# 1. Add growthTracking default to INITIAL_DATA
do_replace(
    'const INITIAL_DATA = {\n  team: TEAM,',
    'const INITIAL_DATA = {\n  growthTracking: { eventsCount: 0, eventsMonthKey: "", schoolsCount: 0, corporateCount: 0 },\n  team: TEAM,',
    "Added growthTracking to INITIAL_DATA"
)

# 2. Replace GrowthGoalsCard with a trackable version (accepts setData, log buttons, progress)
old_component = '''function GrowthGoalsCard({ data }) {
  const memberCount = data.manualMembershipCount || (data.foundingMembers || []).length || 154;
  const tiers = [
    { count: 500,  emoji: "👕", title: "500 Members",   reward: "Staff Merch",      note: "" },
    { count: 700,  emoji: "🍽️", title: "700 Members",   reward: "Big Team Dinner",  note: "Expanded design & hold budget unlock" },
    { count: 1000, emoji: "💰", title: "1,000 Members", reward: "Rich Bitch Goal",  note: "The big one." },
  ];
  const strategies = [
    { emoji: "🎉", text: "10 solid events a month" },
    { emoji: "🎓", text: "Connecting with schools & universities" },
    { emoji: "🏢", text: "Corporate parties" },
  ];

  return (
    <div className="card" style={{ marginBottom: 20, background: "linear-gradient(135deg, #FBF8F3 0%, #F3EFE6 100%)", border: "1px solid #E8DFD0" }}>
      <div className="sec-label" style={{ marginBottom: 4 }}>Growth Milestones 🚀</div>
      <p className="inter" style={{ fontSize: 12, color: "#555", marginBottom: 16 }}>
        We're at <strong>{memberCount}</strong> members. Here's what we're playing for.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
        {tiers.map(t => {
          const reached = memberCount >= t.count;
          const pctVal = Math.min(100, Math.round((memberCount / t.count) * 100));
          return (
            <div key={t.count} style={{ padding: "12px 14px", background: reached ? "linear-gradient(135deg, #F0FBF5, #E8F9F0)" : "#fff", borderRadius: 12, border: `1.5px solid ${reached ? "#A8DCC0" : "#E8DFD0"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{t.emoji}</span>
                  <div>
                    <div className="inter" style={{ fontSize: 13, fontWeight: 700, color: "#0D1117" }}>{t.title} — {t.reward}</div>
                    {t.note && <div className="inter" style={{ fontSize: 10, color: "#888" }}>{t.note}</div>}
                  </div>
                </div>
                <div className="inter" style={{ fontSize: 13, fontWeight: 800, color: reached ? "#2E7D32" : "#1A5F6A" }}>
                  {reached ? "✓ Hit!" : `${pctVal}%`}
                </div>
              </div>
              <div style={{ height: 6, background: "#E0EAF0", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${pctVal}%`, height: "100%", background: reached ? "#4CAF50" : "#1A5F6A", borderRadius: 99, transition: "width 0.6s" }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: "1px solid #E8DFD0", paddingTop: 14 }}>
        <div className="inter" style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", color: "#888", textTransform: "uppercase", marginBottom: 10 }}>How we get there</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {strategies.map(s => (
            <div key={s.text} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fff", borderRadius: 10, border: "1px solid #E8DFD0" }}>
              <span style={{ fontSize: 15 }}>{s.emoji}</span>
              <span className="inter" style={{ fontSize: 13, color: "#333" }}>{s.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}'''

new_component = '''function GrowthGoalsCard({ data, setData }) {
  const memberCount = data.manualMembershipCount || (data.foundingMembers || []).length || 154;
  const tiers = [
    { count: 500,  emoji: "👕", title: "500 Members",   reward: "Staff Merch",      note: "" },
    { count: 700,  emoji: "🍽️", title: "700 Members",   reward: "Big Team Dinner",  note: "Expanded design & hold budget unlock" },
    { count: 1000, emoji: "💰", title: "1,000 Members", reward: "Rich Bitch Goal",  note: "The big one." },
  ];

  const monthKey = new Date().toISOString().slice(0, 7);
  const gt = data.growthTracking || { eventsCount: 0, eventsMonthKey: monthKey, schoolsCount: 0, corporateCount: 0 };
  const eventsThisMonth = gt.eventsMonthKey === monthKey ? (gt.eventsCount || 0) : 0;

  const logEvent = () => setData(d => {
    const cur = d.growthTracking || {};
    const curMonthKey = new Date().toISOString().slice(0, 7);
    const curCount = cur.eventsMonthKey === curMonthKey ? (cur.eventsCount || 0) : 0;
    return { ...d, growthTracking: { ...cur, eventsCount: curCount + 1, eventsMonthKey: curMonthKey } };
  });
  const logSchool = () => setData(d => ({ ...d, growthTracking: { ...(d.growthTracking || {}), schoolsCount: ((d.growthTracking || {}).schoolsCount || 0) + 1 } }));
  const logCorporate = () => setData(d => ({ ...d, growthTracking: { ...(d.growthTracking || {}), corporateCount: ((d.growthTracking || {}).corporateCount || 0) + 1 } }));

  const strategies = [
    { key: "events",    emoji: "🎉", text: "10 solid events a month",              count: eventsThisMonth,     target: 10,   onLog: logEvent,     logLabel: "+1 Event" },
    { key: "schools",   emoji: "🎓", text: "Connecting with schools & universities", count: gt.schoolsCount || 0,   target: null, onLog: logSchool,    logLabel: "+1 Connection" },
    { key: "corporate", emoji: "🏢", text: "Corporate parties",                     count: gt.corporateCount || 0, target: null, onLog: logCorporate, logLabel: "+1 Booked" },
  ];

  return (
    <div className="card" style={{ marginBottom: 20, background: "linear-gradient(135deg, #FBF8F3 0%, #F3EFE6 100%)", border: "1px solid #E8DFD0" }}>
      <div className="sec-label" style={{ marginBottom: 4 }}>Growth Milestones 🚀</div>
      <p className="inter" style={{ fontSize: 12, color: "#555", marginBottom: 16 }}>
        We're at <strong>{memberCount}</strong> members. Here's what we're playing for.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
        {tiers.map(t => {
          const reached = memberCount >= t.count;
          const pctVal = Math.min(100, Math.round((memberCount / t.count) * 100));
          return (
            <div key={t.count} style={{ padding: "12px 14px", background: reached ? "linear-gradient(135deg, #F0FBF5, #E8F9F0)" : "#fff", borderRadius: 12, border: `1.5px solid ${reached ? "#A8DCC0" : "#E8DFD0"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{t.emoji}</span>
                  <div>
                    <div className="inter" style={{ fontSize: 13, fontWeight: 700, color: "#0D1117" }}>{t.title} — {t.reward}</div>
                    {t.note && <div className="inter" style={{ fontSize: 10, color: "#888" }}>{t.note}</div>}
                  </div>
                </div>
                <div className="inter" style={{ fontSize: 13, fontWeight: 800, color: reached ? "#2E7D32" : "#1A5F6A" }}>
                  {reached ? "✓ Hit!" : `${pctVal}%`}
                </div>
              </div>
              <div style={{ height: 6, background: "#E0EAF0", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${pctVal}%`, height: "100%", background: reached ? "#4CAF50" : "#1A5F6A", borderRadius: 99, transition: "width 0.6s" }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: "1px solid #E8DFD0", paddingTop: 14 }}>
        <div className="inter" style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", color: "#888", textTransform: "uppercase", marginBottom: 10 }}>How we get there — tap to log</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {strategies.map(s => (
            <div key={s.key} style={{ padding: "10px 12px", background: "#fff", borderRadius: 10, border: "1px solid #E8DFD0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 15 }}>{s.emoji}</span>
                  <span className="inter" style={{ fontSize: 13, color: "#333" }}>{s.text}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span className="inter" style={{ fontSize: 12, fontWeight: 800, color: "#1A5F6A" }}>
                    {s.target ? `${s.count}/${s.target}` : s.count}
                  </span>
                  <button onClick={s.onLog} style={{ background: "#1A5F6A", color: "#fff", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{s.logLabel}</button>
                </div>
              </div>
              {s.target && (
                <div style={{ height: 5, background: "#E0EAF0", borderRadius: 99, overflow: "hidden", marginTop: 8 }}>
                  <div style={{ width: `${Math.min(100, Math.round((s.count / s.target) * 100))}%`, height: "100%", background: s.count >= s.target ? "#4CAF50" : "#1A5F6A", borderRadius: 99, transition: "width 0.5s" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}'''

do_replace(old_component, new_component, "Made GrowthGoalsCard trackable (log buttons + monthly event counter)")

# 3. Pass setData at the Goals page call site
do_replace(
    '<GrowthGoalsCard data={data} />',
    '<GrowthGoalsCard data={data} setData={setData} />',
    "Passed setData to GrowthGoalsCard on Goals page"
)

# 4. Also render it on the Ops (My Shift) page, right under DailyPulse, so staff can log during their shift
do_replace(
    '      <DailyPulse data={data} setData={setData} TEAM={TEAM} />',
    '      <DailyPulse data={data} setData={setData} TEAM={TEAM} />\n      <GrowthGoalsCard data={data} setData={setData} />',
    "Added GrowthGoalsCard to Ops (My Shift) page"
)

with open(path, "w") as f:
    f.write(src)

print("Done.")
