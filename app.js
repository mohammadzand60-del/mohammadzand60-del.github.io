const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobileMedia = matchMedia('(max-width: 980px)');
const videos = [...document.querySelectorAll('.film-scene')];
const chapters = [...document.querySelectorAll('.chapter')];
const navLinks = [...document.querySelectorAll('[data-nav]')];
const dots = [...document.querySelectorAll('.progress-rail li')];
const sceneNumber = document.querySelector('#sceneNumber');
const sceneLabel = document.querySelector('#sceneLabel');
const cursor = document.querySelector('.cursor-orbit');
const portrait = document.querySelector('[data-portrait]');
const film = document.querySelector('.film');
let activeScene = -1;

const constrainedDevice = (navigator.deviceMemory && navigator.deviceMemory <= 4)
  || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
  || matchMedia('(update: slow)').matches;
document.documentElement.classList.toggle('performance-lite', Boolean(constrainedDevice));

function onPointerFrame(element, callback) {
  let frame = 0;
  let latestEvent;
  element.addEventListener('pointermove', (event) => {
    latestEvent = event;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      callback(latestEvent);
      frame = 0;
    });
  }, { passive: true });
}

const palettes = {
  intro: ['#c7ff4a', '#19e3ff', '199, 255, 74'],
  manifesto: ['#ff7139', '#ff3ca6', '255, 113, 57'],
  capabilities: ['#20e3d2', '#8b5cf6', '32, 227, 210'],
  work: ['#f6c453', '#ff4d8d', '246, 196, 83'],
  path: ['#a78bfa', '#3b82f6', '167, 139, 250'],
  contact: ['#ff4f91', '#ff9f1c', '255, 79, 145']
};

function setPalette(section) {
  const [accent, accent2, rgb] = palettes[section.id] || palettes.intro;
  const root = document.documentElement;
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-2', accent2);
  root.style.setProperty('--accent-rgb', rgb);
  chapters.forEach((chapter) => chapter.classList.toggle('is-current', chapter === section));
}

function filmEnabled() {
  return !mobileMedia.matches && film && getComputedStyle(film).display !== 'none';
}

function unloadVideos() {
  videos.forEach((video) => {
    video.pause();
    video.removeAttribute('src');
    video.load();
  });
}

function loadVideos() {
  if (!filmEnabled()) {
    unloadVideos();
    return;
  }
  videos.forEach((video) => {
    const source = video.dataset.desktop;
    if (video.src !== new URL(source, location.href).href) {
      video.src = source;
      video.load();
    }
  });
}

function setScene(index, label = '') {
  const safeIndex = Math.max(0, Math.min(index, videos.length - 1));
  if (safeIndex === activeScene && sceneLabel.textContent === label) return;
  activeScene = safeIndex;
  videos.forEach((video, i) => {
    video.classList.toggle('is-active', i === safeIndex);
    if (filmEnabled() && i === safeIndex && !reduceMotion) video.play().catch(() => {});
    else video.pause();
  });
  sceneNumber.textContent = String(safeIndex + 1).padStart(2, '0');
  sceneLabel.textContent = label;
}

loadVideos();
mobileMedia.addEventListener('change', loadVideos);

const sceneObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  const section = visible.target;
  setPalette(section);
  setScene(Number(section.dataset.scene || 0), section.dataset.label || '');
  navLinks.forEach((link) => link.classList.toggle('is-active', link.dataset.nav === section.id));
  const chapterIndex = chapters.indexOf(section);
  dots.forEach((dot, index) => dot.classList.toggle('is-active', index === Math.min(chapterIndex, dots.length - 1)));
}, { threshold: [0.28, 0.5, 0.72] });
chapters.forEach((chapter) => sceneObserver.observe(chapter));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((item, index) => {
  const delay = mobileMedia.matches ? Math.min(index % 3, 2) * 45 : Math.min(index % 5, 3) * 70;
  item.style.transitionDelay = `${delay}ms`;
  item.style.setProperty('--stagger', `${mobileMedia.matches ? Math.min(index % 3, 2) * 65 : Math.min(index % 6, 5) * 75}ms`);
  revealObserver.observe(item);
});

function updateProgress() {
  const scrollable = document.documentElement.scrollHeight - innerHeight;
  const progress = scrollable > 0 ? (scrollY / scrollable) * 100 : 0;
  document.documentElement.style.setProperty('--progress', `${progress}%`);
  document.documentElement.style.setProperty('--scroll-turn', `${progress * 3.6}deg`);
}
let progressFrame = 0;
addEventListener('scroll', () => {
  if (progressFrame) return;
  progressFrame = requestAnimationFrame(() => {
    updateProgress();
    progressFrame = 0;
  });
}, { passive: true });
updateProgress();

