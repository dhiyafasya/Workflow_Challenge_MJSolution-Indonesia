import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../api';
import Modal from '../components/Modal';
import { Search, Download, Plus, ChevronLeft, ChevronRight, Copy, Check, Pencil, Trash2 } from 'lucide-react';

interface Device { id: string; nama: string; lokasi: string; status: string; last_seen: string | null; }

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [form, setForm] = useState({ nama: '', lokasi: '' });

  useEffect(() => {
    api.getDevices().then(setDevices).catch(console.error);
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;

    const connect = () => {
      ws = new WebSocket('ws://localhost:3001');

      ws.onopen = () => { retryCount = 0; };

      ws.onclose = () => {
        ws = null;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        retryCount++;
        retryTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => { ws?.close(); };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'device_online')
            setDevices((prev) => prev.map((d) => d.id === msg.deviceId ? { ...d, status: 'online' } : d));
          else if (msg.type === 'device_offline')
            setDevices((prev) => prev.map((d) => d.id === msg.deviceId ? { ...d, status: 'offline' } : d));
          else if (msg.type === 'device_deleted')
            setDevices((prev) => prev.filter((d) => d.id !== msg.deviceId));
          else if (msg.type === 'device_added' && msg.device)
            setDevices((prev) => [...prev, msg.device]);
          else if (msg.type === 'device_updated' && msg.device)
            setDevices((prev) => prev.map((d) => d.id === msg.device.id ? msg.device : d));
        } catch {}
      };
    };

    connect();
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      if (ws) { ws.onclose = null; ws.close(); ws = null; }
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return devices;
    const q = search.toLowerCase();
    return devices.filter((d) => d.nama.toLowerCase().includes(q) || d.lokasi.toLowerCase().includes(q));
  }, [devices, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const openAdd = () => {
    setEditId('');
    setForm({ nama: '', lokasi: '' });
    setModalOpen(true);
  };

  const openEdit = (d: Device) => {
    setEditId(d.id);
    setForm({ nama: d.nama, lokasi: d.lokasi || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.updateDevice(editId, form);
      } else {
        await api.createDevice(form);
      }
      const updated = await api.getDevices();
      setDevices(updated);
      setModalOpen(false);
    } catch (err) { alert(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus device ini?')) return;
    try {
      await api.deleteDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
      if (editId === id) setEditId('');
    } catch (err) { alert(err); }
  };

  const copyUrl = (id: string) => {
    const url = `http://localhost:5173/device/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 2000);
    }).catch(() => {
      prompt('Copy URL ini:', url);
    });
  };

  const exportExcel = () => {
    const data = devices.map((d, i) => ({
      No: i + 1,
      Nama: d.nama,
      Lokasi: d.lokasi,
      Status: d.status,
      'Last Seen': d.last_seen ? new Date(d.last_seen).toLocaleString() : '-',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Devices');
    XLSX.writeFile(wb, `devices_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <>
      <div className="page-header">
        <h2>Devices</h2>
        <p>Kelola semua device signage</p>
      </div>

      <div className="card">
        <div className="devices-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input placeholder="Cari device..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="toolbar-actions">
            <button className="btn btn-excel" onClick={exportExcel} title="Export Excel">
              <Download size={16} />
              Export Excel
            </button>
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} />
              Tambah Device
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Daftar Device {search && <span className="search-hint">— hasil untuk "{search}"</span>}</h3>
        {filtered.length === 0 ? (
          <div className="empty-state"><p>{devices.length === 0 ? 'Belum ada device. Klik "Tambah Device" di atas.' : 'Device tidak ditemukan.'}</p></div>
        ) : (
          <table>
            <thead><tr><th>No</th><th>Nama</th><th>Lokasi</th><th>Status</th><th>Last Seen</th><th>Aksi</th></tr></thead>
            <tbody>
              {paginated.map((d, idx) => (
                <tr key={d.id}>
                  <td className="table-muted table-no">{(safePage - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="fw-600">{d.nama}</td>
                  <td>{d.lokasi}</td>
                  <td><span className={`badge ${d.status === 'online' ? 'badge-online' : 'badge-offline'}`}>{d.status}</span></td>
                  <td className="table-muted">{d.last_seen ? new Date(d.last_seen).toLocaleString() : '-'}</td>
                  <td className="actions-cell">
                    <button className="btn-icon" onClick={() => copyUrl(d.id)} title="Copy device URL">
                      {copiedId === d.id ? (
                        <Check size={16} className="icon-check" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                    <button className="btn-icon" onClick={() => openEdit(d)} title="Edit">
                      <Pencil size={16} />
                    </button>
                    <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(d.id)} title="Hapus">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn-icon page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} title="Sebelumnya">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`page-btn ${p === safePage ? 'page-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="btn-icon page-btn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} title="Selanjutnya">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Device' : 'Tambah Device'}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label>Nama Device</label>
            <input placeholder="Contoh: TV-Lobi-01" value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })} required autoFocus />
          </div>
          <div className="modal-field">
            <label>Lokasi</label>
            <input placeholder="Contoh: Lobby Lt.1" value={form.lokasi}
              onChange={(e) => setForm({ ...form, lokasi: e.target.value })} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">{editId ? 'Simpan' : 'Tambah'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
