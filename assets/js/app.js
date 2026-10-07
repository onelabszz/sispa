/**
 * SISPA — UI Shell + Utilities
 */

/* ============================================================
   ICONS (Lucide)
   ============================================================ */

function refreshIcons() {
  if (window.lucide) {
    lucide.createIcons();
    return;
  }
  let attempts = 0;
  const tryCreate = () => {
    if (window.lucide) {
      lucide.createIcons();
    } else if (attempts++ < 20) {
      setTimeout(tryCreate, 100);
    }
  };
  tryCreate();
}

function icon(name, cls) {
  return `<i data-lucide="${name}" class="${cls || 'w-5 h-5'}"></i>`;
}

/* ============================================================
   SWEETALERT2
   ============================================================ */

const Swal2 = window.Swal;

function swalLoading(title) {
  return Swal2.fire({
    title: title || 'Memproses...',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal2.showLoading()
  });
}

function swalSuccess(title, text) {
  return Swal2.fire({
    icon: 'success',
    title: title || 'Berhasil',
    text: text || '',
    timer: 1800,
    showConfirmButton: false
  });
}

function swalError(title, text) {
  return Swal2.fire({
    icon: 'error',
    title: title || 'Terjadi Kesalahan',
    text: text || ''
  });
}

function swalConfirm(title, text, opts) {
  const o = opts || {};
  return Swal2.fire({
    title: title,
    text: text || '',
    icon: o.icon || 'question',
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: o.confirmText || 'Ya, lanjutkan',
    cancelButtonText: o.cancelText || 'Batal',
    confirmButtonColor: o.danger ? '#dc2626' : '#4f46e5',
    cancelButtonColor: '#64748b',
    reverseButtons: true
  }).then(r => r.isConfirmed);
}

function swalInput(title, inputType, placeholder) {
  return Swal2.fire({
    title: title,
    input: inputType || 'text',
    inputPlaceholder: placeholder || '',
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: '#64748b',
    reverseButtons: true,
    inputValidator: (v) => !v && 'Wajib diisi'
  }).then(r => r.isConfirmed ? r.value : null);
}

/* ============================================================
   TOAST
   ============================================================ */

function showToast(msg, type) {
  type = type || 'info';
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

/* ============================================================
   LOADING
   ============================================================ */

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
  try {
    return await fn();
  } finally {
    hideLoading();
  }
}

/* ============================================================
   PDF PREVIEW
   ============================================================ */

function openPdfPreview(res) {
  if (!res) {
    swalError('Gagal', 'Respons kosong.');
    return;
  }
  if (res.mode === 'drive' && res.pdf_url) {
    window.open(res.pdf_url, '_blank');
    return;
  }
  if (res.mode === 'html' && res.html) {
    const w = window.open('', '_blank');
    if (!w) {
      swalError('Popup diblokir', 'Izinkan popup agar laporan dapat dicetak.');
      return;
    }
    w.document.open();
    w.document.write(res.html);
    w.document.close();
    return;
  }
  swalError('Gagal', 'Format respons tidak dikenal.');
}

/* ============================================================
   UTILS
   ============================================================ */

