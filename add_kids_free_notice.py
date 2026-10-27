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

old = '''          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>📝</span>
            <div className="inter" style={{ fontSize: 14, color: "#fff", lineHeight: 1.5, fontWeight: 600 }}>
              Every <span style={{ background: "#fff", color: "#C62828", padding: "1px 8px", borderRadius: 6, fontWeight: 800 }}>MINOR (under 18)</span> must have their waiver signed by a parent or legal guardian before climbing.
            </div>
          </div>
        </div>
      </div>'''

new = '''          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>📝</span>
            <div className="inter" style={{ fontSize: 14, color: "#fff", lineHeight: 1.5, fontWeight: 600 }}>
              Every <span style={{ background: "#fff", color: "#C62828", padding: "1px 8px", borderRadius: 6, fontWeight: 800 }}>MINOR (under 18)</span> must have their waiver signed by a parent or legal guardian before climbing.
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🎉</span>
            <div className="inter" style={{ fontSize: 14, color: "#fff", lineHeight: 1.5, fontWeight: 600 }}>
              Kids <span style={{ background: "#fff", color: "#C62828", padding: "1px 8px", borderRadius: 6, fontWeight: 800 }}>3 AND UNDER</span> climb free — no day pass or membership needed.
            </div>
          </div>
        </div>
      </div>'''

do_replace(old, new, "Added 'kids 3 and under are free' card to Guide safety banner")

with open(path, "w") as f:
    f.write(src)

print("Done.")
