// @ts-nocheck
// Imperative studio logic, ported from the Claude-artifact prototype. Runs
// once against the DOM the page component renders. Kept as plain DOM code so
// the slide renderer stays byte-for-byte the same HTML/CSS the export
// rasterises, which is the whole point of the WYSIWYG preview.

function blankSlideBase(){
  return {dark:false, size:'md', kicker:'', statement:'', sub:'', body:'', learn:'', cite:'', swipe:false};
}

function defaultBrand(){
  return {cream:'#EDE7DC', navy:'#171D2B', accent:'#3A5697', wordmark:'LAWGISTICS', serif:'default', sans:'default', voice:''};
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

function exampleCaption(){
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
    "Brauer v Coburn Resources Pty Ltd [2026] FCA 1110.",
    "General information, not legal advice."
  ].join("\n\n");
}

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
    accent: accent, accentOnNavy: mixHex(accent, '#ffffff', .68)
  };
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
function mdInline(s){
  if(!s) return '';
  var t = smartQuotes(String(s));
  t = textEsc(t);
  t = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return t;
}

function slideInnerHtml(slide, brand){
  var sw = slide.swipe ? '<div class="swipe">swipe &rarr;</div>' : ('<div class="mark">'+mdInline(brand.wordmark||'')+'</div>');
  var paras = String(slide.body||'').split(/\n\s*\n/).map(function(p){return p.trim();}).filter(Boolean)
    .map(function(p){return '<p>'+mdInline(p)+'</p>';}).join('');
  var inner = '<div class="statement '+(slide.size||'md')+'">'+mdInline(slide.statement)+'</div>';
  if(slide.sub) inner += '<div class="sub">'+mdInline(slide.sub)+'</div>';
  if(paras) inner += '<div class="body">'+paras+'</div>';
  if(slide.learn) inner += '<div class="learn"><b>Learn this:</b> '+mdInline(slide.learn)+'</div>';
  var citeHtml = mdInline(slide.cite).replace(/\n/g,'<br>');
  return '<div class="page">'+
    '<div class="kicker">'+mdInline(slide.kicker)+'</div>'+
    inner+
    '<div class="foot"><div class="cite">'+citeHtml+'</div>'+sw+'</div>'+
    '</div>';
}
function buildCanvasEl(slide, brand){
  var div = document.createElement('div');
  div.className = 'slide-canvas' + (slide.dark ? ' dark' : '');
  div.innerHTML = slideInnerHtml(slide, brand);
  applyBrand(div, brand);
  return div;
}

var STEP_KEYS = ['brand','topic','review','export'];