function el(id) {
  const node = document.getElementById(id);
  if (node) return node;

  console.warn('[SISPA] Elemen tidak ditemukan:', id);
  return {
    textContent: '',
    innerHTML: '',
    value: '',
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    style: {},
    dataset: {},
    addEventListener() {},
    removeEventListener() {},
    appendChild() {},
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTanggal(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function formatTanggalWaktu(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/* ============================================================
   API ERROR HANDLER
   ============================================================ */

function handleApiError(err) {
  if (err.code === 401 || (err.message || '').includes('TOKEN_EXPIRED')) {
    showToast('Sesi berakhir. Silakan login ulang.', 'error');
    localStorage.removeItem(SISPA_CONFIG.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(SISPA_CONFIG.STORAGE_KEYS.USER);
    setTimeout(() => { window.location.href = sispaUrl('/index.html'); }, 1200);
    return;
  }
  if (err.code === 409 && (err.message || '').includes('SISTEM_SIBUK')) {
    showToast('Server sedang sibuk. Coba lagi sebentar.', 'error');
    return;
  }
  showToast(err.message || 'Terjadi kesalahan', 'error');
}

/* ============================================================
   NAVIGATION CONFIG
   ============================================================ */

const SISPA_NAV = {
  KS: [
    { section: 'Utama' },
    { key: 'dashboard', href: '/ks/dashboard.html',  label: 'Dashboard',  icon: 'layout-dashboard' },
    { section: 'Manajemen' },
    { key: 'guru',      href: '/ks/guru.html',       label: 'Data Guru',  icon: 'users' },
    { section: 'Supervisi' },
    { key: 'supervisi', href: '/ks/supervisi.html',  label: 'Supervisi',  icon: 'clipboard-list' },
    { key: 'coaching',  href: '/ks/coaching.html',   label: 'Coaching',   icon: 'message-square' },
    { section: 'Bantuan' },
    { key: 'panduan',   href: '/panduan.html',       label: 'Panduan',    icon: 'book-open' }
  ],
  Pengawas: [
    { section: 'Utama' },
    { key: 'dashboard', href: '/pengawas/dashboard.html', label: 'Dashboard', icon: 'layout-dashboard' },
    { section: 'Monitoring' },
    { key: 'guru',      href: '/pengawas/guru.html',      label: 'Daftar Guru', icon: 'users' },
    { key: 'supervisi', href: '/pengawas/supervisi.html', label: 'Semua Supervisi', icon: 'clipboard-list' },
    { key: 'coaching',  href: '/pengawas/coaching.html',  label: 'Semua Coaching', icon: 'message-square' },
    { section: 'Bantuan' },
    { key: 'panduan',   href: '/panduan.html',            label: 'Panduan', icon: 'book-open' }
  ],
  Admin: [
    { section: 'Utama' },
    { key: 'dashboard', href: '/admin/dashboard.html',   label: 'Dashboard', icon: 'layout-dashboard' },
    { section: 'Manajemen' },
    { key: 'users',     href: '/admin/users.html',       label: 'Users', icon: 'users' },
    { key: 'sekolah',   href: '/admin/sekolah.html',     label: 'Sekolah', icon: 'building-2' },
    { section: 'Monitoring' },
    { key: 'supervisi', href: '/pengawas/supervisi.html', label: 'Semua Supervisi', icon: 'clipboard-list' },
    { key: 'coaching',  href: '/pengawas/coaching.html',  label: 'Semua Coaching', icon: 'message-square' },
    { section: 'Sistem' },
    { key: 'audit-log', href: '/admin/audit-log.html',   label: 'Audit Log', icon: 'activity' },
    { key: 'settings',  href: '/admin/pengaturan.html',  label: 'Pengaturan', icon: 'settings' },
    { section: 'Bantuan' },
    { key: 'panduan',   href: '/panduan.html',           label: 'Panduan', icon: 'book-open' }
  ]
};

const SISPA_ROLE_LABEL = {
  KS: 'Kepala Sekolah',
  Pengawas: 'Pengawas',
  Admin: 'Administrator'
};

/* ============================================================
   SHELL BUILDER — SIDEBAR
   ============================================================ */

function buildSidebar(user, activeKey) {
  const items = SISPA_NAV[user.role] || SISPA_NAV.KS;

  const navHtml = items.map(item => {
    if (item.section) {
      return `<div class="sidebar-section-title">${item.section}</div>`;
    }
    const active = item.key === activeKey ? 'active' : '';
    return `
      <a href="${sispaUrl(item.href)}" class="nav-item ${active}">
        ${icon(item.icon, 'w-5 h-5')}
        <span>${item.label}</span>
      </a>`;
  }).join('');

  const roleLabel = SISPA_ROLE_LABEL[user.role] || user.role;

  return `
    <aside id="appSidebar" class="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand-logo">${icon('graduation-cap', 'w-5 h-5')}</div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-slate-900 text-sm leading-tight">SISPA</div>
          <div class="text-xs text-slate-500 truncate">${escapeHtml(user.nama_sekolah || user.npsn)}</div>
        </div>
        <button id="sidebarClose" class="icon-btn lg:hidden" title="Tutup">
          ${icon('x', 'w-5 h-5')}
        </button>
      </div>
      <nav class="sidebar-nav">${navHtml}</nav>
      <div class="sidebar-footer">
        <div class="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div class="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
               style="background: var(--brand-100); color: var(--brand-700)">
            ${escapeHtml((user.nama || user.nama_sekolah || 'U').charAt(0).toUpperCase())}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-medium text-slate-900 truncate">${escapeHtml(user.nama || user.nama_sekolah || user.npsn)}</div>
            <div class="text-xs text-slate-500 truncate">${roleLabel}</div>
          </div>
        </div>
      </div>
    </aside>
    <div id="sidebarOverlay" class="overlay"></div>`;
}

/* ============================================================
   SHELL BUILDER — HEADER (dengan logout di pojok kanan atas)
   ============================================================ */

function buildHeader(user) {
  const roleLabel = SISPA_ROLE_LABEL[user.role] || user.role;
  return `
    <header class="header">
      <button id="menuBtn" class="icon-btn lg:hidden" title="Menu">
        ${icon('menu', 'w-5 h-5')}
      </button>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-slate-500 truncate">
          NPSN <span class="text-mono">${escapeHtml(user.npsn)}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="hidden md:block text-right">
          <div class="text-xs font-medium text-slate-900 truncate" style="max-width: 200px;">
            ${escapeHtml(user.nama_sekolah || user.npsn)}
          </div>
          <div class="text-xs text-slate-500">${roleLabel}</div>
        </div>
        <button id="profileBtn" class="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 transition" title="Menu Akun">
          <div class="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
               style="background: var(--brand-100); color: var(--brand-700)">
            ${escapeHtml((user.nama || user.nama_sekolah || 'U').charAt(0).toUpperCase())}
          </div>
          ${icon('chevron-down', 'w-3.5 h-3.5 text-slate-400 hidden md:block')}
        </button>
      </div>
    </header>`;
}

/* ============================================================
   IMPERSONATION BANNER
   ============================================================ */

function mountImpersonationBanner() {
  const backup = sessionStorage.getItem('sispa_admin_backup');
  if (!backup) return;
  if (document.getElementById('impersonationBanner')) return;

  const bar = document.createElement('div');
  bar.id = 'impersonationBanner';
  bar.style.cssText = 'position:fixed;bottom:16px;left:16px;z-index:100;background:#f59e0b;color:#fff;padding:10px 14px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,.18);display:flex;align-items:center;gap:10px;font-size:13px;font-weight:500;max-width:90vw';
  bar.innerHTML = `${icon('user-check', 'w-4 h-4')}<span>Anda melihat sebagai user lain</span><button id="btnBackAdmin" style="background:#fff;color:#d97706;padding:4px 10px;border-radius:6px;font-weight:600;cursor:pointer;border:none;font-size:12px;">Kembali ke Admin</button>`;
  document.body.appendChild(bar);
  refreshIcons();

  document.getElementById('btnBackAdmin').addEventListener('click', () => {
    try {
      const b = JSON.parse(sessionStorage.getItem('sispa_admin_backup'));
      localStorage.setItem(SISPA_CONFIG.STORAGE_KEYS.TOKEN, b.token);
      localStorage.setItem(SISPA_CONFIG.STORAGE_KEYS.USER, b.user);
    } catch (e) { /* abaikan */ }
    sessionStorage.removeItem('sispa_admin_backup');
    window.location.href = sispaUrl('/admin/dashboard.html');
  });
}

/* ============================================================
   PROFILE DROPDOWN MENU
   ============================================================ */

function openProfileMenu(anchorBtn) {
  // Cegah dobel
  closeProfileMenu();

  const user = sispaGetUser();
  if (!user) return;

  const roleLabel = SISPA_ROLE_LABEL[user.role] || user.role;

  const rect = anchorBtn.getBoundingClientRect();
  const menu = document.createElement('div');
  menu.id = 'profileMenu';
  menu.style.cssText = [
    'position:fixed',
    'z-index:200',
    'background:#fff',
    'border:1px solid #e2e8f0',
    'border-radius:12px',
    'box-shadow:0 10px 25px rgba(0,0,0,.12)',
    'padding:6px',
    'min-width:240px',
    'font-size:14px',
    'top:' + (rect.bottom + 8) + 'px',
    'right:' + Math.max(8, window.innerWidth - rect.right) + 'px'
  ].join(';');

  menu.innerHTML = `
    <div class="px-3 py-2 border-b border-slate-100 mb-1">
      <div class="text-sm font-semibold text-slate-900 truncate">
        ${escapeHtml(user.nama || '(Belum diisi)')}
      </div>
      <div class="text-xs text-slate-500 truncate mt-0.5">
        ${escapeHtml(user.nama_sekolah || user.npsn)}
      </div>
      <div class="text-xs text-slate-400 mt-0.5">${roleLabel}</div>
    </div>

    <a href="${sispaUrl('/panduan.html')}" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700">
      ${icon('book-open', 'w-4 h-4')}
      <span>Panduan</span>
    </a>

    <a href="${sispaUrl('/settings.html')}" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700">
      ${icon('settings', 'w-4 h-4')}
      <span>Pengaturan Koneksi</span>
    </a>

    <div style="height:1px;background:#f1f5f9;margin:4px 0"></div>

    <button id="profileLogoutBtn" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 text-left">
      ${icon('log-out', 'w-4 h-4')}
      <span>Keluar</span>
    </button>`;

  document.body.appendChild(menu);
  refreshIcons();

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', closeProfileMenuOnOutside, { once: true });
  }, 50);

  // Event: logout
  document.getElementById('profileLogoutBtn').addEventListener('click', async (e) => {
    e.stopPropagation();
    closeProfileMenu();
    const ok = await swalConfirm(
      'Keluar dari SISPA?',
      'Anda akan diminta login kembali.',
      { confirmText: 'Ya, keluar', danger: true }
    );
    if (!ok) return;
    await sispaLogout();
    window.location.href = sispaUrl('/index.html');
  });

  // Event: klik menu item
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeProfileMenu);
  });
}

