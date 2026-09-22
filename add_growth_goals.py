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

# 1. Simplify owner nav to just Ops, Goals, Guide, Budget
old_nav = '''  const ownerNav = [
    { key: "home",       label: "Home" },
    { key: "announce",   label: "📣 Board" },
    { key: "ops",        label: "Ops" },
    { key: "scoreboard", label: "Scoreboard" },
    { key: "goals",      label: "Goals" },
    { key: "opening",    label: "Opening" },
    { key: "guide",      label: "📋 Guide" },
    { key: "budget",     label: "💰 Budget" },
    { key: "passwords",  label: "Passwords" },
    { key: "settings",   label: "Settings" },
  ];'''
new_nav = '''  const ownerNav = [
    { key: "ops",        label: "Ops" },
    { key: "goals",      label: "Goals" },
    { key: "guide",      label: "📋 Guide" },
    { key: "budget",     label: "💰 Budget" },
  ];'''
do_replace(old_nav, new_nav, "Simplified owner nav")

# 2. Update default-landing-page fallbacks from "home" to "goals" (4 spots)
do_replace(
    'const [nav, setNavState] = useState("home");',
    'const [nav, setNavState] = useState("goals");',
    "Default nav state -> goals"
)
do_replace(
    '''      setData(d => ({ ...d, viewMode: "owner" }));
      setNav("home");''',
    '''      setData(d => ({ ...d, viewMode: "owner" }));
      setNav("goals");''',
    "PIN-submit nav -> goals"
)
do_replace(
    'setNav(data.viewMode === "staff" ? "ops" : "home");',
    'setNav(data.viewMode === "staff" ? "ops" : "goals");',
    "Post-load nav -> goals"
)
do_replace(
    'setNav(isOwner ? "home" : "ops");',
    'setNav(isOwner ? "goals" : "ops");',
    "Invalid-nav redirect -> goals"
)

# 3. Insert <GrowthGoalsCard /> into GoalsPage, right after the header row
old_hook = '''        {isOwner && <button className="btn btn-teal" onClick={() => setAdding(true)}>+ New goal</button>}
      </div>

      {adding && ('''
new_hook = '''        {isOwner && <button className="btn btn-teal" onClick={() => setAdding(true)}>+ New goal</button>}
      </div>

      <GrowthGoalsCard data={data} />

      {adding && ('''
do_replace(old_hook, new_hook, "Inserted GrowthGoalsCard into Goals page")

# 4. Define the GrowthGoalsCard component
anchor = 'function AnnouncePage({ data, setData, memberCount }) {'
component = '''function GrowthGoalsCard({ data }) {
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
}

''' + anchor
do_replace(anchor, component, "Added GrowthGoalsCard component")

with open(path, "w") as f:
    f.write(src)

print("Done - file written.")
