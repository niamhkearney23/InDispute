import pathlib, subprocess
head = pathlib.Path("_case_head.py").read_text()
src = "SLUG = 'lane'\n" + head
A = '#3A5697'
def arrow(light):
    c = A if light else '#6E86C9'
    return ('<svg class="arw" width="58" height="50" viewBox="0 0 58 50">'
      f'<path d="M54 46 C 40 42, 20 36, 10 9" stroke="{c}" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
      f'<path d="M9 5 L 19 11 M9 5 L 7 17" stroke="{c}" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>')
def gl(light, t, d):
    return f'<div class="gloss">{arrow(light)}<div class="glosstxt"><b>{t}</b>{d}</div></div>'
T = lambda w: f'<span class="term">{w}</span>'
S = []
S.append((1,"The Question","lg","Can you keep land you just <em>took?</em>",
  '<div class="sub">A fight playing out in inner Melbourne right now.</div>', True))
S.append((2,"Start Here","md","A laneway is a <em>road.</em>",
  f'<div class="body"><p>Even a scruffy one behind a pub. If it is a {T("public road")}, the public has a right to walk down it, and the council has to manage it.</p></div>'
  + gl(True,"Public road","Land the public is entitled to pass along. It does not stop being a road because it is narrow, ugly, or because nobody has used it in years."), True))
S.append((3,"The Rule","md","Using it does not make it <em>yours.</em>",
  f'<div class="body"><p>With private land, occupying it openly for long enough can eventually give you title. That is {T("adverse possession")}.</p>'
  '<p>Against land held by a council or the Crown for public purposes, that generally does not work.</p></div>'
  + gl(True,"Adverse possession","Squatter&rsquo;s rights. Occupy someone&rsquo;s land openly, without permission, for long enough and the law can hand you the title. Public land is largely carved out of it."), True))
S.append((4,"The Twist","md","But a council <em>can</em> sell a road.",
  f'<div class="body"><p>Through a formal process called {T("discontinuance")}. The road stops being a road, and the land can be sold, often to whoever is next to it.</p>'
  '<p>There is public notice. People get to object.</p></div>'
  + gl(True,"Discontinuance","The statutory process for a council to decide a road is no longer needed as a road. Once discontinued, the land can be sold like any other."), True))
S.append((5,"The Real Question","md","Does taking it first make the sale more likely, or <em>less?</em>",
  '<div class="body"><p><b>One way:</b> nobody has used it as a road for years, so it is not needed as one. Sell it.</p>'
  '<p><b>The other way:</b> it went unused because someone blocked it. Selling now rewards that.</p></div>'
  '<div class="learn">Learn this: whether a long standing wrong becomes a reason to change the law is one of the oldest arguments there is.</div>', False))
body = ""
for n,k,size,st,extra,light in S:
    inner = f'<div class="statement {size}">{st}</div>' + extra
    cite = '""' if n==1 else ('"General information only, not legal advice."' if n==5 else '"General principles of Victorian law. Not about any particular dispute."')
    body += f'slide({n}, "{k}", {inner!r}, cite={cite}, light={light}{", swipe=True" if n==1 else ""})\n'
pathlib.Path("case_lane.py").write_text(src + body + 'print("ok")\n')
subprocess.run(["python3","case_lane.py"],check=True)
subprocess.run(["node","shoot.mjs"]+[f"out/lane0{i}.html" for i in range(1,6)],capture_output=True)
print("done")