function closeProfileMenu() {
  const m = document.getElementById('profileMenu');
  if (m) m.remove();
}

function closeProfileMenuOnOutside(e) {
  const menu = document.getElementById('profileMenu');
  if (!menu) return;
  const btn = document.getElementById('profileBtn');
  if (menu.contains(e.target)) return;
  if (btn && btn.contains(e.target)) return;
  closeProfileMenu();
}

/* ============================================================
   MIGRATION BANNER
   ============================================================ */

function checkMigrationBanner() {
  if (typeof wasJustMigrated !== 'function') return;
  if (!wasJustMigrated()) return;
  if (document.getElementById('migrationBanner')) return;

  const banner = document.createElement('div');
  banner.id = 'migrationBanner';
  banner.style.cssText = [
    'position:fixed',
    'top:16px',
    'left:50%',
    'transform:translateX(-50%)',
    'z-index:110',
    'background:#4f46e5',
    'color:#fff',
    'padding:10px 16px',
    'border-radius:12px',
    'box-shadow:0 10px 25px rgba(79,70,229,.35)',
    'display:flex',
    'align-items:center',
    'gap:10px',
    'font-size:13px',
    'font-weight:500',
    'max-width:90vw'
  ].join(';');

  banner.innerHTML = `
    ${icon('sparkles', 'w-4 h-4')}
    <span>Aplikasi telah diperbarui — memuat data terbaru…</span>
    <button id="btnCloseMigration" style="background:transparent;border:none;color:#fff;cursor:pointer;padding:2px 6px;font-size:16px;line-height:1">×</button>`;

  document.body.appendChild(banner);
  refreshIcons();

  setTimeout(() => {
    if (banner.parentNode) {
      banner.style.opacity = '0';
      banner.style.transform = 'translateX(-50%) translateY(-8px)';
      banner.style.transition = 'all .3s ease';
      setTimeout(() => banner.remove(), 300);
    }
    if (typeof clearMigrationFlag === 'function') clearMigrationFlag();
  }, 4000);

  const btn = document.getElementById('btnCloseMigration');
  if (btn) {
    btn.addEventListener('click', () => {
      banner.remove();
      if (typeof clearMigrationFlag === 'function') clearMigrationFlag();
    });
  }
}

