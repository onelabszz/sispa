/**
 * SISPA — Util umum
 */

function el(id) { return document.getElementById(id); }

function showToast(msg, type = 'info') {
  const color = type === 'error' ? 'bg-red-600'
    : type === 'success' ? 'bg-green-600'
    : 'bg-slate-800';
  const div = document.createElement('div');
  div.className = 'fixed bottom-4 right-4 ' + color +
    ' text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm max-w-xs';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3500);
}

function formatTanggal(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderHeader(user, activePath) {
  const nav = [
    { href: '/ks/dashboard.html', label: 'Dashboard', roles: ['KS'] },
    { href: '/ks/guru.html', label: 'Guru', roles: ['KS'] },
    { href: '/ks/supervisi.html', label: 'Supervisi', roles: ['KS'] },
    { href: '/ks/coaching.html', label: 'Coaching', roles: ['KS'] },
    { href: '/pengawas/dashboard.html', label: 'Dashboard', roles: ['Pengawas'] }
  ];

  const links = nav
    .filter(n => n.roles.includes(user.role))
    .map(n => {
      const active = activePath === n.href
        ? 'text-indigo-600 font-semibold'
        : 'text-slate-600 hover:text-indigo-600';
      return `<a href="${sispaUrl(n.href)}" class="text-sm ${active}">${n.label}</a>`;
    }).join('');

  return `
    <nav class="bg-white shadow-sm border-b border-slate-200">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a href="${sispaUrl(user.role === 'Pengawas' ? '/pengawas/dashboard.html' : '/ks/dashboard.html')}"
             class="font-bold text-indigo-700 text-lg">SISPA</a>
          <span class="hidden md:inline text-xs text-slate-500 border-l border-slate-200 pl-4">
            ${escapeHtml(user.nama_sekolah || '')} · NPSN ${escapeHtml(user.npsn)}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <div class="hidden md:flex items-center gap-4">${links}</div>
          <a href="${sispaUrl('/settings.html')}" class="text-sm text-slate-500 hover:text-indigo-600" title="Pengaturan">⚙️</a>
          <button id="logoutBtn" class="text-sm text-red-600 hover:underline">Keluar</button>
        </div>
      </div>
    </nav>`;
}

function mountHeader(activePath) {
  const user = sispaGetUser();
  if (!user) return;
  const holder = document.getElementById('appHeader');
  if (holder) holder.innerHTML = renderHeader(user, activePath);
  const btn = document.getElementById('logoutBtn');
  if (btn) btn.addEventListener('click', async () => {
    if (!confirm('Keluar dari SISPA?')) return;
    await sispaLogout();
    window.location.href = sispaUrl('/index.html');
  });
}

function handleApiError(err) {
  if (err.code === 401 || (err.message || '').includes('TOKEN_EXPIRED')) {
    alert('Sesi berakhir. Silakan login ulang.');
    localStorage.removeItem(SISPA_CONFIG.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(SISPA_CONFIG.STORAGE_KEYS.USER);
    window.location.href = sispaUrl('/index.html');
    return;
  }
  showToast(err.message || 'Terjadi kesalahan', 'error');
}

window.el = el;
window.showToast = showToast;
window.formatTanggal = formatTanggal;
window.todayIso = todayIso;
window.escapeHtml = escapeHtml;
window.mountHeader = mountHeader;
window.handleApiError = handleApiError;
