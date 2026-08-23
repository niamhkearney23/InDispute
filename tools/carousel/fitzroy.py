import pathlib, subprocess
head = pathlib.Path("_case_head.py").read_text().replace("TOTAL = 5","TOTAL = 6")
src = "SLUG = 'fitz'\n" + head
def arrow(light):
    c = '#3A5697' if light else '#6E86C9'
    return ('<svg class="arw" width="58" height="50" viewBox="0 0 58 50">'
      f'<path d="M54 46 C 40 42, 20 36, 10 9" stroke="{c}" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
      f'<path d="M9 5 L 19 11 M9 5 L 7 17" stroke="{c}" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>')
def gl(light,t,d): return f'<div class="gloss">{arrow(light)}<div class="glosstxt"><b>{t}</b>{d}</div></div>'
T = lambda w: f'<span class="term">{w}</span>'
R = "As reported. Proceedings are on foot and nothing has been decided."
S=[]
S.append((1,"Before The Court","lg","A company is asking a court to <em>force</em> a council to sell public land.",
 '<div class="sub">Not to review the decision. To order the sale.</div>', False, '""'))
S.append((2,"The Background","md","A laneway behind a Fitzroy pub.",
 '<div class="body"><p>Reporting says operators began using the rear laneway as a beer garden in the <b>1970s</b>, and that it was later fenced off, blocking neighbours&rsquo; rear access.</p>'
 '<p>The council refused to sell the laneway and told the operator to remove the beer garden.</p></div>', False, f'"{R}"'))
S.append((3,"The Claim","md","The refusal was <em>legally unreasonable.</em>",
 f'<div class="body"><p>That is what the company&rsquo;s court documents are reported to say. It is a specific legal term, not a complaint that the decision was harsh.</p></div>'
 + gl(False,"Legally unreasonable","An administrative law ground. The decision has to lack any evident and intelligible justification, so that no reasonable decision maker could have reached it. The bar is deliberately very high."), False, f'"{R}"'))
S.append((4,"What They Want","md","Discontinue the road. Sell it at <em>market rates.</em>",
 f'<div class="body"><p>Reporting says the company is asking the Supreme Court to {T("discontinue")} the road and order the land sold.</p></div>'
 + gl(False,"Discontinue","The formal process by which a road stops legally being a road, so the land underneath can be sold. Normally it is the council that decides to do it."), False, f'"{R}"'))
S.append((5,"The Hard Part","md","Courts check <em>how</em> a decision was made. Not what it should be.",
 '<div class="body"><p>On judicial review a court can usually quash a decision and send it back to be made again, properly.</p>'
 '<p>Ordering the council to sell is a much bigger ask, because it means the court making the decision instead of the council.</p></div>'
 '<div class="learn">Learn this: winning judicial review usually gets you a second decision, not the decision you wanted.</div>', False, f'"{R}"'))
S.append((6,"Read This Twice","md","Nothing here has been <em>decided.</em>",
 '<div class="body"><p>These are claims in a proceeding that is still running. Reporting says the council had not yet filed its defence.</p>'
 '<p>We are describing the argument, not the answer.</p></div>', True,
 '"Based on media reporting of an ongoing proceeding. General information only, not legal advice."'))
body=""
for n,k,size,st,extra,light,cite in S:
    inner=f'<div class="statement {size}">{st}</div>'+extra
    body+=f'slide({n}, "{k}", {inner!r}, cite={cite}, light={light}{", swipe=True" if n==1 else ""})\n'
pathlib.Path("case_fitz.py").write_text(src+body+'print("ok")\n')
subprocess.run(["python3","case_fitz.py"],check=True)
subprocess.run(["node","shoot.mjs"]+[f"out/fitz0{i}.html" for i in range(1,7)],capture_output=True)
print("done")
