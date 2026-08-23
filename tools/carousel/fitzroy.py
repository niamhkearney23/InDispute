import pathlib, subprocess
head = pathlib.Path("_case_head.py").read_text().replace("TOTAL = 5","TOTAL = 7")
head = head.replace(".foot{margin-top:auto;", """.cite2{margin-top:44px;padding:26px 30px;border:1px solid rgba(237,231,220,.22);
  font-family:'TikTok Sans',sans-serif;font-size:31px;font-weight:600;color:#EDE7DC;max-width:820px;line-height:1.4;}
.light .cite2{border-color:rgba(23,29,43,.2);color:#171D2B;}
.cite2 span{color:#6E86C9;}
.light .cite2 span{color:#3A5697;}

.foot{margin-top:auto;""")
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
S.append((1,"Before The Court","lg","A beer garden built on a public road. For <em>half a century.</em>",
 '<div class="sub">Now a company wants the Supreme Court to make the council sell it.</div>', False, '""'))
S.append((2,"The Laneway","md","It started in the <em>1970s.</em>",
 '<div class="body"><p>Reporting says operators of a Fitzroy pub began using the laneway behind it as a beer garden, and that it was later blocked off with a <b>barbed wire topped fence.</b></p>'
 '<p>Neighbouring businesses could not reach their own back doors. Their skip bins went out on the footpath instead.</p></div>', False, f'"{R}"'))
S.append((3,"The Council","md","No sale. Take it down.",
 '<div class="body"><p>The council refused to sell the laneway and told the operator to remove the beer garden.</p>'
 '<p>Reporting says the pub&rsquo;s position is that it cannot survive without it.</p></div>', False, f'"{R}"'))
S.append((4,"The Claim","md","That refusal was <em>legally unreasonable.</em>",
 '<div class="body"><p>That is what the company&rsquo;s court documents are reported to say. It is a term of art, not a complaint that the decision was harsh.</p></div>'
 + gl(False,"Legally unreasonable","An administrative law ground. The decision has to lack any evident and intelligible justification, so that no reasonable decision maker could have reached it. Plenty of decisions you would call stupid clear that bar easily."), False, f'"{R}"'))
S.append((5,"The Ask","md","Strip it of road status. Then <em>sell it to us.</em>",
 f'<div class="body"><p>Reporting says the company wants the Supreme Court to {T("discontinue")} the road and order the land sold at market rates.</p></div>'
 + gl(False,"Discontinue","The formal process that ends a road&rsquo;s legal status as a road, so the land underneath can be sold. Normally the council decides whether to do it."), False, f'"{R}"'))
S.append((6,"The Hard Part","md","Courts police <em>how</em> a decision was made. Not what it should be.",
 '<div class="body"><p>Win a judicial review and the usual prize is that the decision is quashed and sent back to be made again, properly. The council can lawfully land on the same answer twice.</p>'
 '<p>Ordering a sale asks the court to make the decision instead.</p></div>'
 '<div class="learn">Learn this: winning judicial review usually gets you a second decision, not the decision you wanted.</div>', False, f'"{R}"'))
S.append((7,"Find It Yourself","md","Want to read it when it lands?",
 '<div class="body"><p>Judgments are free on AustLII. This one will probably be styled something like:</p></div>'
 '<div class="cite2">X &amp; G Pty Ltd v Yarra City Council <span>[2026] VSC ___</span></div>'
 + gl(True,"Reading a citation","Parties, then year, then court, then the judgment number for that year. VSC is the Supreme Court of Victoria. VSCA is its Court of Appeal. HCA is the High Court."), True,
 '"Nothing has been decided. Based on media reporting of an ongoing proceeding. General information only, not legal advice."'))
body=""
for n,k,size,st,extra,light,cite in S:
    inner=f'<div class="statement {size}">{st}</div>'+extra
    body+=f'slide({n}, "{k}", {inner!r}, cite={cite}, light={light}{", swipe=True" if n==1 else ""})\n'
pathlib.Path("case_fitz.py").write_text(src+body+'print("ok")\n')
subprocess.run(["python3","case_fitz.py"],check=True)
subprocess.run(["node","shoot.mjs"]+[f"out/fitz0{i}.html" for i in range(1,8)],capture_output=True)
print("done")
