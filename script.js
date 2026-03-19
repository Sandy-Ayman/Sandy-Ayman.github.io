// ============================================
//  SANDY AYMAN PORTFOLIO - script.js v2
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
    getFirestore, collection, getDocs, doc, setDoc, addDoc,
    updateDoc, deleteDoc, serverTimestamp, query, orderBy,
    getDoc, increment, where, writeBatch
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey:            "AIzaSyD9yPf_ix4L71gCnAnhvrTatiF9XWvsJwc",
    authDomain:        "portfolio-f0132.firebaseapp.com",
    projectId:         "portfolio-f0132",
    storageBucket:     "portfolio-f0132.firebasestorage.app",
    messagingSenderId: "254571795689",
    appId:             "1:254571795689:web:fabed587483d3b1a1f4c78",
    measurementId:     "G-6SJLJLJPXM"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

let isAdmin = false;
let caseStudies = [];
let scrollObs;
const g   = id => document.getElementById(id);
const esc = t  => String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

//  THEME (light = default)

function initTheme() {
    const saved = localStorage.getItem('sandyTheme') || 'light';
    applyTheme(saved);
    g('theme-toggle').addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme') || 'light';
        applyTheme(cur === 'light' ? 'dark' : 'light');
    });
}
function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    const btn = g('theme-toggle');
    if(btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('sandyTheme', t);
}

//  TOAST
function toast(msg, type='success', ms=3500) {
    const c=g('toast-container'), el=document.createElement('div');
    el.className=`toast toast-${type}`;
    el.innerHTML=`${type==='success'?'✓':type==='error'?'✕':'ℹ'} ${msg}`;
    c.appendChild(el);
    setTimeout(()=>{ el.style.animation='slideUp .3s ease reverse'; setTimeout(()=>el.remove(),300); },ms);
}

//  LOADING
function initLoading() {
    const screen=g('loading-screen'), bar=g('loading-bar');
    if(!screen) return;
    let p=0;
    const iv=setInterval(()=>{ p+=Math.random()*12+5; if(p>=100){p=100;clearInterval(iv);} if(bar)bar.style.width=p+'%'; },120);
    const forceHide = () => {
        clearInterval(iv);
        if(bar) bar.style.width='100%';
        screen.classList.add('fade-out');
        setTimeout(()=>{ screen.style.display='none'; }, 700);
    };
    // Fix: if load event already fired (module scripts load late), hide immediately
    if(document.readyState === 'complete') {
        setTimeout(forceHide, 400);
    } else {
        window.addEventListener('load', ()=>setTimeout(forceHide, 400), {once:true});
    }
    // Absolute fallback — never stay stuck
    setTimeout(forceHide, 5000);
}

//  SCROLL + BACK TO TOP
function initScroll() {
    const bar=g('scroll-progress'), btn=g('back-to-top');
    window.addEventListener('scroll',()=>{
        bar.style.width=((window.scrollY/(document.documentElement.scrollHeight-window.innerHeight))*100)+'%';
        btn.classList.toggle('visible',window.scrollY>400);
    },{passive:true});
    btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
}

//  MOBILE MENU
function initMobileMenu() {
    const btn=g('mobile-menu-btn'), menu=g('mobile-menu'); let open=false;
    btn.addEventListener('click',()=>{ open=!open; menu.classList.toggle('hidden',!open); g('menu-icon').setAttribute('data-feather',open?'x':'menu'); feather.replace(); });
    document.querySelectorAll('.mobile-nav-link').forEach(l=>l.addEventListener('click',()=>{ open=false;menu.classList.add('hidden');g('menu-icon').setAttribute('data-feather','menu');feather.replace(); }));
}

//  TYPEWRITER
function initTypewriter() {
    const el=g('typewriter'); if(!el)return;
    const texts=['Crafting beautiful experiences ✨','Turning ideas into designs 🎨','Building user-centered products 💡','Designing with empathy 🤝','Creating seamless interfaces 🖥'];
    let i=0,j=0,del=false;
    (function type(){ const cur=texts[i]; el.textContent=cur.substring(0,j+=del?-1:1);
        let d=del?40:70; if(!del&&j===cur.length+1){d=1800;del=true;} else if(del&&j<0){del=false;j=0;i=(i+1)%texts.length;d=300;}
        setTimeout(type,d); })();
}

//  STATS COUNTERS
function countUp(el,target,dur=1400){ const t0=performance.now();
    (function tick(now){ const p=Math.min((now-t0)/dur,1); el.textContent=Math.round(target*(1-Math.pow(1-p,3))); if(p<1)requestAnimationFrame(tick); })(performance.now()); }

function initStats() {
    const sec=g('stats'); if(!sec)return;
    const obs=new IntersectionObserver(entries=>{
        if(entries[0].isIntersecting){
            document.querySelectorAll('.stat-num[data-target]').forEach(e=>{ const t=+e.dataset.target; if(t>0) countUp(e,t); });
            obs.unobserve(sec);
        }
    },{threshold:0.3});
    obs.observe(sec);
}

//  VISITOR COUNTER
async function initVisitors() {
    const disp=g('visitor-count-display');
    try {
        const ref=doc(db,'siteStats','visitors'), snap=await getDoc(ref);
        let count=snap.exists()?(snap.data().count||0):0;
        if(!sessionStorage.getItem('sandyVisited')){ sessionStorage.setItem('sandyVisited','1'); await setDoc(ref,{count:increment(1)},{merge:true}); count++; }
        if(disp){ const t0=performance.now(); (function tick(now){ const p=Math.min((now-t0)/1200,1); disp.textContent=Math.round(count*(1-Math.pow(1-p,3))).toLocaleString()+' visitors'; if(p<1)requestAnimationFrame(tick); })(performance.now()); }
    } catch{ if(disp)disp.textContent='—'; }
}

