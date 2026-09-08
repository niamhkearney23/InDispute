import pathlib, subprocess
head = pathlib.Path("_case_head.py").read_text().replace("TOTAL = 5","TOTAL = 1")
extra = """
/* B: big number */
.bignum{font-family:'Playfair',serif;font-weight:600;font-size:300px;line-height:.86;
  letter-spacing:-.03em;}
.bignum em{font-style:italic;font-weight:400;}
.numlabel{margin-top:40px;font-family:'Playfair',serif;font-weight:600;font-size:58px;
  line-height:1.2;max-width:820px;}
.numsub{margin-top:26px;font-family:'TikTok Sans',sans-serif;font-size:31px;
  line-height:1.6;color:#A9B0C2;max-width:800px;}
.light .numsub{color:#4E4A3F;}

/* C: pull quote */
.pqmark{font-family:'Playfair',serif;font-weight:600;font-size:120px;line-height:.6;
  color:#6E86C9;opacity:.55;margin-bottom:34px;}
.light .pqmark{color:#3A5697;opacity:.5;}
.pq{font-family:'Playfair',serif;font-style:italic;
  font-weight:400;font-size:62px;line-height:1.3;max-width:870px;}
.pqa{margin-top:52px;font-family:'TikTok Sans',sans-serif;font-size:25px;
  font-weight:500;line-height:1.5;color:#8892A6;}
.light .pqa{color:#8C8577;}

/* D: short line, top weighted, air underneath */
.airwell{flex:1;display:flex;flex-direction:column;justify-content:flex-start;padding-top:20px;}
.airline{font-family:'Playfair',serif;font-weight:600;font-size:74px;line-height:1.16;
  letter-spacing:-.008em;max-width:840px;}
.airline em{font-style:italic;font-weight:400;}
.airsub{margin-top:44px;font-family:'TikTok Sans',sans-serif;font-size:29px;
  line-height:1.6;color:#A9B0C2;max-width:760px;}
.light .airsub{color:#4E4A3F;}
"""
head = head.replace(".foot{margin-top:auto;", extra + "\n.foot{margin-top:auto;")
src = "SLUG = 'tpl'\n" + head

cards = []
# A. centred headline (the current one)
cards.append(("A  Headline", False,
  '<div class="statement md">Ten months in detention. <em>Set aside.</em></div>'
  '<div class="body"><p>He was seventeen. He had already served five months.</p></div>',
  "RM v DPP [2026] VSC 544", False))
# B. big number
cards.append(("B  Number", True,
  '<div class="bignum">45</div>'
  '<div class="numlabel">days imprisonment. <em>Seven to serve.</em></div>'
  '<div class="numsub">A former solicitor, 88 years old, who would not hand over a password.</div>',
  "Victorian Legal Services Board v Guss [2026] VSC 529", False))
# C. pull quote
cards.append(("C  Quote", False,
  '<div class="pqmark">&ldquo;</div>'
  '<div class="pq">You must take reasonable care to avoid acts or omissions you can reasonably foresee would injure your neighbour.</div>'
  '<div class="pqa">Lord Atkin<br>Donoghue v Stevenson [1932] AC 562</div>',
  "", False))
# D. short line with air
cards.append(("D  Air", True,
  '<div class="airline">Nothing has been <em>decided.</em></div>'
  '<div class="airsub">This ruling was only about whether the case can be heard.</div>',
  "Marriott v Grigorovitch [2026] VSC 535", True))

body = ""
for i,(kick,light,inner,cite,air) in enumerate(cards,1):
    well = 'airwell' if air else 'well'
    body += f'''
html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{{CSS}}</style></head>
<body class="{'light' if light else ''}"><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">{kick}</div><div class="num">TEMPLATE</div></div>
  <div class="{well}">{inner}</div>
  <div class="foot"><div class="cite">{cite}</div><div class="mark">LAWGISTICS</div></div>
</div></body></html>"""
(OUT / "tpl{i}.html").write_text(html)
'''
pathlib.Path("case_tpl.py").write_text(src + body + 'print("ok")\n')
subprocess.run(["python3","case_tpl.py"],check=True)
subprocess.run(["node","shoot.mjs"]+[f"out/tpl{i}.html" for i in range(1,5)],capture_output=True)
print("done")
