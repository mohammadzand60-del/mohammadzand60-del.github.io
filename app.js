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
  addEventListener('pointermove', (event) => {
    cursor.style.opacity = '1';
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  });
  document.querySelectorAll('a, [data-tilt], .project').forEach((element) => {
    element.addEventListener('pointerenter', () => { cursor.style.width = '48px'; cursor.style.height = '48px'; });
    element.addEventListener('pointerleave', () => {
      cursor.style.width = '28px'; cursor.style.height = '28px';
      if (element.hasAttribute('data-tilt')) element.style.transform = '';
    });
  });
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--pointer-x', `${(x + 0.5) * 100}%`);
      card.style.setProperty('--pointer-y', `${(y + 0.5) * 100}%`);
      card.style.transform = `perspective(700px) rotateX(${-y * 4}deg) rotateY(${x * 5}deg)`;
    });
  });
  document.querySelectorAll('.project').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
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
    portrait.addEventListener('pointermove', (event) => {
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

document.addEventListener('visibilitychange', () => {
  const current = videos[activeScene];
  if (!current) return;
  if (document.hidden) current.pause();
  else if (filmEnabled() && !reduceMotion) current.play().catch(() => {});
});

setScene(0, 'SYSTEM / INTRO');
setPalette(document.querySelector('#intro'));

