/**
 * SISPA — API Client
 * Semua request ke GAS lewat sini.
 * Mengirim payload di dua tempat: top-level & nested (payload),
 * agar kompatibel dengan semua endpoint backend.
 */

async function sispaRequest(action, payload = {}) {
  const apiUrl = getApiUrl();
  const token = localStorage.getItem(SISPA_CONFIG.STORAGE_KEYS.TOKEN);

  const body = Object.assign({}, payload, {
    action: action,
    version: 'v1',
    token: token || '',
    client_request_id: generateRequestId()
  });

  // Jika caller tidak mengirim nested `payload`, buat dari top-level.
  // Jika caller sudah kirim nested (mis. { id, payload: {...} }), biarkan.
  if (body.payload === undefined) {
    body.payload = payload;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    SISPA_CONFIG.REQUEST_TIMEOUT
  );

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();

    if (data.status === 'error') {
      const err = new Error(data.message || 'Terjadi kesalahan');
      err.code = data.code;
      throw err;
    }

    return data.data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Permintaan timeout. Periksa koneksi atau URL GAS.');
    }
    throw err;
  }
}

function generateRequestId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'req-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
}

async function testApiConnection(url) {
  const target = url || getApiUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'admin.health', version: 'v1' }),
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    return { ok: data.status === 'ok', data: data };
  } catch (err) {
    clearTimeout(timeoutId);
    return { ok: false, error: err.message || String(err) };
  }
}

window.sispaRequest = sispaRequest;
window.testApiConnection = testApiConnection;