//  CURSOR
function initCursor() {
    const ring=g('cursor-ring'), dot=g('cursor-dot-s');
    if(!ring||!dot)return;
    const m={x:-100,y:-100},r={x:-100,y:-100,vx:0,vy:0},d={x:-100,y:-100};
    window.addEventListener('mousemove',e=>{m.x=e.clientX;m.y=e.clientY;});
    (function anim(){
        r.vx+=(m.x-r.x)*.15; r.vy+=(m.y-r.y)*.15; r.vx*=.75; r.vy*=.75; r.x+=r.vx; r.y+=r.vy;
        ring.style.transform=`translate(${r.x}px,${r.y}px) translate(-50%,-50%)`;
        d.x+=(m.x-d.x)*.25; d.y+=(m.y-d.y)*.25;
        dot.style.transform=`translate(${d.x}px,${d.y}px) translate(-50%,-50%)`;
        requestAnimationFrame(anim);
    })();
    document.querySelectorAll('a,button,.case-card,.tool-card').forEach(e=>{ e.addEventListener('mouseover',()=>ring.classList.add('hovered')); e.addEventListener('mouseout',()=>ring.classList.remove('hovered')); });
}

//  Saves static items to Firestore so edit/delete work
async function initStaticDataIfNeeded() {
    // --- PROCESS ---
    const procSnap = await getDocs(collection(db,'process'));
    if(procSnap.empty) {
        const defaults=[
            {id:'p1',step:'01',icon:'🔍',title:'Empathize',desc:'Understanding users through research, interviews, and journey mapping.',order:1},
            {id:'p2',step:'02',icon:'📋',title:'Define',desc:'Crafting a clear problem statement based on user insights.',order:2},
            {id:'p3',step:'03',icon:'💡',title:'Ideate',desc:'Brainstorming creative solutions and exploring possibilities.',order:3},
            {id:'p4',step:'04',icon:'🎨',title:'Design',desc:'Creating wireframes, high-fidelity prototypes and design systems.',order:4},
            {id:'p5',step:'05',icon:'🧪',title:'Test',desc:'Validating designs through usability testing and iteration.',order:5},
        ];
        const batch=writeBatch(db);
        defaults.forEach(item=>{ const {id,...data}=item; batch.set(doc(db,'process',id),{...data,createdAt:serverTimestamp()}); });
        await batch.commit();
    }
    // --- TOOLS ---
    const toolsSnap = await getDocs(collection(db,'tools'));
    if(toolsSnap.empty) {
        const defaults=[
            {id:'t1',name:'Figma',icon:'🎨',category:'Design',level:95},
            {id:'t2',name:'Adobe Photoshop',icon:'🖼',category:'Design',level:80},
            {id:'t3',name:'Adobe Illustrator',icon:'✏️',category:'Design',level:75},
            {id:'t4',name:'User Research',icon:'🔍',category:'Research',level:85},
            {id:'t5',name:'Prototyping',icon:'📱',category:'Prototyping',level:90},
            {id:'t6',name:'JavaScript',icon:'⚡',category:'Technical',level:65},
        ];
        const batch=writeBatch(db);
        defaults.forEach(item=>{ const {id,...data}=item; batch.set(doc(db,'tools',id),{...data,createdAt:serverTimestamp()}); });
        await batch.commit();
    }
    // --- TIMELINE ---
    const tlSnap = await getDocs(collection(db,'timeline'));
    if(tlSnap.empty) {
        const defaults=[
            {id:'s1',year:'2024 – 2028',role:'B.Sc. Computer Science',company:'Egyptian University',icon:'🎓',desc:'Software engineering, algorithms, data structures, and mobile development.',tags:['Computer Science','OOP','Algorithms']},
            {id:'s2',year:'2024 – Present',role:'UI/UX Designer',company:'Freelance',icon:'🎨',desc:'Designing user-centered digital products across e-commerce, healthcare, and service platforms.',tags:['Figma','User Research','Prototyping']},
        ];
        const batch=writeBatch(db);
        defaults.forEach(item=>{ const {id,...data}=item; batch.set(doc(db,'timeline',id),{...data,createdAt:serverTimestamp()}); });
        await batch.commit();
    }
}

//  LOAD SITE SETTINGS
async function loadSiteSettings() {
    try {
        // Hero
        const hero=await getDoc(doc(db,'site_content','hero'));
        if(hero.exists()){ const d=hero.data(); if(d.name)g('hero-name').textContent=d.name; if(d.subtitle)g('hero-subtitle').textContent=d.subtitle; }
        // About
        const about=await getDoc(doc(db,'site_content','about'));
        if(about.exists()){ const d=about.data(); if(d.text)g('about-text').textContent=d.text; if(d.imageUrl){g('about-image').src=d.imageUrl;} }
        // Stats
        const stats=await getDoc(doc(db,'site_content','stats'));
        if(stats.exists()){ const d=stats.data();
            ['projects','clients','hours','screens'].forEach(k=>{ const el=g('stat-'+k); if(el&&d[k]!=null){el.dataset.target=d[k];el.textContent='0';} });
        } else {
            ['stat-projects','stat-clients','stat-hours','stat-screens'].forEach(id=>{ const el=g(id);if(el)el.textContent='—'; });
        }
        // Social links
        const social=await getDoc(doc(db,'site_content','social'));
        if(social.exists()){ const d=social.data();
            if(d.behance)  { const a=g('social-behance');  if(a)a.href=d.behance; }
            if(d.dribbble) { const a=g('social-dribbble'); if(a)a.href=d.dribbble; }
            if(d.linkedin) { const a=g('social-linkedin'); if(a)a.href=d.linkedin; }
        }
    } catch(e){ console.warn('Settings:',e); }
}

