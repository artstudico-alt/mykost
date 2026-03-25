import React, { useState, useEffect } from 'react';
import { Users, Home, BarChart3, TrendingUp, MapPin, CalendarCheck, Clock, CheckCircle, XCircle, Loader2, DollarSign, Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ kosts: 0, kostsAktif: 0, pendapatan: 0, totalBooking: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('This Month');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const [k, p, b] = await Promise.allSettled([
        api.get('/kost'),
        api.get('/pembayaran?status=lunas'),
        api.get('/booking'),
      ]);
      const kosts = k.status === 'fulfilled' ? k.value.data.data || [] : [];
      const payments = p.status === 'fulfilled' ? p.value.data.data || [] : [];
      const bookings = b.status === 'fulfilled' ? b.value.data.data || [] : [];

      setStats({
        kosts: kosts.length,
        kostsAktif: kosts.filter(ki => ki.status === 'aktif').length,
	pendapatan: payments.reduce((sum, pay) => sum + parseFloat(pay.jumlah || 0), 0),
	totalBooking: bookings.length,
      });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const statCards = [
    { label: 'Revenue', value: `Rp ${stats.pendapatan.toLocaleString()}`, icon: Wallet, color: '#14b8a6', bg: '#f0fdfa', trend: '+8.5% Up from yesterday' },
    { label: 'Total Kost', value: stats.kosts, icon: Home, color: '#f59e0b', bg: '#fffbeb', trend: '0.0% Status constant' },
    { label: 'Booking', value: stats.totalBooking, icon: CalendarCheck, color: '#10b981', bg: '#f0fdf4', trend: '-4.3% Down from yesterday' },
    { label: 'Profit Est.', value: `Rp ${(stats.pendapatan * 0.15).toLocaleString()}`, icon: TrendingUp, color: '#f97316', bg: '#fff7ed', trend: '+12% Target met' },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Welcome Banner */}
      <div style={{ 
        position: 'relative', background: '#f5fcf9', borderRadius: 24, padding: '40px 48px', marginBottom: 32, 
        border: '1px solid #e2f2eb', overflow: 'hidden', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 500 }}>
          <p style={{ color: '#64748b', fontSize: 13, fontWeight: 700, margin: '0 0 10px' }}>Welcome To</p>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.8px' }}>MYKOST ANALYTICS</h2>
          <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px', fontWeight: 500 }}>
            Pantau performa bisnis properti Anda dengan metrik real-time. Kelola seluruh aset, pendapatan, dan hunian karyawan secara efisien dalam satu dashboard.
          </p>
          <button style={{ 
            background: '#10b981', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 12, 
            fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px -5px #10b98166' 
          }}>
	    Panduan Sistem
          </button>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <img src="/brain/852da0b2-173c-4fd5-9a08-45ed3e087fea/dashboard_illustration_1774431714639.png" 
               alt="Dashboard Illustration" 
               style={{ width: 380, height: 'auto', borderRadius: 12 }} />
        </div>
      </div>

      {/* Tabs / Filter Row */}
      <div style={{ background: 'white', borderRadius: 16, padding: '16px 24px', border: '1px solid #f1f5f9', display: 'flex', gap: 24, marginBottom: 28, alignItems: 'center' }}>
          {['Today', 'Last 7 days', 'This Month', 'This Year'].map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                background: activeTab === t ? '#10b981' : 'transparent',
                color: activeTab === t ? 'white' : '#94a3b8',
                border: 'none', padding: '8px 20px', borderRadius: 10,
                fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {t}
            </button>
          ))}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, marginBottom: 32 }}>
        {loading ? Array(4).fill(0).map((_, i) => (
          <div key={i} style={{ height: 140, background: 'white', border: '1px solid #f1f5f9', borderRadius: 20 }} />
        )) : statCards.map(c => (
          <div key={c.label} style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 20, padding: 24, transition: 'transform 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
               <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', margin: '0 0 6px' }}>{c.label}</p>
                  <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{c.value}</h3>
               </div>
               <div style={{ width: 50, height: 50, borderRadius: 14, background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <c.icon size={24} />
               </div>
            </div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
               <TrendingUp size={12} /> {c.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Row with "Cash Flow" Chart and Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          {/* Main Chart Card (Simplified Area Chart) */}
          <div style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 24, padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Cash Flow Statistics</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>Pendapatan</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>Pengeluaran</span>
                 </div>
              </div>
            </div>
            {/* Mock Area Chart - CSS Lines */}
            <div style={{ height: 260, width: '100%', position: 'relative', borderBottom: '2px solid #f1f5f9', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: 10, paddingRight: 10 }}>
               {[40, 60, 45, 80, 55, 90, 75].map((h, i) => (
                 <div key={i} style={{ width: '12%', height: `${h}%`, background: 'rgba(16, 185, 129, 0.1)', borderTop: '3px solid #10b981', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 800, color: '#10b981' }}>{h}k</div>
                 </div>
               ))}
               <div style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  {/* Grid lines */}
                  {[25, 50, 75, 100].map(v => <div key={v} style={{ position: 'absolute', top: `${100-v}%`, left: 0, width: '100%', height: 1, background: '#f8fafc' }} />)}
               </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, padding: '0 10px' }}>
               {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d} style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>{d}</span>)}
            </div>
          </div>

          {/* Right Distribution Panel */}
          <div style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 24, padding: 32 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 24, textAlign: 'center' }}>Property Distribution</h3>
            <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto 24px' }}>
               <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="60, 100" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="25, 100" strokeDashoffset="-60" />
               </svg>
               <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>{stats.kosts}</p>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', margin: 0 }}>Total Assets</p>
               </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
               {[
                 { label: 'Kost Aktif', val: '60%', color: '#10b981' },
                 { label: 'Pending Admin', val: '25%', color: '#3b82f6' },
                 { label: 'Non-aktif', val: '15%', color: '#cbd5e1' }
               ].map(item => (
                 <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                       <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                       <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{item.val}</span>
                 </div>
               ))}
            </div>
          </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
