/* === Canvas Hero Particles === */
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
let particles = [], W, H, animId;

function resize() {
  W = canvas.width = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
}
resize();
window.addEventListener('resize', resize);

function Particle() {
  this.reset();
}
Particle.prototype.reset = function() {
  this.x = Math.random() * W;
  this.y = Math.random() * H;
  this.size = Math.random() * 1.2 + 0.2;
  this.speedX = (Math.random() - 0.5) * 0.25;
  this.speedY = (Math.random() - 0.5) * 0.25;
  this.alpha = Math.random() * 0.5 + 0.1;
};
Particle.prototype.update = function() {
  this.x += this.speedX;
  this.y += this.speedY;
  if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
};

for (let i = 0; i < 120; i++) particles.push(new Particle());

// Grid lines
const LINES = [];
for (let i = 0; i < 6; i++) LINES.push({ x1: 0, y1: (i/5)*100+'%', x2: 100, y2: (i/5)*100+'%', h: true });
for (let i = 0; i < 8; i++) LINES.push({ x1: (i/7)*100+'%', y1: 0, x2: (i/7)*100+'%', y2: 100, h: false });

function pct(v, total) { return typeof v === 'string' ? parseFloat(v)/100*total : v; }

function getSeasonRGB() {
  const c = window._seasonParticleColors;
  if (c) return c;
  return { primary: [201,168,76], secondary: [180,150,60], tertiary: [220,185,90] };
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  const sc = getSeasonRGB();

  // subtle grid
  ctx.strokeStyle = `rgba(${sc.primary.join(',')},0.04)`;
  ctx.lineWidth = 1;
  LINES.forEach(l => {
    ctx.beginPath();
    if (l.h) {
      const y = pct(l.y1, H);
      ctx.moveTo(0, y); ctx.lineTo(W, y);
    } else {
      const x = pct(l.x1, W);
      ctx.moveTo(x, 0); ctx.lineTo(x, H);
    }
    ctx.stroke();
  });

  // connect near particles
  particles.forEach((a, i) => {
    particles.slice(i+1).forEach(b => {
      const d = Math.hypot(a.x-b.x, a.y-b.y);
      if (d < 100) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${sc.secondary.join(',')},${0.06*(1-d/100)})`;
        ctx.lineWidth = 0.5;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    });
  });

  // dots — mix primary + tertiary
  particles.forEach((p, i) => {
    p.update();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    const rgb = i % 3 === 0 ? sc.tertiary : (i % 2 === 0 ? sc.secondary : sc.primary);
    ctx.fillStyle = `rgba(${rgb.join(',')},${p.alpha})`;
    ctx.fill();
  });

  animId = requestAnimationFrame(draw);
}
draw();

/* === Custom Cursor === */
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

(function animCursor() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
  ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
  requestAnimationFrame(animCursor);
})();

function getCursorRGB() {
  const c = window._seasonParticleColors;
  return c ? c.primary : [201,168,76];
}

document.querySelectorAll('a,button,[data-filter],[data-year]').forEach(el => {
  el.addEventListener('mouseenter', () => {
    const rgb = getCursorRGB();
    ring.style.width = '56px'; ring.style.height = '56px';
    ring.style.borderColor = `rgba(${rgb.join(',')},0.9)`;
  });
  el.addEventListener('mouseleave', () => {
    const rgb = getCursorRGB();
    ring.style.width = '36px'; ring.style.height = '36px';
    ring.style.borderColor = `rgba(${rgb.join(',')},0.5)`;
  });
});

/* === Nav scroll === */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

/* === Hamburger / Mobile menu === */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
function closeMobile() { mobileMenu.classList.remove('open'); }

/* === Works Filter === */
const filterBtns = document.querySelectorAll('.filter-btn');
const workCards = document.querySelectorAll('.work-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    workCards.forEach(card => {
      const show = f === 'all' || card.dataset.category === f;
      card.classList.toggle('hidden', !show);
    });
  });
});

/* === Archive Year Filter === */
const yearBtns = document.querySelectorAll('.year-btn');
const archiveCards = document.querySelectorAll('.archive-card');

yearBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    yearBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const y = btn.dataset.year;
    archiveCards.forEach(card => {
      const show = y === 'all' || card.dataset.year === y;
      card.classList.toggle('hidden', !show);
    });
  });
});

/* === Work Card Modal === */
const overlay = document.getElementById('modalOverlay');
const modalVisual = document.getElementById('modalVisual');
const modalCat = document.getElementById('modalCat');
const modalTitle = document.getElementById('modalTitle');
const modalYear = document.getElementById('modalYear');
const modalDesc = document.getElementById('modalDesc');

workCards.forEach(card => {
  card.addEventListener('click', () => {
    const visual = card.querySelector('.card-visual');
    modalVisual.style.background = getComputedStyle(visual).background;
    modalCat.textContent = card.querySelector('.card-cat').textContent;
    modalTitle.textContent = card.dataset.title;
    modalYear.textContent = card.dataset.year;
    modalDesc.textContent = card.dataset.desc;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

function closeModal() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('modalClose').addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* === Scroll Reveal === */
const revealEls = document.querySelectorAll('.work-card, .archive-card, .section-header, .about-right, .contact-inner');
revealEls.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }});
}, { threshold: 0.1 });
revealEls.forEach(el => observer.observe(el));

/* === Smooth active nav link === */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => sectionObserver.observe(s));

/* ═══════════════════════════════════════
   FIGMA ARCHIVE
   ═══════════════════════════════════════ */

const FIGMA_FILES = {
  space: {
    key: 'qvdgvlkWEbLSbpNCTvJ9pM',
    type: 'board',
    name: 'DMU 공간프로그램분석',
    url: 'https://www.figma.com/board/qvdgvlkWEbLSbpNCTvJ9pM/'
  },
  final: {
    key: 'awKUPNP6nebEJutetxC8Z9',
    type: 'design',
    name: 'DMU Final Exam',
    url: 'https://www.figma.com/design/awKUPNP6nebEJutetxC8Z9/'
  }
};

let figmaToken = localStorage.getItem('figma_token') || '';

// Pre-fill token if saved
const tokenInput = document.getElementById('figmaTokenInput');
if (tokenInput && figmaToken) {
  tokenInput.value = figmaToken;
  setTokenStatus('ok', '✓ 저장된 토큰 사용 중');
  loadAllFigmaData();
}

// Course tab switching
document.querySelectorAll('.course-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.course-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.figma-course-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.course).classList.add('active');
  });
});

// iframe load handlers
['figmaEmbed1', 'figmaEmbed2'].forEach((id, i) => {
  const iframe = document.getElementById(id);
  const loader = document.getElementById('iframeLoading' + (i + 1));
  if (iframe && loader) {
    iframe.addEventListener('load', () => loader.classList.add('hidden'));
  }
});

// Token submit
const tokenSubmit = document.getElementById('figmaTokenSubmit');
if (tokenSubmit) {
  tokenSubmit.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    if (!token) { setTokenStatus('err', '토큰을 입력해주세요'); return; }
    tokenSubmit.disabled = true;
    tokenSubmit.textContent = '확인 중…';
    const ok = await verifyToken(token);
    tokenSubmit.disabled = false;
    tokenSubmit.textContent = '연동하기';
    if (ok) {
      figmaToken = token;
      localStorage.setItem('figma_token', token);
      setTokenStatus('ok', '✓ 연동 성공! 프로젝트 카드를 불러오는 중…');
      loadAllFigmaData();
    } else {
      setTokenStatus('err', '✗ 토큰이 올바르지 않습니다');
    }
  });
}

function setTokenStatus(type, msg) {
  const el = document.getElementById('tokenStatus');
  if (!el) return;
  el.className = 'token-status ' + type;
  el.textContent = msg;
}

async function verifyToken(token) {
  try {
    const r = await fetch('https://api.figma.com/v1/me', {
      headers: { 'X-Figma-Token': token }
    });
    return r.ok;
  } catch { return false; }
}

async function loadAllFigmaData() {
  for (const [course, info] of Object.entries(FIGMA_FILES)) {
    await loadFigmaFile(course, info);
  }
}

async function loadFigmaFile(course, info) {
  const grid = document.getElementById('apiCards-' + course);
  if (!grid || !figmaToken) return;

  grid.innerHTML = '<div class="api-cards-loading"><div class="loading-spinner"></div> 학생 프로젝트 불러오는 중…</div>';

  try {
    // Fetch file to get pages/top-level frames
    const r = await fetch(`https://api.figma.com/v1/files/${info.key}?depth=1`, {
      headers: { 'X-Figma-Token': figmaToken }
    });
    if (!r.ok) { grid.innerHTML = '<p style="color:var(--gray);padding:1rem;font-size:.8rem">파일을 불러올 수 없습니다. 파일 접근 권한을 확인해주세요.</p>'; return; }

    const data = await r.json();
    const pages = data.document?.children || [];

    if (!pages.length) { grid.innerHTML = ''; return; }

    // Fetch thumbnail for the file
    const thumbR = await fetch(`https://api.figma.com/v1/files/${info.key}/thumbnails`, {
      headers: { 'X-Figma-Token': figmaToken }
    }).catch(() => null);

    // Build cards — one per page
    grid.innerHTML = '';
    pages.forEach(page => {
      const card = buildFigmaCard({
        name: page.name,
        course: info.name,
        fileUrl: info.url,
        nodeId: page.id,
        fileKey: info.key,
        type: info.type,
      });
      grid.appendChild(card);
    });

    setTokenStatus('ok', `✓ ${pages.length}개 페이지 로드됨`);
  } catch (e) {
    grid.innerHTML = '<p style="color:var(--gray);padding:1rem;font-size:.8rem">불러오기 실패: ' + e.message + '</p>';
  }
}