//  DESIGN PROCESS
async function loadProcess() {
    const grid=g('process-grid');
    grid.innerHTML='<div class="loader mx-auto"></div>';
    try {
        // Use 'order' numeric field for reliable sorting (serverTimestamp can cause ordering issues with pending writes)
        let snap;
        try{ snap=await getDocs(query(collection(db,'process'),orderBy('order','asc'))); }
        catch{
            try{ snap=await getDocs(query(collection(db,'process'),orderBy('createdAt','asc'))); }
            catch{ snap=await getDocs(collection(db,'process')); }
        }
        grid.innerHTML='';
        if(snap.empty){ renderStaticProcess(grid); return; }
        const items=[]; snap.forEach(d=>items.push({id:d.id,...d.data()}));
        // Sort client-side as fallback
        items.sort((a,b)=>{ const ao=a.order??a.createdAt?.seconds??0, bo=b.order??b.createdAt?.seconds??0; return ao-bo; });
        items.forEach(p=>grid.appendChild(createProcessCard(p)));
        feather.replace(); animateNew();
    } catch(e){ console.error('loadProcess:',e); renderStaticProcess(grid); }
}
function renderStaticProcess(grid){
    const defaults=[
        {id:'p1',step:'01',icon:'🔍',title:'Empathize',desc:'Understanding users through research, interviews, and journey mapping.'},
        {id:'p2',step:'02',icon:'📋',title:'Define',desc:'Crafting a clear problem statement based on user insights.'},
        {id:'p3',step:'03',icon:'💡',title:'Ideate',desc:'Brainstorming creative solutions and exploring possibilities.'},
        {id:'p4',step:'04',icon:'🎨',title:'Design',desc:'Creating wireframes, high-fidelity prototypes and design systems.'},
        {id:'p5',step:'05',icon:'🧪',title:'Test',desc:'Validating designs through usability testing and iteration.'},
    ];
    defaults.forEach(d=>grid.appendChild(createProcessCard(d))); feather.replace(); animateNew();
}
function createProcessCard(p){
    const c=document.createElement('div'); c.className='process-card animate-on-scroll';
    c.innerHTML=`<div class="process-step-num">STEP ${p.step||''}</div><span class="process-emoji">${p.icon||'✨'}</span><h3>${p.title||''}</h3><p>${p.desc||p.description||''}</p>${isAdmin?`<div class="flex gap-2 mt-3 justify-center"><button class="admin-btn edit-btn" onclick="handleEditProcess('${p.id}')">Edit</button><button class="admin-btn delete-btn" onclick="handleDeleteProcess('${p.id}')">Delete</button></div>`:''}`;
    return c;
}
window.handleEditProcess = async id => {
    let data={};
    try{ const snap=await getDoc(doc(db,'process',id)); if(snap.exists())data=snap.data(); }catch{}
    g('process-id').value=id;
    g('process-step').value=data.step||'';
    g('process-icon').value=data.icon||'';
    g('process-title-inp').value=data.title||'';
    g('process-desc').value=data.desc||data.description||'';
    g('process-modal-title').innerText='Edit Process Step';
    openModal('process-modal');
};
window.handleDeleteProcess = async id => {
    if(!confirm('Delete this step?'))return;
    try{ await deleteDoc(doc(db,'process',id)); }catch(e){ toast('Error: '+e.message,'error'); return; }
    loadProcess(); toast('Deleted','info');
};

