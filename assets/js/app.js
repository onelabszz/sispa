/**
 * SISPA — UI Shell + Utilities
 */

/* ============================================================
   ICONS (Lucide)
   ============================================================ */

function refreshIcons() {
  if (window.lucide) lucide.createIcons();
}

function icon(name, cls) {
  return `<i data-lucide="${name}" class="${cls || 'w-5 h-5'}"></i>`;
}

/* ============================================================
   SWEETALERT2 HELPERS
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

/**
 * Buka HTML hasil generate PDF di tab baru.
 * Tab baru berisi tombol "Cetak / Simpan sebagai PDF" yang otomatis
 * memicu window.print() saat diklik.
 *
 * @param {Object} res - Respons dari endpoint *.pdf
 *   { mode:'html', html:'...', filename:'...' } — mode preview
 *   { mode:'drive', pdf_url:'...' }             — mode Drive
 */
function openPdfPreview(res) {
  if (!res) {
    swalError('Gagal', 'Respons kosong.');
    return;
  }

  // Mode Drive: langsung buka URL
  if (res.mode === 'drive' && res.pdf_url) {
    window.open(res.pdf_url, '_blank');
    return;
  }

  // Mode HTML: buka tab baru dengan konten
  if (res.mode === 'html' && res.html) {
    const w = window.open('', '_blank');
    if (!w) {
      swalError('Popup diblokir',
        'Izinkan popup untuk browser ini agar laporan dapat dicetak.');
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

/**
 * Ambil elemen by id.
 * Mengembalikan dummy element jika tidak ditemukan,
 * supaya `el('x').textContent = '...'` tidak crash.
 */
function el(id) {
  const node = document.getElementById(id);
  if (node) return node;

  // Fallback: dummy supaya tidak crash
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
    { key: 'coaching',  href: '/ks/coaching.html',   label: 'Coaching',   icon: 'message-square' }
  ],
  Pengawas: [
    { section: 'Utama' },
    { key: 'dashboard', href: '/pengawas/dashboard.html', label: 'Dashboard', icon: 'layout-dashboard' },
    { section: 'Monitoring' },
    { key: 'guru',      href: '/pengawas/guru.html',      label: 'Daftar Guru', icon: 'users' }
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

const SISPA_ROLE_LABEL = {
  KS: 'Kepala Sekolah',
  Pengawas: 'Pengawas',
  Admin: 'Administrator'
};

/* ============================================================
   SHELL BUILDER
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
      <button id="menuBtn" class="icon-btn lg:hidden" title="Menu">
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
          <div class="text-xs text-slate-500">${SISPA_ROLE_LABEL[user.role] || user.role}</div>
        </div>
      </div>
    </header>`;
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

  // Pindahkan konten ke dalam appMain (appendChild otomatis menghilangkan dari posisi lama)
  const main = shell.querySelector('#appMain');
  contentNodes.forEach(n => main.appendChild(n));

  // Sisipkan shell di awal body (script tetap di tempatnya)
  document.body.insertBefore(shell, document.body.firstChild);

  refreshIcons();

  // Event listeners
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuBtn = document.getElementById('menuBtn');
  const closeBtn = document.getElementById('sidebarClose');
  const logoutBtn = document.getElementById('logoutBtn');

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('show');
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  }

  if (menuBtn) menuBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const ok = await swalConfirm(
        'Keluar dari SISPA?',
        'Anda akan diminta login kembali.',
        { confirmText: 'Ya, keluar', danger: true }
      );
      if (!ok) return;
      await sispaLogout();
      window.location.href = sispaUrl('/index.html');
    });
  }
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

window.openModal          = openModal;
window.closeModal         = closeModal;
