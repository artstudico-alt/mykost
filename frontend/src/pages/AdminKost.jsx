import React, { useState, useEffect } from 'react';
import { Home, Edit2, Trash2, Search, MapPin, CheckCircle, XCircle, Clock, Loader2, Plus } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const AdminKost = () => {
  const { user } = useAuth();
  const role = user?.role?.name || '';
  const isOwner = role === 'pemilik_kost';
  const isAdmin = role === 'super_admin';

  const [kosts, setKosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [currentKost, setCurrentKost] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama_kost: '', alamat: '', kota: '', provinsi: 'Jawa Barat', tipe: 'campur', harga_min: '', status: 'pending', deskripsi: '', latitude: -6.1751, longitude: 106.8650
  });

  useEffect(() => { fetchKosts(); }, []);

  const fetchKosts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/kost');
      setKosts(response.data.data || []);
    } catch (error) {
      console.error('Gagal mengambil data kost:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (kost = null) => {
    if (kost) {
      setCurrentKost(kost);
      setFormData({
        nama_kost: kost.nama_kost || '',
        alamat: kost.alamat || '',
        kota: kost.kota || '',
        provinsi: kost.provinsi || 'Jawa Barat',
        tipe: kost.tipe || 'campur',
        harga_min: kost.harga_min || '',
        status: kost.status || 'pending',
        deskripsi: kost.deskripsi || '',
        latitude: kost.latitude || -6.1751,
        longitude: kost.longitude || 106.8650
      });
    } else {
      setCurrentKost(null);
      setFormData({
        nama_kost: '', alamat: '', kota: '', provinsi: 'Jawa Barat', tipe: 'campur', harga_min: '', status: 'pending', deskripsi: '', latitude: -6.1751, longitude: 106.8650
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isAdmin && currentKost) {
        // Super Admin hanya update status
        await api.patch(`/kost/${currentKost.id}/status`, { status: formData.status });
      } else if (isOwner) {
        if (currentKost) {
          await api.put(`/kost/${currentKost.id}`, formData);
        } else {
          await api.post('/kost', formData);
        }
      }
      setShowModal(false);
      fetchKosts();
    } catch (error) {
      alert('Gagal menyimpan kost: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Hapus kost "${nama}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await api.delete(`/kost/${id}/force`);
      fetchKosts();
    } catch (error) {
      alert('Gagal menghapus kost.');
    }
  };

  const statusFilter = kosts.filter(k => filterStatus === 'all' || k.status === filterStatus);
  const filteredKosts = statusFilter.filter(k =>
    k.nama_kost?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.kota?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusConfig = {
    aktif: { label: 'Aktif', icon: <CheckCircle size={12} />, cls: 'pill-aktif' },
    pending: { label: 'Pending', icon: <Clock size={12} />, cls: 'pill-pending' },
    nonaktif: { label: 'Nonaktif', icon: <XCircle size={12} />, cls: 'pill-nonaktif' },
  };

  const tipeConfig = {
    putra: { label: 'Putra', cls: 'tipe-putra' },
    putri: { label: 'Putri', cls: 'tipe-putri' },
    campur: { label: 'Campur', cls: 'tipe-campur' },
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            {isOwner ? 'Kost Saya' : 'Properti Kost'}
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 6, fontWeight: 500 }}>
            {isOwner ? 'Kelola daftar properti kost yang Anda miliki.' : 'Kelola dan moderasi properti yang didaftarkan oleh Pemilik Kost.'}
          </p>
        </div>
        {isOwner && (
          <button 
            onClick={() => handleOpenModal()}
            style={{ 
              background: '#10b981', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, 
              fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
            }}
          >
            <Plus size={18} /> Tambah Kost
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Properti', value: kosts.length, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Kost Aktif', value: kosts.filter(k => k.status === 'aktif').length, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Pending Review', value: kosts.filter(k => k.status === 'pending').length, color: '#f59e0b', bg: '#fffbeb' },
        ].map(card => (
          <div key={card.label} style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>{card.label}</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>{card.value}</p>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
              <Home size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
        {/* Toolbar */}
        <div style={{ padding: '18px 28px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: '#fcfcfd' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '9px 16px', flex: 1, maxWidth: 380, transition: 'all 0.2s' }}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Cari nama kost atau kota..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 14, color: '#1e293b', background: 'transparent', width: '100%', fontWeight: 500 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'aktif', 'pending', 'nonaktif'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  border: filterStatus === s ? 'none' : '1px solid #e2e8f0',
                  background: filterStatus === s ? '#0f172a' : 'white',
                  color: filterStatus === s ? 'white' : '#64748b',
                }}
              >
                {s === 'all' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Properti', 'Lokasi', 'Tipe', 'Harga/Bulan', 'Status', 'Aksi'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 24px', color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid #f1f5f9' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Memuat data properti...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredKosts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14, fontWeight: 500 }}>
                    Tidak ada properti ditemukan.
                  </td>
                </tr>
              ) : filteredKosts.map(k => {
                const sc = statusConfig[k.status] || statusConfig.pending;
                const tc = tipeConfig[k.tipe] || tipeConfig.campur;
                return (
                  <tr key={k.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexShrink: 0 }}>
                          <Home size={17} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: '#0f172a', margin: 0, fontSize: 14 }}>{k.nama_kost}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 600 }}>#{k.id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: 13 }}>
                        <MapPin size={13} />
                        <span>{k.kota}{k.provinsi ? `, ${k.provinsi}` : ''}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={tc.cls} style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                        {tc.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                      Rp {parseInt(k.harga_min || 0).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={sc.cls} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        {sc.icon} {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleOpenModal(k)}
                          title="Edit Kost"
                          style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(k.id, k.nama_kost)}
                          title="Hapus Kost"
                          style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: isAdmin ? 480 : 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', animation: 'fadeUp 0.25s ease' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {isAdmin ? 'Moderasi Kost' : (currentKost ? 'Edit Data Kost' : 'Tambah Kost Baru')}
                </h2>
                {currentKost && <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>{currentKost.nama_kost}</p>}
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <XCircle size={22} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: 28 }}>
              {isAdmin ? (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status Persetujuan</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, outline: 'none' }}
                  >
                    <option value="aktif">✅ Aktif — Setujui</option>
                    <option value="pending">⏳ Pending — Review</option>
                    <option value="nonaktif">❌ Nonaktif — Tolak</option>
                  </select>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Nama Kost</label>
                    <input type="text" value={formData.nama_kost} onChange={e => setFormData({...formData, nama_kost: e.target.value})} required style={{ width: '100%', padding: '11px 16px', borderRadius: 10, border: '1px solid #e2e8f0', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Tipe</label>
                    <select value={formData.tipe} onChange={e => setFormData({...formData, tipe: e.target.value})} style={{ width: '100%', padding: '11px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <option value="putra">Putra</option>
                      <option value="putri">Putri</option>
                      <option value="campur">Campur</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Harga Sewa / Bulan (Rp)</label>
                    <input type="number" value={formData.harga_min} onChange={e => setFormData({...formData, harga_min: e.target.value})} required style={{ width: '100%', padding: '11px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Alamat Lengkap</label>
                    <textarea value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} required style={{ width: '100%', padding: '11px 16px', borderRadius: 10, border: '1px solid #e2e8f0', minHeight: 80 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Kota</label>
                    <input type="text" value={formData.kota} onChange={e => setFormData({...formData, kota: e.target.value})} required style={{ width: '100%', padding: '11px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Provinsi</label>
                    <input type="text" value={formData.provinsi} onChange={e => setFormData({...formData, provinsi: e.target.value})} required style={{ width: '100%', padding: '11px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 24, marginTop: 20, borderTop: '1px solid #f1f5f9' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, fontSize: 14 }}>Batal</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#0f172a', color: 'white', fontWeight: 700, fontSize: 14, opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Memproses...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .tipe-putra { background: #eff6ff; color: #2563eb; }
        .tipe-putri { background: #fdf2f8; color: #db2777; }
        .tipe-campur { background: #f5f3ff; color: #7c3aed; }
        .pill-aktif { background: #ecfdf5; color: #059669; }
        .pill-pending { background: #fffbeb; color: #d97706; }
        .pill-nonaktif { background: #f1f5f9; color: #64748b; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default AdminKost;
