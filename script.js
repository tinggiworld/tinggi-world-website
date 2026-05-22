/* =================================================================
   TINGGI WORLD — INTERACTIONS (Dark Future)
   ================================================================= */
(function(){
'use strict';

const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

/* ---------- 0. COOKIE CONSENT (3 Kategorien) + CONDITIONAL LOADING ---------- */
const COOKIE_KEY = 'tw-cookie-consent-v2';
const GFONTS_HREF = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap';

const loadGoogleFonts = () => {
  if(document.getElementById('gfonts-stylesheet')) return;
  const pre1 = document.createElement('link');
  pre1.rel = 'preconnect';
  pre1.href = 'https://fonts.googleapis.com';
  const pre2 = document.createElement('link');
  pre2.rel = 'preconnect';
  pre2.href = 'https://fonts.gstatic.com';
  pre2.crossOrigin = 'anonymous';
  const css = document.createElement('link');
  css.id = 'gfonts-stylesheet';
  css.rel = 'stylesheet';
  css.href = GFONTS_HREF;
  document.head.appendChild(pre1);
  document.head.appendChild(pre2);
  document.head.appendChild(css);
};

const loadConsentedScripts = (category) => {
  document.querySelectorAll(
    `script[type="text/plain"][data-cookie-consent="${category}"]`
  ).forEach(orig => {
    if(orig.dataset.activated === '1') return;
    orig.dataset.activated = '1';
    const fresh = document.createElement('script');
    if(orig.src){
      if(orig.async) fresh.async = true;
      if(orig.defer) fresh.defer = true;
      fresh.src = orig.src;
    } else {
      fresh.text = orig.textContent;
    }
    document.head.appendChild(fresh);
  });
};

const getStoredConsent = () => {
  try{
    const raw = localStorage.getItem(COOKIE_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
};

const persistConsent = (analytics, marketing) => {
  const data = {
    necessary: true,
    analytics: !!analytics,
    marketing: !!marketing,
    ts: Date.now()
  };
  try{ localStorage.setItem(COOKIE_KEY, JSON.stringify(data)); }catch(e){}
  return data;
};

const applyConsent = (consent) => {
  // Notwendig: immer aktiv (Google Fonts + technische Funktionen)
  loadGoogleFonts();
  if(consent.analytics) loadConsentedScripts('analytics');
  if(consent.marketing) loadConsentedScripts('marketing');
};

const initCookieBanner = () => {
  const banner = $('#cookieBanner');
  const stored = getStoredConsent();

  if(stored){
    // Entscheid liegt vor → wende ihn an und blende Banner aus (falls vorhanden)
    applyConsent(stored);
    if(banner) banner.hidden = true;
    return;
  }

  // Noch kein Entscheid: lade nur Notwendiges (Google Fonts)
  loadGoogleFonts();

  // Auf Seiten ohne Banner (z. B. Subpages) ist nichts weiter zu tun
  if(!banner) return;

  banner.hidden = false;

  const cbAnalytics  = $('#cookieCatAnalytics');
  const cbMarketing  = $('#cookieCatMarketing');
  const acceptAllBtn = $('#cookieAcceptAll');
  const rejectAllBtn = $('#cookieRejectAll');
  const saveBtn      = $('#cookieSavePref');

  const finalize = (analytics, marketing) => {
    const consent = persistConsent(analytics, marketing);
    applyConsent(consent);
    banner.hidden = true;
  };

  if(acceptAllBtn) acceptAllBtn.addEventListener('click', () => {
    if(cbAnalytics) cbAnalytics.checked = true;
    if(cbMarketing) cbMarketing.checked = true;
    finalize(true, true);
  });
  if(rejectAllBtn) rejectAllBtn.addEventListener('click', () => {
    if(cbAnalytics) cbAnalytics.checked = false;
    if(cbMarketing) cbMarketing.checked = false;
    finalize(false, false);
  });
  if(saveBtn) saveBtn.addEventListener('click', () => finalize(
    cbAnalytics ? cbAnalytics.checked : false,
    cbMarketing ? cbMarketing.checked : false
  ));
};

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initCookieBanner);
}else{
  initCookieBanner();
}

/* ---------- 1. NAV SCROLL STATE + BURGER ---------- */
const nav = $('#nav');
const burger = $('#navBurger');
const navLinks = $('#navLinks');

const onScroll = () => {
  if(!nav) return;
  nav.classList.toggle('scrolled', window.scrollY > 12);
};
window.addEventListener('scroll', onScroll, {passive:true});
onScroll();

if(burger && nav){
  burger.addEventListener('click', () => nav.classList.toggle('open'));
}
if(navLinks && nav){
  $$('.nav-link', navLinks).forEach(l =>
    l.addEventListener('click', () => nav.classList.remove('open'))
  );
}

/* ---------- 2. SCROLL PROGRESS BAR ---------- */
const progressBar = $('#scrollProgress');
const updateProgress = () => {
  if(!progressBar) return;
  const h = document.documentElement;
  const total = h.scrollHeight - h.clientHeight;
  const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
  progressBar.style.width = pct + '%';
};
window.addEventListener('scroll', updateProgress, {passive:true});
updateProgress();

/* ---------- 3. MOTION DEFAULT ---------- */
document.body.setAttribute('data-motion', 'subtle');

/* ---------- 4. SECTION INDICATOR + ACTIVE NAV ---------- */
const indicatorDots = $$('#sectionIndicator .indicator-dot');
const sectionIds = indicatorDots.map(d => d.dataset.target);

const updateActiveSection = () => {
  const y = window.scrollY + window.innerHeight * 0.4;
  let current = sectionIds[0];
  for(const id of sectionIds){
    const el = document.getElementById(id);
    if(el && el.offsetTop <= y) current = id;
  }
  indicatorDots.forEach(d => d.classList.toggle('active', d.dataset.target === current));
  $$('.nav-link').forEach(l => {
    const href = l.getAttribute('href');
    l.classList.toggle('active', href === '#' + current);
  });
};
window.addEventListener('scroll', updateActiveSection, {passive:true});
updateActiveSection();

/* ---------- 5. TABS (AI + Web sections) — Click + Keyboard ---------- */
const activateTab = (tab, tabs, panels) => {
  const target = tab.dataset.panel;
  tabs.forEach(t => {
    const isActive = t === tab;
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    t.setAttribute('tabindex', isActive ? '0' : '-1');
  });
  panels.forEach(p => p.classList.toggle('active', p.dataset.name === target));
};

const initTabs = (container) => {
  if(!container) return;
  const tabs = $$('.tab', container);
  const section = container.closest('section');
  const panels = $$('.tab-panel', section);

  tabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => activateTab(tab, tabs, panels));
    tab.addEventListener('keydown', (e) => {
      let nextIdx = null;
      if(e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
      else if(e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
      else if(e.key === 'Home') nextIdx = 0;
      else if(e.key === 'End') nextIdx = tabs.length - 1;
      else return;
      e.preventDefault();
      const next = tabs[nextIdx];
      activateTab(next, tabs, panels);
      next.focus();
    });
  });
};
initTabs($('#aiTabs'));
initTabs($('#webTabs'));

/* ---------- 6. EXPANDABLE AUTO ROWS ---------- */
$$('.auto-row').forEach(row => {
  const head = $('.auto-head', row);
  if(!head) return;
  head.addEventListener('click', (e) => {
    // Don't toggle if clicking inside the body (links)
    if(e.target.closest('a')) return;
    const open = row.getAttribute('data-open') === 'true';
    row.setAttribute('data-open', open ? 'false' : 'true');
  });
});

/* ---------- 7. FAQ ACCORDION + FILTER ---------- */
const faqList = $('#faqList');
const faqCats = $$('#faqCats .faq-cat');
const faqItems = $$('.faq-item', faqList);

if(faqList){
  faqList.addEventListener('click', (e) => {
    const q = e.target.closest('.faq-q');
    if(!q) return;
    const item = q.parentElement;
    const open = item.getAttribute('data-open') === 'true';
    item.setAttribute('data-open', open ? 'false' : 'true');
  });

  faqCats.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      faqCats.forEach(c => c.setAttribute('aria-selected', c === btn ? 'true' : 'false'));
      faqItems.forEach(item => {
        const match = cat === 'all' || item.dataset.cat === cat;
        item.hidden = !match;
        if(!match) item.setAttribute('data-open', 'false');
      });
    });
  });
}