//  CASE STUDIES
async function loadCaseStudies(){
    const grid=g('cases-grid'); grid.innerHTML='<div class="loader mx-auto"></div>';
    try {
        let snap; try{snap=await getDocs(query(collection(db,'caseStudies'),orderBy('createdAt','desc')));}catch{snap=await getDocs(collection(db,'caseStudies'));}
        grid.innerHTML=''; caseStudies=[];
        if(snap.empty){grid.innerHTML='<p class="col-span-3 text-center text-violet-300 py-12 font-mono">No case studies yet.</p>';return;}
        snap.forEach(d=>{ const cs={id:d.id,...d.data()}; caseStudies.push(cs); grid.appendChild(createCaseCard(cs)); });
        feather.replace(); initCaseFilter(); animateNew();
    } catch(e){grid.innerHTML='<p class="col-span-3 text-center text-red-400 py-8">Error loading.</p>';console.error(e);}
}
function getCategoryClass(cat){ const m={'Mobile App':'badge-mobile','Web App':'badge-web','Healthcare':'badge-healthcare','E-Commerce':'badge-ecommerce','Branding':'badge-branding'}; return m[cat]||'badge-mobile'; }
function createCaseCard(cs){
    const card=document.createElement('div'); card.className='case-card animate-on-scroll'; card.dataset.cat=cs.category||''; card.style.cursor='pointer'; card.onclick=()=>showCaseDetail(cs.id);
    card.innerHTML=`<img src="${cs.thumbnail||'https://placehold.co/600x400/EDE9FE/8B5CF6?text='+encodeURIComponent(cs.title||'Case Study')}" alt="${esc(cs.title)}" loading="lazy"><div class="case-card-body"><span class="case-badge ${getCategoryClass(cs.category)}">${cs.category||'Design'}</span><h3>${esc(cs.title||'')}</h3><p>${esc(cs.description||'')}</p><div class="case-tools">${(cs.tools||[]).slice(0,3).map(t=>`<span class="case-tool-tag">${esc(t)}</span>`).join('')}</div><div class="flex justify-between items-center">${isAdmin?`<div class="flex gap-2"><button class="admin-btn edit-btn" onclick="event.stopPropagation();handleEditCase('${cs.id}')">Edit</button><button class="admin-btn delete-btn" onclick="event.stopPropagation();handleDeleteCase('${cs.id}')">Del</button></div>`:'<span></span>'}<button class="case-view-btn" onclick="event.stopPropagation();showCaseDetail('${cs.id}')">View Study →</button></div></div>`;
    return card;
}
window.showCaseDetail=id=>{ const cs=caseStudies.find(x=>x.id===id); if(!cs)return;
    g('detail-title').innerText=cs.title||''; g('detail-category').className=`case-badge ${getCategoryClass(cs.category)}`; g('detail-category').innerText=cs.category||'';
    g('detail-main-img').src=cs.thumbnail||''; g('detail-challenge').innerText=cs.challenge||''; g('detail-solution').innerText=cs.solution||'';
    g('detail-tools').innerHTML=(cs.tools||[]).map(t=>`<span class="case-tool-tag">${esc(t)}</span>`).join('');
    const gal=g('detail-gallery'); gal.innerHTML=''; (cs.images||[]).forEach(img=>{ const i=document.createElement('img');i.src=img.url||img;i.className='w-full rounded-xl';i.style.cssText='max-height:200px;object-fit:contain;background:#F3EEFF;';gal.appendChild(i); });
    const lc=g('detail-links'); lc.innerHTML='';
    if(cs.prototypeLink){const a=document.createElement('a');a.href=cs.prototypeLink;a.target='_blank';a.className='btn-primary text-sm';a.innerText='View Prototype';lc.appendChild(a);}
    openModal('case-detail-modal');
};
window.handleEditCase=async id=>{ const cs=caseStudies.find(x=>x.id===id);if(!cs)return;
    g('case-id').value=id; g('case-title').value=cs.title||''; g('case-category').value=cs.category||'Mobile App'; g('case-desc').value=cs.description||'';
    g('case-challenge').value=cs.challenge||''; g('case-solution').value=cs.solution||''; g('case-tools').value=(cs.tools||[]).join(', ');
    g('case-thumbnail').value=cs.thumbnail||''; g('case-prototype').value=cs.prototypeLink||'';
    const imgCont=g('case-images-container'); imgCont.innerHTML=''; (cs.images||[]).forEach(img=>addCaseImageRow(img.url||img));
    g('case-modal-title').innerText='Edit Case Study'; openModal('case-modal');
};
window.handleDeleteCase=async id=>{ if(!confirm('Delete?'))return; await deleteDoc(doc(db,'caseStudies',id)); loadCaseStudies();toast('Deleted','info'); };
function addCaseImageRow(url=''){
    const row=document.createElement('div');row.className='flex gap-2';
    row.innerHTML=`<input type="url" placeholder="Image URL" class="modal-input flex-grow additional-case-img" value="${url}"><button type="button" class="modal-btn-ghost rounded-xl px-3" onclick="this.parentElement.remove()">✕</button>`;
    g('case-images-container').appendChild(row);
}
function initCaseFilter(){
    document.querySelectorAll('.filter-btn').forEach(btn=>{
        btn.addEventListener('click',()=>{
            document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
            const cat=btn.dataset.cat;
            document.querySelectorAll('.case-card').forEach(card=>{ card.style.display=(cat==='all'||card.dataset.cat===cat)?'':'none'; });
        });
    });
}

//  TOOLS
async function loadTools(){
    const grid=g('tools-grid'); grid.innerHTML='<div class="loader mx-auto"></div>';
    try {
        let snap; try{snap=await getDocs(query(collection(db,'tools'),orderBy('createdAt','asc')));}catch{snap=await getDocs(collection(db,'tools'));}
        grid.innerHTML='';
        if(snap.empty){ renderStaticTools(grid); return; }
        snap.forEach(d=>grid.appendChild(createToolCard({id:d.id,...d.data()})));
        setTimeout(()=>document.querySelectorAll('.tool-bar-fill').forEach(b=>{ b.style.width=b.dataset.level+'%'; }),100);
        animateNew();
    } catch{ renderStaticTools(grid); }
}
function renderStaticTools(grid){
    const defaults=[
        {id:'t1',name:'Figma',icon:'🎨',category:'Design',level:95},
        {id:'t2',name:'Adobe Photoshop',icon:'🖼',category:'Design',level:80},
        {id:'t3',name:'Adobe Illustrator',icon:'✏️',category:'Design',level:75},
        {id:'t4',name:'User Research',icon:'🔍',category:'Research',level:85},
        {id:'t5',name:'Prototyping',icon:'📱',category:'Prototyping',level:90},
        {id:'t6',name:'JavaScript',icon:'⚡',category:'Technical',level:65},
    ];
    defaults.forEach(d=>grid.appendChild(createToolCard(d)));
    setTimeout(()=>document.querySelectorAll('.tool-bar-fill').forEach(b=>{ b.style.width=b.dataset.level+'%'; }),100);
    animateNew();
}
function createToolCard(t){
    const card=document.createElement('div'); card.className='tool-card animate-on-scroll';
    card.innerHTML=`<span class="tool-emoji">${t.icon||'🎨'}</span><div class="tool-name">${esc(t.name||'')}</div><div class="tool-cat">${esc(t.category||'')}</div><div class="tool-bar-bg"><div class="tool-bar-fill" data-level="${t.level||80}" style="width:0%"></div></div><div class="text-xs mt-1 font-mono" style="color:var(--primary)">${t.level||80}%</div>${isAdmin?`<div class="flex gap-2 mt-3"><button class="admin-btn edit-btn" onclick="handleEditTool('${t.id}')">Edit</button><button class="admin-btn delete-btn" onclick="handleDeleteTool('${t.id}')">Del</button></div>`:''}`;
    return card;
}
window.handleEditTool = async id => {
    let data={};
    try{ const snap=await getDoc(doc(db,'tools',id)); if(snap.exists())data=snap.data(); }catch{}
    g('tool-id').value=id;
    g('tool-name').value=data.name||'';
    g('tool-icon').value=data.icon||'';
    g('tool-category').value=data.category||'Design';
    g('tool-level').value=data.level||80;
    g('tool-level-display').textContent=(data.level||80)+'%';
    g('tool-modal-title').innerText='Edit Tool';
    openModal('tool-modal');
};
window.handleDeleteTool = async id => {
    if(!confirm('Delete this tool?'))return;
    try{ await deleteDoc(doc(db,'tools',id)); }catch(e){ toast('Error: '+e.message,'error'); return; }
    loadTools(); toast('Deleted','info');
};

