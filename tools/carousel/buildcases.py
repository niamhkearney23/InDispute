import pathlib, importlib.util, subprocess
spec = importlib.util.spec_from_file_location("c", "_cases.py"); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
head = pathlib.Path("_case_head.py").read_text()
files = []
for slug, cite, dark, slides in m.CASES:
    src = f"SLUG = {slug!r}\n" + head
    body = ""
    for i, s in enumerate(slides, 1):
        kicker, size, statement, *rest = s
        inner = f'<div class="statement {size}">{statement}</div>'
        for r in rest:
            if r.startswith("SUB:"):   inner += f'<div class="sub">{r[4:]}</div>'
            if r.startswith("BODY:"):  inner += f'<div class="body">{r[5:]}</div>'
            if r.startswith("LEARN:"): inner += f'<div class="learn">{r[6:]}</div>'
        lightval = (not dark) if i < 5 else dark
        args = f'light={lightval}'
        if i == 1: args += ', swipe=True'
        c = '""' if i == 1 else f'"{cite}"'
        if i == 5: c = '"Summary only. Read the judgment before relying on it. General information only, not legal advice."'
        body += f'slide({i}, "{kicker}", {inner!r}, cite={c}, {args})\n'
    p = pathlib.Path(f"case_{slug}.py"); p.write_text(src + body + 'print("ok")\n')
    subprocess.run(["python3", str(p)], check=True, capture_output=True)
    files += [f"out/{slug}0{i}.html" for i in range(1,6)]
print(len(files), "slides")
subprocess.run(["node","shoot.mjs"]+files, capture_output=True)
print("rendered")
