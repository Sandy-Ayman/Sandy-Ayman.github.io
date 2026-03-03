import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app-check.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, writeBatch, getDoc, increment, where } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC9c5yk7Smmjk3PRJgJm24PmXJfr0XpBlc",
    authDomain: "robert-portfolio-98d71.firebaseapp.com",
    projectId: "robert-portfolio-98d71",
    storageBucket: "robert-portfolio-98d71.firebasestorage.app",
    messagingSenderId: "125447409289",
    appId: "1:125447409289:web:010585084cc2a0fe8ec058",
    measurementId: "G-FS62VLHDGH"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LcsLsArAAAAAIKuIslOZOQSSr7HSlZZD2qVHWhD'),
    isTokenAutoRefreshEnabled: true
});

// =====================================================
//  TOAST NOTIFICATION SYSTEM
// =====================================================
function showToast(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span style="font-size:1rem">${icons[type]}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// =====================================================
//  LOADING SCREEN
// =====================================================
function initLoadingScreen() {
    const screen = document.getElementById('loading-screen');
    const bar = document.getElementById('loading-bar');
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) { progress = 100; clearInterval(interval); }
        bar.style.width = progress + '%';
    }, 120);
    window.addEventListener('load', () => {
        setTimeout(() => {
            bar.style.width = '100%';
            setTimeout(() => screen.classList.add('fade-out'), 300);
        }, 500);
    });
    setTimeout(() => screen.classList.add('fade-out'), 3000);
}

// =====================================================
//  SCROLL PROGRESS BAR
// =====================================================
function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    const backToTop = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        bar.style.width = scrolled + '%';
        if (window.scrollY > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }, { passive: true });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// =====================================================
//  MOBILE MENU
// =====================================================
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    let isOpen = false;
    btn.addEventListener('click', () => {
        isOpen = !isOpen;
        menu.classList.toggle('hidden', !isOpen);
        const icon = document.getElementById('menu-icon');
        icon.setAttribute('data-feather', isOpen ? 'x' : 'menu');
        feather.replace();
    });
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => {
            isOpen = false;
            menu.classList.add('hidden');
            document.getElementById('menu-icon').setAttribute('data-feather', 'menu');
            feather.replace();
        });
    });
}

// =====================================================
//  TYPEWRITER EFFECT
// =====================================================
function initTypewriter() {
    const el = document.getElementById('typewriter');
    if (!el) return;
    const texts = [
        'Android Apps 📱',
        'Kotlin Solutions 🛠️',
        'Jetpack Compose UI ✨',
        'Clean Architecture 🏗️',
        'Scalable Apps 🚀',
    ];
    let i = 0, j = 0, isDeleting = false;
    function type() {
        const current = texts[i];
        el.textContent = isDeleting ? current.substring(0, j--) : current.substring(0, j++);
        let delay = isDeleting ? 50 : 80;
        if (!isDeleting && j === current.length + 1) { delay = 1800; isDeleting = true; }
        else if (isDeleting && j < 0) { isDeleting = false; j = 0; i = (i + 1) % texts.length; delay = 300; }
        setTimeout(type, delay);
    }
    type();
}

// =====================================================
//  ANIMATED STATS COUNTERS
// =====================================================
function animateCounter(el, target, duration = 1500) {
    const start = 0;
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (target - start) * eased);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function initStatsCounters() {
    const statsSection = document.getElementById('stats');
    if (!statsSection) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.stat-number[data-target]').forEach(el => {
                    const target = parseInt(el.dataset.target);
                    animateCounter(el, target);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    observer.observe(statsSection);
}

// =====================================================
//  VISITOR COUNTER
// =====================================================
async function initVisitorCounter() {
    const display = document.getElementById('visitor-count-display');
    try {
        const counterRef = doc(db, 'siteStats', 'visitors');
        const snap = await getDoc(counterRef);
        let count = snap.exists() ? (snap.data().count || 0) : 0;

        // Only count once per session
        if (!sessionStorage.getItem('hasVisited')) {
            sessionStorage.setItem('hasVisited', 'true');
            await setDoc(counterRef, { count: increment(1) }, { merge: true });
            count++;
        }

        // Animate the counter display
        if (display) {
            let shown = 0;
            const duration = 1200;
            const startTime = performance.now();
            function update(t) {
                const p = Math.min((t - startTime) / duration, 1);
                shown = Math.round(count * (1 - Math.pow(1 - p, 3)));
                display.textContent = shown.toLocaleString() + ' visitors';
                if (p < 1) requestAnimationFrame(update);
            }
            requestAnimationFrame(update);
        }
    } catch (e) {
        if (display) display.textContent = '—';
    }
}

