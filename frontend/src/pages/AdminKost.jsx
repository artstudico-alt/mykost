import React, { useState, useEffect } from 'react';
import { Home, Edit2, Trash2, Search, MapPin, CheckCircle, XCircle, Clock, Loader2, Plus } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

// Fix Marker Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component untuk update peta jika FormData diganti manual
function FormMapUpdater({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// Helper untuk klik Map Interaktif
function MapClickSetter({ setFormData }) {
  useMapEvents({
    click(e) {
      setFormData(prev => ({ ...prev, latitude: parseFloat(e.latlng.lat), longitude: parseFloat(e.latlng.lng) }));
    },
  });
  return null;
}

const AdminKost = () => {
  const { user, loading: authLoading } = useAuth();
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

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: 12,
    border: '1.5px solid #e2e8f0', outline: 'none',
    fontSize: 14, fontWeight: 600, color: '#0f172a',
    background: 'white', transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };
  const labelStyle = {
    fontSize: 11, fontWeight: 800, color: '#64748b',
    display: 'block', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: '0.7px',
  };


  // Tunggu AuthContext selesai sebelum fetch, cegah race condition
  useEffect(() => {
    if (!authLoading && user) {
      fetchKosts();
    }
  }, [authLoading, user]);

  const fetchKosts = async () => {
    setLoading(true);
    try {
      // Pastikan token ada sebelum request
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Token belum tersedia, skip fetch.');
        return;
      }
      const response = await api.get('/kost');
      setKosts(response.data.data || []);
    } catch (error) {
      console.error('Gagal mengambil data kost:', error);
      // Jika 401, token sudah expired — jangan crash UI
      if (error.response?.status !== 401) {
        // Coba sekali lagi setelah 1 detik
        setTimeout(() => fetchKosts(), 1000);
      }
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
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.8px' }}>
            {isOwner ? 'Kost Saya' : 'Properti Kost'}
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 8, fontWeight: 500 }}>
            {isOwner ? 'Kelola daftar properti kost yang Anda miliki.' : 'Kelola dan moderasi properti yang didaftarkan oleh Pemilik Kost.'}
          </p>
        </div>
        {isOwner && (
          <button 
            onClick={() => handleOpenModal()}
            style={{ 
              background: '#22c55e', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 14, 
              fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              boxShadow: '0 10px 20px -5px rgba(34, 197, 94, 0.4)', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={18} strokeWidth={3} /> Tambah Properti
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginBottom: 32 }}>
        {[
          { label: 'Total Properti', value: kosts.length, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Kost Aktif', value: kosts.filter(k => k.status === 'aktif').length, color: '#22c55e', bg: '#f0fdf4' },
          { label: 'Pending Review', value: kosts.filter(k => k.status === 'pending').length, color: '#f59e0b', bg: '#fffbeb' },
        ].map(card => (
          <div key={card.label} style={{ background: 'white', borderRadius: 24, padding: '24px 28px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>{card.label}</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '4px 0 0', letterSpacing: '-0.5px' }}>{card.value}</p>
            </div>
            <div style={{ width: 54, height: 54, borderRadius: 16, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, boxShadow: `0 8px 16px ${card.color}15` }}>
              <Home size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div style={{ background: 'white', borderRadius: 28, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
        {/* Toolbar */}
        <div style={{ padding: '20px 32px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: '#fcfcfd' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '10px 18px', flex: 1, maxWidth: 400, transition: 'all 0.2s' }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="Cari nama kost atau lokasi..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 14, color: '#1e293b', background: 'transparent', width: '100%', fontWeight: 500 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 14 }}>
            {['all', 'aktif', 'pending', 'nonaktif'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '8px 16px', borderRadius: 11, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  border: 'none',
                  background: filterStatus === s ? 'white' : 'transparent',
                  color: filterStatus === s ? '#0f172a' : '#64748b',
                  boxShadow: filterStatus === s ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
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
                {['Properti', 'Lokasi', 'Tipe', 'Harga / Bulan', 'Status', 'Aksi'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '16px 32px', color: '#94a3b8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #f1f5f9' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '80px 0', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: 15, fontWeight: 600 }}>Memuat data properti...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredKosts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '80px 0', textAlign: 'center', color: '#94a3b8', fontSize: 15, fontWeight: 500 }}>
                    Tidak ada properti ditemukan.
                  </td>
                </tr>
              ) : filteredKosts.map(k => {
                const sc = statusConfig[k.status] || statusConfig.pending;
                const tc = tipeConfig[k.tipe] || tipeConfig.campur;
                return (
                  <tr key={k.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexShrink: 0, fontWeight: 800 }}>
                          <Home size={18} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 800, color: '#0f172a', margin: 0, fontSize: 14, letterSpacing: '-0.2px' }}>{k.nama_kost}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 700 }}>#{k.id} • Registered</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
                        <MapPin size={14} color="#94a3b8" />
                        <span>{k.kota}{k.provinsi ? `, ${k.provinsi}` : ''}</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <span className={tc.cls} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {tc.label}
                      </span>
                    </td>
                    <td style={{ padding: '20px 32px', fontWeight: 800, color: '#0f172a', fontSize: 14 }}>
                      Rp {parseInt(k.harga_min || 0).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <span className={sc.cls} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {sc.icon} {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleOpenModal(k)}
                          title="Edit Properti"
                          style={{ width: 38, height: 38, borderRadius: 11, border: 'none', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                          onMouseEnter={e => e.currentTarget.style.background='#e2e8f0'}
                          onMouseLeave={e => e.currentTarget.style.background='#f1f5f9'}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(k.id, k.nama_kost)}
                          title="Hapus Properti"
                          style={{ width: 38, height: 38, borderRadius: 11, border: 'none', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                          onMouseEnter={e => e.currentTarget.style.background='#fee2e2'}
                          onMouseLeave={e => e.currentTarget.style.background='#fef2f2'}
                        >
                          <Trash2 size={15} />
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 32, width: '100%', maxWidth: isAdmin ? 500 : 760, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.3)', animation: 'fadeUp 0.3s ease-out', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div style={{ padding: '32px 40px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.8px' }}>
                  {isAdmin ? 'Moderasi Properti' : (currentKost ? 'Perbarui Properti' : 'Tambah Properti Baru')}
                </h2>
                {currentKost && <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0', fontWeight: 600 }}>ID: #{currentKost.id} • {currentKost.nama_kost}</p>}
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'white', border: '1px solid #e2e8f0', width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' }}>
                <XCircle size={22} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: '32px 40px', overflowY: 'auto', flex: 1 }}>
              <form onSubmit={handleSubmit} id="kost-form">
                {isAdmin ? (
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>Tentukan Status Approval</label>
                    <div style={{ display: 'grid', gap: 12 }}>
                       {['aktif', 'pending', 'nonaktif'].map(s => (
                         <div key={s} 
                            onClick={() => setFormData({ ...formData, status: s })}
                            style={{ 
                              padding: '16px 20px', borderRadius: 16, border: `2px solid ${formData.status === s ? (s === 'aktif' ? '#22c55e' : (s === 'pending' ? '#f59e0b' : '#ef4444')) : '#f1f5f9'}`,
                              background: formData.status === s ? (s === 'aktif' ? '#f0fdf4' : (s === 'pending' ? '#fffbeb' : '#fef2f2')) : 'white',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s'
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                               <div style={{ width: 12, height: 12, borderRadius: '50%', background: s === 'aktif' ? '#22c55e' : (s === 'pending' ? '#f59e0b' : '#ef4444') }} />
                               <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 15, textTransform: 'capitalize' }}>{s}</span>
                            </div>
                            {formData.status === s && <CheckCircle size={20} color={s === 'aktif' ? '#22c55e' : (s === 'pending' ? '#f59e0b' : '#ef4444')} />}
                         </div>
                       ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                    {/* Nama Properti */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Nama Properti</label>
                      <input type="text" placeholder="Contoh: Kost Hijau Sejahtera"
                        value={formData.nama_kost}
                        onChange={e => setFormData({...formData, nama_kost: e.target.value})}
                        required style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#22c55e'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>

                    {/* Tipe Hunian */}
                    <div>
                      <label style={labelStyle}>Tipe Hunian</label>
                      <select value={formData.tipe}
                        onChange={e => setFormData({...formData, tipe: e.target.value})}
                        style={inputStyle}>
                        <option value="putra">Putra</option>
                        <option value="putri">Putri</option>
                        <option value="campur">Campur</option>
                      </select>
                    </div>

                    {/* Harga */}
                    <div>
                      <label style={labelStyle}>Harga Sewa / Bulan (Rp)</label>
                      <input type="number" placeholder="500000"
                        value={formData.harga_min}
                        onChange={e => setFormData({...formData, harga_min: e.target.value})}
                        required style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#22c55e'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>

                    {/* Alamat */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Alamat Lengkap</label>
                      <textarea placeholder="Jalan Raya No. 123..."
                        value={formData.alamat}
                        onChange={e => setFormData({...formData, alamat: e.target.value})}
                        required
                        style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
                        onFocus={e => e.target.style.borderColor = '#22c55e'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>

                    {/* Kota */}
                    <div>
                      <label style={labelStyle}>Kota</label>
                      <input type="text" placeholder="contoh: Bogor"
                        value={formData.kota}
                        onChange={e => setFormData({...formData, kota: e.target.value})}
                        required style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#22c55e'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>

                    {/* Provinsi */}
                    <div>
                      <label style={labelStyle}>Provinsi</label>
                      <input type="text" placeholder="contoh: Jawa Barat"
                        value={formData.provinsi}
                        onChange={e => setFormData({...formData, provinsi: e.target.value})}
                        required style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#22c55e'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>

                    {/* Container Koordinat */}
                    <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', display: 'block' }}>Pemetaan Otomatis Koordinat</label>
                          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Tekan tombol di samping setelah mengisi Alamat, Kota, dan Provinsi.</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={async () => {
                            if (!formData.kota) return alert('Silakan isi Kota terlebih dahulu (Minimal Kota/Kabupaten)!');
                            
                            // Percobaan 1: Detail Lengkap (Alamat + Kota)
                            let queryLengkap = '';
                            if (formData.alamat) queryLengkap += `${formData.alamat}, `;
                            queryLengkap += `${formData.kota}`;

                            // Percobaan 2: Fallback (Hanya Kota + Provinsi)
                            const queryKotaP = `${formData.kota}${formData.provinsi ? ', ' + formData.provinsi : ''}`;

                            // Percobaan 3: Super Toleran (HANYA KOTA)
                            const queryHanyaKota = formData.kota;

                            // Fungsi Helper untuk parsing hasil dari Photon (Komoot API)
                            const trySearch = async (queryStr) => {
                               const resp = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(queryStr)}&limit=1`);
                               const json = await resp.json();
                               if (json && json.features && json.features.length > 0) {
                                  return {
                                     lat: json.features[0].geometry.coordinates[1],
                                     lon: json.features[0].geometry.coordinates[0]
                                  };
                               }
                               return null;
                            };

                            setIsSubmitting(true);
                            try {
                              // Tembak 1 (Paling Presisi)
                              let point = await trySearch(queryLengkap);
                              if (point) {
                                setFormData(prev => ({...prev, latitude: point.lat, longitude: point.lon}));
                                alert('✅ Titik Y/X berhasil diisi akurat menggunakan Mesin Pencari Lanjutan!');
                                return;
                              } 

                              // Tembak 2 (Kota + Provinsi)
                              point = await trySearch(queryKotaP);
                              if (point) {
                                  setFormData(prev => ({...prev, latitude: point.lat, longitude: point.lon}));
                                  alert('⚠️ Jalan spesifik tidak dikenali secara utuh.\nNamun, koordinat otomatis diletakkan persis di pusat Desa/Wilayah Anda.');
                                  return;
                              }

                              // Tembak 3 (Paling Darurat - Hanya Kota)
                              point = await trySearch(queryHanyaKota);
                              if (point) {
                                  setFormData(prev => ({...prev, latitude: point.lat, longitude: point.lon}));
                                  alert('⚠️ Peta gagal melacak susunan alamat kompleks.\n\nKoordinat terpaksa kami letakkan di titik pusat Kota/Kabupaten [' + formData.kota + ']. Silakan seret Pin di peta mini untuk menyesuaikan.');
                              } else {
                                  alert('❌ Lokasi "' + formData.kota + '" tidak eksis di database Peta. Pastikan ketikan nama kota di Indonesia.');
                              }

                            } catch (e) {
                              alert('❌ Gagal menghubungi satelit Peta.');
                            } finally {
                              setIsSubmitting(false);
                            }
                          }}
                          style={{ background: 'white', color: '#2563eb', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <MapPin size={16} /> Cari Auto
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {/* Titik Koordinat - Latitude */}
                        <div>
                          <label style={labelStyle}>Latitude (Titik Y)</label>
                          <input type="number" step="any" placeholder="contoh: -6.563749"
                            value={formData.latitude}
                            onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value) || ''})}
                            required style={{...inputStyle, background: 'white'}}
                            onFocus={e => e.target.style.borderColor = '#22c55e'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                          />
                        </div>

                        {/* Titik Koordinat - Longitude */}
                        <div>
                          <label style={labelStyle}>Longitude (Titik X)</label>
                          <input type="number" step="any" placeholder="contoh: 106.781062"
                            value={formData.longitude}
                            onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value) || ''})}
                            required style={{...inputStyle, background: 'white'}}
                            onFocus={e => e.target.style.borderColor = '#22c55e'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                          />
                        </div>
                      </div>

                      {/* Interactive Mini Map */}
                      <div style={{ marginTop: 20, width: '100%', height: 250, borderRadius: 14, overflow: 'hidden', border: '2px solid #e2e8f0', position: 'relative' }}>
                        <MapContainer 
                          center={[formData.latitude || -6.1751, formData.longitude || 106.8650]} 
                          zoom={14} 
                          scrollWheelZoom={true} 
                          style={{ height: '100%', width: '100%', zIndex: 0 }}
                        >
                          <TileLayer 
                            attribution='&copy; Google Maps'
                            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" 
                          />
                          <FormMapUpdater lat={formData.latitude} lng={formData.longitude} />
                          <MapClickSetter setFormData={setFormData} />
                          
                          {(formData.latitude && formData.longitude) && (
                            <Marker position={[formData.latitude, formData.longitude]} />
                          )}
                        </MapContainer>
                        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 400, background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#0f172a', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', pointerEvents: 'none' }}>
                          💡 Sentuh/klik peta untuk pindahkan pin
                        </div>
                      </div>

                    </div>

                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '24px 40px', background: '#fcfcfd', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ padding: '13px 28px', borderRadius: 14, border: '1px solid #e2e8f0', background: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', color: '#475569', transition: 'all 0.2s' }}>Batal</button>
              <button type="submit" form="kost-form" disabled={isSubmitting} style={{ padding: '13px 32px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 20px -5px rgba(34,197,94,0.4)', minWidth: 160, opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? 'Memproses...' : (currentKost ? 'Simpan Perubahan' : 'Daftarkan Properti')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .tipe-putra { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
        .tipe-putri { background: #fdf2f8; color: #db2777; border: 1px solid #fce7f3; }
        .tipe-campur { background: #f5f3ff; color: #7c3aed; border: 1px solid #ede9fe; }
        .pill-aktif { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
        .pill-pending { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }

        .pill-nonaktif { background: #f8fafc; color: #64748b; border: 1px solid #f1f5f9; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};


export default AdminKost;