export function initStudio(){
  var state = {slides: [], activeIndex: 0, brand: defaultBrand(), caption: '', consented: false, step: 'brand'};

  function loadLocal(){
    try{ var raw = localStorage.getItem('lgm_state_v1'); return raw ? JSON.parse(raw) : null; }catch(e){ return null; }
  }
  function saveLocal(){ try{ localStorage.setItem('lgm_state_v1', JSON.stringify(state)); }catch(e){} }

  var $ = function(id){ return document.getElementById(id); };
  var editorPanel = $('editorPanel'), previewHolder = $('previewHolder'), strip = $('strip'), stepBar = $('stepBar');
  var dotRow = $('dotRow'), exportStage = $('exportStage'), toast = $('toast');
  var btnAddSlide = $('btnAddSlide'), btnDupSlide = $('btnDupSlide'), btnDelSlide = $('btnDelSlide');
  var btnMoveUp = $('btnMoveUp'), btnMoveDown = $('btnMoveDown'), btnNew = $('btnNew'), btnLoadExample = $('btnLoadExample');
  var btnPrevSlide = $('btnPrevSlide'), btnNextSlide = $('btnNextSlide');
  var btnExportOne = $('btnExportOne'), btnExportAll = $('btnExportAll');
  var shareBar = $('shareBar'), downloadBar = $('downloadBar'), btnShareAll = $('btnShareAll'), btnShareOne = $('btnShareOne');
  var exportNote = $('exportNote');
  var aiPrompt = $('aiPrompt'), btnAiGenerate = $('btnAiGenerate'), aiStatus = $('aiStatus');
  var brandPanel = $('brandPanel'), btnResetBrand = $('btnResetBrand');
  var brandCream = $('brandCream'), brandNavy = $('brandNavy'), brandAccent = $('brandAccent');
  var brandWordmark = $('brandWordmark'), brandSerif = $('brandSerif'), brandSans = $('brandSans'), brandVoice = $('brandVoice');
  var captionPanel = $('captionPanel'), captionText = $('captionText'), btnCopyCaption = $('btnCopyCaption');
  var consentCheck = $('consentCheck');

  function previewWidth(){
    var frame = previewHolder.parentElement;
    var pad = parseFloat(getComputedStyle(frame).paddingLeft) || 0;
    var avail = frame.clientWidth - pad*2;
    return avail > 0 ? Math.min(340, avail) : 340;
  }
  var toastTimer = null;
  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 2600);
  }

  var STRIP_WIDTH = 96;
  function renderStrip(){
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
  }

  function showStep(name){
    if(STEP_KEYS.indexOf(name)<0) name = 'topic';
    state.step = name;
    var idx = STEP_KEYS.indexOf(name);
    document.querySelectorAll('.step').forEach(function(sec){
      sec.classList.toggle('active', sec.dataset.step===name);
    });
    stepBar.querySelectorAll('.stepbtn').forEach(function(b,i){
      b.classList.toggle('active', i===idx);
      b.classList.toggle('done', i<idx);
      if(i===idx) b.setAttribute('aria-current','step'); else b.removeAttribute('aria-current');
    });
    if(name==='export'){ renderStrip(); if(state.consented) prepareBlobs(); }
    if(name==='review') setTimeout(updatePreview, 0);
    saveLocal();
    window.scrollTo(0,0);
    if(name==='topic') setTimeout(function(){ aiPrompt.focus(); }, 0);
  }
  var resizeTimer = null;
  window.addEventListener('resize', function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function(){ if(state.step==='review') updatePreview(); }, 120);
  });

  function renderEditor(){
    var idx = state.activeIndex, total = state.slides.length, slide = state.slides[idx];
    editorPanel.innerHTML =
      '<p class="panel-title">Slide '+(idx+1)+' of '+total+'</p>'+
      '<div class="rowfields">'+
        '<div class="field"><label>Background</label>'+
          '<div class="segmented">'+
            '<button type="button" data-act="setDark" data-val="false" class="'+(!slide.dark?'active':'')+'">Light</button>'+
            '<button type="button" data-act="setDark" data-val="true" class="'+(slide.dark?'active':'')+'">Dark</button>'+
          '</div></div>'+
        '<div class="field"><label>Statement size</label>'+
          '<div class="segmented">'+
            '<button type="button" data-act="setSize" data-val="lg" class="'+(slide.size==='lg'?'active':'')+'">Large</button>'+
            '<button type="button" data-act="setSize" data-val="md" class="'+(slide.size==='md'?'active':'')+'">Medium</button>'+
          '</div></div>'+
      '</div>'+
      '<div class="field"><label>Series label / kicker</label>'+
        '<input type="text" data-field="kicker" value="'+attrEsc(slide.kicker)+'"></div>'+
      '<div class="field"><label>Statement <span class="hint">**bold** *italic*</span></label>'+
        '<div class="mdbar">'+
          '<button type="button" data-wrap="**" data-target="statement" title="Bold selection"><b>B</b></button>'+
          '<button type="button" data-wrap="*" data-target="statement" title="Italicise selection"><i>I</i></button>'+
        '</div>'+
        '<textarea data-field="statement" rows="3">'+textEsc(slide.statement)+'</textarea></div>'+
      '<div class="field"><label>Subline <span class="hint">optional, italic serif</span></label>'+
        '<textarea data-field="sub" rows="2">'+textEsc(slide.sub)+'</textarea></div>'+
      '<div class="field"><label>Body <span class="hint">optional, blank line = new paragraph</span></label>'+
        '<div class="mdbar">'+
          '<button type="button" data-wrap="**" data-target="body" title="Bold selection"><b>B</b></button>'+
          '<button type="button" data-wrap="*" data-target="body" title="Italicise selection"><i>I</i></button>'+
        '</div>'+
        '<textarea data-field="body" rows="4">'+textEsc(slide.body)+'</textarea></div>'+
      '<details class="morefields"'+((slide.learn||slide.cite||slide.swipe)?' open':'')+'>'+
        '<summary>More fields (learning line, citation, cover slide)</summary>'+
        '<div class="field"><label>"Learn this" pull-quote <span class="hint">optional</span></label>'+
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
    previewHolder.innerHTML = '';
    previewHolder.appendChild(wrap);
  }

  function renderDots(){
    dotRow.innerHTML = state.slides.map(function(s,i){
      return '<button type="button" class="dot'+(i===state.activeIndex?' active':'')+'" data-idx="'+i+'" aria-label="Slide '+(i+1)+'"></button>';
    }).join('');
  }

  function renderCaption(){
    if(state.caption){
      captionPanel.hidden = false;
      captionText.value = state.caption;
    } else {
      captionPanel.hidden = true;
    }
  }

  function updateButtons(){
    btnMoveUp.disabled = state.activeIndex===0;
    btnMoveDown.disabled = state.activeIndex===state.slides.length-1;
    btnPrevSlide.disabled = state.activeIndex===0;
    btnNextSlide.disabled = state.activeIndex===state.slides.length-1;
    btnDelSlide.disabled = state.slides.length<=1;
    consentCheck.checked = !!state.consented;
    btnExportOne.disabled = !state.consented;
    btnExportAll.disabled = !state.consented;
    btnShareAll.disabled = !state.consented;
    btnShareOne.disabled = !state.consented;
  }

  function syncBrandFields(){
    brandCream.value = state.brand.cream;
    brandNavy.value = state.brand.navy;
    brandAccent.value = state.brand.accent;
    brandWordmark.value = state.brand.wordmark;
    brandSerif.value = state.brand.serif;
    brandSans.value = state.brand.sans;
    brandVoice.value = state.brand.voice || '';
  }

  function renderAll(){
    if(state.activeIndex>=state.slides.length) state.activeIndex = state.slides.length-1;
    if(state.activeIndex<0) state.activeIndex = 0;
    renderEditor();
    syncBrandFields();
    updatePreview();
    renderDots();
    renderCaption();
    updateButtons();
    if(state.step==='export') renderStrip();
  }
  function select(i){ state.activeIndex = i; renderAll(); }

  dotRow.addEventListener('click', function(e){
    var d = e.target.closest('.dot'); if(!d) return; select(+d.dataset.idx);
  });
  strip.addEventListener('click', function(e){
    var item = e.target.closest('.stripitem'); if(!item) return;
    select(+item.dataset.idx); showStep('review');
  });
  btnPrevSlide.addEventListener('click', function(){ if(state.activeIndex>0) select(state.activeIndex-1); });
  btnNextSlide.addEventListener('click', function(){ if(state.activeIndex<state.slides.length-1) select(state.activeIndex+1); });
  stepBar.addEventListener('click', function(e){
    var b = e.target.closest('.stepbtn'); if(!b) return; showStep(b.dataset.step);
  });
  document.addEventListener('click', function(e){
    var go = e.target.closest('[data-go]'); if(!go) return; showStep(go.dataset.go);
  });

  editorPanel.addEventListener('input', function(e){
    var el = e.target, field = el.dataset.field; if(!field) return;
    var slide = state.slides[state.activeIndex];
    slide[field] = (el.type==='checkbox') ? el.checked : el.value;
    saveLocal(); updatePreview();
  });
  editorPanel.addEventListener('click', function(e){
    var actBtn = e.target.closest('button[data-act]');
    if(actBtn){
      var slide = state.slides[state.activeIndex];
      if(actBtn.dataset.act==='setDark') slide.dark = actBtn.dataset.val==='true';
      if(actBtn.dataset.act==='setSize') slide.size = actBtn.dataset.val;
      saveLocal(); renderEditor(); updatePreview();
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
  armConfirm(btnNew, function(){
    state.slides = [blankSlideBase()]; state.activeIndex = 0; state.caption = ''; state.consented = false;
    saveLocal(); renderAll(); showStep('review');
  });
  armConfirm(btnLoadExample, function(){
    state.slides = exampleSlides(); state.activeIndex = 0; state.caption = exampleCaption(); state.consented = false;
    saveLocal(); renderAll(); showStep('review');
    showToast('Loaded the example');
  });

  btnResetBrand.addEventListener('click', function(){
    var voice = state.brand.voice;
    state.brand = defaultBrand(); state.brand.voice = voice;
    syncBrandFields(); saveLocal(); updatePreview();
  });
  brandPanel.addEventListener('input', function(e){
    var el = e.target, key = el.dataset.brand; if(!key) return;
    state.brand[key] = el.value;
    if(key==='serif' || key==='sans') ensureGoogleFont(el.value);
    saveLocal(); updatePreview();
  });

  consentCheck.addEventListener('change', function(){
    state.consented = consentCheck.checked; saveLocal(); updateButtons();
    if(state.consented) prepareBlobs();
  });

  btnCopyCaption.addEventListener('click', async function(){
    try{ await navigator.clipboard.writeText(captionText.value); showToast('Caption copied'); }
    catch(e){ showToast('Select the caption and copy it manually'); }
  });
  captionText.addEventListener('input', function(){ state.caption = captionText.value; saveLocal(); });

  // ---------- AI drafting ----------
  function setAiStatus(msg, kind){
    aiStatus.textContent = msg;
    aiStatus.className = 'aistatus' + (kind ? ' '+kind : '');
  }
  btnAiGenerate.addEventListener('click', async function(){
    var topic = aiPrompt.value.trim();
    if(!topic){ setAiStatus('Type what you want to post about first.', 'bad'); aiPrompt.focus(); return; }
    btnAiGenerate.disabled = true;
    var label = btnAiGenerate.textContent; btnAiGenerate.textContent = 'Drafting…';
    setAiStatus('Drafting. Usually under a minute.', 'busy');
    try{
      var res = await fetch('/api/draft', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({topic: topic, voiceSample: state.brand.voice || ''})
      });
      var data = await res.json();
      if(!res.ok) throw new Error(data && data.error ? data.error : 'request failed');
      var result = data.draft;
      var kicker = result.kicker || '', cite = result.cite || '';
      var slides = (result.slides || []).map(function(s){
        return { dark: !!s.dark, size: s.size==='lg'?'lg':'md', swipe: !!s.swipe, kicker: kicker, cite: cite,
          statement: s.statement||'', sub: s.sub||'', body: s.body||'', learn: s.learn||'' };
      });
      if(!slides.length) throw new Error('no slides came back');
      state.slides = slides; state.activeIndex = 0;
      state.caption = result.caption || '';
      state.consented = false;
      saveLocal(); renderAll();
      setAiStatus('Drafted '+slides.length+' slides and a caption.', '');
      showStep('review');
      showToast('Drafted '+slides.length+' slides. Check every fact before you post.');
    }catch(err){
      setAiStatus('Could not draft that: '+((err && err.message) ? err.message : 'please try again'), 'bad');
    } finally {
      btnAiGenerate.disabled = false;
      btnAiGenerate.textContent = label;
    }
  });
  aiPrompt.addEventListener('keydown', function(e){
    if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); btnAiGenerate.click(); }
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
  // are rendered ahead of time (on consent / entering the Download step) and
  // the tap itself just hands the cached files to the share sheet.
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
      if(state.caption) zip.file('caption.txt', state.caption);
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
    if(typeof state.caption !== 'string') state.caption = '';
    state.consented = !!state.consented;
    if(STEP_KEYS.indexOf(state.step)<0) state.step = 'topic';
  } else {
    state = {slides: exampleSlides(), activeIndex: 0, brand: defaultBrand(), caption: exampleCaption(), consented: false, step: 'brand'};
  }
  ensureGoogleFont(state.brand.serif);
  ensureGoogleFont(state.brand.sans);
  renderAll();
  showStep(state.step);
}