// =====================================================
//  TESTIMONIALS
// =====================================================
async function loadTestimonials() {
    const grid = document.getElementById('testimonials-grid');
    const loader = document.getElementById('testimonials-loader');

    try {
        const q = query(collection(db, 'testimonials'), where('status', '==', 'approved'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);

        if (loader) loader.remove();
        grid.innerHTML = '';

        if (snap.empty) {
            grid.innerHTML = '<p class="col-span-3 text-center text-gray-500 font-mono text-sm py-12">No reviews yet. Be the first! 🌟</p>';
            return;
        }

        snap.forEach(docSnap => {
            const t = docSnap.data();
            const stars = '★'.repeat(t.rating || 5) + '☆'.repeat(5 - (t.rating || 5));
            const initials = (t.name || 'A').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
            const card = document.createElement('div');
            card.className = 'testimonial-card animate-on-scroll';
            card.innerHTML = `
                <div class="testimonial-stars">${stars}</div>
                <p class="testimonial-message">${escapeHtml(t.message)}</p>
                <div class="testimonial-author">
                    <div class="testimonial-avatar">${initials}</div>
                    <div>
                        <p class="testimonial-name">${escapeHtml(t.name)}</p>
                        <p class="testimonial-role">${escapeHtml(t.role || '')}</p>
                    </div>
                    ${isAdmin ? `<div class="ml-auto flex gap-2">
                        <button class="delete-btn admin-btn" onclick="handleDeleteTestimonial('${docSnap.id}')">Delete</button>
                    </div>` : ''}
                </div>`;
            grid.appendChild(card);
        });

        // Re-observe new elements
        document.querySelectorAll('.animate-on-scroll:not(.is-visible)').forEach(el => scrollObserver.observe(el));
        feather.replace();

    } catch (e) {
        if (loader) loader.remove();
        grid.innerHTML = '<p class="col-span-3 text-center text-gray-400 py-8">Unable to load reviews.</p>';
    }
}

async function submitTestimonial(name, role, message, rating) {
    await addDoc(collection(db, 'testimonials'), {
        name, role, message, rating,
        status: 'pending',
        timestamp: serverTimestamp()
    });
}

async function loadPendingTestimonials() {
    const list = document.getElementById('pending-testimonials-list');
    list.innerHTML = '<div class="loader mx-auto"></div>';
    try {
        const q = query(collection(db, 'testimonials'), where('status', '==', 'pending'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        list.innerHTML = '';
        if (snap.empty) {
            list.innerHTML = '<p class="text-center text-gray-400 py-8 font-mono text-sm">No pending reviews 🎉</p>';
            return;
        }
        snap.forEach(docSnap => {
            const t = docSnap.data();
            const stars = '★'.repeat(t.rating || 5);
            const card = document.createElement('div');
            card.className = 'pending-t-card';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="font-bold text-sm">${escapeHtml(t.name)} <span class="font-normal text-gray-400">— ${escapeHtml(t.role || '')}</span></p>
                        <p class="text-yellow-400 text-xs">${stars}</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="edit-btn admin-btn" onclick="handleApproveTestimonial('${docSnap.id}', this)">Approve</button>
                        <button class="delete-btn admin-btn" onclick="handleDeleteTestimonial('${docSnap.id}', true)">Reject</button>
                    </div>
                </div>
                <p class="text-sm text-gray-300">${escapeHtml(t.message)}</p>`;
            list.appendChild(card);
        });
    } catch (e) {
        list.innerHTML = '<p class="text-center text-red-400">Error loading reviews.</p>';
    }
}

window.handleApproveTestimonial = async (id, btn) => {
    btn.textContent = '...';
    await updateDoc(doc(db, 'testimonials', id), { status: 'approved' });
    btn.closest('.pending-t-card').remove();
    showToast('Review approved!', 'success');
    loadTestimonials();
};

window.handleDeleteTestimonial = async (id, isPending = false) => {
    if (!confirm('Delete this review?')) return;
    await deleteDoc(doc(db, 'testimonials', id));
    showToast('Review deleted.', 'info');
    if (isPending) loadPendingTestimonials();
    else loadTestimonials();
};

function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// =====================================================
//  STAR RATING WIDGET
// =====================================================
function initStarRating() {
    const stars = document.querySelectorAll('#star-rating .star');
    const ratingInput = document.getElementById('t-rating');
    stars.forEach(star => {
        star.addEventListener('mouseover', () => {
            const val = parseInt(star.dataset.val);
            stars.forEach((s, i) => s.classList.toggle('filled', i < val));
        });
        star.addEventListener('mouseout', () => {
            const current = parseInt(ratingInput.value) || 0;
            stars.forEach((s, i) => s.classList.toggle('filled', i < current));
        });
        star.addEventListener('click', () => {
            const val = parseInt(star.dataset.val);
            ratingInput.value = val;
            stars.forEach((s, i) => s.classList.toggle('filled', i < val));
        });
    });
}

// =====================================================
//  THEMES
// =====================================================
let isAdmin = false;
let projects = [];
let scrollObserver;

const themes = {
    dark: {
        cursorColor: '#00f15e',
        body: 'bg-black text-gray-200 theme-dark',
        bgLayer1: 'bg-black bg-[radial-gradient(#e5e7eb0f_1px,transparent_1px)] [background-size:16px_16px]',
        bgLayer1Fade: 'opacity-100',
        bgLayer2: 'bg-[radial-gradient(circle_500px_at_50%_200px,rgba(0,241,94,0.12),transparent)]',
        bgLayer2Fade: 'opacity-100',
        navbar: 'bg-black/80 backdrop-blur-sm border-b border-gray-900',
        navLogo: 'text-white',
        navLink: 'text-gray-300 hover:text-[#00f15e]',
        heroTitle: 'text-white',
        heroName: 'text-white',
        heroSubtitle: 'text-gray-400',
        sectionTitle: 'text-white', sectionText: 'text-gray-400',
        underline: 'bg-[#00f15e]',
        aboutImage: 'ring-[#00f15e]/20',
        principleCard: 'bg-gray-900/80 border border-gray-800 hover:border-[#00f15e]/30',
        principleIcon: 'text-[#00f15e]',
        skillsContainer: 'text-gray-300',
        projectCard: 'bg-gray-900/80 border border-gray-800 hover:border-[#00f15e]/30',
        addBtn: 'bg-[#00f15e]/10 hover:bg-[#00f15e]/20 text-[#00f15e] border border-[#00f15e]/20',
        emailContainer: 'bg-gray-900/80 border border-gray-800',
        emailText: 'text-gray-300',
        copyBtn: 'bg-gray-800 hover:bg-gray-700 text-gray-300',
        mailtoBtn: 'bg-[#00f15e] hover:bg-[#00c74d] text-gray-900',
        footer: 'bg-black border-gray-900 text-gray-500',
        modalContent: 'bg-[#0a0a0a] border border-gray-800 text-white',
        modalInput: 'bg-gray-900 border border-gray-700 text-white focus:ring-[#00f15e] placeholder:text-gray-600',
        modalSubmit: 'bg-[#00f15e] hover:bg-[#00c74d] text-black',
        modalClose: 'text-gray-400 hover:text-white',
        detailLinkSource: 'bg-gray-800 hover:bg-gray-700 text-white',
        detailLinkLive: 'bg-[#00f15e] hover:bg-[#00c74d] text-gray-900',
        activeThumb: 'border-[#00f15e]',
        mobileMenu: 'bg-black/95 backdrop-blur-sm border-b border-gray-900',
        navLogoAccent: '#00f15e',
    },
    light: {
        cursorColor: '#2563eb',
        body: 'bg-slate-50 text-slate-800 theme-light',
        bgLayer1: 'bg-slate-50',
        bgLayer1Fade: 'opacity-100',
        bgLayer2: 'bg-[radial-gradient(circle_800px_at_50%_200px,rgba(37,99,235,0.07),transparent)]',
        bgLayer2Fade: 'opacity-100',
        navbar: 'bg-white/90 backdrop-blur-md border-b border-slate-100',
        navLogo: 'text-slate-900',
        navLink: 'text-slate-600 hover:text-blue-600',
        heroTitle: 'text-slate-900',
        heroName: 'text-slate-900',
        heroSubtitle: 'text-slate-500',
        sectionTitle: 'text-slate-900', sectionText: 'text-slate-600',
        underline: 'bg-blue-600',
        aboutImage: 'ring-blue-600/20',
        principleCard: 'bg-white border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md',
        principleIcon: 'text-blue-600',
        skillsContainer: 'text-slate-700',
        projectCard: 'bg-white border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md',
        addBtn: 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100',
        emailContainer: 'bg-white border border-slate-200 shadow-sm',
        emailText: 'text-slate-700',
        copyBtn: 'bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600',
        mailtoBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20',
        footer: 'bg-white border-slate-100 text-slate-400',
        modalContent: 'bg-white text-slate-800 shadow-2xl',
        modalInput: 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-blue-500 placeholder:text-slate-400',
        modalSubmit: 'bg-blue-600 hover:bg-blue-700 text-white',
        modalClose: 'text-slate-400 hover:text-slate-800',
        detailLinkSource: 'bg-slate-100 hover:bg-slate-200 text-slate-800',
        detailLinkLive: 'bg-blue-600 hover:bg-blue-700 text-white',
        activeThumb: 'border-blue-600',
        mobileMenu: 'bg-white/95 backdrop-blur-sm border-b border-slate-100',
        navLogoAccent: '#2563eb',
    }
};

function applyTheme(themeName) {
    const theme = themes[themeName];
    if (!theme) return;
    document.documentElement.style.setProperty('--cursor-color', theme.cursorColor);

    document.body.className = '';
    document.body.classList.add(...theme.body.split(' ').filter(Boolean));

    const setClasses = (elements, classes) => {
        if (!elements) return;
        const list = elements.length !== undefined ? Array.from(elements) : [elements];
        list.forEach(el => {
            if (!el || typeof el.setAttribute !== 'function') return;
            const preserved = (el.getAttribute('class') || '').split(' ').filter(c =>
                c && !c.startsWith('bg-') && !c.startsWith('text-') && !c.startsWith('border-') &&
                !c.startsWith('ring-') && !c.startsWith('shadow-') && !c.startsWith('hover:') &&
                !c.startsWith('backdrop-') && !c.startsWith('placeholder:') && !c.startsWith('focus:') &&
                !c.startsWith('opacity-') && !c.startsWith('theme-')
            ).join(' ');
            el.setAttribute('class', `${preserved} ${classes}`.trim());
        });
    };

    setClasses(document.getElementById('bg-layer-1'), `${theme.bgLayer1} ${theme.bgLayer1Fade}`);
    setClasses(document.getElementById('bg-layer-2'), `${theme.bgLayer2} ${theme.bgLayer2Fade}`);
    setClasses(document.getElementById('navbar'), theme.navbar);
    setClasses(document.getElementById('nav-logo'), `${theme.navLogo} text-xl font-black tracking-wider`);
    setClasses(document.querySelectorAll('.nav-link'), theme.navLink);
    setClasses(document.querySelectorAll('.mobile-nav-link'), theme.navLink);
    setClasses(document.getElementById('hero-title'), theme.heroTitle);
    setClasses(document.getElementById('hero-name'), theme.heroName);
    setClasses(document.getElementById('hero-subtitle'), theme.heroSubtitle);
    setClasses(document.getElementById('about-title'), theme.sectionTitle);
    setClasses(document.getElementById('about-text'), theme.sectionText);
    setClasses(document.getElementById('about-underline'), theme.underline);
    setClasses(document.getElementById('about-image'), theme.aboutImage);
    setClasses(document.getElementById('principles-title'), theme.sectionTitle);
    setClasses(document.getElementById('principles-underline'), theme.underline);
    setClasses(document.getElementById('skills-title'), theme.sectionTitle);
    setClasses(document.getElementById('skills-underline'), theme.underline);
    setClasses(document.getElementById('skills-container'), theme.skillsContainer);
    setClasses(document.getElementById('projects-title'), theme.sectionTitle);
    setClasses(document.getElementById('projects-underline-line'), theme.underline);
    setClasses(document.getElementById('timeline-title'), theme.sectionTitle);
    setClasses(document.getElementById('timeline-underline'), theme.underline);
    setClasses(document.getElementById('contact-title'), theme.sectionTitle);
    setClasses(document.getElementById('contact-text'), theme.sectionText);
    setClasses(document.getElementById('contact-underline'), theme.underline);
    setClasses(document.getElementById('email-container'), theme.emailContainer);
    setClasses(document.getElementById('email-text'), theme.emailText);
    setClasses(document.getElementById('copy-email-btn'), theme.copyBtn);
    setClasses(document.getElementById('mailto-btn'), theme.mailtoBtn);
    setClasses(document.getElementById('footer'), `${theme.footer} border-t`);
    setClasses(document.getElementById('mobile-menu'), theme.mobileMenu);
    setClasses([
        document.getElementById('add-project-btn'),
        document.getElementById('add-principle-btn'),
        document.getElementById('add-skill-btn')
    ].filter(Boolean), theme.addBtn);

    document.querySelectorAll('.modal-content').forEach(el => setClasses(el, theme.modalContent));
    document.querySelectorAll('.modal-input').forEach(el => setClasses(el, theme.modalInput));
    document.querySelectorAll('.modal-close').forEach(el => setClasses(el, theme.modalClose));
    [
        'login-submit-btn', 'project-submit-btn', 'principle-submit-btn',
        'skill-submit-btn', 'about-submit-btn', 'text-edit-submit-btn', 'testimonial-submit-btn'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) setClasses(el, theme.modalSubmit);
    });

    // Logo accent color
    const accent = document.getElementById('nav-logo-accent');
    if (accent) accent.style.color = theme.navLogoAccent;

    localStorage.setItem('portfolioTheme', themeName);
    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === themeName));
    renderAllContent();
}

// =====================================================
//  FIREBASE DATA LOADING
// =====================================================
async function loadAllData() {
    await Promise.all([
        loadSiteSettings(),
        loadPrinciples(),
        loadSkills(),
        loadProjects(),
        loadTimeline(),
        loadTestimonials(),
        initVisitorCounter(),
    ]);
}

// ── TIMELINE (fully editable) ─────────────────────
async function loadTimeline() {
    const cont = document.getElementById('timeline-container');
    cont.innerHTML = '<div class="timeline-line"></div><div id="timeline-loader" class="loader mx-auto mt-8"></div>';
    try {
        let snap;
        try { snap = await getDocs(query(collection(db, 'timeline'), orderBy('order'))); }
        catch { snap = await getDocs(collection(db, 'timeline')); }
        document.getElementById('timeline-loader')?.remove();
        if (snap.empty) { renderStaticTimeline(cont); return; }
        let idx = 0;
        snap.forEach(d => { cont.appendChild(createTimelineCard({ id: d.id, ...d.data() }, idx % 2 === 0 ? 'timeline-left' : 'timeline-right')); idx++; });
        feather.replace();
        document.querySelectorAll('.animate-on-scroll:not(.is-visible)').forEach(e => scrollObserver && scrollObserver.observe(e));
    } catch (e) { document.getElementById('timeline-loader')?.remove(); renderStaticTimeline(cont); }
}

function renderStaticTimeline(cont) {
    const defaults = [
        { id: 's1', year: '2023 – Present', role: 'Android Developer', company: 'Freelance', icon: 'briefcase', desc: 'Building production-ready Android apps using Kotlin, Jetpack Compose and Clean Architecture.', tags: ['Kotlin', 'Jetpack Compose', 'MVVM'] },
        { id: 's2', year: '2022 – 2023', role: 'IEEE Vice Head', company: 'IEEE Student Branch', icon: 'users', desc: 'Technical leadership: workshops, events, and mentoring junior developers.', tags: ['Leadership', 'Mentoring', 'Android'] },
        { id: 's3', year: '2020 – 2024', role: 'B.Sc. Computer Science', company: 'University', icon: 'book', desc: 'Software engineering, algorithms, data structures, and mobile development.', tags: ['CS', 'Software Engineering', 'Algorithms'] },
    ];
    defaults.forEach((item, i) => cont.appendChild(createTimelineCard(item, i % 2 === 0 ? 'timeline-left' : 'timeline-right')));
    feather.replace();
}

function createTimelineCard(item, side) {
    const w = document.createElement('div');
    w.className = `timeline-item ${side} animate-on-scroll`;
    w.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-card">
            <div class="timeline-date">${item.year || item.date || ''}</div>
            <h3 class="timeline-role">${item.role || item.title || ''}</h3>
            <p class="timeline-company"><i data-feather="${item.icon || 'briefcase'}" class="w-3 h-3 inline mr-1"></i>${item.company || ''}</p>
            <p class="timeline-desc">${item.desc || item.description || ''}</p>
            <div class="timeline-tags">${(item.tags || []).map(t => `<span>${t}</span>`).join('')}</div>
            ${isAdmin ? `<div class="flex gap-2 mt-3">
                <button class="edit-btn admin-btn" onclick="handleEditTimeline('${item.id}')">Edit</button>
                <button class="delete-btn admin-btn" onclick="handleDeleteTimeline('${item.id}')">Delete</button>
            </div>` : ''}
        </div>`;
    return w;
}

window.handleEditTimeline = async id => {
    let data = {};
    try { data = (await getDoc(doc(db, 'timeline', id))).data() || {}; } catch {}
    const statics = {
        s1: { year: '2023 – Present', role: 'Android Developer', company: 'Freelance', icon: 'briefcase', desc: '', tags: [] },
        s2: { year: '2022 – 2023', role: 'IEEE Vice Head', company: 'IEEE Student Branch', icon: 'users', desc: '', tags: [] },
        s3: { year: '2020 – 2024', role: 'B.Sc. Computer Science', company: 'University', icon: 'book', desc: '', tags: [] }
    };
    if (!data.role) data = statics[id] || {};
    document.getElementById('timeline-id').value = id;
    document.getElementById('timeline-year').value = data.year || data.date || '';
    document.getElementById('timeline-role').value = data.role || data.title || '';
    document.getElementById('timeline-company').value = data.company || '';
    document.getElementById('timeline-icon').value = data.icon || 'briefcase';
    document.getElementById('timeline-desc').value = data.desc || data.description || '';
    document.getElementById('timeline-tags').value = (data.tags || []).join(', ');
    document.getElementById('timeline-modal-title').innerText = 'Edit Timeline Item';
    openModal('timeline-modal');
};

window.handleDeleteTimeline = async id => {
    if (!confirm('Delete this item?')) return;
    try { await deleteDoc(doc(db, 'timeline', id)); } catch {}
    loadTimeline();
    showToast('Deleted.', 'info');
};

async function loadSiteSettings() {
    try {
        // Hero text
        const snap = await getDoc(doc(db, 'siteSettings', 'hero'));
        if (snap.exists()) {
            const data = snap.data();
            if (data.title)    document.getElementById('hero-name').textContent    = data.title;
            if (data.subtitle) document.getElementById('hero-subtitle').textContent = data.subtitle;
        }
        // About text & image
        const aboutSnap = await getDoc(doc(db, 'siteSettings', 'about'));
        if (aboutSnap.exists()) {
            const d = aboutSnap.data();
            if (d.text)     document.getElementById('about-text').textContent = d.text;
            if (d.imageUrl) document.getElementById('about-image').src        = d.imageUrl;
        }
        // Stats numbers
        const statsSnap = await getDoc(doc(db, 'siteSettings', 'stats'));
        if (statsSnap.exists()) {
            const d = statsSnap.data();
            if (d.years != null)   { const e=document.getElementById('stat-years');   if(e){e.dataset.target=d.years;  e.textContent='0';} }
            if (d.apps != null)    { const e=document.getElementById('stat-apps');    if(e){e.dataset.target=d.apps;   e.textContent='0';} }
            if (d.clients != null) { const e=document.getElementById('stat-clients'); if(e){e.dataset.target=d.clients;e.textContent='0';} }
            if (d.lines)   { const e=document.querySelector('#stat-lines');        if(e) e.textContent=d.lines; }
            if (d.lblYears)  { const e=document.querySelector('#stat-label-years');  if(e) e.textContent=d.lblYears; }
            if (d.lblApps)   { const e=document.querySelector('#stat-label-apps');   if(e) e.textContent=d.lblApps; }
            if (d.lblClients){ const e=document.querySelector('#stat-label-clients');if(e) e.textContent=d.lblClients; }
        }
    } catch (e) { console.warn('loadSiteSettings:', e); }
}

async function loadPrinciples() {
    const grid = document.getElementById('principles-grid');
    const loader = document.getElementById('principles-loader');
    try {
        let snap;
        try { snap = await getDocs(query(collection(db, 'principles'), orderBy('order'))); }
        catch { snap = await getDocs(collection(db, 'principles')); }
        if (loader) loader.remove();
        grid.innerHTML = '';
        const themeName = localStorage.getItem('portfolioTheme') || 'dark';
        const theme = themes[themeName];
        snap.forEach(docSnap => {
            const p = { id: docSnap.id, ...docSnap.data() };
            grid.appendChild(createPrincipleCard(p, theme));
        });
        feather.replace();
    } catch (e) {
        if (loader) loader.remove();
        grid.innerHTML = '<p class="col-span-3 text-center text-gray-400 py-8">Unable to load principles.</p>';
    }
}

function createPrincipleCard(p, theme) {
    const card = document.createElement('div');
    card.className = `principle-card p-6 ${theme.principleCard}`;
    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <i data-feather="${p.icon || 'star'}" class="w-8 h-8 ${theme.principleIcon}"></i>
            ${isAdmin ? `<div class="flex gap-2">
                <button class="edit-btn admin-btn" onclick="handleEditPrinciple('${p.id}')">Edit</button>
                <button class="delete-btn admin-btn" onclick="handleDeletePrinciple('${p.id}')">Del</button>
            </div>` : ''}
        </div>
        <h3 class="font-bold text-lg mb-2">${p.title}</h3>
        <p class="text-sm leading-relaxed opacity-70">${p.description}</p>`;
    return card;
}

async function loadSkills() {
    const container = document.getElementById('skills-container');
    const loader = document.getElementById('skills-loader');
    try {
        let snap;
        try { snap = await getDocs(query(collection(db, 'skills'), orderBy('order'))); }
        catch { snap = await getDocs(collection(db, 'skills')); }
        if (loader) loader.remove();
        container.innerHTML = '';
        const themeName = localStorage.getItem('portfolioTheme') || 'dark';
        snap.forEach(docSnap => {
            const s = { id: docSnap.id, ...docSnap.data() };
            container.appendChild(createSkillItem(s));
        });
        feather.replace();
    } catch (e) {
        if (loader) loader.remove();
    }
}

function createSkillItem(s) {
    const item = document.createElement('div');
    item.className = 'skill-item flex flex-col items-center gap-2 text-center';
    item.innerHTML = `
        <i class="${s.iconClass} text-5xl colored"></i>
        <span class="text-xs font-medium opacity-70">${s.name}</span>
        ${isAdmin ? `<div class="flex gap-1">
            <button class="edit-btn admin-btn" onclick="handleEditSkill('${s.id}')">E</button>
            <button class="delete-btn admin-btn" onclick="handleDeleteSkill('${s.id}')">D</button>
        </div>` : ''}`;
    return item;
}

async function loadProjects() {
    const grid = document.getElementById('projects-grid');
    const loader = document.getElementById('projects-loader');
    try {
        // Fallback: if 'order' field missing on old docs, getDocs without orderBy
        let snap;
        try { snap = await getDocs(query(collection(db, 'projects'), orderBy('order'))); }
        catch { snap = await getDocs(collection(db, 'projects')); }
        if (loader) loader.remove();
        grid.innerHTML = '';
        const themeName = localStorage.getItem('portfolioTheme') || 'dark';
        const theme = themes[themeName];
        projects = [];
        snap.forEach(docSnap => {
            const p = { id: docSnap.id, ...docSnap.data() };
            projects.push(p);
            grid.appendChild(createProjectCard(p, theme));
        });
        feather.replace();
    } catch (e) {
        if (loader) loader.remove();
        grid.innerHTML = '<p class="col-span-3 text-center text-gray-400 py-8">Unable to load projects.</p>';
    }
}

function createProjectCard(p, theme) {
    const card = document.createElement('div');
    card.className = `project-card ${theme.projectCard} cursor-pointer`;
    card.onclick = () => showProjectDetails(p.id);
    card.innerHTML = `
        <img src="${p.thumbnail || 'https://placehold.co/600x400'}" alt="${p.title}" class="w-full h-48 object-cover">
        <div class="p-5">
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-bold text-lg">${p.title}</h3>
                ${isAdmin ? `<div class="flex gap-2" onclick="event.stopPropagation()">
                    <button class="edit-btn admin-btn" onclick="handleEditProject('${p.id}')">Edit</button>
                    <button class="delete-btn admin-btn" onclick="handleDeleteProject('${p.id}')">Del</button>
                </div>` : ''}
            </div>
            <p class="text-sm opacity-60 leading-relaxed mb-4 line-clamp-2">${p.description}</p>
            <div class="flex flex-wrap gap-1.5">
                ${(p.technologies || []).slice(0, 4).map(t => `<span class="tech-badge text-xs px-2 py-0.5 rounded-md font-mono">${t}</span>`).join('')}
                ${(p.technologies || []).length > 4 ? `<span class="tech-badge text-xs px-2 py-0.5 rounded-md font-mono">+${p.technologies.length - 4}</span>` : ''}
            </div>
        </div>`;
    // Tech badge styling
    card.querySelectorAll('.tech-badge').forEach(b => {
        const themeName = localStorage.getItem('portfolioTheme') || 'dark';
        if (themeName === 'dark') {
            b.style.cssText = 'background:rgba(0,241,94,0.08);color:#00f15e;border:1px solid rgba(0,241,94,0.15)';
        } else {
            b.style.cssText = 'background:rgba(37,99,235,0.08);color:#2563eb;border:1px solid rgba(37,99,235,0.15)';
        }
    });
    return card;
}

function renderAllContent() {
    const themeName = localStorage.getItem('portfolioTheme') || 'dark';
    if (!document.getElementById('principles-loader')) loadPrinciples();
    if (!document.getElementById('skills-loader'))    loadSkills();
    if (!document.getElementById('projects-loader'))  loadProjects();
    if (!document.getElementById('timeline-loader'))  loadTimeline();
}

// =====================================================
//  ADMIN CRUD HANDLERS
// =====================================================
window.handleEditPrinciple = async (id) => {
    const p = (await getDoc(doc(db, 'principles', id))).data();
    document.getElementById('principle-id').value = id;
    document.getElementById('principle-title').value = p.title;
    document.getElementById('principle-description').value = p.description;
    document.getElementById('principle-icon').value = p.icon;
    document.getElementById('principle-modal-title').innerText = 'Edit Principle';
    openModal('principle-modal');
};

window.handleDeletePrinciple = async (id) => {
    if (confirm('Delete this principle?')) {
        await deleteDoc(doc(db, 'principles', id));
        loadPrinciples();
        showToast('Principle deleted.', 'info');
    }
};

window.handleEditSkill = async (id) => {
    const s = (await getDoc(doc(db, 'skills', id))).data();
    document.getElementById('skill-id').value = id;
    document.getElementById('skill-name').value = s.name;
    document.getElementById('skill-icon-class').value = s.iconClass;
    document.getElementById('skill-modal-title').innerText = 'Edit Skill';
    openModal('skill-modal');
};

window.handleDeleteSkill = async (id) => {
    if (confirm('Delete this skill?')) {
        await deleteDoc(doc(db, 'skills', id));
        loadSkills();
        showToast('Skill deleted.', 'info');
    }
};

window.handleEditProject = async (id) => {
    const p = projects.find(pr => pr.id === id);
    if (!p) return;
    document.getElementById('project-id').value = id;
    document.getElementById('project-title').value = p.title;
    document.getElementById('project-description').value = p.description;
    document.getElementById('project-thumbnail-url').value = p.thumbnail || '';
    document.getElementById('project-tech').value = (p.technologies || []).join(', ');
    document.getElementById('project-source-link').value = p.sourceLink || '';
    document.getElementById('project-live-link').value = p.liveLink || '';
    const imagesContainer = document.getElementById('additional-images-container');
    imagesContainer.innerHTML = '';
    (p.images || []).forEach(img => addImageRow(img.url, img.description));
    feather.replace();
    document.getElementById('project-modal-title').innerText = 'Edit Project';
    openModal('project-modal');
};

window.handleDeleteProject = async (id) => {
    if (confirm('Delete this project?')) {
        await deleteDoc(doc(db, 'projects', id));
        loadProjects();
        showToast('Project deleted.', 'info');
    }
};

window.showProjectDetails = (id) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    const themeName = localStorage.getItem('portfolioTheme') || 'dark';
    const theme = themes[themeName];
    document.getElementById('detail-title').innerText = project.title;
    document.getElementById('detail-description').innerText = project.description;
    const mainImage = document.getElementById('detail-main-image');
    const imageDesc = document.getElementById('detail-image-description');
    const thumbnailsContainer = document.getElementById('detail-thumbnails');
    thumbnailsContainer.innerHTML = '';
    const allImages = [{ url: project.thumbnail, description: 'Project Thumbnail' }, ...(project.images || [])];

    function updateMainImage(imgObj) {
        mainImage.src = imgObj.url;
        imageDesc.textContent = imgObj.description || '';
    }
    updateMainImage(allImages[0]);
    allImages.forEach(imgObj => {
        const thumb = document.createElement('img');
        thumb.src = imgObj.url;
        thumb.className = 'gallery-thumbnail w-20 h-16 object-cover rounded-lg';
        if (imgObj.url === mainImage.src) thumb.classList.add('active', theme.activeThumb);
        thumb.addEventListener('click', () => {
            updateMainImage(imgObj);
            document.querySelectorAll('.gallery-thumbnail').forEach(t => t.classList.remove('active', ...Object.values(themes).map(t => t.activeThumb)));
            thumb.classList.add('active', theme.activeThumb);
        });
        thumbnailsContainer.appendChild(thumb);
    });

    const isLight = themeName === 'light';
    document.getElementById('detail-tech').innerHTML = (project.technologies || [])
        .map(t => `<span class="${isLight ? 'bg-blue-50 text-blue-600' : 'bg-gray-800 text-green-400'} text-sm font-semibold px-3 py-1 rounded-full font-mono">${t}</span>`).join('');

    const linksContainer = document.getElementById('detail-links');
    linksContainer.innerHTML = '';
    if (project.sourceLink) {
        const a = document.createElement('a'); a.href = project.sourceLink; a.target = '_blank';
        a.innerText = 'Source Code'; a.className = `font-bold py-2 px-4 rounded-xl transition ${theme.detailLinkSource}`;
        linksContainer.appendChild(a);
    }
    if (project.liveLink) {
        const a = document.createElement('a'); a.href = project.liveLink; a.target = '_blank';
        a.innerText = 'Live Link'; a.className = `font-bold py-2 px-4 rounded-xl transition ${theme.detailLinkLive}`;
        linksContainer.appendChild(a);
    }
    openModal('project-detail-modal');
};

// =====================================================
//  MODAL HELPERS
// =====================================================
function openModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal-content').classList.remove('scale-95'), 10);
    applyTheme(localStorage.getItem('portfolioTheme') || 'dark');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    modal.querySelector('.modal-content').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function addImageRow(url = '', description = '') {
    const themeName = localStorage.getItem('portfolioTheme') || 'dark';
    const inputClasses = themes[themeName].modalInput;
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2';
    row.innerHTML = `
        <input type="url" placeholder="Image URL" class="modal-input ${inputClasses} p-2 rounded-xl flex-grow additional-image-url" value="${url}">
        <input type="text" placeholder="Image Description" class="modal-input ${inputClasses} p-2 rounded-xl flex-grow-[2] additional-image-desc" value="${description}">
        <button type="button" class="p-2 bg-red-500/30 hover:bg-red-500/60 rounded-xl remove-image-btn"><i data-feather="trash-2" class="w-4 h-4"></i></button>`;
    document.getElementById('additional-images-container').appendChild(row);
    feather.replace();
}

// =====================================================
//  FORM SUBMISSIONS
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    feather.replace();
    initLoadingScreen();
    initScrollProgress();
    initMobileMenu();
    initTypewriter();
    initStatsCounters();
    initStarRating();

    // Theme switcher
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });

    const savedTheme = localStorage.getItem('portfolioTheme') || 'dark';
    applyTheme(savedTheme);
    loadAllData();

    // Auth state
    onAuthStateChanged(auth, user => {
        isAdmin = !!user;
        document.getElementById('login-btn').classList.toggle('hidden', isAdmin);
        document.getElementById('logout-btn').classList.toggle('hidden', !isAdmin);
        document.querySelectorAll('#add-project-btn, #add-principle-btn, #add-skill-btn').forEach(btn => btn.classList.toggle('hidden', !isAdmin));
        if (isAdmin) {
            // Add testimonials admin button to navbar area
            const navLogoAccent = document.getElementById('nav-logo-accent');
            if (!document.getElementById('testimonials-admin-btn')) {
                const btn = document.createElement('button');
                btn.id = 'testimonials-admin-btn';
                btn.className = 'text-xs font-mono text-yellow-400 hover:text-yellow-300 transition hidden md:block';
                btn.textContent = '⚡ Reviews';
                btn.addEventListener('click', () => {
                    openModal('testimonial-admin-modal');
                    loadPendingTestimonials();
                });
                document.getElementById('logout-btn').before(btn);
            }
        }
        renderAllContent();
    });

    // Login
    document.getElementById('login-btn').addEventListener('click', () => openModal('login-modal'));
    document.getElementById('login-form').addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('login-submit-btn');
        btn.textContent = 'Logging in...';
        try {
            await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value);
            closeModal('login-modal');
            showToast('Welcome back, Admin!', 'success');
        } catch (err) {
            document.getElementById('login-error').textContent = 'Invalid credentials.';
        } finally {
            btn.textContent = 'Login';
        }
    });
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await signOut(auth);
        showToast('Logged out.', 'info');
    });

    // Close modals
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal || e.target.classList.contains('modal-close')) closeModal(modal.id);
        });
    });

    // Project form
    document.getElementById('project-form').addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('project-submit-btn');
        document.getElementById('project-submit-text').textContent = 'Saving...';
        btn.disabled = true;
        const id = document.getElementById('project-id').value;
        const images = Array.from(document.querySelectorAll('.additional-image-url')).map((el, i) => ({
            url: el.value,
            description: document.querySelectorAll('.additional-image-desc')[i]?.value || ''
        })).filter(img => img.url);
        const data = {
            title: document.getElementById('project-title').value,
            description: document.getElementById('project-description').value,
            thumbnail: document.getElementById('project-thumbnail-url').value,
            technologies: document.getElementById('project-tech').value.split(',').map(t => t.trim()).filter(Boolean),
            sourceLink: document.getElementById('project-source-link').value,
            liveLink: document.getElementById('project-live-link').value,
            images,
            order: Date.now(),
        };
        try {
            if (id) await setDoc(doc(db, 'projects', id), data, { merge: true });
            else await addDoc(collection(db, 'projects'), data);
            closeModal('project-modal');
            loadProjects();
            showToast('Project saved!', 'success');
        } catch (err) {
            showToast('Error saving project.', 'error');
        } finally {
            document.getElementById('project-submit-text').textContent = 'Save Project';
            btn.disabled = false;
        }
    });

    // Principle form
    document.getElementById('principle-form').addEventListener('submit', async e => {
        e.preventDefault();
        const id = document.getElementById('principle-id').value;
        const data = {
            title: document.getElementById('principle-title').value,
            description: document.getElementById('principle-description').value,
            icon: document.getElementById('principle-icon').value,
            order: id ? undefined : Date.now(),
        };
        if (!id) data.order = Date.now();
        try {
            if (id) await updateDoc(doc(db, 'principles', id), data);
            else await addDoc(collection(db, 'principles'), data);
            closeModal('principle-modal');
            loadPrinciples();
            showToast('Principle saved!', 'success');
        } catch { showToast('Error saving.', 'error'); }
    });

    // Skill form
    document.getElementById('skill-form').addEventListener('submit', async e => {
        e.preventDefault();
        const id = document.getElementById('skill-id').value;
        const data = {
            name: document.getElementById('skill-name').value,
            iconClass: document.getElementById('skill-icon-class').value,
            order: id ? undefined : Date.now(),
        };
        try {
            if (id) await updateDoc(doc(db, 'skills', id), data);
            else await addDoc(collection(db, 'skills'), { ...data, order: Date.now() });
            closeModal('skill-modal');
            loadSkills();
            showToast('Skill saved!', 'success');
        } catch { showToast('Error saving.', 'error'); }
    });

    // About form
    document.getElementById('about-form').addEventListener('submit', async e => {
        e.preventDefault();
        const text = document.getElementById('about-modal-text').value;
        const imageUrl = document.getElementById('about-image-url').value;
        try {
            await setDoc(doc(db, 'siteSettings', 'about'), { text, imageUrl }, { merge: true });
            document.getElementById('about-text').textContent = text;
            document.getElementById('about-image').src = imageUrl;
            closeModal('about-modal');
            showToast('About section updated!', 'success');
        } catch { showToast('Error saving.', 'error'); }
    });
    document.getElementById('edit-about-btn').addEventListener('click', () => {
        document.getElementById('about-modal-text').value = document.getElementById('about-text').textContent;
        document.getElementById('about-image-url').value = document.getElementById('about-image').src;
        openModal('about-modal');
    });

    // Testimonial submit
    document.getElementById('leave-feedback-btn').addEventListener('click', () => openModal('testimonial-modal'));
    document.getElementById('testimonial-form').addEventListener('submit', async e => {
        e.preventDefault();
        const rating = parseInt(document.getElementById('t-rating').value);
        if (!rating) { showToast('Please select a rating!', 'error'); return; }
        const btn = document.getElementById('testimonial-submit-btn');
        btn.disabled = true;
        try {
            await submitTestimonial(
                document.getElementById('t-name').value,
                document.getElementById('t-role').value,
                document.getElementById('t-message').value,
                rating
            );
            closeModal('testimonial-modal');
            document.getElementById('testimonial-form').reset();
            document.querySelectorAll('#star-rating .star').forEach(s => s.classList.remove('filled'));
            document.getElementById('t-rating').value = '0';
            showToast('Review submitted! It will appear after approval. 🌟', 'success', 5000);
        } catch { showToast('Error submitting review.', 'error'); }
        finally { btn.disabled = false; }
    });

    // Add image button
    document.getElementById('add-image-btn').addEventListener('click', () => addImageRow());
    document.getElementById('additional-images-container').addEventListener('click', e => {
        if (e.target.closest('.remove-image-btn')) e.target.closest('.flex').remove();
    });

    // Copy email
    document.getElementById('copy-email-btn').addEventListener('click', () => {
        const email = document.getElementById('email-text').textContent.trim();
        navigator.clipboard.writeText(email).then(() => {
            const msg = document.getElementById('copy-success-msg');
            msg.classList.remove('opacity-0');
            showToast('Email copied!', 'success', 2000);
            setTimeout(() => msg.classList.add('opacity-0'), 2000);
        });
    });

    // Year
    document.getElementById('year').textContent = new Date().getFullYear();

    // Scroll animations
    scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
    }, { threshold: 0.08 });
    document.querySelectorAll('.animate-on-scroll').forEach(el => scrollObserver.observe(el));

    // Custom cursor
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const aboutSection = document.getElementById('about');
    let cursorBoundary = aboutSection.offsetTop;
    window.addEventListener('resize', () => { cursorBoundary = aboutSection.offsetTop; });
    const mouse = { x: -100, y: -100 };
    const dot = { x: -100, y: -100, vx: 0, vy: 0 };
    const outline = { x: -100, y: -100, vx: 0, vy: 0 };
    window.addEventListener('mousemove', e => {
        if (e.clientY < cursorBoundary) {
            cursorDot.style.opacity = '1';
            cursorOutline.style.opacity = '1';
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        } else {
            cursorDot.style.opacity = '0';
            cursorOutline.style.opacity = '0';
        }
    });
    document.body.addEventListener('mouseleave', () => {
        cursorDot.style.opacity = '0';
        cursorOutline.style.opacity = '0';
    });
    function animateCursor() {
        const ds = 0.2, os = 0.1, d = 0.75;
        dot.vx += (mouse.x - dot.x) * ds; dot.vy += (mouse.y - dot.y) * ds;
        dot.vx *= d; dot.vy *= d; dot.x += dot.vx; dot.y += dot.vy;
        cursorDot.style.transform = `translate(${dot.x}px, ${dot.y}px) translate(-50%, -50%)`;
        outline.vx += (mouse.x - outline.x) * os; outline.vy += (mouse.y - outline.y) * os;
        outline.vx *= d; outline.vy *= d; outline.x += outline.vx; outline.y += outline.vy;
        cursorOutline.style.transform = `translate(${outline.x}px, ${outline.y}px) translate(-50%, -50%)`;
        requestAnimationFrame(animateCursor);
    }
    animateCursor();
    setTimeout(() => {
        document.querySelectorAll('a, button, .project-card, .principle-card, .skill-item').forEach(el => {
            el.addEventListener('mouseover', () => { cursorDot.classList.add('hovered'); cursorOutline.classList.add('hovered'); });
            el.addEventListener('mouseout', () => { cursorDot.classList.remove('hovered'); cursorOutline.classList.remove('hovered'); });
        });
    }, 1500);

    // Parallax BG
    const bgLayer2 = document.getElementById('bg-layer-2');
    window.addEventListener('mousemove', (e) => {
        const x = Math.round((e.clientX / window.innerWidth) * 100);
        const y = Math.round((e.clientY / window.innerHeight) * 100);
        const themeName = localStorage.getItem('portfolioTheme') || 'dark';
        const theme = themes[themeName];
        if (theme.bgLayer2.includes('radial-gradient')) {
            try {
                const bgRule = theme.bgLayer2.match(/\[(.*?)\]/)[1].replace(/_/g, ' ');
                bgLayer2.style.background = bgRule.replace(/at .*?,/, `at ${x}% ${y}%,`);
            } catch (e) {}
        }
    });

    // Hero 3D tilt
    const heroSection = document.getElementById('hero');
    heroSection.addEventListener('mousemove', (e) => {
        const { clientX, clientY, currentTarget } = e;
        const { clientWidth, clientHeight } = currentTarget;
        const xRot = 15 * ((clientY - clientHeight / 2) / clientHeight);
        const yRot = -15 * ((clientX - clientWidth / 2) / clientWidth);
        const content = heroSection.querySelector('div');
        content.style.transform = `perspective(1000px) rotateX(${xRot}deg) rotateY(${yRot}deg)`;
        content.style.transition = 'transform 0.1s ease';
    });
    heroSection.addEventListener('mouseleave', () => {
        heroSection.querySelector('div').style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        heroSection.querySelector('div').style.transition = 'transform 0.5s ease';
    });

    // Code background
    (function initCodeBackground() {
        const container = document.getElementById('code-background');
        window.addEventListener('scroll', () => {
            container.style.transform = `translateY(${window.scrollY * -0.15}px)`;
        }, { passive: true });
        const snippets = [
            'Text(text = "Hello, Robert!")',
            'val flow = MutableStateFlow(0)',
            'suspend fun fetchData(): Result<T>',
            'LazyColumn { items(list) { ... } }',
            '@Composable fun Screen() {}',
            'Modifier.padding(16.dp)',
            'viewModel.state.collect { ... }',
            'data class User(val name: String)',
            '@HiltViewModel class VM : ViewModel()',
            'LaunchedEffect(key) { ... }',
            'Room.databaseBuilder(...).build()',
            'Retrofit.Builder().baseUrl(...)',
        ];
        const create = () => {
            if (document.hidden || container.childElementCount > 25) return;
            const el = document.createElement('pre');
            el.className = 'code-line';
            el.textContent = snippets[Math.floor(Math.random() * snippets.length)];
            el.style.top = `${Math.random() * 100}%`;
            el.style.left = `${Math.random() * 90}%`;
            const disappear = () => {
                el.style.opacity = '0';
                el.style.transform = 'scale(0.5)';
                el.addEventListener('transitionend', () => el.remove(), { once: true });
            };
            el.addEventListener('mouseover', disappear, { once: true });
            container.appendChild(el);
            setTimeout(disappear, 8000 + Math.random() * 5000);
        };
        setInterval(create, 1200);
    })();

    // Edit buttons visibility for admin
    document.querySelectorAll('.edit-icon').forEach(btn => {
        const parent = btn.closest('.editable-container');
        if (parent) {
            parent.addEventListener('mouseenter', () => {
                if (isAdmin) btn.style.display = 'block';
            });
            parent.addEventListener('mouseleave', () => { btn.style.display = 'none'; });
        }
    });

    // Hero text edit
    document.getElementById('edit-hero-title-btn').addEventListener('click', () => {
        document.getElementById('text-edit-modal-title').textContent = 'Edit Name';
        document.getElementById('text-edit-doc').value = 'hero';
        document.getElementById('text-edit-field').value = 'title';
        document.getElementById('text-edit-content').value = document.getElementById('hero-name').textContent;
        openModal('text-edit-modal');
    });
    document.getElementById('edit-hero-subtitle-btn').addEventListener('click', () => {
        document.getElementById('text-edit-modal-title').textContent = 'Edit Subtitle';
        document.getElementById('text-edit-doc').value = 'hero';
        document.getElementById('text-edit-field').value = 'subtitle';
        document.getElementById('text-edit-content').value = document.getElementById('hero-subtitle').textContent;
        openModal('text-edit-modal');
    });
    document.getElementById('text-edit-form').addEventListener('submit', async e => {
        e.preventDefault();
        const docName = document.getElementById('text-edit-doc').value;
        const field = document.getElementById('text-edit-field').value;
        const content = document.getElementById('text-edit-content').value;
        try {
            await setDoc(doc(db, 'siteSettings', docName), { [field]: content }, { merge: true });
            if (docName === 'hero' && field === 'title') document.getElementById('hero-name').textContent = content;
            if (docName === 'hero' && field === 'subtitle') document.getElementById('hero-subtitle').textContent = content;
            closeModal('text-edit-modal');
            showToast('Text updated!', 'success');
        } catch { showToast('Error saving.', 'error'); }
    });

    // Add project/principle/skill buttons
    document.getElementById('add-project-btn').addEventListener('click', () => {
        document.getElementById('project-id').value = '';
        document.getElementById('project-form').reset();
        document.getElementById('additional-images-container').innerHTML = '';
        document.getElementById('project-modal-title').innerText = 'Add New Project';
        openModal('project-modal');
    });
    document.getElementById('add-principle-btn').addEventListener('click', () => {
        document.getElementById('principle-id').value = '';
        document.getElementById('principle-form').reset();
        document.getElementById('principle-modal-title').innerText = 'Add New Principle';
        openModal('principle-modal');
    });
    document.getElementById('add-skill-btn').addEventListener('click', () => {
        document.getElementById('skill-id').value = '';
        document.getElementById('skill-form').reset();
        document.getElementById('skill-modal-title').innerText = 'Add New Skill';
        openModal('skill-modal');
    });
});