/* ============================================================
   MOUNT SHELL
   ============================================================ */

function mountShell(activeKey) {
  const user = sispaGetUser();
  if (!user) return;

  // Cegah mount ganda
  if (document.getElementById('sispaShell')) return;

  // Kumpulkan konten halaman (kecuali script)
  const bodyChildren = Array.from(document.body.childNodes);
  const contentNodes = [];

  bodyChildren.forEach(n => {
    if (n.nodeType === 1 && n.tagName === 'SCRIPT') return;
    if (n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim())) {
      contentNodes.push(n);
    }
  });

  // Bangun shell
  const shell = document.createElement('div');
  shell.id = 'sispaShell';
  shell.innerHTML = `
    ${buildSidebar(user, activeKey)}
    <div class="app-content">
      ${buildHeader(user)}
      <main id="appMain" class="app-main"></main>
    </div>`;

  // Pindahkan konten ke appMain
  const main = shell.querySelector('#appMain');
  contentNodes.forEach(n => main.appendChild(n));

  // Sisipkan shell di awal body
  document.body.insertBefore(shell, document.body.firstChild);

  refreshIcons();

  // Event listeners
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuBtn = document.getElementById('menuBtn');
  const closeBtn = document.getElementById('sidebarClose');
  const profileBtn = document.getElementById('profileBtn');

  function openSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('show');
  }
  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
  }

  if (menuBtn) menuBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  if (profileBtn) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openProfileMenu(profileBtn);
    });
  }

  // Banner
  mountImpersonationBanner();
  checkMigrationBanner();
}

