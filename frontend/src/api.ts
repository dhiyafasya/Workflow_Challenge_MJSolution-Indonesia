const API = 'http://localhost:3001/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    headers: getHeaders(),
    ...options,
  });
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.reload();
    }
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error);
  }
  return res.json();
}

export const api = {
  getDevices: () => request('/devices'),
  createDevice: (data: { nama: string; lokasi?: string }) =>
    request('/devices', { method: 'POST', body: JSON.stringify(data) }),
  updateDevice: (id: string, data: { nama?: string; lokasi?: string }) =>
    request(`/devices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDevice: (id: string) =>
    request(`/devices/${id}`, { method: 'DELETE' }),

  getContents: () => request('/contents'),
  createContent: (data: { judul: string; tipe: string; payload?: string }) =>
    request('/contents', { method: 'POST', body: JSON.stringify(data) }),
  updateContent: (id: string, data: { judul?: string; tipe?: string; payload?: string }) =>
    request(`/contents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContent: (id: string) =>
    request(`/contents/${id}`, { method: 'DELETE' }),

  getPlaylists: (deviceId?: string) =>
    request(deviceId ? `/playlists/device/${deviceId}` : '/playlists'),
  addToPlaylist: (deviceId: string, contentId: string) =>
    request('/playlists', { method: 'POST', body: JSON.stringify({ device_id: deviceId, content_id: contentId }) }),
  removeFromPlaylist: (id: string) =>
    request(`/playlists/${id}`, { method: 'DELETE' }),
  pushContent: (deviceId: string, contentId: string) =>
    request(`/playlists/push/${deviceId}`, { method: 'POST', body: JSON.stringify({ content_id: contentId }) }),
};
