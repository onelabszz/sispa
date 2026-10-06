/**
 * SISPA — UI Shell + Utilities
 */

/* ===== Icons ===== */
function refreshIcons() {
  if (window.lucide) lucide.createIcons();
}
function icon(name, cls) {
  return `<i data-lucide="${name}" class="${cls || 'w-5 h-5'}"></i>`;
}

/* ===== Toast ===== */
function showToast(msg, type = 'info') {
  const cls = type === 'success' ? 'toast-success'
            : type === 'error'   ? 'toast-error'
            : 'toast-info';
  const ic  = type === 'success' ? 'check-circle'
            : type === 'error'   ? 'alert-circle'
            : 'info';
  const div = document.createElement('div');
  div.className = 'toast ' + cls;
  div.innerHTML = `${icon(ic, 'w-4 h-4')}<span>${escapeHtml(msg)}</span>`;
  document.body.appendChild(div);
  refreshIcons();
  setTimeout(() => {
    div.style.opacity = '0';
    div.style.transform = 'translateY(8px)';
    setTimeout(() => div.remove(), 250);
  }, 3000);
}

/* ===== Loading ===== */
function showLoading(msg) {
  if (document.getElementById('sispaLoading')) return;
  const div = document.createElement('div');
  div.id = 'sispaLoading';
  div.className = 'loading-overlay';
  div.innerHTML = `
    <div class="text-center">
      <div class="spinner mx-auto mb-3"></div>
      <div class="text-sm text-slate-600">${escapeHtml(msg || 'Memuat...')}</div>
    </div>`;
  document.body.appendChild(div);
}
function hideLoading() {
  const el = document.getElementById('sispaLoading');
  if (el) el.remove();
}
async function withLoading(msg, fn) {
  showLoading(msg);
  try { return await fn(); } finally { hideLoading(); }
}