if (!reduceMotion && matchMedia('(pointer: fine)').matches) {
  onPointerFrame(document.documentElement, (event) => {
    cursor.style.opacity = '1';
    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
  });
  document.querySelectorAll('a, [data-tilt], .project').forEach((element) => {
    element.addEventListener('pointerenter', () => { cursor.style.width = '48px'; cursor.style.height = '48px'; });
    element.addEventListener('pointerleave', () => {
      cursor.style.width = '28px'; cursor.style.height = '28px';
      if (element.hasAttribute('data-tilt')) element.style.transform = '';
    });
  });
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    onPointerFrame(card, (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--pointer-x', `${(x + 0.5) * 100}%`);
      card.style.setProperty('--pointer-y', `${(y + 0.5) * 100}%`);
      card.style.transform = `perspective(700px) rotateX(${-y * 4}deg) rotateY(${x * 5}deg)`;
    });
  });
  document.querySelectorAll('.project').forEach((card) => {
    onPointerFrame(card, (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty('--pointer-x', `${x * 100}%`);
      card.style.setProperty('--pointer-y', `${y * 100}%`);
      card.style.transform = `perspective(1000px) rotateX(${(0.5 - y) * 2.5}deg) rotateY(${(x - 0.5) * 3}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
  if (portrait) {
    onPointerFrame(portrait, (event) => {
      const rect = portrait.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      portrait.style.setProperty('--portrait-x', `${x * 12}px`);
      portrait.style.setProperty('--portrait-y', `${y * 10}px`);
      portrait.style.setProperty('--portrait-rotate', `${x * 2.2}deg`);
      portrait.style.setProperty('--portrait-light-x', `${(x + 0.5) * 100}%`);
      portrait.style.setProperty('--portrait-light-y', `${(y + 0.5) * 100}%`);
    });
    portrait.addEventListener('pointerleave', () => {
      portrait.style.setProperty('--portrait-x', '0px');
      portrait.style.setProperty('--portrait-y', '0px');
      portrait.style.setProperty('--portrait-rotate', '0deg');
      portrait.style.setProperty('--portrait-light-x', '50%');
      portrait.style.setProperty('--portrait-light-y', '42%');
    });
  }
}

const englishContent = [
  ['.skip-link', 'Skip to main content'],
  ['.brand-copy b', 'Mohammad Zand'],
  ['.nav [data-nav="manifesto"]', 'Approach'],
  ['.nav [data-nav="capabilities"]', 'Capabilities'],
  ['.nav [data-nav="work"]', 'Projects'],
  ['.nav [data-nav="path"]', 'Journey'],
  ['.contact-pill', '<span></span> Available for work'],
  ['.hero .eyebrow', '<span>01</span> Industrial Engineering × Business Systems × Artificial Intelligence'],
  ['.hero-title', '<span>I turn systems</span><span class="outline">into action.</span><span>Built to work.</span>'],
  ['.hero-lead', 'I’m Mohammad Zand. I design business and digital-sales systems, and turn artificial intelligence into an everyday tool for building and learning.'],
  ['.hero-action-primary span', 'View professional journey'],
  ['.hero-action-secondary span', 'AI tutorials'],
  ['.scroll-cue span', 'Scroll to enter'],
  ['.manifesto .section-index', '02 — Approach'],
  ['.statement h2', 'The best tool is the one that makes <em>real work</em> flow better.'],
  ['.manifesto-grid p:nth-child(1)', 'I focus on execution. I start with the everyday needs of teams and customers, then translate them into processes, roles, data and tools.'],
  ['.manifesto-grid p:nth-child(2)', 'My experience spans digital-service operations and online sales, CRM, Excel automation, WordPress management and AI content.'],
  ['.education div strong:not(.education-master)', 'B.Sc. in Industrial Engineering'],
  ['.education div small:nth-of-type(1)', 'University of Kurdistan'],
  ['.education .education-master', 'M.Sc. in Industrial Engineering'],
  ['.education div small:nth-of-type(2)', 'Logistics & Supply Chain · University of Kurdistan · Admitted'],
  ['.capabilities .section-index', '03 — Capabilities'],
  ['.capabilities .section-heading h2', 'Six disciplines,<br><span>one systems mindset.</span>'],
  ['.capabilities .section-heading p', 'Technical knowledge matters when it is tied to a measurable outcome.'],
  ['.capability:nth-child(1) h3', 'Operations & Sales'],
  ['.capability:nth-child(1) p', 'Process design, execution coordination, online sales and customer experience.'],
  ['.capability:nth-child(2) p', 'Sales stages, access control, customer records and data migration.'],
  ['.capability:nth-child(3) h3', 'Data & Automation'],
  ['.capability:nth-child(3) p', 'Excel, operational databases, dashboards and inventory control.'],
  ['.capability:nth-child(4) h3', 'Web & SEO'],
  ['.capability:nth-child(4) p', 'WordPress, WooCommerce, cPanel and technical optimization.'],
  ['.capability:nth-child(5) h3', 'AI & Content'],
  ['.capability:nth-child(5) p', 'Image and video workflows, scripting and visual identity.'],
  ['.capability:nth-child(6) h3', 'Systems Analysis'],
  ['.capability:nth-child(6) p', 'Requirements analysis, engineering economy, optimization and solution design.'],
  ['.ai-feature-copy > small', 'AI EDUCATION · @MRMOZED'],
  ['.ai-feature-copy h3', 'I turn AI tools into practical skills.'],
  ['.ai-feature-copy p', 'On Instagram, I teach artificial intelligence step by step with practical examples—from prompting and ideation to image, video and faster creative workflows.'],
  ['.ai-feature-copy > a', 'View AI tutorials on Instagram <span>↗</span>'],
  ['.work .section-index', '04 — Projects'],
  ['.work .section-heading h2', 'Built for<br><span>specific problems.</span>'],
  ['.work .section-heading p', 'From structure to working tools, every project begins with a real question.'],
  ['.project:nth-child(1) p', 'CRM structure, sales stages, customer records and a plan for migrating data and documents.'],
  ['.project:nth-child(2) p', 'Design and feasibility study for an integrated financial and business services platform; undergraduate project.'],
  ['.project:nth-child(3) p', 'Automation for invoice generation, discounts, inventory control and bank-payment reconciliation—with transparent, traceable transaction records.'],
  ['.project:nth-child(4) p', 'An offline learning simulator for practicing accounting scenarios and workflows.'],
  ['.project:nth-child(5) h3', 'Dynamics 365 Seminar'],
  ['.project:nth-child(5) p', 'Research and a specialist presentation on integrated ERP and CRM processes.'],
  ['.project:nth-child(6) p', 'Practical AI education for image and video creation, prompting and creative workflow design—with actionable examples.'],
  ['.project:nth-child(6) a', 'View tutorials <span>↗</span>'],
  ['.project:nth-child(7) h3', 'Lavish Market'],
  ['.project:nth-child(7) p', 'Design and implementation of the Lavish Market website: a coherent digital presence for discovery and direct audience access.'],
  ['.project:nth-child(8) h3', 'Aqaqia Internet Café'],
  ['.project:nth-child(8) p', 'Design and implementation of the Aqaqia Internet Café website to present services and make customer communication easier.'],
  ['.path .section-index', '05 — Experience'],
  ['.path .section-heading h2', 'A professional journey,<br><span>centered on execution.</span>'],
  ['.timeline-item:nth-child(1) time', '2026 — Present'],
  ['.timeline-item:nth-child(1) h3', 'AI Specialist & Educator'],
  ['.timeline-item:nth-child(1) small', '<a href="https://www.instagram.com/mrmozed/" target="_blank" rel="noreferrer">@mrmozed · AI Education ↗</a>'],
  ['.timeline-item:nth-child(1) p', 'Teaching AI concepts and tools through practical exercises in prompting, image and video generation, and creative workflow design.'],
  ['.timeline-item:nth-child(2) time', '2026'],
  ['.timeline-item:nth-child(2) h3', 'CRM Deployment Designer & Implementer'],
  ['.timeline-item:nth-child(2) p', 'Structure assessment, sales-stage design and planning the migration of customer information.'],
  ['.timeline-item:nth-child(3) time', '2026'],
  ['.timeline-item:nth-child(3) h3', 'WordPress, SEO & Web Operations Specialist'],
  ['.timeline-item:nth-child(3) p', 'WordPress and cPanel management, troubleshooting and website-structure optimization.'],
  ['.timeline-item:nth-child(4) time', '2025 — 2026'],
  ['.timeline-item:nth-child(4) h3', 'Digital Operations & Services Manager'],
  ['.timeline-item:nth-child(4) small', 'Aqaqia Internet Café'],
  ['.timeline-item:nth-child(4) p', 'Daily-service management, customer communication and coordination of service delivery.'],
  ['.timeline-item:nth-child(5) time', 'Before 2024 — Present'],
  ['.timeline-item:nth-child(5) h3', 'Digital Content Producer & Manager'],
  ['.timeline-item:nth-child(5) small', 'Freelance projects and brands'],
  ['.timeline-item:nth-child(5) p', 'Content calendars, concepts, captions, stories, reels and visual assets.'],
  ['.timeline-item:nth-child(6) time', 'Around 2024'],
  ['.timeline-item:nth-child(6) h3', 'Online Sales & E-commerce Manager'],
  ['.timeline-item:nth-child(6) small', '<a href="https://lusify.co/" target="_blank" rel="noreferrer">Lusify.co ↗</a> · Online Store'],
  ['.timeline-item:nth-child(6) p', 'Managed online sales, order follow-up and sales-team coordination to create a more consistent shopping experience at <a href="https://lusify.co/" target="_blank" rel="noreferrer">Lusify</a>.'],
  ['.contact .section-index', '06 — Contact'],
  ['.contact-body > small', 'Have a business problem?'],
  ['.contact-body h2', 'Let’s build<br><span>a system for it.</span>'],
  ['.contact-link:nth-of-type(1) span', 'Message me on Telegram'],
  ['.contact-link:nth-of-type(2) span', 'AI education on Instagram'],
  ['footer span:nth-child(1)', 'Mohammad Zand © 2026'],
  ['footer a', 'Back to top ↑']
];

const originalMarkup = new Map();
englishContent.forEach(([selector]) => {
  const element = document.querySelector(selector);
  if (element) originalMarkup.set(element, element.innerHTML);
});

const languageToggle = document.querySelector('.lang-toggle');

function applyLanguage(language, persist = true) {
  const isEnglish = language === 'en';
  document.documentElement.lang = isEnglish ? 'en' : 'fa';
  document.documentElement.dir = isEnglish ? 'ltr' : 'rtl';
  document.body.classList.toggle('is-english', isEnglish);
  englishContent.forEach(([selector, english]) => {
    const element = document.querySelector(selector);
    if (!element) return;
    element.innerHTML = isEnglish ? english : originalMarkup.get(element);
  });
  document.title = isEnglish ? 'Mohammad Zand | Industrial Systems & Applied AI' : 'محمد زند | مهندسی سیستم‌های کاری';
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = isEnglish
    ? 'Mohammad Zand’s resume and portfolio: industrial engineering, business operations, CRM, data and digital projects.'
    : 'رزومه و نمونه‌کارهای محمد زند؛ مهندسی صنایع، عملیات کسب‌وکار، CRM، داده و پروژه‌های دیجیتال.';
  const brand = document.querySelector('.brand');
  const nav = document.querySelector('.nav');
  const portraitImage = document.querySelector('.portrait-frame img');
  if (brand) brand.setAttribute('aria-label', isEnglish ? 'Mohammad Zand, top of page' : 'محمد زند، ابتدای صفحه');
  if (nav) nav.setAttribute('aria-label', isEnglish ? 'Main navigation' : 'پیمایش اصلی');
  if (portraitImage) portraitImage.alt = isEnglish ? 'Professional portrait of Mohammad Zand with curly hair and black glasses' : 'پرترهٔ حرفه‌ای محمد زند با مدل موی جدید و عینک مشکی';
  if (languageToggle) {
    languageToggle.querySelector('span').textContent = isEnglish ? 'FA' : 'EN';
    languageToggle.querySelector('i').textContent = isEnglish ? 'EN' : 'FA';
    languageToggle.setAttribute('aria-label', isEnglish ? 'تغییر زبان سایت به فارسی' : 'Switch website language to English');
    languageToggle.setAttribute('aria-pressed', String(isEnglish));
  }
  if (persist) localStorage.setItem('mz-language', language);
}

languageToggle?.addEventListener('click', () => {
  applyLanguage(document.documentElement.lang === 'en' ? 'fa' : 'en');
});

const savedLanguage = localStorage.getItem('mz-language');
applyLanguage(savedLanguage === 'en' ? 'en' : 'fa', false);

document.addEventListener('visibilitychange', () => {
  const current = videos[activeScene];
  if (!current) return;
  if (document.hidden) current.pause();
  else if (filmEnabled() && !reduceMotion) current.play().catch(() => {});
});

setScene(0, 'SYSTEM / INTRO');
setPalette(document.querySelector('#intro'));
