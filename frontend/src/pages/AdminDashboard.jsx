import React, { useState, useEffect } from 'react';
import { Users, Home, BarChart3, TrendingUp, MapPin, CalendarCheck, Clock, CheckCircle, XCircle, Loader2, DollarSign, Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ kosts: 0, kostsAktif: 0, pendapatan: 0, totalBooking: 0 });
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('This Month');

  // Map tab labels to API period parameters
  const tabToPeriod = {
    'Today': 'today',
    'Last 7 days': 'week',
    'This Month': 'month',
    'This Year': 'year'
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchStats();
    }
  }, [authLoading, user, activeTab]); // Re-fetch when tab changes

  const fetchStats = async () => {
    try {
      const period = tabToPeriod[activeTab] || 'week';
      const [k, p, b, d] = await Promise.allSettled([
        api.get('/kost/moderasi'),
        api.get('/pembayaran?status=lunas'),
        api.get('/booking'),
        api.get(`/dashboard?period=${period}`),
      ]);
      const kosts = k.status === 'fulfilled' ? k.value.data.data || [] : [];
      const payments = p.status === 'fulfilled' ? p.value.data.data || [] : [];
      const bookings = b.status === 'fulfilled' ? b.value.data.data || [] : [];
      const dashboard = d.status === 'fulfilled' ? d.value.data.data : null;

      setStats({
        kosts: kosts.length,
        kostsAktif: kosts.filter(ki => ki.status === 'aktif').length,
	pendapatan: payments.reduce((sum, pay) => sum + parseFloat(pay.jumlah || 0), 0),
	totalBooking: bookings.length,
      });
      setDashboardData(dashboard);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const statCards = [
    { label: 'Revenue', value: `Rp ${stats.pendapatan.toLocaleString()}`, icon: Wallet, color: '#16a34a', bg: '#f0fdf4', trend: '+8.5% Up from yesterday' },
    { label: 'Total Kost', value: stats.kosts, icon: Home, color: '#f59e0b', bg: '#fffbeb', trend: '0.0% Status constant' },
    { label: 'Booking', value: stats.totalBooking, icon: CalendarCheck, color: '#22c55e', bg: '#f0fdf4', trend: '-4.3% Down from yesterday' },
    { label: 'Profit Est.', value: `Rp ${(stats.pendapatan * 0.15).toLocaleString()}`, icon: TrendingUp, color: '#f97316', bg: '#fff7ed', trend: '+12% Target met' },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      

      {/* Tabs / Filter Row */}
      <div style={{ background: '#f8fafc', borderRadius: 20, padding: '8px', border: '1px solid #f1f5f9', display: 'flex', gap: 8, marginBottom: 32, width: 'fit-content' }}>
          {['Today', 'Last 7 days', 'This Month', 'This Year'].map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                background: activeTab === t ? 'white' : 'transparent',
                color: activeTab === t ? '#0f172a' : '#94a3b8',
                border: 'none', padding: '10px 24px', borderRadius: 14,
                fontSize: 13, fontWeight: activeTab === t ? 800 : 700, cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: activeTab === t ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              {t}
            </button>
          ))}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, marginBottom: 32 }}>
        {loading ? Array(4).fill(0).map((_, i) => (
          <div key={i} style={{ height: 160, background: 'white', border: '1px solid #f1f5f9', borderRadius: 24 }} />
        )) : statCards.map(c => (
          <div key={c.label} className="admin-dashboard-card" style={{ 
            background: 'white', border: '1px solid #f1f5f9', borderRadius: 24, padding: 28, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)', cursor: 'default'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
               <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', margin: '0 0 8px' }}>{c.label}</p>
                  <h3 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.8px' }}>{c.value}</h3>
               </div>
               <div style={{ width: 54, height: 54, borderRadius: 16, background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px ${c.color}15` }}>
                  <c.icon size={26} />
               </div>
            </div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: c.trend.includes('Up') ? '#16a34a' : '#f97316', display: 'flex', alignItems: 'center', gap: 6 }}>
               <TrendingUp size={14} /> {c.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Row with "Cash Flow" Chart and Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28 }}>
          {/* Main Chart Card (Simplified Area Chart) */}
          <div style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 28, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>Cash Flow Statistics</h3>
              <div style={{ display: 'flex', gap: 16 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Pendapatan</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Pengeluaran</span>
                 </div>
              </div>
            </div>
            {/* Cash Flow Chart - Real Data */}
            <div style={{ height: 260, width: '100%', position: 'relative', borderBottom: '2px solid #f8fafc', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: 10, paddingRight: 10 }}>
               {loading ? (
                 <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                   <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#94a3b8' }} />
                 </div>
               ) : (
                 dashboardData?.cash_flow?.map((item, i) => {
                   const maxAmount = Math.max(...(dashboardData?.cash_flow?.map(d => d.amount) || [1]));
                   const height = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                   return (
                     <div key={i} style={{ width: '12%', height: `${Math.max(height, 5)}%`, background: 'rgba(34, 197, 94, 0.08)', borderTop: '4px solid #22c55e', position: 'relative', borderRadius: '4px 4px 0 0' }}>
                        <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 800, color: '#16a34a' }}>{item.amount}k</div>
                     </div>
                   );
                 })
               )}
               <div style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  {/* Grid lines */}
                  {[25, 50, 75, 100].map(v => <div key={v} style={{ position: 'absolute', bottom: `${v}%`, left: 0, width: '100%', height: 1, background: '#f1f5f9' }} />)}
               </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, padding: '0 10px' }}>
               {loading ? (
                 <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>Loading...</span>
               ) : (
                 dashboardData?.cash_flow?.map((item, i) => <span key={i} style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>{item.day}</span>)
               )}
            </div>
          </div>

          {/* Right Distribution Panel */}
          <div style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 24, padding: 32 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 24, textAlign: 'center' }}>Property Distribution</h3>
            <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto 24px' }}>
               {loading ? (
                 <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                   <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#94a3b8' }} />
                 </div>
               ) : (
                 <>
                   <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${dashboardData?.property_distribution?.aktif || 0}, 100`} />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${dashboardData?.property_distribution?.pending || 0}, 100`} strokeDashoffset={`-${dashboardData?.property_distribution?.aktif || 0}`} />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeDasharray={`${dashboardData?.property_distribution?.nonaktif || 0}, 100`} strokeDashoffset={`-${(dashboardData?.property_distribution?.aktif || 0) + (dashboardData?.property_distribution?.pending || 0)}`} />
                   </svg>
                   <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                      <p style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>{stats.kosts}</p>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', margin: 0 }}>Total Assets</p>
                   </div>
                 </>
               )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
               {loading ? (
                 <span style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>Loading...</span>
               ) : (
                 [
                   { label: 'Kost Aktif', val: `${dashboardData?.property_distribution?.aktif || 0}%`, count: dashboardData?.kost_aktif || 0, color: '#10b981' },
                   { label: 'Pending Admin', val: `${dashboardData?.property_distribution?.pending || 0}%`, count: dashboardData?.kost_pending || 0, color: '#3b82f6' },
                   { label: 'Non-aktif', val: `${dashboardData?.property_distribution?.nonaktif || 0}%`, count: dashboardData?.kost_nonaktif || 0, color: '#cbd5e1' }
                 ].map(item => (
                   <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                         <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                         <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{item.label}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{item.val}</span>
                         <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginLeft: 4 }}>({item.count})</span>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