/* ---------- 8. GLOSSAR SEARCH + ALPHA ---------- */
const glossarSearch = $('#glossarSearch');
const glossarCards = $$('#glossarGrid .glossar-card');
const alphaLetters = $$('#alphaBar .alpha-letter');
let activeLetter = 'A';
let searchQuery = '';

const applyGlossarFilter = () => {
  const q = searchQuery.trim().toLowerCase();
  glossarCards.forEach(card => {
    const term = card.dataset.term;
    const def = card.querySelector('.glossar-def').textContent.toLowerCase();
    const letter = card.dataset.letter;
    const letterMatch = activeLetter === '*' || letter === activeLetter;
    const searchMatch = q === '' || term.includes(q) || def.includes(q);
    card.style.display = (letterMatch && searchMatch) ? '' : 'none';
  });
};

alphaLetters.forEach(l => {
  if(l.classList.contains('is-disabled')) return;
  l.addEventListener('click', (e) => {
    e.preventDefault();
    alphaLetters.forEach(x => x.classList.remove('is-active'));
    l.classList.add('is-active');
    activeLetter = l.dataset.letter;
    applyGlossarFilter();
  });
});

if(glossarSearch){
  glossarSearch.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    applyGlossarFilter();
  });
}

glossarCards.forEach(card => {
  card.addEventListener('click', () => {
    const expanded = card.getAttribute('data-expanded') === 'true';
    card.setAttribute('data-expanded', expanded ? 'false' : 'true');
  });
});

