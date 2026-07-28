import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../api';
import Modal from '../components/Modal';

interface Device { id: string; nama: string; lokasi: string; status: string; last_seen: string | null; }

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState({ nama: '', lokasi: '' });

  useEffect(() => {
    api.getDevices().then(setDevices).catch(console.error);
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'device_online')
        setDevices((prev) => prev.map((d) => d.id === msg.deviceId ? { ...d, status: 'online' } : d));
      else if (msg.type === 'device_offline')
        setDevices((prev) => prev.map((d) => d.id === msg.deviceId ? { ...d, status: 'offline' } : d));
      else if (msg.type === 'device_deleted')
        setDevices((prev) => prev.filter((d) => d.id !== msg.deviceId));
    };
    return () => ws.close();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return devices;
    const q = search.toLowerCase();
    return devices.filter((d) => d.nama.toLowerCase().includes(q) || d.lokasi.toLowerCase().includes(q));
  }, [devices, search]);

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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input placeholder="Cari device..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="toolbar-actions">
            <button className="btn btn-secondary" onClick={exportExcel} title="Export Excel">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export Excel
            </button>
            <button className="btn btn-primary" onClick={openAdd}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Tambah Device
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Daftar Device {search && <span style={{ fontWeight: 400, color: '#86868b' }}>— hasil untuk "{search}"</span>}</h3>
        {filtered.length === 0 ? (
          <div className="empty-state"><p>{devices.length === 0 ? 'Belum ada device. Klik "Tambah Device" di atas.' : 'Device tidak ditemukan.'}</p></div>
        ) : (
          <table>
            <thead><tr><th>Nama</th><th>Lokasi</th><th>Status</th><th>Last Seen</th><th>Aksi</th></tr></thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td className="fw-600">{d.nama}</td>
                  <td>{d.lokasi}</td>
                  <td><span className={`badge ${d.status === 'online' ? 'badge-online' : 'badge-offline'}`}>{d.status}</span></td>
                  <td className="table-muted">{d.last_seen ? new Date(d.last_seen).toLocaleString() : '-'}</td>
                  <td className="actions-cell">
                    <button className="btn-icon" onClick={() => openEdit(d)} title="Edit">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(d.id)} title="Hapus">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Device' : 'Tambah Device'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="modal-field">
            <label>Nama Device</label>
            <input placeholder="Contoh: TV-Lobi-01" value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })} required autoFocus />
          </div>
          <div className="modal-field">
            <label>Lokasi</label>
            <input placeholder="Contoh: Lobby Lt.1" value={form.lokasi}
              onChange={(e) => setForm({ ...form, lokasi: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">{editId ? 'Simpan' : 'Tambah'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
