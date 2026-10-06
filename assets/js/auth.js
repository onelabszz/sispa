/**
 * SISPA — Autentikasi & Guard
 */

async function sispaLogin(npsn, password) {
  const data = await sispaRequest('auth.login', { npsn, password });
  localStorage.setItem(SISPA_CONFIG.STORAGE_KEYS.TOKEN, data.token);
  localStorage.setItem(SISPA_CONFIG.STORAGE_KEYS.USER, JSON.stringify(data.user));
  return data;
}

async function sispaLogout() {
  try { await sispaRequest('auth.logout', {}); } catch (e) {}
  localStorage.removeItem(SISPA_CONFIG.STORAGE_KEYS.TOKEN);
  localStorage.removeItem(SISPA_CONFIG.STORAGE_KEYS.USER);
}

function sispaGetUser() {
  const raw = localStorage.getItem(SISPA_CONFIG.STORAGE_KEYS.USER);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function sispaGetToken() {
  return localStorage.getItem(SISPA_CONFIG.STORAGE_KEYS.TOKEN);
}

function sispaIsLoggedIn() {
  return !!sispaGetToken() && !!sispaGetUser();
}

/**
 * Guard: redirect ke login jika belum masuk / role tidak sesuai.
 * @returns user atau null (dan sudah redirect).
 */
function sispaRequireLogin(allowedRoles) {
  if (!sispaIsLoggedIn()) {
    window.location.href = sispaUrl('/index.html');
    return null;
  }
  const user = sispaGetUser();
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    alert('Anda tidak memiliki akses ke halaman ini.');
    window.location.href = sispaUrl('/index.html');
    return null;
  }
  return user;
}

function sispaRedirectByRole(user) {
  if (!user) return;
  window.location.href = user.role === 'Pengawas'
    ? sispaUrl('/pengawas/dashboard.html')
    : sispaUrl('/ks/dashboard.html');
}

window.sispaLogin = sispaLogin;
window.sispaLogout = sispaLogout;
window.sispaGetUser = sispaGetUser;
window.sispaGetToken = sispaGetToken;
window.sispaIsLoggedIn = sispaIsLoggedIn;
window.sispaRequireLogin = sispaRequireLogin;
window.sispaRedirectByRole = sispaRedirectByRole;

/**
 * Redirect ke halaman utama sesuai role.
 */
function sispaHomeUrl(user) {
  if (!user) return sispaUrl('/index.html');
  if (user.role === 'Pengawas') return sispaUrl('/pengawas/dashboard.html');
  return sispaUrl('/ks/dashboard.html');
}

window.sispaHomeUrl = sispaHomeUrl;
