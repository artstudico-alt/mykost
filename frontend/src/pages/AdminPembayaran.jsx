import React, { useState, useEffect } from 'react';
import { CheckSquare, Search, Loader2, CheckCircle, Clock, XCircle, Eye, DollarSign } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const AdminPembayaran = () => {
  const { user, loading: authLoading } = useAuth();
  const [pembayarans, setPembayarans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState({ total: 0, lunas: 0, pending: 0, totalNominal: 0 });

  useEffect(() => {
    if (!authLoading && user) {
      fetchPembayaran();
    }
  }, [authLoading, user]);

  const fetchPembayaran = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pembayaran');
      const data = res.data.data || [];
      setPembayarans(data);
      setSummary({
        total: data.length,
        lunas: data.filter(p => p.status === 'lunas').length,
        pending: data.filter(p => p.status === 'menunggu').length,
        totalNominal: data.filter(p => p.status === 'lunas').reduce((sum, p) => sum + parseFloat(p.jumlah || 0), 0),
      });
    } catch (e) {
      console.error('Gagal ambil pembayaran:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    if (!window.confirm('Verifikasi pembayaran ini?')) return;
    try {
      await api.patch(`/pembayaran/${id}/verify`);
      fetchPembayaran();
    } catch (e) {
      alert('Gagal verifikasi: ' + (e.response?.data?.message || e.message));
    }
  };

  const statusCfg = {
    lunas:      { label: 'Lunas',    bg: '#ecfdf5', color: '#059669', icon: <CheckCircle size={11}/> },
    menunggu:   { label: 'Menunggu', bg: '#fffbeb', color: '#d97706', icon: <Clock size={11}/> },
    gagal:      { label: 'Gagal',    bg: '#fef2f2', color: '#dc2626', icon: <XCircle size={11}/> },
    diproses:   { label: 'Diproses', bg: '#eff6ff', color: '#2563eb', icon: <Clock size={11}/> },
  };

  const filtered = pembayarans.filter(p => {
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const nama = p.booking?.user?.name || '';
    const matchSearch = nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.nomor_referensi || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const summaryCards = [
    { label: 'Total Transaksi', value: summary.total, color: '#6366f1', bg: '#eef2ff', icon: CheckSquare },
    { label: 'Pembayaran Lunas', value: summary.lunas, color: '#10b981', bg: '#ecfdf5', icon: CheckCircle },
    { label: 'Menunggu Verifikasi', value: summary.pending, color: '#f59e0b', bg: '#fffbeb', icon: Clock },
    { label: 'Total Nominal', value: `Rp ${summary.totalNominal.toLocaleString('id-ID')}`, color: '#3b82f6', bg: '#eff6ff', icon: DollarSign, small: true },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Pembayaran</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0', fontWeight: 500 }}>
          Monitor dan verifikasi seluruh transaksi pembayaran sewa kost.
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
                <p style={{ fontSize: c.small ? 18 : 26, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>{c.value}</p>
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
            <Search size={15} color="#94a3b8" />
            <input type="text" placeholder="Cari nama atau no. referensi..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, background: 'transparent', width: '100%', color: '#1e293b', fontWeight: 500 }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'lunas', 'menunggu', 'diproses', 'gagal'].map(s => (
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
                {['No. Referensi', 'Penyewa', 'Kost / Kamar', 'Jumlah', 'Status', 'Tanggal', 'Aksi'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '13px 20px', color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 50, textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Memuat data pembayaran...</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 50, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Tidak ada data pembayaran.</td></tr>
              ) : filtered.map(p => {
                const sc = statusCfg[p.status] || statusCfg.menunggu;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace' }}>
                      {p.nomor_referensi || '-'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{p.booking?.user?.name || '-'}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{p.booking?.user?.email || '-'}</p>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#64748b' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{p.booking?.kost?.nama_kost || '-'}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Kamar #{p.booking?.kamar_id}</p>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 800, color: '#0f172a', fontSize: 14 }}>
                      Rp {parseFloat(p.jumlah || 0).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>
                        {sc.icon} {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {p.status === 'menunggu' && (
                        <button onClick={() => handleVerify(p.id)}
                          style={{ padding: '7px 14px', borderRadius: 9, border: 'none', background: '#ecfdf5', color: '#059669', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <CheckCircle size={13} /> Verifikasi
                        </button>
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

export default AdminPembayaran;