function buildFigmaCard({ name, course, fileUrl, nodeId, fileKey, type }) {
  const card = document.createElement('article');
  card.className = 'api-card';

  const figmaLink = type === 'board'
    ? `https://www.figma.com/board/${fileKey}/?node-id=${encodeURIComponent(nodeId)}`
    : `https://www.figma.com/design/${fileKey}/?node-id=${encodeURIComponent(nodeId)}`;

  card.innerHTML = `
    <div class="api-card-thumb-placeholder">
      <svg width="40" height="40" viewBox="0 0 38 57" fill="none">
        <path d="M19 28.5A9.5 9.5 0 1 1 19 9.5a9.5 9.5 0 0 1 0 19z" fill="#1ABCFE"/>
        <path d="M9.5 47.5A9.5 9.5 0 0 1 9.5 28.5H19v9.5a9.5 9.5 0 0 1-9.5 9.5z" fill="#0ACF83"/>
        <path d="M19 .5H9.5a9.5 9.5 0 0 0 0 19H19V.5z" fill="#FF7262"/>
        <path d="M28.5 19a9.5 9.5 0 0 0 0-19H19v19h9.5z" fill="#F24E1E"/>
        <path d="M38 28.5a9.5 9.5 0 1 1-19 0 9.5 9.5 0 0 1 19 0z" fill="#A259FF"/>
      </svg>
    </div>
    <div class="api-card-body">
      <span class="api-card-course">${course}</span>
      <p class="api-card-name">${name}</p>
      <a href="${figmaLink}" target="_blank" class="api-card-link">
        Figma에서 보기
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
      </a>
    </div>`;

  return card;
}
