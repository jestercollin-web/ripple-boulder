path = "/Users/collinjester/ripple-boulder/src/App.jsx"
with open(path) as f:
    lines = f.readlines()

start_idx = None
end_idx = None
for i, line in enumerate(lines):
    if line.strip().startswith("function GoalsPage("):
        start_idx = i
    if start_idx is not None and line.strip().startswith("// ── Work Page"):
        end_idx = i
        break

if start_idx is None or end_idx is None:
    print(f"SKIPPED (Simplify GoalsPage): could not find boundaries (start={start_idx}, end={end_idx})")
else:
    new_func = '''function GoalsPage({ data, setData, updateGoal, updateLog, isOwner, TEAM }) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="lora" style={{ fontSize: 26, fontStyle: "italic", color: "#0D1117" }}>Goals & Focus</h1>
        <p className="inter" style={{ fontSize: 13, color: "#222", marginTop: 2 }}>Our membership goals, and how we get there.</p>
      </div>
      <GrowthGoalsCard data={data} />
    </div>
  );
}

'''
    lines[start_idx:end_idx] = [new_func]
    with open(path, "w") as f:
        f.writelines(lines)
    print(f"OK: Simplified GoalsPage (replaced lines {start_idx+1}-{end_idx})")

# Add "Goals" to the staff nav so staff can see growth goals too
with open(path) as f:
    src = f.read()

old_staff_nav = '''  const staffNav = [
    { key: "ops",        label: "My Shift" },
    { key: "announce",   label: "Board" },
    { key: "incidents",  label: "Report" },
    { key: "guide",      label: "Guide" },
  ];'''
new_staff_nav = '''  const staffNav = [
    { key: "ops",        label: "My Shift" },
    { key: "announce",   label: "Board" },
    { key: "goals",      label: "Goals" },
    { key: "incidents",  label: "Report" },
    { key: "guide",      label: "Guide" },
  ];'''

count = src.count(old_staff_nav)
if count != 1:
    print(f"SKIPPED (Add Goals to staff nav): found {count} matches, expected 1")
else:
    src = src.replace(old_staff_nav, new_staff_nav)
    with open(path, "w") as f:
        f.write(src)
    print("OK: Added Goals to staff nav")

print("Done.")