/* ===== Utils ===== */
function el(id) { return document.getElementById(id); }
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function formatTanggal(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function todayIso() { return new Date().toISOString().slice(0, 10); }

/* ===== API error handler ===== */
function handleApiError(err) {
  if (err.code === 401 || (err.message || '').includes('TOKEN_EXPIRED')) {
    showToast('Sesi berakhir. Silakan login ulang.', 'error');
    localStorage.removeItem(SISPA_CONFIG.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(SISPA_CONFIG.STORAGE_KEYS.USER);
    setTimeout(() => { window.location.href = sispaUrl('/index.html'); }, 1200);
    return;
  }
  showToast(err.message || 'Terjadi kesalahan', 'error');
}

/* ===== Navigation config ===== */
const SISPA_NAV = {
  KS: [
    { section: 'Utama' },
    { key: 'dashboard', href: '/ks/dashboard.html',  label: 'Dashboard',  icon: 'layout-dashboard' },
    { section: 'Manajemen' },
    { key: 'guru',      href: '/ks/guru.html',       label: 'Data Guru',  icon: 'users' },
    { section: 'Supervisi' },
    { key: 'supervisi', href: '/ks/supervisi.html',  label: 'Supervisi',  icon: 'clipboard-list' },
    { key: 'coaching',  href: '/ks/coaching.html',   label: 'Coaching',   icon: 'message-square' }
  ],
  Pengawas: [
    { section: 'Utama' },
    { key: 'dashboard', href: '/pengawas/dashboard.html', label: 'Dashboard', icon: 'layout-dashboard' }
  ],
  Admin: [
    { section: 'Utama' },
    { key: 'dashboard', href: '/ks/dashboard.html',      label: 'Dashboard', icon: 'layout-dashboard' },
    { section: 'Manajemen' },
    { key: 'guru',      href: '/ks/guru.html',           label: 'Data Guru', icon: 'users' },
    { section: 'Supervisi' },
    { key: 'supervisi', href: '/ks/supervisi.html',      label: 'Supervisi', icon: 'clipboard-list' },
    { key: 'coaching',  href: '/ks/coaching.html',       label: 'Coaching',  icon: 'message-square' },
    { section: 'Sistem' },
    { key: 'settings',  href: '/settings.html',          label: 'Pengaturan', icon: 'settings' }
  ]
};

function buildSidebar(user, activeKey) {
  const items = SISPA_NAV[user.role] || SISPA_NAV.KS;
  const navHtml = items.map(item => {
    if (item.section) return `<div class="sidebar-section-title">${item.section}</div>`;
    const active = item.key === activeKey ? 'active' : '';
    return `
      <a href="${sispaUrl(item.href)}" class="nav-item ${active}">
        ${icon(item.icon, 'w-5 h-5')}
        <span>${item.label}</span>
      </a>`;
  }).join('');

  const roleLabel = { KS: 'Kepala Sekolah', Pengawas: 'Pengawas', Admin: 'Administrator' }[user.role] || user.role;

  return `
    <aside id="appSidebar" class="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand-logo">${icon('graduation-cap', 'w-5 h-5')}</div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-slate-900 text-sm leading-tight">SISPA</div>
          <div class="text-xs text-slate-500 truncate">${escapeHtml(user.nama_sekolah || user.npsn)}</div>
        </div>
        <button id="sidebarClose" class="icon-btn lg:hidden">
          ${icon('x', 'w-5 h-5')}
        </button>
      </div>
      <nav class="sidebar-nav">${navHtml}</nav>
      <div class="sidebar-footer">
        <div class="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div class="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm flex-shrink-0" style="background: var(--brand-100); color: var(--brand-700)">
            ${escapeHtml((user.nama_sekolah || 'U').charAt(0).toUpperCase())}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-medium text-slate-900 truncate">${escapeHtml(user.nama_sekolah || user.npsn)}</div>
            <div class="text-xs text-slate-500 truncate">${roleLabel}</div>
          </div>
          <button id="logoutBtn" class="icon-btn" title="Keluar">
            ${icon('log-out', 'w-4 h-4')}
          </button>
        </div>
      </div>
    </aside>
    <div id="sidebarOverlay" class="overlay"></div>`;
}

function buildHeader(user) {
  return `
    <header class="header">
      <button id="menuBtn" class="icon-btn lg:hidden">
        ${icon('menu', 'w-5 h-5')}
      </button>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-slate-500">
          NPSN <span class="text-mono">${escapeHtml(user.npsn)}</span>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <div class="hidden md:block text-right mr-2">
          <div class="text-xs font-medium text-slate-900">${escapeHtml(user.nama_sekolah || user.npsn)}</div>
          <div class="text-xs text-slate-500">${user.role}</div>
        </div>
      </div>
    </header>`;
}

/**
 * Mount shell: sidebar + header.
 * Panggil setelah halaman siap.
 */
function mountShell(activeKey) {
  const user = sispaGetUser();
  if (!user) return;

  // Buat wrapper
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    ${buildSidebar(user, activeKey)}
    <div class="app-content">
      ${buildHeader(user)}
      <main id="appMain" class="app-main"></main>
    </div>
    <div id="pageContent" style="display:none"></div>
  `;
  document.body.insertBefore(wrapper, document.body.firstChild);

  // Pindahkan konten halaman (apapun setelah <body> asli) ke dalam appMain
  const main = document.getElementById('appMain');
  const nodes = Array.from(document.body.childNodes).filter(n => n !== wrapper && !n.id?.startsWith('sispa'));
  // Ambil semua script yang ada di body
  const scripts = [];
  nodes.forEach(n => {
    if (n.nodeType === 1 && n.tagName === 'SCRIPT') {
      scripts.push(n);
    } else if (n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim())) {
      main.appendChild(n);
    }
  });
  document.body.appendChild(wrapper);

  // Sembunyikan overlay body kalau ada
  document.body.appendChild(document.createElement('span')); // no-op

  // Event
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuBtn = document.getElementById('menuBtn');
  const closeBtn = document.getElementById('sidebarClose');
  const logoutBtn = document.getElementById('logoutBtn');

  function openSidebar() { sidebar.classList.add('open'); overlay.classList.add('show'); }
  function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('show'); }

  if (menuBtn) menuBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);
  if (logoutBtn) logoutBtn.addEventListener('click', async () => {
    if (!confirm('Keluar dari SISPA?')) return;
    await sispaLogout();
    window.location.href = sispaUrl('/index.html');
  });

  refreshIcons();
}

/* ===== Modal helper ===== */
function openModal({ title, body, footer, maxWidth }) {
  closeModal();
  const wrap = document.createElement('div');
  wrap.id = 'sispaModal';
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `
    <div class="modal-panel" style="${maxWidth ? 'max-width:' + maxWidth + ';' : ''}">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h3 class="font-semibold text-slate-900">${escapeHtml(title)}</h3>
        <button class="icon-btn" data-close>${icon('x', 'w-5 h-5')}</button>
      </div>
      <div class="p-5 overflow-y-auto">${body}</div>
      ${footer ? `<div class="px-5 py-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">${footer}</div>` : ''}
    </div>`;
  document.body.appendChild(wrap);
  refreshIcons();
  wrap.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal));
  wrap.addEventListener('click', e => { if (e.target === wrap) closeModal(); });
}

function closeModal() {
  const m = document.getElementById('sispaModal');
  if (m) m.remove();
}

window.refreshIcons = refreshIcons;
window.icon = icon;
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.withLoading = withLoading;
window.el = el;
window.escapeHtml = escapeHtml;
window.formatTanggal = formatTanggal;
window.todayIso = todayIso;
window.handleApiError = handleApiError;
window.mountShell = mountShell;
window.openModal = openModal;
window.closeModal = closeModal;
