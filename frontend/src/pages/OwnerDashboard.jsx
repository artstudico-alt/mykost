import React, { useState, useEffect } from 'react';
import { Home, DollarSign, CalendarCheck, TrendingUp, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalKost: 0, aktif: 0, pendapatan: 0, bookingBaru: 0 });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOwnerStats(); }, []);

  const fetchOwnerStats = async () => {
    try {
      const [kostRes, bookRes, payRes] = await Promise.allSettled([
        api.get('/kost'),
        api.get('/booking'),
        api.get('/pembayaran?status=lunas'),
      ]);

      const kosts = kostRes.status === 'fulfilled' ? kostRes.value.data.data || [] : [];
      const bookings = bookRes.status === 'fulfilled' ? bookRes.value.data.data || [] : [];
      const payments = payRes.status === 'fulfilled' ? payRes.value.data.data || [] : [];

      setStats({
        totalKost: kosts.length,
        aktif: kosts.filter(k => k.status === 'aktif').length,
        pendapatan: payments.reduce((sum, p) => sum + parseFloat(p.jumlah || 0), 0),
        bookingBaru: bookings.filter(b => b.status === 'pending').length,
      });
      setRecentBookings(bookings.slice(0, 5));
    } catch (e) {
      console.error('Owner Stats Error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(135deg, #059669, #10b981)', borderRadius: 24, padding: '36px 40px', marginBottom: 32, color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -20, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#ecfdf5' }}>OWNER PORTAL</p>
          <h1 style={{ margin: '8px 0 4px', fontSize: 28, fontWeight: 800 }}>Halo, {user?.name}!</h1>
          <p style={{ margin: 0, opacity: 0.9, fontWeight: 500 }}>Kelola properti kost Anda dan pantau pendapatan masuk secara real-time.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 32 }}>
        {[
          { label: 'Total Properti', value: stats.totalKost, icon: Home, color: '#10b981' },
          { label: 'Properti Aktif', value: stats.aktif, icon: CheckCircle, color: '#3b82f6' },
          { label: 'Booking Pending', value: stats.bookingBaru, icon: Clock, color: '#f59e0b' },
          { label: 'Total Pendapatan', value: `Rp ${stats.pendapatan.toLocaleString('id-ID')}`, icon: DollarSign, color: '#10b981', small: true },
        ].map(c => (
          <div key={c.label} style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9' }}>
            <div style={{ color: c.color, marginBottom: 16 }}><c.icon size={26} /></div>
            <p style={{ fontSize: c.small ? 20 : 32, fontWeight: 800, margin: 0, color: '#1e293b' }}>{loading ? '...' : c.value}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', margin: '4px 0 0' }}>{c.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
          <div style={{ padding: '24px 30px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>Pemesanan Kamar Terbaru</h3>
            <button style={{ fontSize: 13, fontWeight: 700, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer' }}>Kelola Booking</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Penyewa', 'Kost', 'Bulan', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 30px', color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center' }}><Loader2 className="animate-spin" /></td></tr> : recentBookings.length === 0 ? <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Belum ada booking masuk.</td></tr> : recentBookings.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '16px 30px' }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{b.user?.name || 'Penyewa'}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{b.user?.email}</p>
                    </td>
                    <td style={{ padding: '16px 30px', fontSize: 13, color: '#475569', fontWeight: 600 }}>{b.kost?.nama_kost || '-'}</td>
                    <td style={{ padding: '16px 30px', fontSize: 13, color: '#475569', fontWeight: 700 }}>{b.durasi_bulan} Bln</td>
                    <td style={{ padding: '16px 30px' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 5, background: '#f1f5f9', padding: '4px 10px', borderRadius: 20, width: 'fit-content' }}>
                        {b.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 20 }}>Okupansi Properti</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Kost Aktif', color: '#10b981', val: stats.aktif },
              { label: 'Menunggu Verifikasi', color: '#f59e0b', val: stats.totalKost - stats.aktif },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{item.label}</span><span style={{ fontSize: 13, fontWeight: 800 }}>{item.val}</span></div>
                <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', background: item.color, width: `${stats.totalKost > 0 ? (item.val/stats.totalKost*100) : 0}%` }}></div></div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, padding: 20, background: 'white', borderRadius: 16, border: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12 }}>Tips Properti</p>
            <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>Pastikan data kost Anda selalu akurat untuk menarik lebih banyak penyewa karyawan.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
