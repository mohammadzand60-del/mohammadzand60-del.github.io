const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobileMedia = matchMedia('(max-width: 980px)');
const videos = [...document.querySelectorAll('.film-scene')];
const chapters = [...document.querySelectorAll('.chapter')];
const navLinks = [...document.querySelectorAll('[data-nav]')];
const dots = [...document.querySelectorAll('.progress-rail li')];
const sceneNumber = document.querySelector('#sceneNumber');
const sceneLabel = document.querySelector('#sceneLabel');
const cursor = document.querySelector('.cursor-orbit');
let activeScene = -1;

function loadVideos() {
  videos.forEach((video) => {
    const source = mobileMedia.matches ? video.dataset.mobile : video.dataset.desktop;
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
    if (i === safeIndex && !reduceMotion) video.play().catch(() => {});
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
  item.style.transitionDelay = `${Math.min(index % 5, 3) * 70}ms`;
  revealObserver.observe(item);
});

function updateProgress() {
  const scrollable = document.documentElement.scrollHeight - innerHeight;
  const progress = scrollable > 0 ? (scrollY / scrollable) * 100 : 0;
  document.documentElement.style.setProperty('--progress', `${progress}%`);
}
addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

if (!reduceMotion && matchMedia('(pointer: fine)').matches) {
  addEventListener('pointermove', (event) => {
    cursor.style.opacity = '1';
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  });
  document.querySelectorAll('a, [data-tilt]').forEach((element) => {
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
      card.style.transform = `perspective(700px) rotateX(${-y * 4}deg) rotateY(${x * 5}deg)`;
    });
  });
}

document.addEventListener('visibilitychange', () => {
  const current = videos[activeScene];
  if (!current) return;
  if (document.hidden) current.pause();
  else if (!reduceMotion) current.play().catch(() => {});
});

setScene(0, 'SYSTEM / INTRO');
