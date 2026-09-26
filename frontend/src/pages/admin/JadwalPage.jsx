import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../../lib/api';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function JadwalPage() {
  const [jadwals, setJadwals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState({ nama: '', hari_kerja: ['Senin','Selasa','Rabu','Kamis','Jumat'], jam_masuk: '08:00', jam_pulang: '16:00', toleransi_menit: 15, is_default: false });
  const [submitting, setSubmitting] = useState(false);

  const fetchJadwal = () => {
    api.get('/jadwal').then(({ data }) => setJadwals(data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchJadwal(); }, []);

  const toggleHari = (hari) => {
    const updated = form.hari_kerja.includes(hari)
      ? form.hari_kerja.filter((h) => h !== hari)
      : [...form.hari_kerja, hari];
    setForm({ ...form, hari_kerja: updated });
  };

  const openAdd = () => {
    setEditData(null);
    setForm({ nama: '', hari_kerja: ['Senin','Selasa','Rabu','Kamis','Jumat'], jam_masuk: '08:00', jam_pulang: '16:00', toleransi_menit: 15, is_default: false });
    setShowModal(true);
  };

  const openEdit = (j) => {
    setEditData(j);
    setForm({ nama: j.nama, hari_kerja: j.hari_kerja, jam_masuk: j.jam_masuk, jam_pulang: j.jam_pulang, toleransi_menit: j.toleransi_menit, is_default: j.is_default });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editData) await api.put(`/jadwal/${editData.id}`, form);
      else await api.post('/jadwal', form);
      setShowModal(false);
      fetchJadwal();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan jadwal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus jadwal ini?')) return;
    await api.delete(`/jadwal/${id}`);
    fetchJadwal();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Jadwal Kerja</h1>
          <p className="page-desc">Atur jam dan hari kerja pegawai</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Tambah Jadwal</button>
      </div>

      <div className="cards-grid">
        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : jadwals.length === 0 ? (
          <div className="card"><div className="card-body empty-row">Belum ada jadwal kerja</div></div>
        ) : jadwals.map((j) => (
          <div key={j.id} className={`card jadwal-card ${j.is_default ? 'jadwal-default' : ''}`}>
            {j.is_default && <div className="jadwal-badge-default">Default</div>}
            <div className="card-body">
              <h3 className="jadwal-nama">{j.nama}</h3>
              <div className="jadwal-time">
                <span>{j.jam_masuk}</span> — <span>{j.jam_pulang}</span>
              </div>
              <div className="jadwal-hari">
                {HARI.map((h) => (
                  <span key={h} className={`hari-chip ${j.hari_kerja.includes(h) ? 'hari-aktif' : ''}`}>{h.slice(0, 3)}</span>
                ))}
              </div>
              <div className="jadwal-toleransi">Toleransi keterlambatan: {j.toleransi_menit} menit</div>
            </div>
            <div className="card-footer">
              <button className="btn-icon btn-edit" onClick={() => openEdit(j)}><Edit2 size={15} /></button>
              <button className="btn-icon btn-delete" onClick={() => handleDelete(j.id)}><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editData ? 'Edit Jadwal' : 'Tambah Jadwal'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Nama Jadwal</label>
                <input className="form-input" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Hari Kerja</label>
                <div className="hari-selector">
                  {HARI.map((h) => (
                    <button key={h} type="button"
                      className={`hari-chip ${form.hari_kerja.includes(h) ? 'hari-aktif' : ''}`}
                      onClick={() => toggleHari(h)}
                    >{h.slice(0, 3)}</button>
                  ))}
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Jam Masuk</label>
                  <input type="time" className="form-input" value={form.jam_masuk} onChange={(e) => setForm({ ...form, jam_masuk: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Jam Pulang</label>
                  <input type="time" className="form-input" value={form.jam_pulang} onChange={(e) => setForm({ ...form, jam_pulang: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Toleransi (menit)</label>
                  <input type="number" className="form-input" value={form.toleransi_menit} onChange={(e) => setForm({ ...form, toleransi_menit: Number(e.target.value) })} min={0} max={120} />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
                  Jadwal Default
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner-sm" /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