//  TIMELINE
async function loadTimeline(){
    const cont=g('timeline-container');
    Array.from(cont.children).forEach(el=>{ if(!el.classList.contains('timeline-spine'))el.remove(); });
    const loader=document.createElement('div'); loader.id='timeline-loader'; loader.className='loader mx-auto mt-8'; cont.appendChild(loader);
    try {
        let snap; try{snap=await getDocs(query(collection(db,'timeline'),orderBy('createdAt','asc')));}catch{snap=await getDocs(collection(db,'timeline'));}
        g('timeline-loader')?.remove();
        if(snap.empty){ renderStaticTimeline(cont); return; }
        const items=[]; snap.forEach(d=>items.push({id:d.id,...d.data()}));
        items.sort((a,b)=>{ const yr=s=>{ const m=String(s||'').match(/\d{4}/); return m?+m[0]:0; }; return yr(b.year||b.date)-yr(a.year||a.date); });
        items.forEach(item=>cont.appendChild(createTlCard(item)));
        feather.replace(); animateNew();
    } catch{ g('timeline-loader')?.remove(); renderStaticTimeline(cont); }
}
function renderStaticTimeline(cont){
    const defaults=[
        {id:'s1',year:'2024 – 2028',role:'B.Sc. Computer Science',company:'Egyptian University',icon:'🎓',desc:'Software engineering, algorithms, data structures, and mobile development.',tags:['Computer Science','OOP','Algorithms']},
        {id:'s2',year:'2024 – Present',role:'UI/UX Designer',company:'Freelance',icon:'🎨',desc:'Designing user-centered digital products across e-commerce, healthcare, and service platforms.',tags:['Figma','User Research','Prototyping']},
    ];
    defaults.forEach(d=>cont.appendChild(createTlCard(d))); feather.replace(); animateNew();
}
function createTlCard(item){
    const w=document.createElement('div'); w.className='timeline-item animate-on-scroll';
    w.innerHTML=`<div class="tl-card"><div class="tl-date">${item.year||''} ${item.icon||''}</div><div class="tl-role">${esc(item.role||item.title||'')}</div><div class="tl-company">${esc(item.company||'')}</div><p class="tl-desc">${esc(item.desc||item.description||'')}</p><div class="tl-tags">${(item.tags||[]).map(t=>`<span class="tl-tag">${esc(t)}</span>`).join('')}</div>${isAdmin?`<div class="flex gap-2 mt-3"><button class="admin-btn edit-btn" onclick="handleEditTimeline('${item.id}')">Edit</button><button class="admin-btn delete-btn" onclick="handleDeleteTimeline('${item.id}')">Delete</button></div>`:''}</div>`;
    return w;
}
window.handleEditTimeline=async id=>{ let data={};
    try{ const snap=await getDoc(doc(db,'timeline',id)); if(snap.exists())data=snap.data(); }catch{}
    g('timeline-id').value=id; g('timeline-year').value=data.year||''; g('timeline-role').value=data.role||data.title||''; g('timeline-company').value=data.company||''; g('timeline-icon').value=data.icon||''; g('timeline-desc').value=data.desc||data.description||''; g('timeline-tags').value=(data.tags||[]).join(', '); g('timeline-modal-title').innerText='Edit Timeline Item'; openModal('timeline-modal');
};
window.handleDeleteTimeline=async id=>{ if(!confirm('Delete?'))return;
    try{ await deleteDoc(doc(db,'timeline',id)); }catch(e){ toast('Error: '+e.message,'error'); return; }
    loadTimeline(); toast('Deleted','info');
};

