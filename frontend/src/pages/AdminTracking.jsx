import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, CheckCircle, Clock, Users, Home, XCircle } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const AdminTracking = () => {
  const { user, loading: authLoading } = useAuth();
  const [hunians, setHunians] = useState([]);
  const [stats, setStats] = useState({ total_hunian: 0, aktif: 0, verified: 0, belum_verified: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      fetchTracking();
    }
  }, [authLoading, user]);

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
    { label: 'Total Hunian', value: stats.total_hunian || 0, color: '#6366f1', bg: '#f5f3ff', icon: Home },
    { label: 'Hunian Aktif', value: stats.aktif || 0, color: '#22c55e', bg: '#f0fdf4', icon: CheckCircle },
    { label: 'Sudah Verified', value: stats.verified || 0, color: '#2563eb', bg: '#eff6ff', icon: CheckCircle },
    { label: 'Belum Verified', value: stats.belum_verified || 0, color: '#f59e0b', bg: '#fffbeb', icon: Clock },
  ];

  const statusCfg = {
    aktif:   { label: 'Aktif',   bg: '#f0fdf4', color: '#16a34a' },
    selesai: { label: 'Selesai', bg: '#f8fafc', color: '#64748b' },
    pending: { label: 'Pending', bg: '#fffbeb', color: '#d97706' },
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.8px' }}>Tracking Hunian</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '8px 0 0', fontWeight: 500 }}>
          Pantau data hunian karyawan beserta lokasi kost mereka secara real-time.
        </p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, marginBottom: 32 }}>
        {summaryCards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} style={{ background: 'white', borderRadius: 24, padding: '24px 28px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>{c.label}</p>
                <p style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '4px 0 0', letterSpacing: '-0.5px' }}>{c.value}</p>
              </div>
              <div style={{ width: 54, height: 54, borderRadius: 16, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, boxShadow: `0 8px 16px ${c.color}15` }}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 28, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
        <div style={{ padding: '20px 32px', borderBottom: '1px solid #f8fafc', display: 'flex', gap: 16, flexWrap: 'wrap', background: '#fcfcfd' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '10px 18px', flex: 1, maxWidth: 400 }}>
            <MapPin size={18} color="#94a3b8" />
            <input type="text" placeholder="Cari nama karyawan atau kost..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 14, background: 'transparent', width: '100%', color: '#1e293b', fontWeight: 500 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 14 }}>
            {['all', 'aktif', 'selesai', 'pending'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                padding: '8px 16px', borderRadius: 11, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                border: 'none',
                background: filterStatus === s ? 'white' : 'transparent',
                color: filterStatus === s ? '#0f172a' : '#64748b',
                boxShadow: filterStatus === s ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
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
                  <th key={h} style={{ textAlign: 'left', padding: '16px 32px', color: '#94a3b8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 80, textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: 15, fontWeight: 600 }}>Memuat data tracking...</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 80, textAlign: 'center', color: '#94a3b8', fontSize: 15, fontWeight: 500 }}>Belum ada data hunian karyawan.</td></tr>
              ) : filtered.map(h => {
                const sc = statusCfg[h.status] || statusCfg.pending;
                const nama = h.karyawan?.user?.name || h.karyawan?.nama_karyawan || '-';
                return (
                  <tr key={h.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#475569', fontSize: 17 }}>
                          {nama.charAt(0)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>{nama}</p>
                          <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{h.karyawan?.no_karyawan || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 32px', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                      {h.karyawan?.divisi || h.karyawan?.nama || '-'}
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>{h.kost?.nama_kost || '-'}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                        <MapPin size={12} color="#94a3b8" /> {h.kost?.kota || '-'}
                      </p>
                    </td>
                    <td style={{ padding: '20px 32px', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                      {h.tanggal_mulai ? new Date(h.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 800, background: sc.bg, color: sc.color, textTransform: 'uppercase', letterSpacing: '0.3px', border: `1px solid ${sc.color}15` }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      {h.is_verified ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#16a34a' }}>
                          <CheckCircle size={15} strokeWidth={3} /> Terverifikasi
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#f59e0b' }}>
                          <Clock size={15} strokeWidth={3} /> Tertunda
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
