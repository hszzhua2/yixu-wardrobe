/* 衣序 · Buildless, offline-first wardrobe. No external runtime dependencies. */
(() => {
  'use strict';
  const STORAGE_KEY = 'yixu.public.wardrobe.v1';
  const TYPES = {unknown:'待细分',top:'上装',bottom:'下装',outer:'外套',dress:'连衣裙',shoes:'鞋履',bag:'包袋',accessory:'配饰',underwear:'内衣 / 家居'};
  const SEASONS = ['春','夏','秋','冬'];
  const STATUS = {active:'在衣柜',idle:'闲置',laundry:'待洗护'};
  const paths = {
    hanger:'M8 7a4 4 0 1 1 5 4v3l8 5c1 .7.5 2-1 2H4c-1.5 0-2-1.3-1-2l9-6',
    home:'m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8',
    wardrobe:'M4 3h16v18H4zM12 3v18M9 11v3m6-3v3',
    heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
    data:'M4 6c0-4 16-4 16 0s-16 4-16 0Zm0 0v6c0 4 16 4 16 0V6M4 12v6c0 4 16 4 16 0v-6',
    plus:'M12 5v14M5 12h14',close:'m6 6 12 12M18 6 6 18',search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
    arrow:'M4 12h16m-6-6 6 6-6 6',back:'M20 12H4m6-6-6 6 6 6',down:'m6 9 6 6 6-6',
    edit:'m15 4 5 5M3 21l5-1L21 7a3.5 3.5 0 0 0-5-5L3 16z',trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
    grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',list:'M9 5h12M9 12h12M9 19h12M3 5h1m-1 7h1m-1 7h1',
    check:'m5 12 4 4L19 6',shuffle:'m3 4 18 16m-5 0h5v-5M3 20l7-7m4-4 7-5m-5 0h5v5',
    save:'M4 3h14l3 3v15H3V3h1Zm3 0v7h10V3M7 21v-7h10v7',download:'M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5',
    upload:'M12 16V3m-5 5 5-5 5 5M3 16v5h18v-5',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
    tag:'M3 3h8l10 10-8 8L3 11V3Zm4 4h.01',move:'M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4m12-8 4 4-4 4',
    menu:'M4 6h16M4 12h16M4 18h16',image:'M3 3h18v18H3zM3 16l6-6 6 6 3-3 3 3M16 7h.01',
    spark:'m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z',info:'M12 11v6m0-10h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',undo:'M3 10h11a6 6 0 0 1 0 12M3 10l6-6m-6 6 6 6',calendar:'M4 5h16v16H4zM8 2v6m8-6v6M4 11h16',copy:'M8 8h13v13H8zM16 8V3H3v13h5'
  };
  const icon = (name, cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.hanger}"/></svg>`;
  const $ = (s,r=document) => r.querySelector(s);
  const $$ = (s,r=document) => [...r.querySelectorAll(s)];
  const esc = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => globalThis.crypto?.randomUUID?.() || `yx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
  const clone = v => JSON.parse(JSON.stringify(v));
  const seed = window.WARDROBE_SEED || {items:[],categories:[],source:{filename:'通用示例衣柜',demo:true}};
  function starterDraft(){
    return [{code:'OT-001',x:8,y:12,w:42},{code:'BT-001',x:45,y:32,w:36},{code:'BG-001',x:62,y:9,w:25}].map(p=>{const i=seed.items.find(i=>i.code===p.code);return i?{uid:uid(),itemId:i.id,x:p.x,y:p.y,w:p.w}:null;}).filter(Boolean);
  }
  const freshState = () => ({version:1,items:clone(seed.items),categories:clone(seed.categories),source:clone(seed.source),outfits:[],draft:starterDraft(),updatedAt:new Date().toISOString()});
  let storageAvailable=true, initialMessage='', state;
  try {
    const raw=localStorage.getItem(STORAGE_KEY);
    state=raw ? normalizeBackup(JSON.parse(raw)) : freshState();
  } catch(e) {
    state=freshState();
    storageAvailable=!(e instanceof SyntaxError || /备份|编号|分类|衣物|搭配|重复/.test(e.message));
    initialMessage=storageAvailable?'之前保存的数据无法读取，当前显示内置示例。可在数据页恢复备份。':'浏览器暂时不允许本地保存，当前可继续使用，请及时导出备份。';
  }
  let page='home', filters={category:'all',season:'all',status:'all',search:'',type:'all',favorites:false},sort='manual',view='grid';
  let multi=false, selected=new Set(), pickCategory='all',pickSearch='',pickSeason='all', activeOutfitId=null, outfitQuery='';
  let modalCleanup=null, modalReturnFocus=null, dragItemId=null, undoSnapshot=null, toastTimer;

  function safeImage(v) {
    if(!v)return '';
    if(typeof v!=='string'||v.length>2500000)throw Error('衣物图片过大或格式不正确');
    if(/^assets\/items\/[a-zA-Z0-9_.-]+\.(svg|webp|png|jpe?g|gif)$/i.test(v)||/^data:image\/(png|jpe?g|webp|gif);base64,[a-zA-Z0-9+/=]+$/i.test(v))return v;
    throw Error('衣物图片格式不受支持');
  }
  function normalizeBackup(raw) {
    if(!raw||raw.version!==1||!Array.isArray(raw.items)||!Array.isArray(raw.categories)||!Array.isArray(raw.outfits))throw Error('备份格式不正确，请选择衣序导出的 JSON 文件');
    if(raw.items.length>10000||raw.categories.length>100||raw.outfits.length>3000)throw Error('备份数据量过大');
    const text=(v,n=500)=>String(v??'').trim().slice(0,n);
    const cats=raw.categories.map(c=>({id:text(c.id,100),name:text(c.name,40),location:text(c.location,80)}));
    if(cats.some(c=>!c.id||!c.name)||new Set(cats.map(c=>c.id)).size!==cats.length||new Set(cats.map(c=>c.name)).size!==cats.length)throw Error('分类存在空值或重复');
    const catIds=new Set(cats.map(c=>c.id)), itemIds=new Set(), codes=new Set();
    const items=raw.items.map(i=>{
      const id=text(i.id,100),code=text(i.code,60),name=text(i.name,100);
      if(!id||!code||!name||itemIds.has(id)||codes.has(code.toLowerCase())||!catIds.has(i.categoryId))throw Error('衣物存在空值、重复编号或无效分类');
      itemIds.add(id); codes.add(code.toLowerCase());
      return {id,code,name,categoryId:i.categoryId,type:Object.hasOwn(TYPES,i.type)?i.type:'unknown',seasons:Array.isArray(i.seasons)?SEASONS.filter(s=>i.seasons.includes(s)):[],status:Object.hasOwn(STATUS,i.status)?i.status:'active',color:text(i.color,40),location:text(i.location,80),note:text(i.note,2000),image:safeImage(i.image),favorite:!!i.favorite,wearCount:Math.max(0,Math.min(99999,Number(i.wearCount)||0)),sourceSheet:text(i.sourceSheet,80),sourceCell:text(i.sourceCell,30)};
    });
    const layout=(arr)=>Array.isArray(arr)?arr.filter(p=>p&&itemIds.has(p.itemId)).slice(0,12).map(p=>({uid:text(p.uid,100)||uid(),itemId:p.itemId,x:Math.max(0,Math.min(78,Number(p.x)||0)),y:Math.max(0,Math.min(78,Number(p.y)||0)),w:Math.max(14,Math.min(60,Number(p.w)||32))})).filter((p,idx,a)=>a.findIndex(x=>x.itemId===p.itemId)===idx):[];
    const outfits=raw.outfits.map(o=>({id:text(o.id,100)||uid(),name:text(o.name,80)||'未命名搭配',occasion:text(o.occasion,40)||'日常',note:text(o.note,1000),pieces:layout(o.pieces),createdAt:text(o.createdAt,40)||new Date().toISOString(),updatedAt:text(o.updatedAt,40),wearCount:Math.max(0,Number(o.wearCount)||0)}));
    if(new Set(outfits.map(o=>o.id)).size!==outfits.length)throw Error('搭配标识重复');
    return {version:1,items,categories:cats,outfits,draft:layout(raw.draft),source:raw.source&&typeof raw.source==='object'?clone(raw.source):clone(seed.source),updatedAt:text(raw.updatedAt,40)};
  }
  function persist(next) {
    next.updatedAt=new Date().toISOString();
    if(storageAvailable){
      try {localStorage.setItem(STORAGE_KEY,JSON.stringify(next));}
      catch(e){toast('保存空间不足，修改尚未保存。请压缩照片或先导出备份。');return false;}
    }
    state=next;
    $('#storage-state').textContent=storageAvailable?'已保存在此浏览器':'临时使用 · 请导出备份';
    return true;
  }
  function mutate(fn,renderNow=true){const next=clone(state);fn(next);if(!persist(next))return false;if(renderNow)render();return true;}
  const itemById = id => state.items.find(i=>i.id===id);
  const categoryName = id => state.categories.find(c=>c.id===id)?.name||'未分类';
  function placeholder(item){return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#edeae2"/><g fill="none" stroke="#b7afa0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M136 100a17 17 0 1 1 24 15v19l72 52c7 5 3 13-5 13H73c-8 0-12-8-5-13l85-59"/></g><text x="150" y="246" text-anchor="middle" fill="#928b7d" font-family="sans-serif" font-size="14">暂未添加照片</text></svg>`)}`;}
  const itemImage = (i,cls='',lazy=true) => `<img class="${cls}" src="${esc(i.image||placeholder(i))}" alt="${esc(i.name)}" ${lazy?'loading="lazy"':''} draggable="false">`;
  function toast(message,action,label='撤销'){
    clearTimeout(toastTimer);const host=$('#toast-region');host.innerHTML=`<div class="toast">${icon('check')}<span>${esc(message)}</span>${action?`<button class="toast-action">${esc(label)}</button>`:''}<button class="icon-button toast-close" aria-label="关闭提示">${icon('close')}</button></div>`;
    $('.toast-close',host).onclick=()=>host.innerHTML='';if(action)$('.toast-action',host).onclick=()=>{action();host.innerHTML='';};toastTimer=setTimeout(()=>host.innerHTML='',action?12000:5000);
  }
  function route(){const hash=location.hash.slice(1).split('?')[0];page=['home','wardrobe','outfits','data'].includes(hash)?hash:'home';selected.clear();multi=false;closeModal();render();window.scrollTo(0,0);$('#sidebar').classList.remove('open');}
  function navigate(p){if(location.hash===`#${p}`){page=p;render();window.scrollTo(0,0);}else location.hash=p;}
  function renderNav(){
    $('#main-nav').innerHTML=[['home','home','今日搭配'],['wardrobe','wardrobe','我的衣柜'],['outfits','heart','搭配收藏'],['data','data','数据与备份']].map(([p,i,n])=>`<a class="nav-link ${page===p?'active':''}" href="#${p}">${icon(i)}<span>${n}</span>${p==='wardrobe'?`<span class="nav-count">${state.items.length}</span>`:p==='outfits'&&state.outfits.length?`<span class="nav-count">${state.outfits.length}</span>`:''}</a>`).join('');
    $('#category-nav').innerHTML=state.categories.map((c,idx)=>`<button class="category-link ${page==='wardrobe'&&filters.category===c.id?'active':''}" data-category="${esc(c.id)}"><span class="category-dot" style="--category-color:${['#bca68a','#a9b69c','#c69373','#9ca8b7','#b8a8b6'][idx%5]}"></span><span>${esc(c.name)}</span><span class="count">${state.items.filter(i=>i.categoryId===c.id).length}</span></button>`).join('');
    $$('.category-link').forEach(el=>{
      el.onclick=()=>{filters={...filters,category:el.dataset.category,search:'',season:'all',type:'all',status:'all',favorites:false};selected.clear();navigate('wardrobe');};
      el.ondragover=e=>{if(dragItemId){e.preventDefault();el.classList.add('drop-target');}};el.ondragleave=()=>el.classList.remove('drop-target');
      el.ondrop=e=>{e.preventDefault();el.classList.remove('drop-target');if(dragItemId){const id=dragItemId;mutate(n=>n.items.find(i=>i.id===id).categoryId=el.dataset.category);dragItemId=null;toast('已移动到此分类');}};
    });
    $('#storage-state').textContent=storageAvailable?'已保存在此浏览器':'临时使用 · 请导出备份';
  }
  function render(){renderNav();({home:renderHome,wardrobe:renderWardrobe,outfits:renderOutfits,data:renderData}[page])();}
  function dateLabel(){return new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'long'}).format(new Date());}
  function homePieces(){return state.draft.map(p=>({...p,item:itemById(p.itemId)})).filter(p=>p.item);}
  function renderHome(){
    const active=state.items.filter(i=>i.status==='active').length;
    $('#app').innerHTML=`<header class="page-header"><div class="eyebrow">YOUR EVERYDAY, REIMAGINED</div><span class="date-pill">${icon('calendar')}${esc(dateLabel())}</span></header>
      <section class="hero"><div class="hero-copy"><h1>穿得自在，<br>从认识自己的衣柜开始。</h1><p>让被遗忘的衣物重新出场，让日常多一些灵感。</p></div><div class="hero-mark" aria-hidden="true">✳</div></section>
      <div class="stats-row"><button class="stat-card" data-go="wardrobe"><span class="stat-icon">${icon('wardrobe')}</span><span><strong class="stat-value">${state.items.length}<small>件</small></strong><span class="stat-label">衣物与物品</span></span>${icon('arrow')}</button><button class="stat-card" id="home-category-stat"><span class="stat-icon">${icon('tag')}</span><span><strong class="stat-value">${state.categories.length}<small>类</small></strong><span class="stat-label">各有归处</span></span>${icon('arrow')}</button><button class="stat-card" data-go="outfits"><span class="stat-icon">${icon('heart')}</span><span><strong class="stat-value">${state.outfits.length}<small>套</small></strong><span class="stat-label">喜欢的搭配</span></span>${icon('arrow')}</button></div>
      <div class="section-heading"><div><span class="eyebrow">A LITTLE INSPIRATION</span><h2>今天，想怎么穿？</h2></div><span class="help-text">从右侧挑选衣物，组合你的风格</span></div>
      <div class="home-layout"><section class="panel canvas-panel"><div class="panel-header"><div><span class="panel-title">我的搭配画布</span><span class="badge">${homePieces().length} 件单品</span></div><div class="canvas-tools"><button class="btn ghost small" id="clear-board">清空</button><button class="btn secondary small" id="shuffle-outfit">${icon('shuffle')}换一套灵感</button></div></div><div class="outfit-canvas" id="outfit-canvas" aria-label="搭配画布，衣物可拖动调整位置"><span class="canvas-label">DAILY COMPOSITION <span>NO. ${String(state.outfits.length+1).padStart(3,'0')}</span></span>${renderCanvasPieces()}${homePieces().length?'':`<div class="canvas-empty">${icon('hanger')}<h3>每一种风格，都由你定义。</h3><p>点击右侧衣物，或拖动到这里<br>也可以让衣柜带来一点随机灵感</p><button class="btn primary" id="first-shuffle">${icon('spark')}为我选一套</button></div>`}<span class="canvas-watermark">a style of your own.</span></div><div class="canvas-bottom"><span class="help-text">${icon('move')}拖动调整位置 · 点击单品调整大小</span><button class="btn primary" id="save-outfit">${icon('save')}${activeOutfitId?'保存修改':'收藏这套搭配'}</button></div></section>
      <section class="panel picker-panel"><div class="panel-header"><div><span class="panel-title">从衣柜挑选</span><span class="badge">${active} 件可搭配</span></div><button class="icon-button" id="picker-add" title="添加衣物" aria-label="添加衣物">${icon('plus')}</button></div><div class="picker-tools"><label class="search-input">${icon('search')}<input id="picker-search" placeholder="搜索名称、编号…" value="${esc(pickSearch)}" aria-label="搜索搭配衣物"></label><div class="filter-row picker-categories" id="picker-categories">${pickerChips()}</div><div class="picker-filter-line"><span>只显示在衣柜的衣物</span><select class="select-field small" id="picker-season" aria-label="搭配季节"><option value="all">所有季节</option>${SEASONS.map(s=>`<option ${pickSeason===s?'selected':''} value="${s}">${s}季</option>`).join('')}</select></div></div><div class="picker-grid" id="picker-grid">${pickerItems()}</div><div class="picker-footer"><button class="text-button" id="go-wardrobe">打开我的衣柜 ${icon('arrow')}</button></div></section></div>
      <div class="gentle-note">${icon('info')}<p>当前内置衣物与插画均为通用示例，可自由修改或删除。添加自己的衣物，慢慢整理出属于你的日常风格。</p></div>`;
    $$('[data-go]').forEach(b=>b.onclick=()=>navigate(b.dataset.go));$('#home-category-stat').onclick=categoryModal;
    $('#picker-add').onclick=()=>itemModal();$('#go-wardrobe').onclick=()=>{filters.category='all';navigate('wardrobe');};
    $('#shuffle-outfit').onclick=shuffleOutfit;$('#first-shuffle')?.addEventListener('click',shuffleOutfit);$('#clear-board').onclick=()=>{if(mutate(n=>n.draft=[])){activeOutfitId=null;toast('已清空画布');}};
    $('#save-outfit').onclick=saveOutfitModal;
    $('#picker-search').oninput=e=>{pickSearch=e.target.value;renderPickerGrid();};
    $('#picker-season').onchange=e=>{pickSeason=e.target.value;renderPickerGrid();};
    $$('#picker-categories [data-pickcat]').forEach(b=>b.onclick=()=>{pickCategory=b.dataset.pickcat;$('#picker-categories').innerHTML=pickerChips();bindPickerChips();renderPickerGrid();});
    bindPickerItems();bindCanvas();
  }
  function pickerChips(){return [{id:'all',name:'全部'},...state.categories].map(c=>`<button class="chip ${pickCategory===c.id?'active':''}" data-pickcat="${esc(c.id)}">${esc(c.name)}</button>`).join('');}
  function bindPickerChips(){$$('#picker-categories [data-pickcat]').forEach(b=>b.onclick=()=>{pickCategory=b.dataset.pickcat;$('#picker-categories').innerHTML=pickerChips();bindPickerChips();renderPickerGrid();});}
  function pickResults(){const q=pickSearch.trim().toLowerCase();return state.items.filter(i=>i.status==='active'&&(pickCategory==='all'||i.categoryId===pickCategory)&&(pickSeason==='all'||!i.seasons.length||i.seasons.includes(pickSeason))&&(!q||[i.name,i.code,i.note,categoryName(i.categoryId)].join(' ').toLowerCase().includes(q)));}
  function pickerItems(){const items=pickResults(),onBoard=new Set(state.draft.map(p=>p.itemId));return items.length?items.map(i=>`<button class="mini-item ${onBoard.has(i.id)?'on-board':''}" data-pick="${esc(i.id)}" draggable="true" title="${esc(i.name)} · ${onBoard.has(i.id)?'已在画布':'点击添加到搭配'}" aria-label="${esc(i.code)} ${onBoard.has(i.id)?'已在画布':'添加到搭配'}"><div class="mini-visual">${itemImage(i)}<span class="mini-add">${icon(onBoard.has(i.id)?'check':'plus')}</span></div><span class="mini-code">${esc(i.code)}</span></button>`).join(''):`<div class="empty-state compact">${icon('search')}<p>没有找到合适的衣物</p><small>试试其他分类或搜索词</small></div>`;}
  function renderPickerGrid(){$('#picker-grid').innerHTML=pickerItems();bindPickerItems();}
  function bindPickerItems(){$$('[data-pick]').forEach(el=>{el.onclick=()=>addToBoard(el.dataset.pick);el.ondragstart=e=>{dragItemId=el.dataset.pick;e.dataTransfer.setData('text/plain',dragItemId);e.dataTransfer.effectAllowed='copy';};el.ondragend=()=>dragItemId=null;});}
  function renderCanvasPieces(){return homePieces().map(p=>`<div class="canvas-item" tabindex="0" role="group" aria-label="${esc(p.item.name)}，方向键移动，删除键移除" data-piece="${esc(p.uid)}" style="left:${p.x}%;top:${p.y}%;--item-w:${p.w}%;width:${p.w}%"><button class="canvas-remove icon-button" data-remove-piece="${esc(p.uid)}" aria-label="移除 ${esc(p.item.code)}">${icon('close')}</button>${itemImage(p.item,'',false)}<span class="canvas-item-code">${esc(p.item.code)}</span><div class="piece-size"><button data-resize="-1" aria-label="缩小衣物">−</button><button data-resize="1" aria-label="放大衣物">+</button></div></div>`).join('');}
  function addToBoard(id,pos){
    const item=itemById(id);if(!item)return;if(state.draft.some(p=>p.itemId===id)){toast('这件衣物已经在画布上');return;}if(state.draft.length>=12){toast('一套搭配最多添加 12 件单品');return;}
    const k=state.draft.length,defaults=[{x:10,y:13,w:35},{x:45,y:37,w:35},{x:58,y:7,w:26},{x:8,y:58,w:29},{x:40,y:8,w:30}];
    mutate(n=>n.draft.push({uid:uid(),itemId:id,...defaults[k%defaults.length],...(pos||{})}));
  }
  function bindCanvas(){
    const canvas=$('#outfit-canvas');canvas.ondragover=e=>{e.preventDefault();canvas.classList.add('drag-over');};canvas.ondragleave=()=>canvas.classList.remove('drag-over');canvas.ondrop=e=>{e.preventDefault();canvas.classList.remove('drag-over');const id=e.dataTransfer.getData('text/plain');const rect=canvas.getBoundingClientRect();addToBoard(id,{x:Math.max(0,Math.min(68,(e.clientX-rect.left)/rect.width*100-15)),y:Math.max(5,Math.min(66,(e.clientY-rect.top)/rect.height*100-15)),w:32});dragItemId=null;};
    $$('[data-remove-piece]').forEach(b=>b.onclick=()=>mutate(n=>n.draft=n.draft.filter(p=>p.uid!==b.dataset.removePiece)));
    $$('.canvas-item').forEach(el=>{
      el.onpointerdown=e=>{
        if(e.target.closest('button'))return;e.preventDefault();$$('.canvas-item').forEach(n=>n.classList.remove('active'));el.classList.add('active');el.focus({preventScroll:true});
        const piece=state.draft.find(p=>p.uid===el.dataset.piece),rect=canvas.getBoundingClientRect(),start={x:e.clientX,y:e.clientY,left:piece.x,top:piece.y};el.setPointerCapture(e.pointerId);let x=piece.x,y=piece.y;
        el.onpointermove=ev=>{x=Math.max(0,Math.min(100-piece.w,start.left+(ev.clientX-start.x)/rect.width*100));y=Math.max(4,Math.min(78,start.top+(ev.clientY-start.y)/rect.height*100));el.style.left=`${x}%`;el.style.top=`${y}%`;};
        const finish=()=>{el.onpointermove=null;el.onpointerup=null;el.onpointercancel=null;mutate(n=>{const p=n.draft.find(p=>p.uid===piece.uid);p.x=x;p.y=y;},false);};el.onpointerup=finish;el.onpointercancel=finish;
      };
      el.onkeydown=e=>{const dir={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]}[e.key];if(dir){e.preventDefault();mutate(n=>{const p=n.draft.find(p=>p.uid===el.dataset.piece);p.x=Math.max(0,Math.min(100-p.w,p.x+dir[0]));p.y=Math.max(4,Math.min(78,p.y+dir[1]));});$(`[data-piece="${el.dataset.piece}"]`)?.focus();}if(e.key==='Delete'){e.preventDefault();mutate(n=>n.draft=n.draft.filter(p=>p.uid!==el.dataset.piece));}};
      $$('[data-resize]',el).forEach(b=>b.onclick=()=>{mutate(n=>{const p=n.draft.find(p=>p.uid===el.dataset.piece);p.w=Math.max(14,Math.min(55,p.w+Number(b.dataset.resize)*4));p.x=Math.min(p.x,100-p.w);});$(`[data-piece="${el.dataset.piece}"]`)?.classList.add('active');});
    });
  }
  function shuffleOutfit(){
    let pool=state.items.filter(i=>i.status==='active'&&i.image&&(pickCategory==='all'||i.categoryId===pickCategory)&&(pickSeason==='all'||!i.seasons.length||i.seasons.includes(pickSeason))&&i.type!=='underwear'&&!/收纳|盒子|家居/.test(i.name));
    if(!pool.length){toast('当前分类和季节没有可搭配的有图衣物，试试其他筛选');return;}
    const random=a=>a[Math.floor(Math.random()*a.length)],chosen=[];let bottoms=pool.filter(i=>i.type==='bottom');let tops=pool.filter(i=>['top','outer','dress','unknown'].includes(i.type));let extras=pool.filter(i=>['bag','shoes','accessory'].includes(i.type));
    if(tops.length)chosen.push(random(tops));if(bottoms.length&&chosen[0]?.type!=='dress')chosen.push(random(bottoms));if(extras.length)chosen.push(random(extras));
    if(!chosen.length)chosen.push(random(pool));
    const positions=[{x:10,y:12,w:39},{x:48,y:34,w:37},{x:58,y:8,w:26}];
    if(mutate(n=>n.draft=chosen.map((i,k)=>({uid:uid(),itemId:i.id,...positions[k]})))){activeOutfitId=null;toast('已从当前筛选中随机组合，可拖动调整或继续添加');}
  }
  function header(eyebrow,title,subtitle,actions=''){return `<header class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></header>`;}
  function filteredItems(){const q=filters.search.trim().toLowerCase();let items=state.items.filter(i=>(filters.category==='all'||i.categoryId===filters.category)&&(filters.season==='all'||i.seasons.includes(filters.season)||!i.seasons.length)&&(filters.status==='all'||i.status===filters.status)&&(filters.type==='all'||i.type===filters.type)&&(!filters.favorites||i.favorite)&&(!q||[i.code,i.name,i.note,i.location,categoryName(i.categoryId)].join(' ').toLowerCase().includes(q)));if(sort==='code')items.sort((a,b)=>a.code.localeCompare(b.code,'zh-CN',{numeric:true}));if(sort==='name')items.sort((a,b)=>a.name.localeCompare(b.name,'zh-CN'));if(sort==='recent')items.reverse();return items;}
  function renderWardrobe(){
    const items=filteredItems(),title=filters.category==='all'?'我的衣柜':esc(categoryName(filters.category));
    $('#app').innerHTML=header('A PLACE FOR EVERY PIECE',title,`收好每一件喜欢，也留出新的空间。<span class="page-total">共 ${state.items.length} 件物品</span>`,`<button class="btn secondary" id="toggle-multi">${icon('check')}${multi?'完成多选':'多选管理'}</button><button class="btn primary" id="add-item">${icon('plus')}添加衣物</button>`)+`
      <div class="season-tabs">${[{id:'all',name:'全部季节'},...SEASONS.map(s=>({id:s,name:s+'季'}))].map(s=>`<button class="season-tab ${filters.season===s.id?'active':''}" data-season="${s.id}">${s.name}</button>`).join('')}<span class="tab-spacer"></span><button class="chip ${filters.favorites?'active':''}" id="favorite-filter">${icon('heart')}心爱单品</button></div>
      <div class="toolbar"><div class="toolbar-left"><label class="search-input wardrobe-search">${icon('search')}<input id="wardrobe-search" value="${esc(filters.search)}" placeholder="搜索名称、编号、位置…" aria-label="搜索衣柜"></label><select class="select-field" id="category-filter" aria-label="筛选分类"><option value="all">全部分类</option>${categoryOptions(filters.category)}</select><select class="select-field" id="type-filter" aria-label="筛选品类"><option value="all">全部品类</option>${Object.entries(TYPES).map(([k,v])=>`<option value="${k}" ${filters.type===k?'selected':''}>${v}</option>`).join('')}</select><select class="select-field" id="status-filter" aria-label="筛选状态"><option value="all">全部状态</option>${Object.entries(STATUS).map(([k,v])=>`<option value="${k}" ${filters.status===k?'selected':''}>${v}</option>`).join('')}</select></div><div class="toolbar-right"><select class="select-field" id="sort-select" aria-label="排序方式">${[['manual','手动排序'],['code','编号排序'],['name','名称排序'],['recent','最近添加']].map(([k,v])=>`<option value="${k}" ${sort===k?'selected':''}>${v}</option>`).join('')}</select><div class="segmented"><button class="icon-button ${view==='grid'?'active':''}" id="view-grid" aria-label="网格视图">${icon('grid')}</button><button class="icon-button ${view==='list'?'active':''}" id="view-list" aria-label="列表视图">${icon('list')}</button></div></div></div>
      <div id="wardrobe-results">${wardrobeResults(items)}</div>`;
    $('#add-item').onclick=()=>itemModal();$('#toggle-multi').onclick=()=>{multi=!multi;selected.clear();renderWardrobe();};
    $$('[data-season]').forEach(b=>b.onclick=()=>{filters.season=b.dataset.season;selected.clear();renderWardrobe();});$('#favorite-filter').onclick=()=>{filters.favorites=!filters.favorites;selected.clear();renderWardrobe();};
    $('#wardrobe-search').oninput=e=>{filters.search=e.target.value;selected.clear();$('#wardrobe-results').innerHTML=wardrobeResults(filteredItems());bindWardrobeResults();};
    [['category-filter','category'],['type-filter','type'],['status-filter','status']].forEach(([id,key])=>$('#'+id).onchange=e=>{filters[key]=e.target.value;selected.clear();render();});
    $('#sort-select').onchange=e=>{sort=e.target.value;renderWardrobe();};$('#view-grid').onclick=()=>{view='grid';renderWardrobe();};$('#view-list').onclick=()=>{view='list';renderWardrobe();};bindWardrobeResults();
  }
  function wardrobeResults(items){return `<div class="results-heading"><span><strong>${items.length}</strong> 件物品${items.length!==state.items.length?'符合筛选':''}</span><span class="help-text">${sort==='manual'?'拖动卡片调整顺序，拖到左侧分类即可归类':'切换「手动排序」可拖动整理'}</span></div>${multi?selectionBar(items):''}${items.length?`<div class="${view==='grid'?'wardrobe-grid':'garment-list'}">${items.map(i=>garmentCard(i)).join('')}</div>`:`<div class="empty-state">${icon('hanger')}<h3>这里还没有衣物</h3><p>添加第一件衣物，或调整筛选条件。</p><button class="btn secondary" id="reset-filters">重置筛选</button></div>`}`;}
  function garmentCard(i){return `<article class="garment-card ${selected.has(i.id)?'selected':''} ${view==='list'?'list-row':''}" data-item="${esc(i.id)}" draggable="${sort==='manual'}" tabindex="0" aria-label="${esc(i.code+' '+i.name)}"><div class="garment-visual">${itemImage(i)}<label class="card-checkbox ${multi?'visible':''}" title="选择 ${esc(i.code)}"><input type="checkbox" data-select="${esc(i.id)}" aria-label="选择 ${esc(i.code)}" ${selected.has(i.id)?'checked':''}><span>${icon('check')}</span></label><button class="favorite-button icon-button ${i.favorite?'is-favorite':''}" data-favorite="${esc(i.id)}" aria-label="${i.favorite?'取消喜爱':'设为喜爱'} ${esc(i.code)}">${icon('heart')}</button>${i.status!=='active'?`<span class="card-badge ${i.status}">${STATUS[i.status]}</span>`:!i.image?'<span class="card-badge">待补照片</span>':''}<span class="drag-handle">${icon('move')}</span></div><div class="garment-info"><div class="garment-code">${esc(i.code)}</div><h3 class="garment-name">${esc(i.name===i.code?categoryName(i.categoryId)+' · '+(TYPES[i.type]||'单品'):i.name)}</h3><div class="garment-meta"><span>${i.seasons.length?i.seasons.join(' / '):'四季'}</span><span>${esc(i.location?'位置 '+i.location:categoryName(i.categoryId))}</span></div></div><div class="card-actions"><button class="text-button" data-edit="${esc(i.id)}">${icon('edit')}编辑</button><button class="icon-button" data-card-add="${esc(i.id)}" aria-label="将 ${esc(i.code)} 加入搭配" title="加入搭配">${icon('plus')}</button></div></article>`;}
  function selectionBar(items){return `<div class="selection-bar"><label class="selection-all"><input type="checkbox" id="select-all" ${items.length&&items.every(i=>selected.has(i.id))?'checked':''}> 全选当前结果</label><span class="selected-count">已选 ${selected.size} 件</span><div class="selection-actions"><button class="btn ghost small" id="batch-move">${icon('tag')}更改分类</button><button class="btn ghost small" id="batch-status">更改状态</button><button class="btn ghost small" id="batch-favorite">${icon('heart')}设为喜爱</button><button class="btn danger small" id="batch-delete">${icon('trash')}删除</button></div></div>`;}
  function bindWardrobeResults(){
    $$('[data-select]').forEach(c=>c.onchange=e=>{e.stopPropagation();if(c.checked)selected.add(c.dataset.select);else selected.delete(c.dataset.select);if(!multi){multi=true;renderWardrobe();}else{$('#wardrobe-results').innerHTML=wardrobeResults(filteredItems());bindWardrobeResults();}});
    $$('[data-favorite]').forEach(b=>b.onclick=()=>mutate(n=>{const i=n.items.find(i=>i.id===b.dataset.favorite);i.favorite=!i.favorite;}));
    $$('[data-edit]').forEach(b=>b.onclick=()=>itemModal(b.dataset.edit));
    $$('[data-card-add]').forEach(b=>b.onclick=()=>{const i=itemById(b.dataset.cardAdd);if(i.status!=='active'){toast('请先将衣物状态改为「在衣柜」');return;}addToBoard(i.id);toast('已加入首页搭配画布',()=>navigate('home'),'去搭配');});
    $('#reset-filters')?.addEventListener('click',()=>{filters={category:'all',season:'all',status:'all',search:'',type:'all',favorites:false};render();});
    $('#select-all')?.addEventListener('change',e=>{selected=e.target.checked?new Set(filteredItems().map(i=>i.id)):new Set();$('#wardrobe-results').innerHTML=wardrobeResults(filteredItems());bindWardrobeResults();});
    $('#batch-move')?.addEventListener('click',()=>batchModal('category'));$('#batch-status')?.addEventListener('click',()=>batchModal('status'));$('#batch-favorite')?.addEventListener('click',()=>{if(!selected.size)return toast('请先选择衣物');mutate(n=>n.items.forEach(i=>{if(selected.has(i.id))i.favorite=true;}));toast(`已将 ${selected.size} 件衣物设为喜爱`);});$('#batch-delete')?.addEventListener('click',()=>deleteItems([...selected]));
    $$('.garment-card').forEach(card=>{
      $('.garment-visual',card).onclick=e=>{if(e.target.closest('button,input,label'))return;if(multi){const id=card.dataset.item;if(selected.has(id))selected.delete(id);else selected.add(id);$('#wardrobe-results').innerHTML=wardrobeResults(filteredItems());bindWardrobeResults();}else itemModal(card.dataset.item);};
      card.onkeydown=e=>{if(e.target!==card)return;if(e.key==='Enter'){e.preventDefault();itemModal(card.dataset.item);}if(e.altKey&&sort==='manual'&&['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const id=card.dataset.item,visible=filteredItems(),at=visible.findIndex(i=>i.id===id),target=visible[at+(e.key==='ArrowUp'?-1:1)];if(target){mutate(n=>{const from=n.items.findIndex(i=>i.id===id),to=n.items.findIndex(i=>i.id===target.id);const [item]=n.items.splice(from,1);n.items.splice(to,0,item);});$(`[data-item="${CSS.escape(id)}"]`)?.focus();}}};
      card.ondragstart=e=>{if(e.target.closest('button,input,label')||sort!=='manual'){e.preventDefault();return;}dragItemId=card.dataset.item;e.dataTransfer.setData('text/plain',dragItemId);e.dataTransfer.effectAllowed='move';card.classList.add('dragging');};card.ondragend=()=>{dragItemId=null;card.classList.remove('dragging');$$('.drop-target').forEach(e=>e.classList.remove('drop-target'));};
      card.ondragover=e=>{if(dragItemId&&sort==='manual'){e.preventDefault();card.classList.add('drop-target');}};card.ondragleave=()=>card.classList.remove('drop-target');card.ondrop=e=>{e.preventDefault();card.classList.remove('drop-target');if(dragItemId&&dragItemId!==card.dataset.item){const moving=dragItemId;mutate(n=>{const from=n.items.findIndex(i=>i.id===moving),to=n.items.findIndex(i=>i.id===card.dataset.item);const [i]=n.items.splice(from,1);n.items.splice(to,0,i);});toast('已保存衣物顺序');}dragItemId=null;};
    });
  }
  function categoryOptions(id){return state.categories.map(c=>`<option value="${esc(c.id)}" ${c.id===id?'selected':''}>${esc(c.name)}</option>`).join('');}
  function nextCode(categoryId){const category=state.categories.find(c=>c.id===categoryId);const prefix=category?.location?category.location+'-':'YX-';let n=1;while(state.items.some(i=>i.code.toLowerCase()===(prefix+String(n).padStart(prefix==='YX-'?3:1,'0')).toLowerCase()))n++;return prefix+String(n).padStart(prefix==='YX-'?3:1,'0');}
  function showModal(html,{wide=false,compact=false,cleanup}={}){
    closeModal();modalReturnFocus=document.activeElement;$('#modal-root').innerHTML=`<div class="modal-overlay"><section class="modal ${wide?'wide':''} ${compact?'compact':''}" role="dialog" aria-modal="true" aria-labelledby="modal-title">${html}</section></div>`;document.body.classList.add('modal-open');modalCleanup=cleanup;
    $('.modal-overlay').onmousedown=e=>{if(e.target.classList.contains('modal-overlay'))closeModal();};$$('[data-close-modal]').forEach(b=>b.onclick=closeModal);setTimeout(()=>$('.modal input:not([type=file]),.modal select,.modal button')?.focus(),0);
  }
  function closeModal(){if(!$('#modal-root')?.children.length)return;modalCleanup?.();modalCleanup=null;$('#modal-root').innerHTML='';document.body.classList.remove('modal-open');modalReturnFocus?.focus?.();}
  const modalHeader=(eyebrow,title)=>`<div class="modal-header"><div><div class="eyebrow">${eyebrow}</div><h2 id="modal-title">${title}</h2></div><button class="icon-button" data-close-modal aria-label="关闭弹窗">${icon('close')}</button></div>`;
  function itemModal(id){
    const old=id?itemById(id):null;
    if(!state.categories.length){categoryModal();toast('先添加一个衣物分类');return;}
    const cat=filters.category!=='all'&&state.categories.some(c=>c.id===filters.category)?filters.category:state.categories[0].id;
    const i=old||{id:uid(),code:nextCode(cat),name:'',categoryId:cat,type:'unknown',seasons:[],status:'active',color:'',location:state.categories.find(c=>c.id===cat)?.location||'',note:'',image:'',favorite:false,wearCount:0};let image=i.image||'',imageBusy=false;
    showModal(`${modalHeader(old?'MAKE IT YOUR OWN':'A NEW PIECE',old?'编辑衣物':'添加一件喜欢')}<form id="item-form"><div class="modal-body item-form-layout"><div class="image-upload"><div class="image-preview" id="upload-preview">${image?itemImage(i,'',false):`<div>${icon('image')}<p>为衣物添加一张照片</p><small>JPG、PNG、WebP · 最高 15 MB</small></div>`}</div><label class="btn secondary upload-label">${icon('upload')}${image?'更换照片':'选择照片'}<input id="item-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden></label><button class="text-button" type="button" id="remove-image">移除照片</button><p class="field-hint">照片会自动压缩并保存在本机</p></div><div class="form-grid"><label class="field"><span>衣物编号 <b class="required">*</b></span><input name="code" maxlength="60" required value="${esc(i.code)}" autocomplete="off"><span class="field-hint">填写唯一编号，方便查找与整理</span></label><label class="field"><span>衣物名称 <b class="required">*</b></span><input name="name" maxlength="100" required value="${esc(i.name)}" placeholder="例如：奶油白棉质衬衫"></label><label class="field"><span>衣物分类</span><select name="categoryId">${categoryOptions(i.categoryId)}</select></label><label class="field"><span>品类</span><select name="type">${Object.entries(TYPES).map(([k,v])=>`<option value="${k}" ${i.type===k?'selected':''}>${v}</option>`).join('')}</select></label><div class="field full"><span>适用季节 <small>可多选，留空表示四季</small></span><div class="checkbox-group">${SEASONS.map(s=>`<label class="check-chip"><input type="checkbox" name="seasons" value="${s}" ${i.seasons.includes(s)?'checked':''}><span>${s}季</span></label>`).join('')}</div></div><label class="field"><span>收纳位置</span><input name="location" maxlength="80" value="${esc(i.location)}" placeholder="例如：左侧第二层"></label><label class="field"><span>主要颜色</span><input name="color" maxlength="40" value="${esc(i.color)}" placeholder="例如：米白 / 藏蓝"></label><label class="field"><span>当前状态</span><select name="status">${Object.entries(STATUS).map(([k,v])=>`<option value="${k}" ${i.status===k?'selected':''}>${v}</option>`).join('')}</select></label><label class="field favorite-field"><span>特别喜欢</span><span class="check-inline"><input type="checkbox" name="favorite" ${i.favorite?'checked':''}> 加入心爱单品</span></label><label class="field full"><span>备注</span><textarea name="note" maxlength="2000" rows="3" placeholder="材质、尺码、搭配想法…">${esc(i.note)}</textarea></label>${i.sourceCell?`<p class="field-hint full">来源：${esc(i.sourceSheet)} · ${esc(i.sourceCell)}</p>`:''}<p class="form-error full" id="item-error" role="alert"></p></div></div><div class="modal-footer">${old?`<button type="button" class="btn danger" id="delete-single">${icon('trash')}删除衣物</button>`:'<span class="help-text">让喜欢的衣物，都被看见。</span>'}<div><button type="button" class="btn secondary" data-close-modal>取消</button><button type="submit" class="btn primary" id="item-save">${icon('check')}保存衣物</button></div></div></form>`,{wide:true});
    $$('[data-close-modal]').forEach(b=>b.onclick=closeModal);
    $('#item-image').onchange=async e=>{const file=e.target.files[0];if(!file)return;imageBusy=true;$('#item-save').disabled=true;$('#item-error').textContent='正在处理照片…';try{image=await compressImage(file);$('#upload-preview').innerHTML=`<img src="${image}" alt="待保存的衣物照片">`;$('#item-error').textContent='';}catch(err){$('#item-error').textContent=err.message;}finally{imageBusy=false;if($('#item-save'))$('#item-save').disabled=false;}};
    $('#remove-image').onclick=()=>{image='';$('#upload-preview').innerHTML=`<div>${icon('image')}<p>暂无照片</p></div>`;$('#item-image').value='';};
    $('#delete-single')?.addEventListener('click',()=>deleteItems([id]));
    $('#item-form').onsubmit=e=>{
      e.preventDefault();if(imageBusy)return;const fd=new FormData(e.target),code=fd.get('code').trim(),name=fd.get('name').trim();const error=$('#item-error');
      if(!code||!name){error.textContent='请填写衣物编号和名称';return;}
      if(state.items.some(x=>x.id!==i.id&&x.code.toLowerCase()===code.toLowerCase())){error.textContent='这个编号已经存在，请使用不同的编号';return;}
      const value={...i,code,name,categoryId:fd.get('categoryId'),type:fd.get('type'),seasons:fd.getAll('seasons'),location:fd.get('location').trim(),color:fd.get('color').trim(),status:fd.get('status'),favorite:fd.has('favorite'),note:fd.get('note').trim(),image};
      if(mutate(n=>{const idx=n.items.findIndex(x=>x.id===i.id);if(idx<0)n.items.push(value);else n.items[idx]=value;},false)){closeModal();render();toast(old?'衣物信息已更新':'新衣物已收进衣柜');}
    };
  }
  async function compressImage(file){
    if(!/^image\/(jpeg|png|webp|gif)$/.test(file.type))throw Error('请选择 JPG、PNG、WebP 或 GIF 图片');if(file.size>15*1024*1024)throw Error('图片超过 15 MB，请选择小一些的照片');
    const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('照片读取失败'));r.readAsDataURL(file);});
    const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('无法识别这张照片'));i.src=data;});
    const scale=Math.min(1,800/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#f5f3ee';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);let out=canvas.toDataURL('image/webp',.8);if(out.length>600000)out=canvas.toDataURL('image/jpeg',.65);return out;
  }
  function confirmModal(title,message,onConfirm,label='确认删除'){
    showModal(`${modalHeader('A MOMENT TO CONFIRM',esc(title))}<div class="modal-body"><p class="confirm-message">${esc(message)}</p></div><div class="modal-footer"><span></span><div><button class="btn secondary" data-close-modal>取消</button><button class="btn danger" id="confirm-action">${esc(label)}</button></div></div>`,{compact:true});$('#confirm-action').onclick=onConfirm;
  }
  function deleteItems(ids){
    if(!ids.length){toast('请先选择衣物');return;}
    const referenced=state.outfits.filter(o=>o.pieces.some(p=>ids.includes(p.itemId))).length;
    confirmModal(`删除 ${ids.length} 件衣物？`,`衣物会从衣柜和搭配画布中移除${referenced?`，并从 ${referenced} 套已收藏搭配中移除`:''}。删除后可在提示中撤销。`,()=>{
      const before=clone(state);if(mutate(n=>{n.items=n.items.filter(i=>!ids.includes(i.id));n.draft=n.draft.filter(p=>!ids.includes(p.itemId));n.outfits.forEach(o=>o.pieces=o.pieces.filter(p=>!ids.includes(p.itemId)));},false)){selected.clear();closeModal();render();toast(`已删除 ${ids.length} 件衣物`,()=>{
        if(mutate(n=>{
          before.items.forEach((item,index)=>{if(ids.includes(item.id)&&!n.items.some(i=>i.id===item.id)){
            const restored=clone(item);if(!n.categories.some(c=>c.id===restored.categoryId)){const cat=before.categories.find(c=>c.id===restored.categoryId);if(cat)n.categories.push(clone(cat));}
            if(n.items.some(i=>i.code.toLowerCase()===restored.code.toLowerCase()))restored.code+='-恢复';n.items.splice(Math.min(index,n.items.length),0,restored);
          }});
          const merge=(current,prior)=>{prior.filter(p=>ids.includes(p.itemId)).forEach(p=>{if(!current.some(x=>x.itemId===p.itemId)&&current.length<12)current.push(clone(p));});};
          merge(n.draft,before.draft);n.outfits.forEach(o=>{const original=before.outfits.find(x=>x.id===o.id);if(original)merge(o.pieces,original.pieces);});
        }))toast('已恢复衣物及相关搭配');
      });}
    });
  }
  function batchModal(kind){
    if(!selected.size)return toast('请先选择衣物');const isCat=kind==='category';
    showModal(`${modalHeader('TIDY TOGETHER',`批量${isCat?'更改分类':'更改状态'}`)}<div class="modal-body"><p class="help-text">将对选中的 ${selected.size} 件衣物生效</p><label class="field"><span>${isCat?'移至分类':'设为状态'}</span><select id="batch-value">${isCat?categoryOptions(''):Object.entries(STATUS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label></div><div class="modal-footer"><span></span><div><button class="btn secondary" data-close-modal>取消</button><button class="btn primary" id="batch-confirm">保存更改</button></div></div>`,{compact:true});$('#batch-confirm').onclick=()=>{const value=$('#batch-value').value,count=selected.size;if(mutate(n=>n.items.forEach(i=>{if(selected.has(i.id))i[isCat?'categoryId':'status']=value;}),false)){closeModal();selected.clear();render();toast(`已更新 ${count} 件衣物`);}};
  }
  function categoryModal(){
    showModal(`${modalHeader('EVERYTHING IN ITS PLACE','整理衣物分类')}<div class="modal-body"><p class="help-text">按品类、季节或自己的习惯分类，让每件衣物各有归处。</p><div class="category-edit-list">${state.categories.map((c,k)=>`<div class="category-row" data-catrow="${esc(c.id)}"><span class="category-swatch">${String(k+1).padStart(2,'0')}</span><input value="${esc(c.name)}" maxlength="40" data-catname="${esc(c.id)}" aria-label="分类名称 ${esc(c.name)}"><span class="count">${state.items.filter(i=>i.categoryId===c.id).length} 件</span><button class="icon-button" data-delete-category="${esc(c.id)}" aria-label="删除分类 ${esc(c.name)}">${icon('trash')}</button></div>`).join('')}</div><form class="add-category-form" id="add-category-form"><input id="new-category-name" maxlength="40" placeholder="新分类名称，例如：外套" required aria-label="新分类名称"><button class="btn secondary" type="submit">${icon('plus')}添加分类</button></form><p class="form-error" id="category-error" role="alert"></p><p class="field-hint">删除分类时，其中的衣物会移至「未分类」。</p></div><div class="modal-footer"><span></span><button class="btn primary" id="save-categories">${icon('check')}保存名称</button></div>`);
    $('#save-categories').onclick=()=>{const values=$$('[data-catname]').map(i=>({id:i.dataset.catname,name:i.value.trim()}));if(values.some(v=>!v.name)){$('#category-error').textContent='分类名称不能为空';return;}if(new Set(values.map(v=>v.name.toLowerCase())).size!==values.length){$('#category-error').textContent='分类名称不能重复';return;}if(mutate(n=>values.forEach(v=>n.categories.find(c=>c.id===v.id).name=v.name),false)){closeModal();render();toast('分类名称已保存');}};
    $('#add-category-form').onsubmit=e=>{e.preventDefault();const name=$('#new-category-name').value.trim();if(!name||state.categories.some(c=>c.name.toLowerCase()===name.toLowerCase())){$('#category-error').textContent='请输入不重复的分类名称';return;}if(state.categories.length>=100){$('#category-error').textContent='最多可添加 100 个分类';return;}if(mutate(n=>n.categories.push({id:uid(),name,location:''}),false)){render();categoryModal();toast('已添加分类');}};
    $$('[data-delete-category]').forEach(b=>b.onclick=()=>{const id=b.dataset.deleteCategory,c=state.categories.find(c=>c.id===id),count=state.items.filter(i=>i.categoryId===id).length;
      if(c.name==='未分类'&&count){toast('「未分类」中仍有衣物，请先移动到其他分类');return;}
      confirmModal('删除这个分类？',`「${c.name}」将被删除${count?`，其中 ${count} 件衣物会移至「未分类」`:''}。`,()=>{if(mutate(n=>{let fallback=n.categories.find(c=>c.name==='未分类'&&c.id!==id);if(count&&!fallback){fallback={id:uid(),name:'未分类'};n.categories.push(fallback);}n.items.forEach(i=>{if(i.categoryId===id)i.categoryId=fallback.id;});n.categories=n.categories.filter(c=>c.id!==id);},false)){if(filters.category===id)filters.category='all';if(pickCategory===id)pickCategory='all';closeModal();render();categoryModal();toast('分类已删除，衣物已保留');}});
    });
  }
  function saveOutfitModal(){
    if(!state.draft.length)return toast('先挑选几件衣物，再收藏搭配');const old=state.outfits.find(o=>o.id===activeOutfitId);
    showModal(`${modalHeader('KEEP THE INSPIRATION',old?'保存搭配修改':'收藏这套搭配')}<form id="outfit-form"><div class="modal-body"><label class="field"><span>搭配名称 <b class="required">*</b></span><input name="name" maxlength="80" required value="${esc(old?.name||'')}" placeholder="例如：周末的松弛感"></label><label class="field"><span>适合场景</span><select name="occasion">${['日常','通勤','周末','约会','运动','旅行','其他'].map(v=>`<option ${old?.occasion===v?'selected':''}>${v}</option>`).join('')}</select></label><label class="field"><span>搭配笔记</span><textarea name="note" rows="3" maxlength="1000" placeholder="记下这套搭配的小灵感…">${esc(old?.note||'')}</textarea></label><p class="form-error" id="outfit-error" role="alert"></p></div><div class="modal-footer"><span class="help-text">共 ${state.draft.length} 件单品</span><div><button type="button" class="btn secondary" data-close-modal>取消</button><button class="btn primary" type="submit">${icon('heart')}保存收藏</button></div></div></form>`,{compact:true});
    $('#outfit-form').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target),name=fd.get('name').trim();if(!name){$('#outfit-error').textContent='请填写搭配名称';return;}const now=new Date().toISOString(),o={id:old?.id||uid(),name,occasion:fd.get('occasion'),note:fd.get('note').trim(),pieces:clone(state.draft),createdAt:old?.createdAt||now,updatedAt:now,wearCount:old?.wearCount||0};if(mutate(n=>{const idx=n.outfits.findIndex(x=>x.id===o.id);if(idx<0)n.outfits.unshift(o);else n.outfits[idx]=o;},false)){activeOutfitId=o.id;closeModal();render();toast('搭配已收藏',()=>navigate('outfits'),'查看收藏');}};
  }
  function outfitPreview(o){return o.pieces.map(p=>{const i=itemById(p.itemId);return i?`<div class="preview-piece" style="left:${p.x}%;top:${p.y}%;width:${p.w}%">${itemImage(i)}</div>`:'';}).join('');}
  function renderOutfits(){
    const q=outfitQuery.trim().toLowerCase(),outfits=state.outfits.filter(o=>!q||[o.name,o.occasion,o.note].join(' ').toLowerCase().includes(q));
    $('#app').innerHTML=header('YOUR PERSONAL LOOKBOOK','搭配收藏','把喜欢的组合留下来，下次出门少一点犹豫。',`<button class="btn primary" id="new-outfit">${icon('plus')}创建新搭配</button>`)+`<div class="toolbar"><label class="search-input"><span>${icon('search')}</span><input id="outfit-search" placeholder="搜索搭配名称或场景…" value="${esc(outfitQuery)}" aria-label="搜索搭配"></label><span class="text-muted">${state.outfits.length} 套灵感，属于你</span></div><div id="outfit-results">${outfitResults(outfits)}</div>`;
    $('#new-outfit').onclick=()=>{activeOutfitId=null;if(mutate(n=>n.draft=[],false))navigate('home');};$('#outfit-search').oninput=e=>{outfitQuery=e.target.value;const q=outfitQuery.trim().toLowerCase();$('#outfit-results').innerHTML=outfitResults(state.outfits.filter(o=>!q||[o.name,o.occasion,o.note].join(' ').toLowerCase().includes(q)));bindOutfitCards();};bindOutfitCards();
  }
  function outfitResults(outfits){return outfits.length?`<div class="outfits-grid">${outfits.map(o=>`<article class="outfit-card"><button class="outfit-preview" data-open-outfit="${esc(o.id)}" aria-label="编辑搭配 ${esc(o.name)}">${outfitPreview(o)}${!o.pieces.length?`<span class="empty-preview">衣物已移除，点击重新搭配</span>`:''}<span class="outfit-occasion">${esc(o.occasion)}</span></button><div class="outfit-card-info"><h3>${esc(o.name)}</h3><p>${esc(o.note||'每一天，都有自己的风格。')}</p><div class="outfit-card-meta"><span>${o.pieces.length} 件单品 · 穿过 ${o.wearCount||0} 次</span><span>${new Date(o.createdAt).toLocaleDateString('zh-CN')}</span></div></div><div class="outfit-card-actions"><button class="text-button" data-open-outfit="${esc(o.id)}">${icon('edit')}继续搭配</button><button class="text-button" data-wear="${esc(o.id)}">${icon('check')}今天穿这套</button><button class="icon-button" data-delete-outfit="${esc(o.id)}" aria-label="删除搭配 ${esc(o.name)}">${icon('trash')}</button></div></article>`).join('')}</div>`:`<div class="empty-state large">${icon('heart')}<span class="eyebrow">SAVE WHAT FEELS LIKE YOU</span><h2>${outfitQuery?'没有找到这套搭配':'喜欢的搭配，值得留下。'}</h2><p>${outfitQuery?'试试其他关键词':'到首页挑选衣物、调整位置，收藏你的第一套日常穿搭。'}</p><button class="btn primary" id="empty-new-outfit">${icon('plus')}去搭配一套</button></div>`;}
  function bindOutfitCards(){
    $$('[data-open-outfit]').forEach(b=>b.onclick=()=>{const o=state.outfits.find(o=>o.id===b.dataset.openOutfit);if(mutate(n=>n.draft=clone(o.pieces),false)){activeOutfitId=o.id;navigate('home');}});
    $$('[data-wear]').forEach(b=>b.onclick=()=>{const outfit=state.outfits.find(o=>o.id===b.dataset.wear);if(!outfit.pieces.length)return toast('这套搭配暂时没有单品，请先重新搭配');if(mutate(n=>{const o=n.outfits.find(o=>o.id===b.dataset.wear);o.wearCount=(o.wearCount||0)+1;o.pieces.forEach(p=>{const i=n.items.find(i=>i.id===p.itemId);if(i)i.wearCount=(i.wearCount||0)+1;});}))toast('已记录一次穿搭，愿今天自在又好看');});
    $$('[data-delete-outfit]').forEach(b=>b.onclick=()=>{const id=b.dataset.deleteOutfit;confirmModal('删除这套搭配？','只会删除搭配记录，衣柜中的衣物会保留。',()=>{const removed=clone(state.outfits.find(o=>o.id===id));if(mutate(n=>n.outfits=n.outfits.filter(o=>o.id!==id),false)){if(activeOutfitId===id)activeOutfitId=null;closeModal();render();toast('已删除搭配',()=>{mutate(n=>{if(!n.outfits.some(o=>o.id===id)){removed.pieces=removed.pieces.filter(p=>n.items.some(i=>i.id===p.itemId));n.outfits.unshift(removed);}});});}});});$('#empty-new-outfit')?.addEventListener('click',()=>navigate('home'));
  }
  function renderData(){
    const photos=state.items.filter(i=>i.image).length;
    $('#app').innerHTML=header('A WARDROBE THAT STAYS WITH YOU','数据与备份','你的衣柜，由你保管。定期备份，让整理更安心。')+`
    <div class="info-banner">${icon('data')}<div><strong>${storageAvailable?'数据已自动保存在当前浏览器':'当前处于临时使用模式'}</strong><p>同一台电脑、同一浏览器可继续使用。清理浏览器数据、更换文件位置或浏览器可能无法读取原有记录，建议定期导出备份。</p></div><span class="pill">本地使用</span></div>
    <div class="data-grid"><section class="data-card"><span class="data-card-icon">${icon('download')}</span><h2>备份整个衣柜</h2><p>保存衣物、分类、搭配收藏和上传的照片。内置照片使用相对路径，请连同应用文件夹一起保管。</p><button class="btn primary" id="export-backup">${icon('download')}导出 JSON 备份</button><small>上次修改：${state.updatedAt?new Date(state.updatedAt).toLocaleString('zh-CN'):'尚未修改'}</small></section><section class="data-card"><span class="data-card-icon">${icon('upload')}</span><h2>从备份恢复</h2><p>导入衣序导出的 JSON 文件。恢复前会显示文件内容摘要，确认后替换当前衣柜。</p><button class="btn secondary" id="import-backup">${icon('upload')}选择备份文件</button><small>建议先导出当前数据，保留一个副本</small></section></div>
    <section class="panel source-panel"><div class="panel-header"><span class="panel-title">从一个小衣柜开始</span><span class="badge">通用示例</span></div><div class="panel-body"><div class="source-summary"><div><strong>${seed.items.length}</strong><span>件示例单品</span></div><div><strong>${seed.items.filter(i=>i.image).length}</strong><span>张原创插画</span></div><div><strong>${seed.categories.length}</strong><span>个示例分类</span></div></div><p class="help-text">内置记录均为虚构的通用示例，衣物插画由 SVG 绘制，不包含个人照片。你可以重命名分类、编辑或删除单品，也可以直接添加自己的衣物。所有使用数据保存在当前浏览器。</p><div class="source-list">${state.categories.map(c=>`<div class="source-row"><span>${esc(c.name)}</span><span>${esc(c.location||'自定义分类')}</span><span>${state.items.filter(i=>i.categoryId===c.id).length} 件</span></div>`).join('')}</div><p class="field-hint">应用无需账号，不会将衣物照片上传到服务器。换设备时可通过 JSON 备份手动迁移。</p></div></section>
    <section class="panel settings-panel"><div class="panel-header"><span class="panel-title">更多整理工具</span></div><div class="settings-row"><div><strong>导出物品清单</strong><p>CSV 可用 Excel 打开，包含编号、分类、季节、位置和备注。</p></div><button class="btn secondary" id="export-csv">${icon('download')}导出 CSV</button></div><div class="settings-row"><div><strong>批量添加物品</strong><p>导入 UTF-8 CSV；列名：编号、名称、分类、品类、季节、位置、颜色、状态、备注。编号须唯一，分类可自动创建。</p></div><button class="btn secondary" id="import-csv">${icon('upload')}导入 CSV</button></div><div class="settings-row"><div><strong>恢复内置示例</strong><p>替换当前衣物、分类与搭配收藏，回到初始演示状态。</p></div><button class="btn danger" id="reset-data">恢复初始数据</button></div></section><div class="gentle-note">${icon('info')}<p>当前有 ${state.items.length} 件物品、${photos} 张照片或插画、${state.outfits.length} 套搭配。此应用可离线使用，无需登录。</p></div>`;
    $('#export-backup').onclick=exportBackup;$('#import-backup').onclick=()=>$('#backup-file').click();$('#export-csv').onclick=exportCSV;$('#import-csv').onclick=()=>$('#csv-file').click();$('#reset-data').onclick=()=>confirmModal('恢复内置示例？','当前所有修改、新增照片和搭配收藏会被替换。请先导出备份。',()=>{if(persist(freshState())){activeOutfitId=null;filters.category='all';pickCategory='all';closeModal();render();toast('已恢复内置示例');}},'确认恢复');
  }
  function download(content,filename,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
  function stamp(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function exportBackup(){download(JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2),`衣序-衣柜备份-${stamp()}.json`,'application/json;charset=utf-8');toast('备份已导出，请妥善保管');}
  async function importBackup(file){
    if(!file)return;try{if(file.size>40*1024*1024)throw Error('备份文件超过 40 MB');const parsed=normalizeBackup(JSON.parse(await file.text()));confirmModal('恢复这个备份？',`将导入 ${parsed.items.length} 件衣物、${parsed.categories.length} 个分类、${parsed.outfits.length} 套搭配，替换当前全部数据。`,()=>{if(persist(parsed)){selected.clear();filters.category='all';pickCategory='all';activeOutfitId=null;closeModal();render();toast('备份已恢复');}},'确认恢复');}catch(e){toast(e instanceof SyntaxError?'文件不是有效的 JSON 备份':e.message);}
  }
  const csvCell=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  function exportCSV(){const rows=[['编号','名称','分类','品类','季节','位置','颜色','状态','备注','喜爱','穿着次数'],...state.items.map(i=>[i.code,i.name,categoryName(i.categoryId),TYPES[i.type],i.seasons.join('/'),i.location,i.color,STATUS[i.status],i.note,i.favorite?'是':'否',i.wearCount||0])];download('\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n'),`衣序-物品清单-${stamp()}.csv`,'text/csv;charset=utf-8');toast('已导出 Excel 可读的 CSV 清单');}
  function parseCSV(text){const rows=[],row=[];let value='',quoted=false;for(let k=0;k<text.length;k++){const c=text[k];if(c==='"'){if(quoted&&text[k+1]==='"'){value+='"';k++;}else if(!quoted&&value.trim())throw Error('CSV 引号格式不正确');else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[k+1]==='\n')k++;row.push(value);if(row.some(v=>v.trim()))rows.push([...row]);row.length=0;value='';}else value+=c;}if(quoted)throw Error('CSV 引号未闭合');row.push(value);if(row.some(v=>v.trim()))rows.push(row);return rows;}
  async function importCSV(file){
    if(!file)return;try{if(file.size>5*1024*1024)throw Error('CSV 文件超过 5 MB');const rows=parseCSV((await file.text()).replace(/^\uFEFF/,''));if(rows.length<2)throw Error('CSV 没有可导入的物品');const headers=rows.shift().map(v=>v.trim()),idx=k=>headers.indexOf(k);if(idx('编号')<0||idx('名称')<0)throw Error('CSV 必须包含「编号」和「名称」列');if(rows.length+state.items.length>10000)throw Error('物品总量超过 10000 件');const existing=new Set(state.items.map(i=>i.code.toLowerCase())),next=clone(state),typeMap=Object.fromEntries(Object.entries(TYPES).map(([k,v])=>[v,k])),statusMap=Object.fromEntries(Object.entries(STATUS).map(([k,v])=>[v,k]));
      rows.forEach((r,k)=>{const get=n=>String(r[idx(n)]||'').trim(),code=get('编号'),name=get('名称');if(!code||!name)throw Error(`第 ${k+2} 行：编号和名称不能为空`);if(code.length>60||name.length>100)throw Error(`第 ${k+2} 行：编号或名称过长`);if(existing.has(code.toLowerCase()))throw Error(`第 ${k+2} 行：编号「${code}」已存在，未导入任何数据`);existing.add(code.toLowerCase());const catName=get('分类')||'未分类';if(catName.length>40)throw Error(`第 ${k+2} 行：分类名称过长`);let cat=next.categories.find(c=>c.name===catName);if(!cat){cat={id:uid(),name:catName};next.categories.push(cat);}next.items.push({id:uid(),code,name,categoryId:cat.id,type:typeMap[get('品类')]||'unknown',seasons:SEASONS.filter(s=>get('季节').includes(s)),location:get('位置').slice(0,80),color:get('颜色').slice(0,40),status:statusMap[get('状态')]||'active',note:get('备注').slice(0,2000),favorite:get('喜爱')==='是',wearCount:Math.max(0,Math.min(99999,Number(get('穿着次数'))||0)),image:''});});
      if(next.categories.length>100)throw Error('导入后的分类超过 100 个');confirmModal('导入这些物品？',`将新增 ${rows.length} 件物品${next.categories.length>state.categories.length?`和 ${next.categories.length-state.categories.length} 个分类`:''}，当前数据会保留。CSV 不包含照片，可导入后补充。`,()=>{if(persist(next)){closeModal();render();toast(`已添加 ${rows.length} 件物品`);}},'确认导入');
    }catch(e){toast(e.message);}
  }
  // Keyboard dialog focus trap and global Escape support.
  document.addEventListener('keydown',e=>{if(!$('#modal-root').children.length)return;if(e.key==='Escape'){e.preventDefault();closeModal();}if(e.key==='Tab'){const f=$$('button:not([disabled]),input:not([type=hidden]):not([hidden]),select,textarea,a[href]',$('.modal')).filter(x=>x.getClientRects().length);if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  document.addEventListener('error',e=>{if(e.target instanceof HTMLImageElement&&!e.target.dataset.fallback){e.target.dataset.fallback='1';e.target.src=placeholder({});}},true);
  $('#brand-symbol').innerHTML=icon('hanger');$('#manage-categories').innerHTML=icon('plus');$('#manage-categories').onclick=categoryModal;$('#profile-button').onclick=()=>navigate('data');$('#mobile-menu').innerHTML=icon('menu');$('#mobile-menu').onclick=()=>$('#sidebar').classList.toggle('open');$('#sidebar-shade').onclick=()=>$('#sidebar').classList.remove('open');
  $('#backup-file').onchange=e=>{importBackup(e.target.files[0]);e.target.value='';};$('#csv-file').onchange=e=>{importCSV(e.target.files[0]);e.target.value='';};window.addEventListener('hashchange',route);
  // A small read-only diagnostic hook is useful when validating exported, static copies.
  window.YIXU={getState:()=>clone(state),getVersion:()=>1};
  route();if(initialMessage)setTimeout(()=>toast(initialMessage),500);
})();