//  TESTIMONIALS
async function loadTestimonials(){
    const grid=g('testimonials-grid'); grid.innerHTML='<div class="loader mx-auto col-span-3"></div>';
    try {
        let snap; try{snap=await getDocs(query(collection(db,'testimonials'),where('status','==','approved'),orderBy('timestamp','desc')));}catch{snap=await getDocs(query(collection(db,'testimonials'),where('status','==','approved')));}
        grid.innerHTML=''; if(snap.empty){grid.innerHTML='<p class="col-span-3 text-center font-mono text-sm py-12" style="color:var(--muted)">No reviews yet. Be the first! 💫</p>';return;}
        snap.forEach(d=>{ const t={id:d.id,...d.data()}; const stars='★'.repeat(t.rating||5)+'☆'.repeat(5-(t.rating||5)); const ini=(t.name||'A').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
            const card=document.createElement('div'); card.className='testimonial-card animate-on-scroll';
            card.innerHTML=`<div class="t-stars">${stars}</div><p class="t-message">"${esc(t.message)}"</p><div class="t-author"><div class="t-avatar">${ini}</div><div><p class="t-name">${esc(t.name)}</p><p class="t-role-txt">${esc(t.role||'')}</p></div>${isAdmin?`<div class="ml-auto"><button class="admin-btn delete-btn" onclick="handleDeleteTestimonial('${d.id}')">Del</button></div>`:''}</div>`;
            grid.appendChild(card); });
        animateNew();
    } catch(e){ grid.innerHTML='<p class="col-span-3 text-center py-8" style="color:var(--muted)">Unable to load reviews.</p>'; console.error(e); }
}
async function loadPendingTestimonials(){
    const list=g('pending-testimonials-list'); list.innerHTML='<div class="loader mx-auto"></div>';
    try {
        let snap; try{snap=await getDocs(query(collection(db,'testimonials'),where('status','==','pending'),orderBy('timestamp','desc')));}catch{snap=await getDocs(query(collection(db,'testimonials'),where('status','==','pending')));}
        list.innerHTML=''; if(snap.empty){list.innerHTML='<p class="text-center py-8 font-mono" style="color:var(--muted)">No pending reviews 🎉</p>';return;}
        snap.forEach(d=>{ const t=d.data(); const card=document.createElement('div'); card.className='pending-t-card';
            card.innerHTML=`<div class="flex justify-between items-start mb-2"><div><p class="font-bold text-sm">${esc(t.name)}<span class="font-normal" style="color:var(--muted)"> — ${esc(t.role||'')}</span></p><p class="text-pink-400 text-xs">${'★'.repeat(t.rating||5)}</p></div><div class="flex gap-2"><button class="admin-btn edit-btn" onclick="handleApproveTestimonial('${d.id}',this)">Approve</button><button class="admin-btn delete-btn" onclick="handleDeleteTestimonial('${d.id}',true)">Reject</button></div></div><p class="text-sm" style="color:var(--muted)">${esc(t.message)}</p>`;
            list.appendChild(card); });
    } catch{ list.innerHTML='<p class="text-center text-red-400">Error loading.</p>'; }
}
window.handleApproveTestimonial=async(id,btn)=>{ btn.textContent='...'; await updateDoc(doc(db,'testimonials',id),{status:'approved'}); btn.closest('.pending-t-card').remove(); toast('Approved! ✨','success'); loadTestimonials(); };
window.handleDeleteTestimonial=async(id,isPending=false)=>{ if(!confirm('Delete?'))return; await deleteDoc(doc(db,'testimonials',id)); toast('Deleted','info'); if(isPending)loadPendingTestimonials();else loadTestimonials(); };

//  HELPERS
function openModal(id){ g(id).classList.remove('hidden'); document.body.style.overflow='hidden'; }
function closeModal(id){ g(id).classList.add('hidden'); document.body.style.overflow=''; }
function animateNew(){ document.querySelectorAll('.animate-on-scroll:not(.is-visible)').forEach(e=>scrollObs&&scrollObs.observe(e)); }

function initStarRating(){
    const stars=document.querySelectorAll('#star-rating .star'),inp=g('t-rating');
    stars.forEach(s=>{ s.addEventListener('mouseover',()=>{ const v=+s.dataset.val; stars.forEach((x,i)=>x.classList.toggle('filled',i<v)); }); s.addEventListener('mouseout',()=>{ const v=+inp.value||0; stars.forEach((x,i)=>x.classList.toggle('filled',i<v)); }); s.addEventListener('click',()=>{ const v=+s.dataset.val; inp.value=v; stars.forEach((x,i)=>x.classList.toggle('filled',i<v)); }); });
}

