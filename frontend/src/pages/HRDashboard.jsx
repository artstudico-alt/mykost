import React, { useState, useEffect } from 'react';
import { Users, MapPin, CalendarCheck, BarChart3, Loader2, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

const HRDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalKaryawan: 0, trackingVerified: 0, trackingPending: 0, totalBooking: 0 });
  const [recentTracking, setRecentTracking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchHRStats(); }, []);

  const fetchHRStats = async () => {
    try {
      const [karyRes, trackRes] = await Promise.allSettled([
        api.get('/karyawan'),
        api.get('/tracking/hunian'),
      ]);

      const karyawan = karyRes.status === 'fulfilled' ? karyRes.value.data.data || [] : [];
      const trackData = trackRes.status === 'fulfilled' ? trackRes.value.data.data || [] : [];
      const trackStats = trackRes.status === 'fulfilled' ? trackRes.value.data.stats || {} : {};

      setStats({
        totalKaryawan: karyawan.length,
        trackingVerified: trackStats.verified || 0,
        trackingPending: trackStats.belum_verified || 0,
        totalBooking: trackData.filter(t => t.booking_id).length,
      });
      setRecentTracking(trackData.slice(0, 5));
    } catch (e) {
      console.error('HR Stats Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const hrGreeting = () => {
    const hr = new Date().getHours();
    return hr < 12 ? 'Selamat Pagi' : hr < 17 ? 'Selamat Siang' : 'Selamat Malam';
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: 24, padding: '36px 40px', marginBottom: 32, color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -20, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#c7d2fe' }}>HR PORTAL</p>
          <h1 style={{ margin: '8px 0 4px', fontSize: 28, fontWeight: 800 }}>{hrGreeting()}, {user?.name}!</h1>
          <p style={{ margin: 0, opacity: 0.9, fontWeight: 500 }}>Pantau hunian dan kesejahteraan karyawan kantor Anda di sini.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 32 }}>
        {[
          { label: 'Total Karyawan', value: stats.totalKaryawan, icon: Users, color: '#6366f1' },
          { label: 'Lokasi Terverifikasi', value: stats.trackingVerified, icon: CheckCircle, color: '#10b981' },
          { label: 'Menunggu Verifikasi', value: stats.trackingPending, icon: Clock, color: '#f59e0b' },
          { label: 'Total Hunian', value: stats.totalBooking, icon: MapPin, color: '#ec4899' },
        ].map(c => (
          <div key={c.label} style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9' }}>
            <div style={{ color: c.color, marginBottom: 16 }}><c.icon size={26} /></div>
            <p style={{ fontSize: 32, fontWeight: 800, margin: 0, color: '#1e293b' }}>{loading ? '...' : c.value}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', margin: '4px 0 0' }}>{c.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
          <div style={{ padding: '24px 30px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>Update Lokasi Karyawan</h3>
            <button style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer' }}>Lihat Semua</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Karyawan', 'Kost Terdaftar', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 30px', color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={3} style={{ padding: 40, textAlign: 'center' }}><Loader2 className="animate-spin" /></td></tr> : recentTracking.length === 0 ? <tr><td colSpan={3} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Belum ada data tracking.</td></tr> : recentTracking.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '16px 30px' }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{t.karyawan?.user?.name || t.karyawan?.nama_karyawan}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{t.karyawan?.no_karyawan}</p>
                    </td>
                    <td style={{ padding: '16px 30px', fontSize: 13, color: '#475569', fontWeight: 500 }}>{t.kost?.nama_kost || '-'}</td>
                    <td style={{ padding: '16px 30px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: t.is_verified ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: 5 }}>
                        {t.is_verified ? <CheckCircle size={14}/> : <Clock size={14}/>}
                        {t.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 20 }}>Distribusi Hunian</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Terverifikasi', color: '#10b981', val: stats.trackingVerified },
              { label: 'Pending', color: '#f59e0b', val: stats.trackingPending },
              { label: 'Belum Input', color: '#cbd5e1', val: stats.totalKaryawan - stats.trackingVerified - stats.trackingPending },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{item.label}</span><span style={{ fontSize: 13, fontWeight: 800 }}>{item.val}</span></div>
                <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', background: item.color, width: `${stats.totalKaryawan > 0 ? (item.val/stats.totalKaryawan*100) : 0}%` }}></div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
