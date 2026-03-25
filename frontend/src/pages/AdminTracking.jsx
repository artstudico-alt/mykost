import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, CheckCircle, Clock, Users, Home, XCircle } from 'lucide-react';
import api from '../utils/api';

const AdminTracking = () => {
  const [hunians, setHunians] = useState([]);
  const [stats, setStats] = useState({ total_hunian: 0, aktif: 0, verified: 0, belum_verified: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchTracking(); }, []);

  const fetchTracking = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tracking/hunian');
      setHunians(res.data.data || []);
      setStats(res.data.stats || {});
    } catch (e) {
      console.error('Gagal ambil tracking:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = hunians.filter(h => {
    const nama = h.karyawan?.user?.name || h.karyawan?.nama_karyawan || '';
    const matchSearch = nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.kost?.nama_kost || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || h.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const summaryCards = [
    { label: 'Total Hunian', value: stats.total_hunian || 0, color: '#6366f1', bg: '#eef2ff', icon: Home },
    { label: 'Hunian Aktif', value: stats.aktif || 0, color: '#10b981', bg: '#ecfdf5', icon: CheckCircle },
    { label: 'Sudah Verified', value: stats.verified || 0, color: '#3b82f6', bg: '#eff6ff', icon: CheckCircle },
    { label: 'Belum Verified', value: stats.belum_verified || 0, color: '#f59e0b', bg: '#fffbeb', icon: Clock },
  ];

  const statusCfg = {
    aktif:   { label: 'Aktif',   bg: '#ecfdf5', color: '#059669' },
    selesai: { label: 'Selesai', bg: '#f1f5f9', color: '#64748b' },
    pending: { label: 'Pending', bg: '#fffbeb', color: '#d97706' },
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Tracking Hunian</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0', fontWeight: 500 }}>
          Pantau data hunian karyawan beserta lokasi kost mereka secara real-time.
        </p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {summaryCards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} style={{ background: 'white', borderRadius: 16, padding: '18px 20px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>{c.label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>{c.value}</p>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 18, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', gap: 12, flexWrap: 'wrap', background: '#fcfcfd' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '8px 14px', flex: 1, maxWidth: 360 }}>
            <MapPin size={15} color="#94a3b8" />
            <input type="text" placeholder="Cari nama karyawan atau kost..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, background: 'transparent', width: '100%', color: '#1e293b', fontWeight: 500 }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'aktif', 'selesai', 'pending'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                padding: '8px 13px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                border: filterStatus === s ? 'none' : '1px solid #e2e8f0',
                background: filterStatus === s ? '#0f172a' : 'white',
                color: filterStatus === s ? 'white' : '#64748b',
              }}>
                {s === 'all' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Karyawan', 'Kantor', 'Kost / Kamar', 'Tanggal Masuk', 'Status', 'Verifikasi'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '13px 20px', color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 50, textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Memuat data tracking...</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 50, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Belum ada data hunian karyawan.</td></tr>
              ) : filtered.map(h => {
                const sc = statusCfg[h.status] || statusCfg.pending;
                const nama = h.karyawan?.user?.name || h.karyawan?.nama_karyawan || '-';
                return (
                  <tr key={h.id} style={{ borderBottom: '1px solid #f8fafc' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#475569', fontSize: 15 }}>
                          {nama.charAt(0)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{nama}</p>
                          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{h.karyawan?.no_karyawan || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                      {h.karyawan?.kantor?.nama_kantor || '-'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{h.kost?.nama_kost || '-'}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={10} /> {h.kost?.kota || '-'}
                      </p>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 12, color: '#64748b' }}>
                      {h.tanggal_mulai ? new Date(h.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {h.is_verified ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#059669' }}>
                          <CheckCircle size={13} /> Terverifikasi
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>
                          <Clock size={13} /> Belum
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminTracking;