// Initial state: highlight "Alle" (*) and show all entries
alphaLetters.forEach(l => l.classList.remove('is-active'));
const initialAlpha = alphaLetters.find(l => l.dataset.letter === activeLetter);
if(initialAlpha) initialAlpha.classList.add('is-active');
applyGlossarFilter();

/* ---------- 9. WORKFLOW DEMO TABS ---------- */
const demoTabs = $$('#demoTabs .demo-tab');
const demoGrid = $('#demoGrid');
const demoNarration = $('#demoNarration');

const DEMOS = {
  bexio: {
    steps: [
      ['gmail',   '1 · Anfrage'],
      ['claude',  '2 · Analyse'],
      ['bexio',   '3 · Offerte'],
      ['n8n',     '4 · QR-Bill'],
      ['outlook', '5 · Versand']
    ],
    narration: [
      'E-Mail mit Anfrage trifft ein. Gmail-Integration triggert den Flow.',
      'Claude liest, extrahiert Kunde, Leistung, Volumen.',
      'Bexio erstellt die Offerte mit deinen Bausteinen.',
      'QR-Bill wird angehängt, ESR-Referenz generiert.',
      'Versand mit Tracking — alles in < 90 Sekunden.'
    ]
  },
  lead: {
    steps: [
      ['linkedin', '1 · Lead-Quelle'],
      ['apollo',   '2 · Anreicherung'],
      ['claude',   '3 · Scoring'],
      ['hubspot',  '4 · CRM-Anlage'],
      ['gmail',    '5 · Outreach']
    ],
    narration: [
      'Neuer Lead aus LinkedIn oder Webformular.',
      'Apollo reichert mit Firmenprofil, Tech-Stack, Volumen an.',
      'Claude bewertet Fit und Priorität.',
      'HubSpot legt Kontakt und Deal mit Owner an.',
      'Personalisierter Outreach-Entwurf — du sendest mit einem Klick.'
    ]
  },
  onboard: {
    steps: [
      ['hubspot',     '1 · Deal won'],
      ['claude',      '2 · Vertrag'],
      ['notion',      '3 · Projekt'],
      ['googledrive', '4 · Ordner'],
      ['outlook',     '5 · Welcome']
    ],
    narration: [
      'Deal-Status wechselt auf "Gewonnen" — Trigger feuert.',
      'Claude generiert Vertrag aus Template, sendet zur Signatur.',
      'Notion legt Projekt mit Roadmap, Tasks, Verantwortlichen an.',
      'Google Drive Ordner-Struktur entsteht automatisch.',
      'Welcome-Mail mit Kickoff-Termin geht raus.'
    ]
  },
  shopify: {
    steps: [
      ['shopify', '1 · Bestellung'],
      ['n8n',     '2 · Sync'],
      ['bexio',   '3 · Rechnung'],
      ['claude',  '4 · Bestätigung'],
      ['gmail',   '5 · Tracking']
    ],
    narration: [
      'Bestellung im Shopify-Shop trifft ein.',
      'n8n synchronisiert Kunde und Produkte zu Bexio.',
      'Bexio erstellt Rechnung inkl. QR-Bill.',
      'Claude generiert personalisierte Bestätigungs-Mail.',
      'Versand-Tracking automatisch nach Übergabe an Post CH.'
    ]
  }
};

