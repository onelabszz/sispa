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
    { key: 'coaching',  href: '/ks/coaching.html',   label: 'Coaching',   icon: 'message-square' }
  ],
  Pengawas: [
    { section: 'Utama' },
    { key: 'dashboard', href: '/pengawas/dashboard.html', label: 'Dashboard', icon: 'layout-dashboard' },
    { section: 'Monitoring' },
    { key: 'guru',      href: '/pengawas/guru.html',      label: 'Daftar Guru', icon: 'users' },
    { key: 'supervisi', href: '/pengawas/supervisi.html', label: 'Semua Supervisi', icon: 'clipboard-list' },
    { key: 'coaching',  href: '/pengawas/coaching.html',  label: 'Semua Coaching', icon: 'message-square' }
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
