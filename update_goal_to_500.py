path = "/Users/collinjester/ripple-boulder/src/App.jsx"
with open(path) as f:
    src = f.read()

count = src.count("const goal = 200;")
if count == 0:
    print("SKIPPED: no matches found for 'const goal = 200;'")
else:
    src = src.replace("const goal = 200;", "const goal = 500;")
    with open(path, "w") as f:
        f.write(src)
    print(f"OK: Updated {count} occurrence(s) of 'const goal = 200' to 500")