const renderDemo = (key) => {
  const data = DEMOS[key];
  if(!data || !demoGrid) return;
  const lineRow = '<div class="demo-line-row"><span class="demo-flow-dot"></span></div>';
  const steps = data.steps.map(([logo, label]) =>
    `<div class="demo-step"><img src="assets/logos/${logo}.svg" alt=""><span class="demo-step-label">${label}</span></div>`
  ).join('');
  demoGrid.innerHTML = lineRow + steps;
  if(demoNarration){
    demoNarration.innerHTML = data.narration.map(t => `<div>${t}</div>`).join('');
  }
};

const activateDemoTab = (tab) => {
  demoTabs.forEach(t => {
    const isActive = t === tab;
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    t.setAttribute('tabindex', isActive ? '0' : '-1');
  });
  const stage = $('#demoPanel-stage');
  if(stage) stage.setAttribute('aria-labelledby', tab.id);
  renderDemo(tab.dataset.demo);
};

demoTabs.forEach((tab, idx) => {
  tab.addEventListener('click', () => activateDemoTab(tab));
  tab.addEventListener('keydown', (e) => {
    let nextIdx = null;
    if(e.key === 'ArrowRight') nextIdx = (idx + 1) % demoTabs.length;
    else if(e.key === 'ArrowLeft') nextIdx = (idx - 1 + demoTabs.length) % demoTabs.length;
    else if(e.key === 'Home') nextIdx = 0;
    else if(e.key === 'End') nextIdx = demoTabs.length - 1;
    else return;
    e.preventDefault();
    const next = demoTabs[nextIdx];
    activateDemoTab(next);
    next.focus();
  });
});

/* ---------- 10. MARQUEE — DUPLICATE FOR SEAMLESS LOOP ---------- */
const marqueeTrack = $('#marqueeTrack');
if(marqueeTrack){
  const items = $$('.marquee-item', marqueeTrack);
  items.forEach(item => marqueeTrack.appendChild(item.cloneNode(true)));
}

/* ---------- 11. REVEAL ON SCROLL ---------- */
const revealEls = $$('.reveal');
if('IntersectionObserver' in window){
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    });
  }, {threshold:0.12, rootMargin:'0px 0px -60px 0px'});
  revealEls.forEach(el => io.observe(el));
}else{
  revealEls.forEach(el => el.classList.add('in-view'));
}

/* ---------- 12. SPOTLIGHT CURSOR (on .spotlight) ---------- */
$$('.spotlight, .bento-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    card.style.setProperty('--mx', x + '%');
    card.style.setProperty('--my', y + '%');
  });
});

/* ---------- 14. SMOOTH ANCHOR SCROLL (offset for fixed nav) ---------- */
$$('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href').slice(1);
    if(!id) return;
    const target = document.getElementById(id);
    if(!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({top, behavior:'smooth'});
    history.replaceState(null, '', '#' + id);
  });
});

/* ---------- 15. KEYBOARD SHORTCUTS ---------- */
document.addEventListener('keydown', (e) => {
  // Ignore when typing in inputs
  if(e.target.matches('input, textarea, [contenteditable]')) return;
  const k = e.key.toLowerCase();
  if(k === 'g'){
    e.preventDefault();
    const target = document.getElementById('booking');
    if(target){
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({top, behavior:'smooth'});
    }
  }
  if(k === '/'){
    e.preventDefault();
    const s = $('#glossarSearch');
    if(s){ s.focus(); s.scrollIntoView({behavior:'smooth', block:'center'}); }
  }
});

})();