/* ============================================================
   MODAL
   ============================================================ */

function openModal(opts) {
  closeModal();
  const wrap = document.createElement('div');
  wrap.id = 'sispaModal';
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `
    <div class="modal-panel" style="${opts.maxWidth ? 'max-width:' + opts.maxWidth + ';' : ''}">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h3 class="font-semibold text-slate-900">${escapeHtml(opts.title)}</h3>
        <button class="icon-btn" data-close title="Tutup">${icon('x', 'w-5 h-5')}</button>
      </div>
      <div class="p-5 overflow-y-auto">${opts.body}</div>
      ${opts.footer ? `<div class="px-5 py-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">${opts.footer}</div>` : ''}
    </div>`;
  document.body.appendChild(wrap);
  refreshIcons();

  wrap.querySelectorAll('[data-close]').forEach(b =>
    b.addEventListener('click', closeModal));
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) closeModal();
  });
}

function closeModal() {
  const m = document.getElementById('sispaModal');
  if (m) m.remove();
}

/* ============================================================
   EXPORT KE WINDOW
   ============================================================ */

window.refreshIcons       = refreshIcons;
window.icon               = icon;

window.Swal2              = Swal2;
window.swalLoading        = swalLoading;
window.swalSuccess        = swalSuccess;
window.swalError          = swalError;
window.swalConfirm        = swalConfirm;
window.swalInput          = swalInput;

window.showToast          = showToast;

window.showLoading        = showLoading;
window.hideLoading        = hideLoading;
window.withLoading        = withLoading;

window.openPdfPreview     = openPdfPreview;

window.el                 = el;
window.escapeHtml         = escapeHtml;
window.formatTanggal      = formatTanggal;
window.formatTanggalWaktu = formatTanggalWaktu;
window.todayIso           = todayIso;

window.handleApiError     = handleApiError;

window.SISPA_NAV          = SISPA_NAV;
window.SISPA_ROLE_LABEL   = SISPA_ROLE_LABEL;
window.mountShell         = mountShell;

window.mountImpersonationBanner = mountImpersonationBanner;
window.checkMigrationBanner     = checkMigrationBanner;
window.openProfileMenu          = openProfileMenu;
window.closeProfileMenu         = closeProfileMenu;

window.openModal          = openModal;
window.closeModal         = closeModal;
