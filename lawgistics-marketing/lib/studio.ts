// @ts-nocheck
// Imperative studio logic, ported from the Claude-artifact prototype. Runs
// once against the DOM the page component renders. Kept as plain DOM code so
// the slide renderer stays byte-for-byte the same HTML/CSS the export
// rasterises, which is the whole point of the WYSIWYG preview.

function blankSlideBase(){
  return {dark:false, size:'md', kicker:'', statement:'', sub:'', body:'', learn:'', cite:'', swipe:false};
}

function defaultBrand(){
  return {kind:'person', style:'editorial', cream:'#EDE7DC', navy:'#171D2B', accent:'#3A5697',
    wordmark:'', role:'', field:'', audience:'', disclaimer:'',
    serif:'default', sans:'default', voice:''};
}
// the corner reads "Name · Practice" when a practice is given
function markText(brand){
  var n = (brand.wordmark||'').trim(), r = (brand.role||'').trim();
  return r ? n+' · '+r : n;
}

function exampleSlides(){
  var kicker = "Daily Court Intelligence · 16.09.26";
  var cite = "**Brauer v Coburn Resources Pty Ltd** [2026] FCA 1110\nFederal Court of Australia · Jackson J";
  return [
    {dark:false,size:'lg',swipe:true,kicker:kicker,cite:cite,
      statement:"Which company employed 166 workers? *The Commonwealth wanted another.*",
      sub:"A secured-lender priority fight inside a mining group's collapse.", body:'', learn:''},
    {dark:false,size:'md',swipe:false,kicker:kicker,cite:cite,
      statement:"Two companies, *one mine site.*", sub:'',
      body:"Strandline Resources and its subsidiary Coburn Resources ran a mineral sands project together. Both collapsed into receivership and voluntary administration on the same day.\n\n166 workers had contracts naming **Strandline** as their employer, even though the work was on Coburn's project.",
      learn:''},
    {dark:false,size:'md',swipe:false,kicker:kicker,cite:cite,
      statement:"Why the employer's name matters.", sub:'',
      body:"Unpaid employee entitlements get priority in an insolvency, ahead of some other creditors.\n\nThe Commonwealth, standing in those workers' shoes after paying out their entitlements, wanted that priority to attach to **Coburn**, where more value sat.",
      learn:''},
    {dark:false,size:'md',swipe:false,kicker:kicker,cite:cite,
      statement:"The Federal Court said: *read the contract.*", sub:'',
      body:"Justice Jackson held the written contracts naming Strandline as employer **ordinarily prevail.**",
      learn:"In a group insolvency, the written employment contract is the starting point for identifying the true employer, not which company's project the work was actually done for."},
    {dark:false,size:'lg',swipe:false,kicker:kicker,cite:cite,
      statement:"\"An intelligible business objective\" is relevant. It is *not* a standalone test.",
      sub:"The contract still comes first.", body:'', learn:''},
    {dark:true,size:'md',swipe:false,kicker:kicker,cite:cite,
      statement:"Why it matters.", sub:'',
      body:"The ruling protected Coburn's secured lenders from being leapfrogged by the Commonwealth's priority claim.\n\nFor anyone advising on group structures: **get the employment contracts right.** Insolvency will test exactly who they name.",
      learn:''}
  ];
}

function exampleCaption(disclaimer){
  var note = (disclaimer||'').trim();
  return [
    "166 workers. Two companies. One question: who actually employed them?",
    "Strandline Resources and its subsidiary Coburn Resources ran a mineral sands project together.",
    "Both collapsed on the same day.",
    "The workers' contracts named Strandline as the employer. The work was on Coburn's project.",
    "The Commonwealth, having paid out the workers' entitlements, wanted the priority claim to sit with Coburn, where the money was.",
    "The Federal Court said no. Read the contract.",
    "Justice Jackson held that written employment contracts naming the employer ordinarily prevail.",
    "For anyone advising on group structures, that is the whole lesson.",
    "Get the employment contracts right before the group is under stress. Insolvency will test exactly who they name.",
    "Brauer v Coburn Resources Pty Ltd [2026] FCA 1110."
  ].concat(note ? [note] : []).join("\n\n");
}

var EXAMPLE_INTRO = "Hi. That is an example post, just so you can see the shape. Tell me what you want to post about and I will draft yours.";
var NEW_POST_INTRO = "What do you want to post about today?";

// ---- colour derivation from the three brand colours, in JS rather than CSS
// color-mix so html2canvas export matches the preview exactly ----
function hexToRgb(hex){
  hex = String(hex||'#000000').replace('#','');
  if(hex.length===3) hex = hex.split('').map(function(c){return c+c;}).join('');
  var num = parseInt(hex,16) || 0;
  return {r:(num>>16)&255, g:(num>>8)&255, b:num&255};
}
function rgbToHex(r,g,b){
  function h(v){ v=Math.max(0,Math.min(255,Math.round(v))); var s=v.toString(16); return s.length<2?'0'+s:s; }
  return '#'+h(r)+h(g)+h(b);
}
function mixHex(hexA, hexB, weightA){
  var a=hexToRgb(hexA), b=hexToRgb(hexB);
  return rgbToHex(a.r*weightA+b.r*(1-weightA), a.g*weightA+b.g*(1-weightA), a.b*weightA+b.b*(1-weightA));
}
function computeBrandTokens(brand){
  var cream = brand.cream, navy = brand.navy, accent = brand.accent;
  return {
    cream: cream, navy: navy,
    inkOnCream: navy, inkOnNavy: cream,
    kickerOnCream: mixHex(navy, cream, .55), kickerOnNavy: mixHex(cream, navy, .55),
    bodyOnCream: mixHex(navy, cream, .88), bodyOnNavy: mixHex(cream, navy, .82),
    subOnCream: mixHex(navy, cream, .70), subOnNavy: mixHex(cream, navy, .78),
    mutedOnCream: mixHex(navy, cream, .40), mutedOnNavy: mixHex(cream, navy, .40),
    accent: accent, accentOnNavy: mixHex(accent, '#ffffff', .68),
    inkOnAccent: cream, kickerOnAccent: mixHex(cream, accent, .72), bodyOnAccent: mixHex(cream, accent, .9), mutedOnAccent: mixHex(cream, accent, .62)
  };
}
var STYLES = [
  {key:'editorial', name:'Editorial', desc:'Serif statements, small labels. The Lawgistics look.'},
  {key:'bold',      name:'Bold', desc:'Big sans headlines and an accent bar. Loud.'},
  {key:'minimal',   name:'Minimal', desc:'Centred and quiet, with room to breathe.'},
  {key:'block',     name:'Colour block', desc:'Your accent colour as the background.'},
  {key:'swiss',     name:'Swiss', desc:'Hard left, tight sans, one heavy rule. Design studio.'},
  {key:'mono',      name:'Mono', desc:'Technical. Monospaced labels, boxed content.'},
  {key:'press',     name:'Press', desc:'Paper grain and heavy ink. Printed, not posted.'},
  {key:'stack',     name:'Stack', desc:'Air at the top, everything weighted to the floor.'}
];
var STYLE_KEYS = STYLES.map(function(s){ return s.key; });
function styleClass(brand){
  var s = brand && brand.style;
  return (s && s!=='editorial' && STYLE_KEYS.indexOf(s)>=0) ? ' style-'+s : '';
}
var loadedGoogleFonts = {};
function ensureGoogleFont(family){
  if(!family || family==='default' || loadedGoogleFonts[family]) return;
  loadedGoogleFonts[family] = true;
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=' +
    encodeURIComponent(family).replace(/%20/g,'+') +
    ':ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap';
  document.head.appendChild(link);
}
function fontVarValue(kind, brand){
  if(kind==='serif') return brand.serif==='default' ? "'Studio Serif'" : "'"+brand.serif+"'";
  return brand.sans==='default' ? "'Studio Sans'" : "'"+brand.sans+"'";
}
function applyBrand(el, brand){
  var t = computeBrandTokens(brand);
  el.style.setProperty('--t-cream', t.cream);
  el.style.setProperty('--t-navy', t.navy);
  el.style.setProperty('--t-ink-cream', t.inkOnCream);
  el.style.setProperty('--t-ink-navy', t.inkOnNavy);
  el.style.setProperty('--t-kicker-cream', t.kickerOnCream);
  el.style.setProperty('--t-kicker-navy', t.kickerOnNavy);
  el.style.setProperty('--t-body-cream', t.bodyOnCream);
  el.style.setProperty('--t-body-navy', t.bodyOnNavy);
  el.style.setProperty('--t-sub-cream', t.subOnCream);
  el.style.setProperty('--t-sub-navy', t.subOnNavy);
  el.style.setProperty('--t-muted-cream', t.mutedOnCream);
  el.style.setProperty('--t-muted-navy', t.mutedOnNavy);
  el.style.setProperty('--t-accent', t.accent);
  el.style.setProperty('--t-accent-navy', t.accentOnNavy);
  el.style.setProperty('--t-ink-accent', t.inkOnAccent);
  el.style.setProperty('--t-kicker-accent', t.kickerOnAccent);
  el.style.setProperty('--t-body-accent', t.bodyOnAccent);
  el.style.setProperty('--t-muted-accent', t.mutedOnAccent);
  el.style.setProperty('--f-serif', fontVarValue('serif', brand));
  el.style.setProperty('--f-sans', fontVarValue('sans', brand));
}

function textEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function attrEsc(s){ return textEsc(s).replace(/"/g,'&quot;'); }
function smartQuotes(s){
  var out = s.replace(/"([^"]+)"/g, '“$1”');
  out = out.replace(/(\w)'(\w)/g, '$1’$2');
  out = out.replace(/\B'(\w)/g, '‘$1');
  out = out.replace(/(\w)'\B/g, '$1’');
  return out;
}
// A designer does not leave a full stop stranded on its own line, a space
// floating before a comma, or an empty emphasis pair. None of this is taste,
// it is the mechanical stuff that makes a graphic read as machine output.
function typeset(s){
  var t = String(s==null?'':s);
  t = t.replace(/\*\*\s*\*\*|\*\s*\*/g, '');   // emphasis wrapped around nothing
  t = t.replace(/[ \t]+/g, ' ');
  t = t.replace(/ +([,.;:!?%)\]])/g, '$1');      // no space before punctuation
  t = t.replace(/([(\[]) +/g, '$1');
  t = t.split('\n').map(function(line){
    // a line with no letters or digits in it is a stray mark, not a line
    return /[A-Za-z0-9]/.test(line) ? line : '';
  }).join('\n');
  t = t.replace(/\n{3,}/g, '\n\n');
  t = t.replace(/[\s.,;:]+$/, function(m){ return /[.!?]$/.test(m.trim()) ? m.trim().slice(-1) : ''; });
  return t.trim();
}
// Bind the last short word to the one before it, so the tail of a line, and
// above all its final punctuation, can never be widowed onto a line of its own.
function noWidow(html){
  var t = String(html).trim();
  var words = t.split(/\s+/);
  // nothing to widow, and binding here would only force a worse break
  if(words.length < 4) return html;
  var last = words[words.length-1].replace(/<[^>]+>/g, '');
  if(last.length > 9) return html;
  return String(html).replace(/ ([^ ]+)$/, '&nbsp;$1');
}
function hasWords(s){ return /[A-Za-z0-9]/.test(String(s||'')); }

function mdInline(s){
  if(!s) return '';
  var t = smartQuotes(typeset(s));
  if(!t) return '';
  t = textEsc(t);
  t = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return t;
}

// Each slide picks a composition, so one carousel can run a title card, a
// dense block of argument, a figure and a quote instead of six of the same.
var LAYOUTS = [
  {key:'statement', name:'Statement', desc:'A line that lands, detail underneath.'},
  {key:'title',     name:'Title card', desc:'Big and centred, nothing else.'},
  {key:'bigtype',   name:'Wall of type', desc:'Words fill the whole frame, edge to edge.'},
  {key:'essay',     name:'Essay', desc:'Headline over a dense block of text.'},
  {key:'impact',    name:'Impact', desc:'Huge uppercase. Shouts.'},
  {key:'stat',      name:'Figure', desc:'One number, blown up.'},
  {key:'list',      name:'List', desc:'Numbered points, each with a line under it.'},
  {key:'checklist', name:'Checklist', desc:'Ticky boxes. People save these.'},
  {key:'quote',     name:'Quote', desc:'A quoted line, with who said it.'},
  {key:'split',     name:'Split', desc:'Colour block on top, the detail underneath.'},
  {key:'twocol',    name:'Two columns', desc:'Heading down one side, content down the other.'},
  {key:'sidebar',   name:'Stripe', desc:'A band of colour down the edge.'},
  {key:'pyramid',   name:'Pyramid', desc:'Tiers, narrow at the top. What sits on what.'},
  {key:'steps',     name:'Steps', desc:'A numbered sequence, in order.'},
  {key:'compare',   name:'This vs that', desc:'Two columns, side by side.'},
  {key:'band',      name:'Band', desc:'A stripe of colour across the middle, reversed out.'},
  {key:'duo',       name:'Half and half', desc:'The frame cut down the middle into two fields.'},
  {key:'frame',     name:'Framed', desc:'A ruled box, the label sitting on the rule.'},
  {key:'numeral',   name:'Numeral', desc:'A number the height of the page, words on top.'},
  {key:'edge',      name:'Edge', desc:'Type hard to the bottom corner, nothing above it.'}
];
// these carve the canvas into zones rather than stacking everything down one page
var ZONED = {split:1, twocol:1, sidebar:1, band:1, duo:1};
// where the words sit in the frame. one carousel that runs top, floor, middle
// reads as designed; six slides all vertically centred read as a template.
var HAS_FURNITURE = {frame:1, band:1, duo:1, sidebar:1, split:1, twocol:1, numeral:1, edge:1, bigtype:1};
var ANCHORS = ['top','mid','bottom'];
var ALIGNS = ['left','centre'];
function alignOf(slide){ return slide.align==='centre' ? 'centre' : 'left'; }
function anchorOf(slide){ return ANCHORS.indexOf(slide.anchor)>=0 ? slide.anchor : 'mid'; }

// Drawn geometry that sits behind the words. Kept to the accent colour and
// off the centre of the frame so it never fights the type.
var MOTIFS = [
  {key:'none',     name:'None'},
  {key:'arc',      name:'Arc'},
  {key:'circle',   name:'Circle'},
  {key:'triangle', name:'Triangle'},
  {key:'rules',    name:'Rules'},
  {key:'grid',     name:'Dot grid'},
  {key:'corner',   name:'Corners'},
  {key:'burst',    name:'Burst'}
];
var MOTIF_KEYS = MOTIFS.map(function(m){ return m.key; });
function motifOf(slide){ return MOTIF_KEYS.indexOf(slide.motif)>=0 ? slide.motif : 'none'; }
function motifSvg(slide){
  var m = motifOf(slide);
  if(m==='none') return '';
  var s = '<svg class="motif" viewBox="0 0 1080 1350" preserveAspectRatio="none" aria-hidden="true">';
  if(m==='arc'){
    s += '<circle cx="1010" cy="1270" r="420" fill="none" stroke="currentColor" stroke-width="3"/>'+
         '<circle cx="1010" cy="1270" r="300" fill="none" stroke="currentColor" stroke-width="3"/>'+
         '<circle cx="1010" cy="1270" r="180" fill="none" stroke="currentColor" stroke-width="3"/>';
  } else if(m==='circle'){
    s += '<circle cx="940" cy="210" r="260" fill="none" stroke="currentColor" stroke-width="3"/>'+
         '<circle cx="940" cy="210" r="96" fill="currentColor" opacity=".18"/>';
  } else if(m==='triangle'){
    s += '<path d="M 150 1120 L 440 610 L 730 1120 Z" fill="none" stroke="currentColor" stroke-width="3"/>'+
         '<path d="M 295 1120 L 440 865 L 585 1120 Z" fill="currentColor" opacity=".16"/>';
  } else if(m==='rules'){
    for(var i=0;i<5;i++) s += '<line x1="620" y1="'+(150+i*26)+'" x2="1010" y2="'+(150+i*26)+'" stroke="currentColor" stroke-width="3"/>';
    for(var j=0;j<5;j++) s += '<line x1="70" y1="'+(1130+j*26)+'" x2="460" y2="'+(1130+j*26)+'" stroke="currentColor" stroke-width="3"/>';
  } else if(m==='grid'){
    for(var r=0;r<9;r++) for(var c=0;c<7;c++)
      s += '<circle cx="'+(700+c*58)+'" cy="'+(880+r*52)+'" r="4.5" fill="currentColor"/>';
  } else if(m==='corner'){
    s += '<path d="M 64 210 L 64 64 L 210 64" fill="none" stroke="currentColor" stroke-width="4"/>'+
         '<path d="M 1016 1140 L 1016 1286 L 870 1286" fill="none" stroke="currentColor" stroke-width="4"/>';
  } else if(m==='burst'){
    for(var k=0;k<16;k++){
      var a = (k/16)*Math.PI*2, cx=920, cy=1150;
      s += '<line x1="'+(cx+Math.cos(a)*70).toFixed(1)+'" y1="'+(cy+Math.sin(a)*70).toFixed(1)+
           '" x2="'+(cx+Math.cos(a)*230).toFixed(1)+'" y2="'+(cy+Math.sin(a)*230).toFixed(1)+
           '" stroke="currentColor" stroke-width="3"/>';
    }
    s += '<circle cx="920" cy="1150" r="44" fill="none" stroke="currentColor" stroke-width="3"/>';
  }
  return s + '</svg>';
}
var LAYOUT_KEYS = LAYOUTS.map(function(l){ return l.key; });
function layoutOf(slide){ return LAYOUT_KEYS.indexOf(slide.layout)>=0 ? slide.layout : 'statement'; }

// "Heading: the line under it" is the shape every rowed layout reads
function rowsFrom(body){
  return String(body||'').split(/\n+/)
    .map(function(l){ return l.replace(/^\s*[-*•]?\s*\d{0,2}[.)]?\s*/,'').trim(); })
    .filter(Boolean)
    .map(function(l){
      var m = l.match(/^(.{2,42}?)\s*[:–]\s+(.+)$/);
      return m ? {head:m[1], desc:m[2]} : {head:l, desc:''};
    });
}
function rowHtml(r, md){
  return '<b>'+md(r.head)+'</b>'+(r.desc ? '<em>'+md(r.desc)+'</em>' : '');
}
function groundOf(slide){
  if(slide.ground==='accent') return 'accent';
  if(slide.ground==='dark' || (slide.ground==null && slide.dark)) return 'dark';
  return 'light';
}

function slideInnerHtml(slide, brand){
  var sw = slide.swipe ? '<div class="swipe">swipe &rarr;</div>' : ('<div class="mark">'+mdInline(markText(brand))+'</div>');
  var layout = layoutOf(slide);
  var bodyParas = String(slide.body||'').split(/\n\s*\n/).map(function(p){return p.trim();}).filter(Boolean);
  var inner = '';

  if(layout==='list' || layout==='checklist'){
    var items = rowsFrom(slide.body);
    inner = '<div class="statement '+(slide.size||'md')+'">'+noWidow(mdInline(slide.statement))+'</div>';
    if(slide.sub) inner += '<div class="sub">'+noWidow(mdInline(slide.sub))+'</div>';
    inner += '<ol class="listrows'+(layout==='checklist' ? ' checks' : '')+'">'+items.map(function(it,i){
      var marker = layout==='checklist'
        ? '<span class="box"></span>'
        : '<span class="n">'+(i+1)+'</span>';
      return '<li>'+marker+'<span class="t">'+rowHtml(it, mdInline)+'</span></li>';
    }).join('')+'</ol>';
  } else if(layout==='pyramid'){
    // first line is the top tier, so the widths grow as you read down
    var tiers = rowsFrom(slide.body);
    var n = Math.max(tiers.length, 1);
    inner = '<div class="statement '+(slide.size||'md')+'">'+noWidow(mdInline(slide.statement))+'</div>';
    if(slide.sub) inner += '<div class="sub">'+noWidow(mdInline(slide.sub))+'</div>';
    inner += '<div class="pyramid">'+tiers.map(function(t,i){
      var w = Math.round(44 + (56 * (n===1 ? 1 : i/(n-1))));
      return '<div class="tier" style="width:'+w+'%">'+rowHtml(t, mdInline)+'</div>';
    }).join('')+'</div>';
  } else if(layout==='steps'){
    var steps = rowsFrom(slide.body);
    inner = '<div class="statement '+(slide.size||'md')+'">'+noWidow(mdInline(slide.statement))+'</div>';
    if(slide.sub) inner += '<div class="sub">'+noWidow(mdInline(slide.sub))+'</div>';
    inner += '<ol class="steprows">'+steps.map(function(s,i){
      return '<li><span class="dot">'+(i+1)+'</span><span class="t">'+rowHtml(s, mdInline)+'</span></li>';
    }).join('')+'</ol>';
  } else if(layout==='compare'){
    // two blank-line separated blocks: each block is a heading then its points
    var cols = String(slide.body||'').split(/\n\s*\n/).slice(0,2).map(function(block){
      var lines = block.split(/\n+/).map(function(l){ return l.replace(/^\s*[-*•]\s*/,'').trim(); }).filter(Boolean);
      return {head: lines.shift() || '', items: lines};
    });
    inner = '<div class="statement '+(slide.size||'md')+'">'+noWidow(mdInline(slide.statement))+'</div>';
    if(slide.sub) inner += '<div class="sub">'+noWidow(mdInline(slide.sub))+'</div>';
    inner += '<div class="compare">'+cols.map(function(c,i){
      return '<div class="col'+(i===1?' alt':'')+'">'+
        '<div class="colhead">'+mdInline(c.head)+'</div>'+
        '<ul>'+c.items.map(function(t){ return '<li>'+mdInline(t)+'</li>'; }).join('')+'</ul>'+
      '</div>';
    }).join('')+'</div>';
  } else if(layout==='bigtype'){
    // size the type to the amount of text so it genuinely fills the frame
    var raw = String(slide.statement||'').replace(/\*/g,'');
    var px = raw.length>90 ? 78 : raw.length>60 ? 96 : raw.length>38 ? 118 : raw.length>22 ? 142 : 172;
    inner = '<div class="bigtype" style="font-size:'+px+'px">'+mdInline(slide.statement)+'</div>';
    if(slide.sub) inner += '<div class="bigsub">'+mdInline(slide.sub)+'</div>';
  } else if(layout==='stat'){
    inner = '<div class="figure">'+mdInline(slide.statement)+'</div>';
    if(slide.sub) inner += '<div class="figcaption">'+mdInline(slide.sub)+'</div>';
    if(bodyParas.length) inner += '<div class="body">'+bodyParas.map(function(p){return '<p>'+mdInline(p)+'</p>';}).join('')+'</div>';
  } else if(layout==='quote'){
    inner = '<div class="quotemark">&ldquo;</div>'+
      '<div class="quotetext">'+noWidow(mdInline(slide.statement))+'</div>';
    if(slide.sub) inner += '<div class="quoteattrib">'+mdInline(slide.sub)+'</div>';
  } else {
    inner = '<div class="statement '+(slide.size||'md')+'">'+noWidow(mdInline(slide.statement))+'</div>';
    if(slide.sub) inner += '<div class="sub">'+noWidow(mdInline(slide.sub))+'</div>';
    if(bodyParas.length) inner += '<div class="body">'+bodyParas.map(function(p){return '<p>'+mdInline(p)+'</p>';}).join('')+'</div>';
  }
  if(hasWords(slide.learn)) inner += '<div class="learn">'+noWidow(mdInline(slide.learn))+'</div>';

  var citeHtml = mdInline(slide.cite).replace(/\n/g,'<br>');
  var photo = (slide.photo ? '<img class="photo" src="'+attrEsc(slide.photo)+'" alt="">' : '') + motifSvg(slide);
  // a wall of type carries the whole frame, so the label and citation get out of its way
  var head = (layout==='bigtype' || !hasWords(slide.kicker)) ? '' : '<div class="kicker">'+mdInline(slide.kicker)+'</div>';
  var foot = layout==='bigtype'
    ? '<div class="foot">'+sw+'</div>'
    : '<div class="foot"><div class="cite">'+citeHtml+'</div>'+sw+'</div>';

  if(ZONED[layout]){
    var lede = '<div class="statement '+(slide.size||'md')+'">'+noWidow(mdInline(slide.statement))+'</div>';
    var rest = '';
    if(slide.sub) rest += '<div class="sub">'+noWidow(mdInline(slide.sub))+'</div>';
    if(bodyParas.length) rest += '<div class="body">'+bodyParas.map(function(p){return '<p>'+mdInline(p)+'</p>';}).join('')+'</div>';
    if(hasWords(slide.learn)) rest += '<div class="learn">'+noWidow(mdInline(slide.learn))+'</div>';
    if(layout==='band'){
      // three horizontal fields: label, a full-bleed stripe carrying the line,
      // then the detail. nothing about it reads as the standard page.
      return photo + '<div class="page zoned">'+
        '<div class="zA">'+head+'</div>'+
        '<div class="zB">'+lede+'</div>'+
        '<div class="zC"><div class="content">'+rest+'</div>'+foot+'</div>'+
        '</div>';
    }
    if(layout==='duo'){
      // the canvas cut vertically into two colour fields, the statement sitting
      // on the floor of the first one
      return photo + '<div class="page zoned">'+
        '<div class="zA">'+head+'<div class="content">'+lede+'</div></div>'+
        '<div class="zB"><div class="content">'+rest+'</div>'+foot+'</div>'+
        '</div>';
    }
    if(layout==='sidebar'){
      // the stripe carries the label, the page carries everything else
      return photo + '<div class="page zoned">'+
        '<div class="zA"><div class="stripelabel">'+mdInline(slide.kicker)+'</div></div>'+
        '<div class="zB"><div class="content">'+lede+rest+'</div>'+foot+'</div>'+
        '</div>';
    }
    return photo + '<div class="page zoned">'+
      '<div class="zA">'+head+'<div class="content">'+lede+'</div></div>'+
      '<div class="zB"><div class="content">'+rest+'</div>'+foot+'</div>'+
      '</div>';
  }

  // drawn furniture that sits behind the page rather than inside the text flow
  var deco = '';
  if(layout==='numeral') deco = '<div class="bignum" aria-hidden="true">'+textEsc(slide.tag||'')+'</div>';
  if(layout==='frame') deco = '<div class="ruleframe" aria-hidden="true"></div>';

  return photo + deco + '<div class="page">'+ head +
    '<div class="content">'+inner+'</div>'+ foot +
    '</div>';
}
function buildCanvasEl(slide, brand){
  var div = document.createElement('div');
  var ground = groundOf(slide);
  var pm = (slide.photoMode==='plain' || slide.photoMode==='card') ? slide.photoMode : 'scrim';
  div.className = 'slide-canvas' + (ground==='dark' ? ' dark' : '') + (ground==='accent' ? ' onaccent' : '') +
    ' lay-'+layoutOf(slide) + ' anc-'+anchorOf(slide) + ' al-'+alignOf(slide) + styleClass(brand) +
    (slide.photo ? ' has-photo photo-'+pm + (slide.photoKind==='design' ? ' has-design' : '') : '');
  div.innerHTML = slideInnerHtml(slide, brand);
  applyBrand(div, brand);
  return div;
}

var STEP_KEYS = ['you','look','voice','ask','review','save'];
var SETUP_STEPS = ['you','look','voice'];

// A calendar invite is the only reminder that works with no accounts and no
// push permission, and it survives the browser being closed.
function weeklyReminderIcs(){
  function pad(n){ return (n<10?'0':'')+n; }
  function stamp(d){
    return d.getUTCFullYear()+pad(d.getUTCMonth()+1)+pad(d.getUTCDate())+'T'+
      pad(d.getUTCHours())+pad(d.getUTCMinutes())+'00Z';
  }
  var start = new Date();
  start.setDate(start.getDate()+7);
  start.setHours(9,0,0,0);
  var end = new Date(start.getTime()+30*60000);
  return [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Lawgistics Marketing//EN','CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:'+Date.now()+'@lawgistics-marketing',
    'DTSTAMP:'+stamp(new Date()),
    'DTSTART:'+stamp(start),
    'DTEND:'+stamp(end),
    'RRULE:FREQ=WEEKLY',
    'SUMMARY:Write this week\'s post',
    'DESCRIPTION:Open Lawgistics Marketing and draft this week\'s post.',
    'URL:'+(typeof location!=='undefined' ? location.origin : ''),
    'BEGIN:VALARM','TRIGGER:-PT10M','ACTION:DISPLAY','DESCRIPTION:Write this week\'s post','END:VALARM',
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
}

var PALETTES = [
  {name:'House',    cream:'#EDE7DC', navy:'#171D2B', accent:'#3A5697'},
  {name:'Mono',     cream:'#F4F4F2', navy:'#0B0B0C', accent:'#4A4A4E'},
  {name:'Stone',    cream:'#F2EEE6', navy:'#23211E', accent:'#B85C38'},
  {name:'Sage',     cream:'#EDF0EA', navy:'#1C2A22', accent:'#4C7C5B'},
  {name:'Slate',    cream:'#EEF1F5', navy:'#151A22', accent:'#5B7FA6'},
  {name:'Electric', cream:'#EFF1FC', navy:'#0C0F1F', accent:'#4A45C8'},
  {name:'Ember',    cream:'#F7EFE8', navy:'#1A1411', accent:'#C0552A'},
  {name:'Plum',     cream:'#F3ECF0', navy:'#241A22', accent:'#8E4A6B'},
  {name:'Sand',     cream:'#F5EFE2', navy:'#2B2416', accent:'#A6782C'},
  {name:'Forest',   cream:'#EAEFEA', navy:'#0F1C15', accent:'#2F6B43'}
];

function previewSlide(brand){
  var who = brand.kind==='person' ? 'your name' : (brand.kind==='business' ? 'your business name' : 'your firm name');
  return {dark:false, size:'lg', swipe:false, kicker:'Your series · today',
    statement:"This is what your posts will *look like.*",
    sub:"The statement carries the point, the detail sits under it, "+who+" in the corner.",
    body:'', learn:'', cite: brand.disclaimer || ''};
}

export function initStudio(){
  var state = {slides: [], activeIndex: 0, brand: defaultBrand(), caption: '', consented: false, step: 'you', messages: [], drafted: false, format: 'carousel', setupDone: false};

  function loadLocal(){
    try{ var raw = localStorage.getItem('lgm_state_v1'); return raw ? JSON.parse(raw) : null; }catch(e){ return null; }
  }
  function saveLocal(){ try{ localStorage.setItem('lgm_state_v1', JSON.stringify(state)); }catch(e){} }

  var $ = function(id){ return document.getElementById(id); };
  var editorPanel = $('editorPanel'), previewHolder = $('previewHolder'), strip = $('strip'), editDrawer = $('editDrawer'), stageCount = $('stageCount');
  var exportStage = $('exportStage'), toast = $('toast');
  var btnAddSlide = $('btnAddSlide'), btnDupSlide = $('btnDupSlide'), btnDelSlide = $('btnDelSlide');
  var btnMoveUp = $('btnMoveUp'), btnMoveDown = $('btnMoveDown'), btnNewPost = $('btnNewPost');
  var btnExportOne = $('btnExportOne'), btnExportAll = $('btnExportAll');
  var shareBar = $('shareBar'), downloadBar = $('downloadBar'), btnShareAll = $('btnShareAll'), btnShareOne = $('btnShareOne');
  var exportNote = $('exportNote');
  var chatLog = $('chatLog'), chatInput = $('chatInput'), btnSend = $('btnSend');
  var askInput = $('askInput'), btnAsk = $('btnAsk'), askStatus = $('askStatus'), btnSeeExample = $('btnSeeExample'), formatPick = $('formatPick');
  var kindPick = $('kindPick'), kindDetails = $('kindDetails'), palettes = $('palettes'), styles = $('styles'), brandPreview = $('brandPreview'), btnRandomise = $('btnRandomise');
  var brandCream = $('brandCream'), brandNavy = $('brandNavy'), brandAccent = $('brandAccent');
  var brandName = $('brandName'), brandField = $('brandField'), brandRole = $('brandRole');
  var brandAudience = $('brandAudience'), brandDisclaimer = $('brandDisclaimer');
  var brandSerif = $('brandSerif'), brandSans = $('brandSans'), brandVoice = $('brandVoice');
  var KINDS = ['person','firm','business'];
  function brandKind(){ return KINDS.indexOf(state.brand.kind)>=0 ? state.brand.kind : 'person'; }
  var captionText = $('captionText'), captionOut = $('captionOut'), btnCopyCaption = $('btnCopyCaption');
  var consentCheck = $('consentCheck'), changePanel = $('changePanel'), btnChange = $('btnChange');
  var btnRemindWeekly = $('btnRemindWeekly'), btnAnother = $('btnAnother');
  var sameAsLast = $('sameAsLast'), sameRow = $('sameRow'), brandBar = $('brandBar');

  function previewWidth(){
    var frame = previewHolder.parentElement;
    var pad = parseFloat(getComputedStyle(frame).paddingLeft) || 0;
    var avail = frame.clientWidth - pad*2;
    return avail > 0 ? Math.min(420, avail) : 340;
  }
  var toastTimer = null;
  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 2600);
  }

  function stripWidth(){ return window.innerWidth <= 600 ? 168 : 96; }
  function renderStrip(){
    var STRIP_WIDTH = stripWidth();
    var scale = STRIP_WIDTH/1080;
    strip.innerHTML = '';
    state.slides.forEach(function(s,i){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'stripitem' + (i===state.activeIndex ? ' active' : '');
      btn.dataset.idx = String(i);
      btn.setAttribute('aria-label', 'Slide '+(i+1));
      btn.style.width = STRIP_WIDTH+'px';
      btn.style.height = Math.round(1350*scale)+'px';
      btn.style.position = 'relative';
      var canvas = buildCanvasEl(s, state.brand);
      canvas.style.transform = 'scale('+scale+')';
      canvas.style.transformOrigin = 'top left';
      canvas.style.position = 'absolute';
      canvas.style.left = '0'; canvas.style.top = '0';
      canvas.style.pointerEvents = 'none';
      btn.appendChild(canvas);
      strip.appendChild(btn);
    });
    var active = strip.querySelector('.stripitem.active');
    if(active && window.innerWidth <= 600 && strip.scrollWidth > strip.clientWidth){
      strip.scrollLeft = active.offsetLeft - (strip.clientWidth - active.offsetWidth)/2;
    }
  }
  var stripTimer = null;
  function renderStripSoon(){ clearTimeout(stripTimer); stripTimer = setTimeout(renderStrip, 250); }

  function showStep(name){
    if(STEP_KEYS.indexOf(name)<0) name = 'ask';
    state.step = name;
    if(name==='ask') state.setupDone = true;
    document.querySelectorAll('.step').forEach(function(sec){
      sec.classList.toggle('active', sec.dataset.step===name);
    });
    if(name==='review'){ renderStrip(); setTimeout(updatePreview, 0); }
    if(name==='save'){ captionOut.value = state.caption || ''; rememberApproved(); if(state.consented) prepareBlobs(); }
    if(name==='look') setTimeout(renderBrandPreview, 0);
    if(name==='you') setTimeout(function(){ brandName.focus(); }, 0);
    if(name==='ask'){ renderBrandBar(); renderSameRow(); setTimeout(function(){ askInput.focus(); }, 0); }
    saveLocal();
    window.scrollTo(0,0);
  }

  function renderBrandPreview(){
    var frame = brandPreview.parentElement;
    var pad = parseFloat(getComputedStyle(frame).paddingLeft) || 0;
    var width = Math.max(120, Math.min(300, frame.clientWidth - pad*2));
    var scale = width/1080;
    // show a stand-in name so the corner is never empty before they type one
    var shown = JSON.parse(JSON.stringify(state.brand));
    if(!shown.wordmark) shown.wordmark = state.brand.kind==='person' ? 'YOUR NAME' : 'YOUR BUSINESS';
    var canvas = buildCanvasEl(previewSlide(state.brand), shown);
    canvas.style.transform = 'scale('+scale+')';
    canvas.style.transformOrigin = 'top left';
    var wrap = document.createElement('div');
    wrap.style.width = width+'px';
    wrap.style.height = Math.round(1350*scale)+'px';
    wrap.style.position = 'relative'; wrap.style.overflow = 'hidden'; wrap.style.borderRadius = '5px';
    wrap.appendChild(canvas);
    brandPreview.innerHTML = '';
    brandPreview.appendChild(wrap);
  }
  function activePaletteName(){
    var b = state.brand;
    for(var i=0;i<PALETTES.length;i++){
      var p = PALETTES[i];
      if(p.cream.toLowerCase()===String(b.cream).toLowerCase() && p.navy.toLowerCase()===String(b.navy).toLowerCase() && p.accent.toLowerCase()===String(b.accent).toLowerCase()) return p.name;
    }
    return null;
  }
  function renderPalettes(){
    var active = activePaletteName();
    palettes.innerHTML = PALETTES.map(function(p){
      return '<button type="button" class="palette'+(p.name===active?' active':'')+'" data-palette="'+p.name+'">'+
        '<span class="sw"><i style="background:'+p.cream+'"></i><i style="background:'+p.navy+'"></i><i style="background:'+p.accent+'"></i></span>'+
        textEsc(p.name)+'</button>';
    }).join('');
  }
  function renderBrandBar(){
    var b = state.brand;
    var styleName = (STYLES.filter(function(s){ return s.key===(b.style||'editorial'); })[0]||STYLES[0]).name;
    var pal = activePaletteName();
    brandBar.innerHTML =
      '<span class="sw"><i style="background:'+attrEsc(b.cream)+'"></i><i style="background:'+attrEsc(b.navy)+'"></i><i style="background:'+attrEsc(b.accent)+'"></i></span>'+
      '<b>'+textEsc(b.wordmark || 'No name yet')+'</b>'+
      '<span class="sep">/</span><span>'+textEsc(pal || 'Custom colours')+'</span>'+
      '<span class="sep">/</span><span>'+textEsc(styleName)+'</span>'+
      '<button type="button" class="linkbtn edit" data-go="look">Change</button>';
  }
  function renderSameRow(){
    var has = !!(state.lastPattern && state.lastPattern.length);
    sameRow.hidden = !has;
    if(has) sameAsLast.checked = !!state.sameAsLast;
  }
  sameAsLast.addEventListener('change', function(){ state.sameAsLast = sameAsLast.checked; saveLocal(); });

  function renderStyles(){
    var active = state.brand.style || 'editorial';
    styles.innerHTML = STYLES.map(function(s){
      return '<button type="button" class="stylebtn'+(s.key===active?' active':'')+'" data-style="'+s.key+'">'+
        '<b>'+textEsc(s.name)+'</b><span>'+textEsc(s.desc)+'</span></button>';
    }).join('');
  }
  styles.addEventListener('click', function(e){
    var b = e.target.closest('[data-style]'); if(!b) return;
    state.brand.style = b.dataset.style;
    syncBrandFields(); saveLocal(); updatePreview(); renderStripSoon();
  });
  palettes.addEventListener('click', function(e){
    var b = e.target.closest('[data-palette]'); if(!b) return;
    var p = PALETTES.filter(function(x){ return x.name===b.dataset.palette; })[0]; if(!p) return;
    applyPalette(p);
  });
  function applyPalette(p){
    state.brand.cream = p.cream; state.brand.navy = p.navy; state.brand.accent = p.accent;
    syncBrandFields(); saveLocal(); updatePreview(); renderStripSoon();
  }
  btnRandomise.addEventListener('click', function(){
    // never hand back the combination they are already looking at
    var current = activePaletteName(), currentStyle = state.brand.style || 'editorial';
    var picks = [];
    PALETTES.forEach(function(p){
      STYLES.forEach(function(s){
        if(p.name===current && s.key===currentStyle) return;
        picks.push({p:p, s:s});
      });
    });
    var pick = picks[Math.floor(Math.random()*picks.length)];
    state.brand.style = pick.s.key;
    applyPalette(pick.p);
    showToast(pick.s.name + ' · ' + pick.p.name);
  });
  var resizeTimer = null;
  window.addEventListener('resize', function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function(){
      if(state.step==='review'){ renderStrip(); updatePreview(); }
      if(state.step==='look') renderBrandPreview();
    }, 120);
  });

  // a one-line instruction that rewrites just this piece of text
  var REFINE_CHIPS = ['Shorter', 'Less corporate', 'Punchier', 'More like me'];
  function refineBar(field){
    return '<div class="refine" data-refine="'+field+'">'+
      '<div class="refinechips">'+REFINE_CHIPS.map(function(c){
        return '<button type="button" class="chip" data-refinechip="'+attrEsc(c)+'">'+textEsc(c)+'</button>';
      }).join('')+
      '<input type="text" class="refineinput" placeholder="or say it yourself, e.g. name the case">'+
      '</div><p class="refinestatus"></p></div>';
  }

  function renderEditor(){
    var idx = state.activeIndex, total = state.slides.length, slide = state.slides[idx];
    editorPanel.innerHTML =
      '<p class="panel-title">Slide '+(idx+1)+' of '+total+'</p>'+
      '<div class="field"><label>Drawn shape <span class="hint">sits behind the words</span></label>'+
        '<div class="segmented motifpick">'+MOTIFS.map(function(m){
          return '<button type="button" data-act="setMotif" data-val="'+m.key+'" class="'+(motifOf(slide)===m.key?'active':'')+'">'+textEsc(m.name)+'</button>';
        }).join('')+'</div></div>'+
      '<div class="field"><label>Shape of this slide</label>'+
        '<div class="styles">'+LAYOUTS.map(function(l){
          return '<button type="button" class="stylebtn'+(layoutOf(slide)===l.key?' active':'')+'" data-act="setLayout" data-val="'+l.key+'">'+
            '<b>'+textEsc(l.name)+'</b><span>'+textEsc(l.desc)+'</span></button>';
        }).join('')+'</div></div>'+
      '<div class="rowfields">'+
        '<div class="field"><label>Background</label>'+
          '<div class="segmented">'+
            '<button type="button" data-act="setGround" data-val="light" class="'+(groundOf(slide)==='light'?'active':'')+'">Light</button>'+
            '<button type="button" data-act="setGround" data-val="dark" class="'+(groundOf(slide)==='dark'?'active':'')+'">Dark</button>'+
            '<button type="button" data-act="setGround" data-val="accent" class="'+(groundOf(slide)==='accent'?'active':'')+'">Accent</button>'+
          '</div></div>'+
        '<div class="field"><label>Statement size</label>'+
          '<div class="segmented">'+
            '<button type="button" data-act="setSize" data-val="lg" class="'+(slide.size==='lg'?'active':'')+'">Large</button>'+
            '<button type="button" data-act="setSize" data-val="md" class="'+(slide.size==='md'?'active':'')+'">Medium</button>'+
          '</div></div>'+
      '</div>'+
      '<div class="field photofield"><label>Photo <span class="hint">optional, sits behind the text</span></label>'+
        (slide.photo
          ? '<div class="photothumb"><img src="'+attrEsc(slide.photo)+'" alt="">'+
              '<div class="photobar">'+
                (total>1 ? '<button type="button" class="btn btn-sm" data-act="photoAll">Use on every slide</button>' : '')+
                '<button type="button" class="btn btn-sm btn-danger" data-act="removePhoto">Remove</button>'+
              '</div></div>'+
            '<div class="segmented" style="margin-top:10px">'+
              ['scrim','plain','card'].map(function(m){
                var label = m==='scrim' ? 'Faded' : (m==='plain' ? 'Straight on' : 'In a card');
                var on = (slide.photoMode||'scrim')===m;
                return '<button type="button" data-act="setPhotoMode" data-val="'+m+'" class="'+(on?'active':'')+'">'+label+'</button>';
              }).join('')+
            '</div>'
          : '<textarea data-photo-prompt rows="2" placeholder="Optional for a design. For a photo, describe it: a quiet courtroom corridor in morning light">'+textEsc(defaultPhotoPrompt(slide))+'</textarea>'+
            '<div class="photobar">'+
              '<button type="button" class="btn btn-sm btn-accent" data-act="genDesign">Design with AI</button>'+
              '<button type="button" class="btn btn-sm" data-act="genPhoto">Photo with AI</button>'+
              '<label class="btn btn-sm">Upload your own<input type="file" accept="image/*" data-photo-upload hidden></label>'+
            '</div>'+
            '<p class="photostatus hint" data-photo-status></p>'+
            '<p class="photonote">Design with AI makes an abstract background in your colours. Photos are places and objects only, no faces, no text. Upload only photos you have the right to post, and nobody’s face without their OK.</p>')+
      '</div>'+
      '<div class="field"><label>Series label / kicker</label>'+
        '<input type="text" data-field="kicker" value="'+attrEsc(slide.kicker)+'"></div>'+
      '<div class="field"><label>Statement <span class="hint">**bold** *italic*</span></label>'+
        '<div class="mdbar">'+
          '<button type="button" data-wrap="**" data-target="statement" title="Bold selection"><b>B</b></button>'+
          '<button type="button" data-wrap="*" data-target="statement" title="Italicise selection"><i>I</i></button>'+
        '</div>'+
        '<textarea data-field="statement" rows="3">'+textEsc(slide.statement)+'</textarea>'+
        refineBar('statement')+'</div>'+
      '<div class="field"><label>Subline <span class="hint">optional</span></label>'+
        '<textarea data-field="sub" rows="2">'+textEsc(slide.sub)+'</textarea>'+
        refineBar('sub')+'</div>'+
      '<div class="field"><label>Body <span class="hint">optional, blank line = new paragraph</span></label>'+
        '<div class="mdbar">'+
          '<button type="button" data-wrap="**" data-target="body" title="Bold selection"><b>B</b></button>'+
          '<button type="button" data-wrap="*" data-target="body" title="Italicise selection"><i>I</i></button>'+
        '</div>'+
        '<textarea data-field="body" rows="4">'+textEsc(slide.body)+'</textarea>'+
        refineBar('body')+'</div>'+
      '<details class="morefields"'+((slide.learn||slide.cite||slide.swipe)?' open':'')+'>'+
        '<summary>More fields (learning line, citation, cover slide)</summary>'+
        '<div class="field"><label>Pull-quote <span class="hint">optional</span></label>'+
          '<textarea data-field="learn" rows="2">'+textEsc(slide.learn)+'</textarea></div>'+
        '<div class="field"><label>Citation <span class="hint">a line break starts the second line</span></label>'+
          '<textarea data-field="cite" rows="3">'+textEsc(slide.cite)+'</textarea></div>'+
        '<div class="field"><div class="checkrow">'+
          '<input type="checkbox" id="swipeCheck" data-field="swipe" '+(slide.swipe?'checked':'')+'>'+
          '<label for="swipeCheck" style="font-weight:400;color:var(--ink);">Show &ldquo;swipe &rarr;&rdquo; (cover slide) instead of the wordmark</label>'+
        '</div></div>'+
      '</details>';
  }

  function updatePreview(){
    var slide = state.slides[state.activeIndex];
    previewHolder.innerHTML = '';
    var width = previewWidth();
    var scale = width/1080;
    var canvas = buildCanvasEl(slide, state.brand);
    canvas.style.transform = 'scale('+scale+')';
    canvas.style.transformOrigin = 'top left';
    var wrap = document.createElement('div');
    wrap.style.width = width+'px';
    wrap.style.height = Math.round(1350*scale)+'px';
    wrap.style.position = 'relative';
    wrap.style.overflow = 'hidden';
    wrap.style.borderRadius = '5px';
    wrap.appendChild(canvas);
    previewHolder.appendChild(wrap);
    stageCount.textContent = state.slides.length>1
      ? 'Slide '+(state.activeIndex+1)+' of '+state.slides.length
      : 'Your poster';
  }

  function renderCaption(){
    if(document.activeElement !== captionText) captionText.value = state.caption || '';
    captionText.placeholder = state.drafted ? '' : 'Your post will appear here.';
    captionOut.value = state.caption || '';
  }

  function renderChat(){
    chatLog.innerHTML = state.messages.map(function(m){
      var cls = 'msg '+(m.role==='user'?'user':'bot')+(m.busy?' busy':'')+(m.error?' error':'');
      return '<div class="'+cls+'">'+textEsc(m.text).replace(/\n/g,'<br>')+'</div>';
    }).join('');
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function updateButtons(){
    btnMoveUp.disabled = state.activeIndex===0;
    btnMoveDown.disabled = state.activeIndex===state.slides.length-1;
    btnDelSlide.disabled = state.slides.length<=1;
    consentCheck.checked = !!state.consented;
    btnExportOne.disabled = !state.consented;
    btnExportAll.disabled = !state.consented;
    btnShareAll.disabled = !state.consented;
    btnShareOne.disabled = !state.consented;
  }

  function syncBrandFields(){
    var kind = brandKind();
    kindPick.querySelectorAll('button').forEach(function(b){
      b.classList.toggle('active', b.dataset.kind===kind);
      if(b.dataset.kind===kind) b.setAttribute('aria-pressed','true'); else b.removeAttribute('aria-pressed');
    });
    brandCream.value = state.brand.cream;
    brandNavy.value = state.brand.navy;
    brandAccent.value = state.brand.accent;
    if(document.activeElement!==brandName) brandName.value = state.brand.wordmark;
    if(document.activeElement!==brandField) brandField.value = state.brand.field || '';
    if(document.activeElement!==brandRole) brandRole.value = state.brand.role || '';
    if(document.activeElement!==brandAudience) brandAudience.value = state.brand.audience || '';
    if(document.activeElement!==brandDisclaimer) brandDisclaimer.value = state.brand.disclaimer || '';
    brandSerif.value = state.brand.serif;
    brandSans.value = state.brand.sans;
    if(document.activeElement!==brandVoice) brandVoice.value = state.brand.voice || '';
    brandName.placeholder = kind==='person' ? 'e.g. John Smith' : (kind==='firm' ? 'e.g. Smith & Co Lawyers' : 'e.g. Corner Lane Cafe');
    renderPalettes();
    renderStyles();
    if(state.step==='look') renderBrandPreview();
  }
  kindPick.addEventListener('click', function(e){
    var b = e.target.closest('button[data-kind]'); if(!b) return;
    var kind = b.dataset.kind;
    if(kind===state.brand.kind) return;
    // switching who it is from keeps the look they have chosen and the name they typed
    state.brand.kind = kind;
    syncBrandFields(); saveLocal(); updatePreview();
    brandName.focus();
  });
  formatPick.addEventListener('click', function(e){
    var b = e.target.closest('button[data-format]'); if(!b) return;
    state.format = b.dataset.format==='poster' ? 'poster' : 'carousel';
    syncFormat(); saveLocal();
  });
  function syncFormat(){
    formatPick.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active', b.dataset.format===state.format); });
  }

  function renderAll(){
    if(state.activeIndex>=state.slides.length) state.activeIndex = state.slides.length-1;
    if(state.activeIndex<0) state.activeIndex = 0;
    renderEditor();
    syncBrandFields();
    updatePreview();
    renderStrip();
    renderCaption();
    renderChat();
    updateButtons();
  }
  function select(i){ state.activeIndex = i; saveLocal(); renderAll(); }

  strip.addEventListener('click', function(e){
    var item = e.target.closest('.stripitem'); if(!item) return;
    select(+item.dataset.idx);
  });
  editDrawer.addEventListener('toggle', function(){ if(editDrawer.open) updatePreview(); });
  document.addEventListener('click', function(e){
    var go = e.target.closest('[data-go]'); if(!go) return; showStep(go.dataset.go);
  });

  editorPanel.addEventListener('input', function(e){
    var el = e.target, field = el.dataset.field; if(!field) return;
    var slide = state.slides[state.activeIndex];
    slide[field] = (el.type==='checkbox') ? el.checked : el.value;
    saveLocal(); updatePreview(); renderStripSoon();
  });
  function defaultPhotoPrompt(slide){
    var s = String(slide.statement||'').replace(/\*/g,'').trim();
    return s ? 'A scene that fits: '+s : '';
  }
  // Photos are stored as slide-sized JPEGs so six of them still fit in localStorage.
  function toSlideJpeg(src){
    return new Promise(function(resolve, reject){
      var img = new Image();
      img.onload = function(){
        var c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
        var ctx = c.getContext('2d');
        var s = Math.max(1080/img.width, 1350/img.height), w = img.width*s, h = img.height*s;
        ctx.drawImage(img, (1080-w)/2, (1350-h)/2, w, h);
        resolve(c.toDataURL('image/jpeg', .86));
      };
      img.onerror = function(){ reject(new Error('could not read that image')); };
      img.src = src;
    });
  }
  function setPhotoStatus(msg, kind){
    var el = editorPanel.querySelector('[data-photo-status]'); if(!el) return;
    el.textContent = msg; el.className = 'photostatus hint' + (kind ? ' '+kind : '');
  }
  async function setSlidePhoto(index, src, kind){
    var jpeg = await toSlideJpeg(src);
    state.slides[index].photo = jpeg;
    state.slides[index].photoKind = kind || 'photo';
    saveLocal(); renderEditor(); updatePreview(); renderStrip();
    showToast(kind==='design' ? 'Design added' : 'Photo added');
  }
  async function generateImage(mode){
    var ta = editorPanel.querySelector('[data-photo-prompt]'); if(!ta) return;
    var prompt = ta.value.trim();
    if(mode==='photo' && !prompt){ setPhotoStatus('Describe the photo first.', 'bad'); ta.focus(); return; }
    if(mode==='design' && /^A scene that fits:/.test(prompt)) prompt = '';
    var btns = editorPanel.querySelectorAll('[data-act="genPhoto"],[data-act="genDesign"]');
    btns.forEach(function(b){ b.disabled = true; });
    var index = state.activeIndex;
    setPhotoStatus(mode==='design' ? 'Designing in your colours. About 20 seconds.' : 'Generating. About 20 seconds.', 'busy');
    try{
      var res = await fetch('/api/image', {method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({prompt: prompt, mode: mode, colours: {navy: state.brand.navy, accent: state.brand.accent, cream: state.brand.cream}})});
      var data = await res.json();
      if(!res.ok) throw new Error(data && data.error ? data.error : 'request failed');
      await setSlidePhoto(index, data.image, mode);
    }catch(err){
      setPhotoStatus('Could not make that: '+((err && err.message) ? err.message : 'try again'), 'bad');
      btns.forEach(function(b){ b.disabled = false; });
    }
  }
  editorPanel.addEventListener('change', function(e){
    var input = e.target.closest('[data-photo-upload]'); if(!input || !input.files || !input.files[0]) return;
    var file = input.files[0], index = state.activeIndex;
    setPhotoStatus('Adding your photo.', 'busy');
    var reader = new FileReader();
    reader.onload = function(){ setSlidePhoto(index, reader.result).catch(function(){ setPhotoStatus('Could not read that image.', 'bad'); }); };
    reader.onerror = function(){ setPhotoStatus('Could not read that image.', 'bad'); };
    reader.readAsDataURL(file);
  });
  async function runRefine(wrap, instruction){
    var field = wrap.dataset.refine;
    var slide = state.slides[state.activeIndex];
    var status = wrap.querySelector('.refinestatus');
    if(!String(slide[field]||'').trim()){ status.textContent = 'Nothing there to rewrite yet.'; status.className = 'refinestatus bad'; return; }
    wrap.classList.add('busy');
    status.textContent = 'Rewriting…'; status.className = 'refinestatus busy';
    try{
      var res = await fetch('/api/refine', {method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({field: field, text: slide[field], instruction: instruction,
          voiceSample: state.brand.voice || '', audience: state.brand.audience || ''})});
      var data = await res.json();
      if(!res.ok) throw new Error(data && data.error ? data.error : 'request failed');
      slide[field] = data.text;
      saveLocal(); renderEditor(); updatePreview(); renderStrip();
      showToast('Rewrote the ' + field);
    }catch(err){
      status.textContent = 'Could not: '+((err && err.message) ? err.message : 'try again');
      status.className = 'refinestatus bad';
      wrap.classList.remove('busy');
    }
  }
  editorPanel.addEventListener('keydown', function(e){
    if(e.key!=='Enter') return;
    var input = e.target.closest('.refineinput'); if(!input) return;
    e.preventDefault();
    var v = input.value.trim(); if(!v) return;
    input.value = '';
    runRefine(input.closest('[data-refine]'), v);
  });
  editorPanel.addEventListener('click', function(e){
    var chip = e.target.closest('[data-refinechip]');
    if(chip){ runRefine(chip.closest('[data-refine]'), chip.dataset.refinechip); return; }
    var actBtn = e.target.closest('button[data-act]');
    if(actBtn){
      var slide = state.slides[state.activeIndex];
      if(actBtn.dataset.act==='genPhoto'){ generateImage('photo'); return; }
      if(actBtn.dataset.act==='genDesign'){ generateImage('design'); return; }
      if(actBtn.dataset.act==='removePhoto'){ delete slide.photo; delete slide.photoKind; delete slide.photoMode; }
      if(actBtn.dataset.act==='setPhotoMode') slide.photoMode = actBtn.dataset.val;
      if(actBtn.dataset.act==='photoAll'){
        state.slides.forEach(function(s){ s.photo = slide.photo; s.photoKind = slide.photoKind; });
        showToast('Used on every slide');
      }
      if(actBtn.dataset.act==='setGround'){ slide.ground = actBtn.dataset.val; slide.dark = slide.ground==='dark'; }
      if(actBtn.dataset.act==='setLayout') slide.layout = actBtn.dataset.val;
      if(actBtn.dataset.act==='setMotif') slide.motif = actBtn.dataset.val;
      if(actBtn.dataset.act==='setSize') slide.size = actBtn.dataset.val;
      saveLocal(); renderEditor(); updatePreview(); renderStrip();
      return;
    }
    var wrapBtn = e.target.closest('button[data-wrap]');
    if(wrapBtn){
      var ta = editorPanel.querySelector('textarea[data-field="'+wrapBtn.dataset.target+'"]');
      if(!ta) return;
      var start = ta.selectionStart, end = ta.selectionEnd, wrapper = wrapBtn.dataset.wrap;
      var val = ta.value, selected = val.slice(start,end) || 'text';
      ta.value = val.slice(0,start)+wrapper+selected+wrapper+val.slice(end);
      ta.dispatchEvent(new Event('input',{bubbles:true}));
      ta.focus();
      ta.selectionStart = start+wrapper.length;
      ta.selectionEnd = start+wrapper.length+selected.length;
    }
  });

  btnAddSlide.addEventListener('click', function(){
    var prev = state.slides[state.activeIndex];
    var fresh = blankSlideBase();
    if(prev){ fresh.dark = !prev.dark; fresh.kicker = prev.kicker; fresh.cite = prev.cite; }
    state.slides.splice(state.activeIndex+1, 0, fresh);
    state.activeIndex++;
    saveLocal(); renderAll();
  });
  btnDupSlide.addEventListener('click', function(){
    var clone = JSON.parse(JSON.stringify(state.slides[state.activeIndex]));
    state.slides.splice(state.activeIndex+1, 0, clone);
    state.activeIndex++;
    saveLocal(); renderAll();
  });
  btnMoveUp.addEventListener('click', function(){
    var i = state.activeIndex; if(i===0) return;
    var tmp = state.slides[i-1]; state.slides[i-1] = state.slides[i]; state.slides[i] = tmp;
    state.activeIndex--; saveLocal(); renderAll();
  });
  btnMoveDown.addEventListener('click', function(){
    var i = state.activeIndex; if(i>=state.slides.length-1) return;
    var tmp = state.slides[i+1]; state.slides[i+1] = state.slides[i]; state.slides[i] = tmp;
    state.activeIndex++; saveLocal(); renderAll();
  });

  function armConfirm(btn, action){
    var orig = btn.textContent, armed = false, timer = null;
    btn.addEventListener('click', function(){
      if(!armed){
        armed = true; btn.textContent = 'Click again to confirm';
        timer = setTimeout(function(){ armed=false; btn.textContent=orig; }, 2500);
        return;
      }
      clearTimeout(timer); armed = false; btn.textContent = orig; action();
    });
  }
  armConfirm(btnDelSlide, function(){
    if(state.slides.length<=1) return;
    state.slides.splice(state.activeIndex,1);
    state.activeIndex = Math.max(0, state.activeIndex-1);
    saveLocal(); renderAll();
  });
  function startNewPost(){
    state.slides = [blankSlideBase()]; state.activeIndex = 0; state.caption = ''; state.consented = false;
    state.drafted = false; state.messages = [];
    editDrawer.open = false; changePanel.hidden = true; btnChange.textContent = 'Change something';
    askInput.value = ''; setAskStatus('', '');
    saveLocal(); renderAll(); showStep('ask');
  }
  btnNewPost.addEventListener('click', startNewPost);
  btnSeeExample.addEventListener('click', function(){
    state.slides = exampleSlides(); state.activeIndex = 0; state.caption = exampleCaption(state.brand.disclaimer); state.consented = false;
    state.messages = [{role:'bot', text: EXAMPLE_INTRO}]; state.drafted = true;
    saveLocal(); renderAll(); showStep('review');
  });

  // the brand inputs live on three different screens now, so listen once at the top
  document.addEventListener('input', function(e){
    var el = e.target, key = el.dataset && el.dataset.brand; if(!key) return;
    state.brand[key] = el.value;
    if(key==='serif' || key==='sans') ensureGoogleFont(el.value);
    if(key!=='voice' && key!=='field' && key!=='audience') renderBrandPreview();
    if(key==='disclaimer'){
      // the footer note is a brand setting, so it follows every slide that has no real citation
      state.slides.forEach(function(s){ if(!s.citeIsReal) s.cite = el.value; });
      renderStrip();
    }
    saveLocal(); updatePreview(); renderStripSoon();
  });

  consentCheck.addEventListener('change', function(){
    state.consented = consentCheck.checked; saveLocal(); updateButtons();
    if(state.consented) prepareBlobs();
  });

  btnChange.addEventListener('click', function(){
    changePanel.hidden = !changePanel.hidden;
    btnChange.textContent = changePanel.hidden ? 'Change something' : 'Hide changes';
    if(!changePanel.hidden) chatInput.focus();
  });
  btnAnother.addEventListener('click', function(){ startNewPost(); });
  btnRemindWeekly.addEventListener('click', function(){
    var blob = new Blob([weeklyReminderIcs()], {type:'text/calendar'});
    saveBlob('weekly-post-reminder.ics', blob);
    showToast('Open the file to add it to your calendar');
  });

  btnCopyCaption.addEventListener('click', async function(){
    var text = state.caption || '';
    if(!text.trim()){ showToast('Nothing to copy yet'); return; }
    try{ await navigator.clipboard.writeText(text); showToast('Post copied. Paste it into LinkedIn.'); }
    catch(e){ captionOut.select(); showToast('Select the post and copy it manually'); }
  });
  captionText.addEventListener('input', function(){ state.caption = captionText.value; saveLocal(); });

  // ---------- the bot ----------
  function currentDraft(){
    var s0 = state.slides[0] || {};
    return {
      kicker: s0.kicker || '', cite: s0.cite || '', caption: state.caption || '',
      slides: state.slides.map(function(s){
        return {layout:layoutOf(s), ground:groundOf(s), anchor:anchorOf(s), align:alignOf(s), tag:s.tag||'',
          size:s.size||'md', swipe:!!s.swipe,
          statement:s.statement||'', sub:s.sub||'', body:s.body||'', learn:s.learn||''};
      })
    };
  }
  // Left alone, a model reaches for the same composition six times and the
  // carousel reads as a template. These are the compositions that render any
  // statement/sub/body slide safely, so one can be swapped in for another
  // without losing a word of what was written.
  var SWAPPABLE = ['statement','essay','band','numeral','frame','edge','duo','split','twocol','impact','sidebar'];
  // Does the citation line look like an actual source, or like a disclaimer the
  // model decided a professional slide "should" have?
  function looksLikeSource(t){
    return /\[\d{4}\]|\(\d{4}\)|\bv\b|\d{4}|·|https?:/i.test(String(t||''));
  }

  // Stock editorial furniture. Harmless inside a sentence; when one of these
  // IS the whole line, it is a heading the model reached for, not content.
  var DEAD_LABELS = /^(why it matters|learn this|the bottom line|key takeaway|takeaway|the point|in short|tl;?dr|the truth is|let that sink in|here is the thing|what this means|the lesson)\b[:.]?$/i;
  function isDeadLabel(t){ return DEAD_LABELS.test(String(t||'').trim()); }

  // ---- the art director pass ----
  // Everything here removes what a human designer would not have left in. It
  // never adds, never invents and never flattens a deliberate choice: an
  // unusual layout, a huge statement or a hard asymmetry all survive it.
  function artDirect(slides){
    var brandNote = (state.brand.disclaimer||'').trim();
    for(var i=0;i<slides.length;i++){
      var s = slides[i], last = i===slides.length-1;
      s.statement = typeset(s.statement);
      s.sub = typeset(s.sub);
      s.body = typeset(s.body);
      s.learn = typeset(s.learn);

      // a sub that restates the statement is filler, not hierarchy
      if(!hasWords(s.sub) || s.sub.toLowerCase()===s.statement.toLowerCase() || isDeadLabel(s.sub)) s.sub = '';
      if(isDeadLabel(s.kicker)) s.kicker = '';
      if(isDeadLabel(s.statement)) s.statement = '';
      // so is a pull-quote too short to carry a thought, or one that just
      // repeats the line above it
      if(!hasWords(s.learn) || s.learn.replace(/[^A-Za-z0-9]/g,'').length < 18 ||
         s.learn.toLowerCase()===s.statement.toLowerCase()) s.learn = '';
      // a footer note the author never asked for
      if(hasWords(s.cite) && !looksLikeSource(s.cite) && !brandNote) s.cite = '';
      // one drawn system per slide, not two
      if(HAS_FURNITURE[s.layout]) s.motif = 'none';
      // the label belongs at the start and the end, not stamped on all six
      if(!s.ownKicker && i>0 && !last) s.kicker = '';
      if(!hasWords(s.statement) && !hasWords(s.body) && !hasWords(s.sub)) s.drop = true;
    }
    return slides.filter(function(s){ return !s.drop; });
  }

  function diversify(slides){
    var lastGrounds = 0;
    for(var i=0;i<slides.length;i++){
      var s = slides[i];
      var prev = i>0 ? slides[i-1] : null;
      var prev2 = i>1 ? slides[i-2] : null;
      // no two neighbours share a composition
      if(prev && s.layout===prev.layout && SWAPPABLE.indexOf(s.layout)>=0){
        for(var k=0;k<SWAPPABLE.length;k++){
          var cand = SWAPPABLE[(i*3+k) % SWAPPABLE.length];
          if(cand!==prev.layout && (!prev2 || cand!==prev2.layout)){ s.layout = cand; break; }
        }
      }
      // and no three in a row on the same ground
      if(prev && prev2 && s.ground===prev.ground && prev.ground===prev2.ground){
        prev.ground = s.ground==='light' ? 'dark' : 'light';
        prev.dark = prev.ground==='dark';
      }
      if(s.layout==='numeral' && !s.tag) s.tag = String(i+1);
      // vary the vertical placement too, so even two statement slides sit
      // differently in the frame
      if(ANCHORS.indexOf(s.anchor)<0) s.anchor = ANCHORS[i % ANCHORS.length];
    }
    return slides;
  }

  function applyDraft(result, keepPhotos){
    var kicker = result.kicker || '';
    var realCite = (result.cite || '').trim();
    var cite = realCite || (state.brand.disclaimer || '');
    var old = state.slides;
    var slides = (result.slides || []).map(function(s, i){
      var ground = (s.ground==='dark' || s.ground==='accent' || s.ground==='light') ? s.ground : (s.dark ? 'dark' : 'light');
      var slide = { layout: LAYOUT_KEYS.indexOf(s.layout)>=0 ? s.layout : 'statement',
        motif: MOTIF_KEYS.indexOf(s.motif)>=0 ? s.motif : 'none',
        ground: ground, dark: ground==='dark', size: s.size==='lg'?'lg':'md', swipe: !!s.swipe,
        anchor: ANCHORS.indexOf(s.anchor)>=0 ? s.anchor : '',
        ownKicker: typeof s.kicker==='string' && s.kicker.trim() ? 1 : 0,
        align: s.align==='centre' ? 'centre' : 'left',
        tag: typeof s.tag==='string' ? s.tag.slice(0,3) : '',
        kicker: (typeof s.kicker==='string' && s.kicker.trim()) ? s.kicker.trim() : kicker,
        cite: cite, citeIsReal: !!realCite,
        statement: s.statement||'', sub: s.sub||'', body: s.body||'', learn: s.learn||'' };
      if(keepPhotos && old[i] && old[i].photo){ slide.photo = old[i].photo; slide.photoKind = old[i].photoKind; }
      return slide;
    });
    if(!slides.length) throw new Error('no slides came back');
    slides = artDirect(slides);
    if(!slides.length) throw new Error('no slides came back');
    diversify(slides);
    // remember the shape of this post so the next one can match it
    state.lastPattern = slides.map(function(s){ return {layout:s.layout, ground:s.ground}; });
    state.slides = slides; state.activeIndex = 0;
    state.caption = typeof result.caption==='string' ? result.caption : '';
    state.consented = false;
    state.drafted = true;
    return slides.length;
  }
  // Brand DNA. Kept as the shape of the work, not the words, so the next post
  // is recognisably theirs without being a reprint.
  function rememberApproved(){
    if(!state.drafted || !state.slides.length) return;
    var sig = state.slides.map(function(s){ return layoutOf(s)+':'+groundOf(s); }).join('|');
    if(!Array.isArray(state.approved)) state.approved = [];
    if(state.approved.length && state.approved[state.approved.length-1].sig===sig) return;
    var words = state.slides.reduce(function(n,s){
      return n + String(s.statement||'').split(/\s+/).length + String(s.body||'').split(/\s+/).length; }, 0);
    state.approved.push({
      sig: sig,
      direction: state.brand.style || 'editorial',
      layouts: state.slides.map(layoutOf),
      grounds: state.slides.map(groundOf),
      note: state.slides.length + ' slides, about ' + Math.round(words/Math.max(state.slides.length,1)) +
            ' words a slide, ' + (state.slides.filter(function(s){ return alignOf(s)==='centre'; }).length ? 'some centred' : 'ranged left')
    });
    state.approved = state.approved.slice(-8);
    saveLocal();
  }

  function setAskStatus(msg, kind){ askStatus.textContent = msg; askStatus.className = 'askstatus' + (kind ? ' '+kind : ''); }
  var sending = false;
  // fromAsk: a brand-new post from the big box. Otherwise a revision typed in the chat.
  async function sendDraft(text, fromAsk){
    if(!text || sending) return;
    sending = true;
    var revising = !fromAsk && state.drafted;
    if(fromAsk){ state.messages = []; state.drafted = false; }
    state.messages.push({role:'user', text:text});
    var pending = {role:'bot', text: revising ? 'On it.' : 'Drafting your post. Usually under a minute.', busy:true};
    state.messages.push(pending);
    saveLocal(); renderChat();
    btnSend.disabled = true; btnAsk.disabled = true;
    var askLabel = btnAsk.textContent;
    if(fromAsk){ btnAsk.textContent = 'Writing…'; setAskStatus('Drafting your post and slides. Usually under a minute.', 'busy'); }
    var ok = false;
    try{
      var payload = {topic:text, voiceSample: state.brand.voice || '', format: state.format==='poster' ? 'poster' : 'carousel',
        brand: {kind: brandKind(), name: state.brand.wordmark || '', field: state.brand.field || '',
          audience: state.brand.audience || '', hasDisclaimer: !!(state.brand.disclaimer||'').trim()}};
      if(revising) payload.current = currentDraft();
      if(fromAsk && state.sameAsLast && state.lastPattern && state.lastPattern.length) payload.pattern = state.lastPattern;
      if(Array.isArray(state.approved) && state.approved.length) payload.approved = state.approved.slice(-6);
      var res = await fetch('/api/draft', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      var data = await res.json();
      if(!res.ok) throw new Error(data && data.error ? data.error : 'request failed');
      var n = applyDraft(data.draft, revising);
      pending.text = revising
        ? 'Done. Have a look, then tell me the next change, or tick the box and save it.'
        : (n===1 ? 'Done. Your poster and your post are ready.' : 'Done. '+n+' slides and your post are ready.')+
          ' Read every line, then tell me what to change, or tick the box and save.';
      ok = true;
      editDrawer.open = false;
    }catch(err){
      var msg = 'Could not do that: '+((err && err.message) ? err.message : 'please try again')+'.';
      pending.text = msg; pending.error = true;
      if(fromAsk) setAskStatus(msg, 'bad');
    } finally {
      pending.busy = false;
      sending = false;
      btnSend.disabled = false; btnAsk.disabled = false; btnAsk.textContent = askLabel;
      saveLocal(); renderAll();
      if(ok){
        if(fromAsk){ askInput.value = ''; setAskStatus('', ''); showStep('review'); }
        showToast('Drafted. Check every fact before you post.');
      }
    }
  }
  function sendChat(){ var t = chatInput.value.trim(); if(!t) return; chatInput.value = ''; sendDraft(t, false); }
  function sendAsk(){
    var t = askInput.value.trim();
    if(!t){ setAskStatus('Type what you want to post about first.', 'bad'); askInput.focus(); return; }
    sendDraft(t, true);
  }
  btnSend.addEventListener('click', sendChat);
  // one tap for the notes people actually give a designer
  var directions = $('directions');
  if(directions) directions.addEventListener('click', function(e){
    var btn = e.target.closest('button[data-direction]');
    if(btn) sendDraft(btn.dataset.direction, false);
  });
  chatInput.addEventListener('keydown', function(e){
    if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendChat(); }
  });
  btnAsk.addEventListener('click', sendAsk);
  askInput.addEventListener('keydown', function(e){
    if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendAsk(); }
  });

  // ---------- export ----------
  // One shared off-screen stage, so renders are queued rather than overlapping.
  var renderQueue = Promise.resolve();
  function exportSlideBlob(index){
    var job = renderQueue.then(async function(){
      var html2canvas = (await import('html2canvas')).default;
      var slide = state.slides[index];
      exportStage.innerHTML = '';
      var canvas = buildCanvasEl(slide, state.brand);
      exportStage.appendChild(canvas);
      if(document.fonts && document.fonts.ready) await document.fonts.ready;
      var shot = await html2canvas(canvas, {width:1080, height:1350, windowWidth:1080, windowHeight:1350, scale:1, backgroundColor:null});
      exportStage.innerHTML = '';
      return new Promise(function(resolve){ shot.toBlob(function(blob){ resolve(blob); }, 'image/png'); });
    });
    renderQueue = job.catch(function(){});
    return job;
  }

  // iOS Safari only lets navigator.share run inside a fresh tap, so the PNGs
  // are rendered ahead of time (on consent) and the tap itself just hands the
  // cached files to the share sheet.
  var renderCache = {key:null, blobs:null, promise:null};
  function renderKey(){ return JSON.stringify({s:state.slides, b:state.brand}); }
  function prepareBlobs(){
    var key = renderKey();
    if(renderCache.key===key && renderCache.promise) return renderCache.promise;
    renderCache = {key:key, blobs:null, promise:null};
    setExportNote('Preparing your slides…');
    var p = (async function(){
      var blobs = [];
      for(var i=0;i<state.slides.length;i++) blobs.push(await exportSlideBlob(i));
      return blobs;
    })();
    renderCache.promise = p;
    p.then(function(blobs){
      if(renderCache.key===key){ renderCache.blobs = blobs; setExportNote(shareSupported ? 'Ready. Tap Save, then choose Save Image in the share sheet.' : ''); }
    }, function(){ if(renderCache.key===key) setExportNote('Could not prepare the slides, try again.'); });
    return p;
  }
  function setExportNote(msg){ exportNote.textContent = msg; }

  function makeFiles(blobs, indices){
    return indices.map(function(i){ return new File([blobs[i]], 'slide'+(i+1)+'.png', {type:'image/png'}); });
  }
  var shareSupported = (function(){
    try{
      if(!navigator.share || !navigator.canShare) return false;
      var probe = new File([new Blob(['x'], {type:'image/png'})], 'probe.png', {type:'image/png'});
      return navigator.canShare({files:[probe]}) && (navigator.maxTouchPoints > 0);
    }catch(e){ return false; }
  })();
  shareBar.hidden = !shareSupported;
  if(shareSupported){ downloadBar.classList.add('exportbar-secondary'); }

  async function shareSlides(indices){
    var blobs = renderCache.blobs;
    if(!blobs || renderCache.key!==renderKey()){
      setExportNote('Preparing your slides, tap again in a moment.');
      try{ await prepareBlobs(); }catch(e){ return; }
      blobs = renderCache.blobs;
      if(!blobs) return;
    }
    var files = makeFiles(blobs, indices);
    try{
      await navigator.share({files:files, title: files.length>1 ? 'Carousel' : 'Slide'});
      showToast(files.length>1 ? 'Sent to the share sheet. Save Image puts them in Photos.' : 'Sent to the share sheet.');
    }catch(e){
      if(e && e.name==='AbortError') return;
      if(e && e.name==='NotAllowedError'){ setExportNote('Ready now. Tap Save once more.'); return; }
      showToast('Sharing failed, use the download buttons instead');
    }
  }
  btnShareAll.addEventListener('click', function(){
    if(!state.consented) return;
    shareSlides(state.slides.map(function(_,i){ return i; }));
  });
  btnShareOne.addEventListener('click', function(){
    if(!state.consented) return;
    shareSlides([state.activeIndex]);
  });

  function saveBlob(filename, blob){
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
    showToast('Saved '+filename);
  }

  btnExportOne.addEventListener('click', async function(){
    if(!state.consented) return;
    btnExportOne.disabled = true; var label = btnExportOne.textContent; btnExportOne.textContent = 'Rendering…';
    try{ saveBlob('slide'+(state.activeIndex+1)+'.png', await exportSlideBlob(state.activeIndex)); }
    catch(e){ showToast('Export failed, try again'); }
    finally{ btnExportOne.disabled = !state.consented; btnExportOne.textContent = label; }
  });
  btnExportAll.addEventListener('click', async function(){
    if(!state.consented) return;
    btnExportAll.disabled = true; var label = btnExportAll.textContent;
    try{
      var JSZip = (await import('jszip')).default;
      var zip = new JSZip();
      for(var i=0;i<state.slides.length;i++){
        btnExportAll.textContent = 'Rendering '+(i+1)+' of '+state.slides.length+'…';
        zip.file('slide'+(i+1)+'.png', await exportSlideBlob(i));
      }
      if(state.caption) zip.file('post.txt', state.caption);
      btnExportAll.textContent = 'Zipping…';
      saveBlob('carousel.zip', await zip.generateAsync({type:'blob'}));
    }catch(e){ showToast('Export failed, try again'); }
    finally{ btnExportAll.disabled = !state.consented; btnExportAll.textContent = label; }
  });

  // ---------- init ----------
  var loaded = loadLocal();
  if(loaded && Array.isArray(loaded.slides) && loaded.slides.length){
    state = loaded;
    if(typeof state.activeIndex !== 'number') state.activeIndex = 0;
    if(!state.brand) state.brand = defaultBrand();
    if(state.brand.voice==null) state.brand.voice = '';
    if(KINDS.indexOf(state.brand.kind)<0) state.brand.kind = 'person';
    if(!state.brand.style) state.brand.style = 'editorial';
    if(typeof state.brand.field !== 'string') state.brand.field = '';
    if(typeof state.brand.role !== 'string') state.brand.role = '';
    if(typeof state.brand.audience !== 'string') state.brand.audience = '';
    if(typeof state.brand.disclaimer !== 'string') state.brand.disclaimer = '';
    state.setupDone = !!state.setupDone;
    state.sameAsLast = !!state.sameAsLast;
    if(!Array.isArray(state.lastPattern)) state.lastPattern = null;
    if(!Array.isArray(state.approved)) state.approved = [];
    if(typeof state.caption !== 'string') state.caption = '';
    state.consented = !!state.consented;
    state.drafted = !!state.drafted;
    if(!Array.isArray(state.messages)) state.messages = [];
    state.messages.forEach(function(m){ if(m.busy){ m.busy = false; m.error = true; m.text = 'That one did not finish. Send it again.'; } });
    if(state.format!=='poster') state.format = 'carousel';
    if(STEP_KEYS.indexOf(state.step)<0) state.step = state.setupDone ? 'ask' : 'you';
  } else {
    state = {slides: exampleSlides(), activeIndex: 0, brand: defaultBrand(), caption: exampleCaption(), consented: false,
      step: 'you', messages: [{role:'bot', text: EXAMPLE_INTRO}], drafted: false, format: 'carousel', setupDone: false};
  }
  ensureGoogleFont(state.brand.serif);
  ensureGoogleFont(state.brand.sans);
  syncFormat();
  renderAll();
  showStep(state.step);
  window.addEventListener('resize', function(){ if(state.step==='brand') renderBrandPreview(); });
}