//  MAIN
document.addEventListener('DOMContentLoaded', async () => {
    feather.replace();
    initTheme();
    initLoading(); initScroll(); initMobileMenu(); initTypewriter(); initStarRating();
    setTimeout(initCursor, 500);

    scrollObs = new IntersectionObserver(entries=>{ entries.forEach(e=>{ if(e.isIntersecting)e.target.classList.add('is-visible'); }); },{threshold:0.08});
    document.querySelectorAll('.animate-on-scroll').forEach(e=>scrollObs.observe(e));

    await Promise.all([
        loadSiteSettings().catch(e=>console.warn('settings:',e)),
        loadProcess().catch(e=>console.warn('process:',e)),
        loadCaseStudies().catch(e=>console.warn('cases:',e)),
        loadTools().catch(e=>console.warn('tools:',e)),
        loadTimeline().catch(e=>console.warn('timeline:',e)),
        loadTestimonials().catch(e=>console.warn('testimonials:',e)),
        initVisitors().catch(e=>console.warn('visitors:',e)),
    ]);
    initStats();

    // AUTH
    onAuthStateChanged(auth, async user => {
        isAdmin=!!user;
        g('login-btn').classList.toggle('hidden',isAdmin);
        g('logout-btn').classList.toggle('hidden',!isAdmin);
        ['add-process-btn','add-case-btn','add-tool-btn','add-timeline-btn','edit-stats-btn'].forEach(id=>{ const b=g(id);if(b)b.classList.toggle('hidden',!isAdmin); });
        ['edit-hero-name-btn','edit-hero-subtitle-btn','edit-about-btn','edit-social-btn'].forEach(id=>{ const b=g(id);if(b)b.style.display=isAdmin?'inline-flex':'none'; });
        if(isAdmin&&!g('reviews-btn')){
            const rb=document.createElement('button');rb.id='reviews-btn';rb.className='nav-btn-ghost text-xs';rb.textContent='⚡ Reviews';
            rb.onclick=()=>{openModal('testimonial-admin-modal');loadPendingTestimonials();};
            g('logout-btn').before(rb);
        }
        if(g('reviews-btn'))g('reviews-btn').classList.toggle('hidden',!isAdmin);

        if(isAdmin) {
            // Save static data to Firestore so edit/delete work — AWAIT before re-rendering
            await initStaticDataIfNeeded();
        }
        // Re-render with/without admin controls (after static data is saved)
        await Promise.all([loadProcess(), loadCaseStudies(), loadTools(), loadTimeline(), loadTestimonials()]);
    });

    // Login / Logout
    g('login-btn').addEventListener('click',()=>openModal('login-modal'));
    g('login-form').addEventListener('submit',async e=>{ e.preventDefault(); const btn=g('login-submit-btn');btn.textContent='...';
        try{ await signInWithEmailAndPassword(auth,g('email').value,g('password').value); closeModal('login-modal');toast('Welcome, Sandy! ✨','success'); }
        catch{ g('login-error').textContent='Invalid credentials.'; }finally{btn.textContent='Login';} });
    g('logout-btn').addEventListener('click',async()=>{ await signOut(auth);toast('Logged out','info'); });

    // Close modals
    document.querySelectorAll('.modal-overlay').forEach(m=>{ m.addEventListener('click',e=>{ if(e.target===m||e.target.classList.contains('modal-close'))closeModal(m.id); }); });

    //  Hero edit 
    g('edit-hero-name-btn').addEventListener('click',()=>{ g('text-edit-modal-title').textContent='Edit Name'; g('text-edit-doc').value='hero'; g('text-edit-field').value='name'; g('text-edit-content').value=g('hero-name').textContent; openModal('text-edit-modal'); });
    g('edit-hero-subtitle-btn').addEventListener('click',()=>{ g('text-edit-modal-title').textContent='Edit Subtitle'; g('text-edit-doc').value='hero'; g('text-edit-field').value='subtitle'; g('text-edit-content').value=g('hero-subtitle').textContent; openModal('text-edit-modal'); });
    g('text-edit-form').addEventListener('submit',async e=>{ e.preventDefault();
        const docName=g('text-edit-doc').value,field=g('text-edit-field').value,content=g('text-edit-content').value;
        try{ await setDoc(doc(db,'site_content',docName),{[field]:content},{merge:true});
            if(field==='name')g('hero-name').textContent=content;
            if(field==='subtitle')g('hero-subtitle').textContent=content;
            closeModal('text-edit-modal');toast('Updated! ✓','success'); }catch{toast('Error','error');} });

    //  About edit 
    g('edit-about-btn').addEventListener('click',()=>{ g('about-modal-text').value=g('about-text').textContent.trim(); g('about-image-url').value=g('about-image').src; openModal('about-modal'); });
    g('about-form').addEventListener('submit',async e=>{ e.preventDefault();
        const text=g('about-modal-text').value,imageUrl=g('about-image-url').value;
        try{ await setDoc(doc(db,'site_content','about'),{text,imageUrl},{merge:true});
            g('about-text').textContent=text;
            if(imageUrl&&!imageUrl.startsWith('https://placehold'))g('about-image').src=imageUrl;
            closeModal('about-modal');toast('About updated! ✓','success'); }catch{toast('Error','error');} });

    //  Social links edit 
    g('edit-social-btn').addEventListener('click',async ()=>{
        try{ const snap=await getDoc(doc(db,'site_content','social'));
            if(snap.exists()){ const d=snap.data(); g('social-behance-url').value=d.behance||''; g('social-dribbble-url').value=d.dribbble||''; g('social-linkedin-url').value=d.linkedin||''; }
        }catch{}
        openModal('social-modal');
    });
    g('social-form').addEventListener('submit',async e=>{ e.preventDefault();
        const behance=g('social-behance-url').value,dribbble=g('social-dribbble-url').value,linkedin=g('social-linkedin-url').value;
        try{ await setDoc(doc(db,'site_content','social'),{behance,dribbble,linkedin},{merge:true});
            if(behance){ const a=g('social-behance');if(a)a.href=behance; }
            if(dribbble){ const a=g('social-dribbble');if(a)a.href=dribbble; }
            if(linkedin){ const a=g('social-linkedin');if(a)a.href=linkedin; }
            closeModal('social-modal');toast('Social links updated! ✓','success'); }catch{toast('Error','error');} });

    //  Stats edit 
    g('edit-stats-btn').addEventListener('click',()=>{ g('se-projects').value=g('stat-projects')?.dataset.target||0; g('se-clients').value=g('stat-clients')?.dataset.target||0; g('se-hours').value=g('stat-hours')?.dataset.target||0; g('se-screens').value=g('stat-screens')?.dataset.target||0; openModal('stats-modal'); });
    g('stats-form').addEventListener('submit',async e=>{ e.preventDefault();
        const projects=+g('se-projects').value,clients=+g('se-clients').value,hours=+g('se-hours').value,screens=+g('se-screens').value;
        try{ await setDoc(doc(db,'site_content','stats'),{projects,clients,hours,screens},{merge:true});
            ['stat-projects','stat-clients','stat-hours','stat-screens'].forEach((id,i)=>{ const el=g(id),v=[projects,clients,hours,screens][i]; if(el){el.dataset.target=v;el.textContent='0';} });
            closeModal('stats-modal');initStats();toast('Stats updated! ✓','success'); }catch{toast('Error','error');} });

    //  Process 
    g('add-process-btn').addEventListener('click',()=>{ g('process-id').value='';g('process-form').reset();g('process-modal-title').innerText='Add Process Step';openModal('process-modal'); });
    g('process-form').addEventListener('submit',async e=>{ e.preventDefault(); const id=g('process-id').value;
        const data={step:g('process-step').value,icon:g('process-icon').value,title:g('process-title-inp').value,desc:g('process-desc').value};
        try{
            if(id) {
                await setDoc(doc(db,'process',id),data,{merge:true});
            } else {
                // Use numeric timestamp for immediate ordering (no serverTimestamp pending issues)
                await addDoc(collection(db,'process'),{...data, order: Date.now(), createdAt: serverTimestamp()});
            }
            closeModal('process-modal');
            await loadProcess();
            toast('Saved! ✓','success');
        }catch(err){ toast('Error: '+err.message,'error',6000); console.error(err); } });

    //  Case Study 
    g('add-case-btn').addEventListener('click',()=>{ g('case-id').value='';g('case-form').reset();g('case-images-container').innerHTML='';g('case-modal-title').innerText='Add Case Study';openModal('case-modal'); });
    g('add-case-img-btn').addEventListener('click',()=>addCaseImageRow());
    g('case-form').addEventListener('submit',async e=>{ e.preventDefault(); const id=g('case-id').value;
        const images=Array.from(document.querySelectorAll('.additional-case-img')).map(x=>({url:x.value})).filter(x=>x.url);
        const data={title:g('case-title').value,category:g('case-category').value,description:g('case-desc').value,challenge:g('case-challenge').value,solution:g('case-solution').value,tools:g('case-tools').value.split(',').map(t=>t.trim()).filter(Boolean),thumbnail:g('case-thumbnail').value,prototypeLink:g('case-prototype').value,images};
        try{ if(id)await setDoc(doc(db,'caseStudies',id),data,{merge:true}); else await addDoc(collection(db,'caseStudies'),{...data,createdAt:serverTimestamp()});
            closeModal('case-modal');loadCaseStudies();toast('Case study saved! ✓','success'); }catch(err){toast('Error: '+err.message,'error',6000);} });

    //  Tool 
    g('add-tool-btn').addEventListener('click',()=>{ g('tool-id').value='';g('tool-form').reset();g('tool-level-display').textContent='80%';g('tool-modal-title').innerText='Add Tool';openModal('tool-modal'); });
    g('tool-level').addEventListener('input',()=>{ g('tool-level-display').textContent=g('tool-level').value+'%'; });
    g('tool-form').addEventListener('submit',async e=>{ e.preventDefault(); const id=g('tool-id').value;
        const data={name:g('tool-name').value,icon:g('tool-icon').value,category:g('tool-category').value,level:+g('tool-level').value};
        try{ if(id)await setDoc(doc(db,'tools',id),data,{merge:true}); else await addDoc(collection(db,'tools'),{...data,createdAt:serverTimestamp()});
            closeModal('tool-modal');loadTools();toast('Tool saved! ✓','success'); }catch(err){toast('Error: '+err.message,'error');} });

    //  Timeline 
    g('add-timeline-btn').addEventListener('click',()=>{ g('timeline-id').value='';g('timeline-form').reset();g('timeline-modal-title').innerText='Add Timeline Item';openModal('timeline-modal'); });
    g('timeline-form').addEventListener('submit',async e=>{ e.preventDefault(); const id=g('timeline-id').value;
        const data={year:g('timeline-year').value,role:g('timeline-role').value,company:g('timeline-company').value,icon:g('timeline-icon').value||'🎓',desc:g('timeline-desc').value,tags:g('timeline-tags').value.split(',').map(t=>t.trim()).filter(Boolean)};
        try{ if(id)await setDoc(doc(db,'timeline',id),data,{merge:true}); else await addDoc(collection(db,'timeline'),{...data,createdAt:serverTimestamp()});
            closeModal('timeline-modal');loadTimeline();toast('Saved! ✓','success'); }catch(err){toast('Error: '+err.message,'error');} });

    //  Testimonials 
    g('leave-feedback-btn').addEventListener('click',()=>openModal('testimonial-modal'));
    g('testimonial-form').addEventListener('submit',async e=>{ e.preventDefault(); const rating=+g('t-rating').value; if(!rating){toast('Please select a rating! ⭐','error');return;} g('testimonial-submit-btn').disabled=true;
        try{ await addDoc(collection(db,'testimonials'),{name:g('t-name').value,role:g('t-role').value,message:g('t-message').value,rating,status:'pending',timestamp:serverTimestamp()});
            closeModal('testimonial-modal');g('testimonial-form').reset();document.querySelectorAll('#star-rating .star').forEach(s=>s.classList.remove('filled'));g('t-rating').value='0';
            toast('Review submitted! 💫 Awaiting approval.','success',5000); }catch{toast('Error','error');}finally{g('testimonial-submit-btn').disabled=false;} });

    //  Copy email 
    g('copy-email-btn').addEventListener('click',()=>{ navigator.clipboard.writeText('sandyayman782@gmail.com').then(()=>{ const m=g('copy-success-msg');m.classList.remove('opacity-0');toast('Email copied! ✓','success',2000);setTimeout(()=>m.classList.add('opacity-0'),2000); }); });

    g('year').textContent=new Date().getFullYear();
});
