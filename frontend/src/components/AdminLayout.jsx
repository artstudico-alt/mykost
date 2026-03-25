import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Home,
  CheckSquare,
  BarChart3,
  LogOut,
  Bell,
  MapPin,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const role = user?.role?.name || '';
  const isHR = role === 'hr';
  const isOwner = role === 'pemilik_kost';

  const getBranding = () => {
    if (isHR) return { title: 'HR Portal', sub: 'Employee Mgmt', color: '#6366f1' };
    if (isOwner) return { title: 'Owner Portal', sub: 'Property Mgmt', color: '#10b981' };
    return { title: 'MyKost', sub: 'Admin Panel', color: '#10b981' };
  };

  const brand = getBranding();

  const getMenuItems = () => {
    const allItems = [
      { id: 'dashboard_admin', label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: ['super_admin'] },
      { id: 'dashboard_hr', label: 'Dashboard', path: '/hr/dashboard', icon: LayoutDashboard, roles: ['hr'] },
      { id: 'dashboard_owner', label: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard, roles: ['pemilik_kost'] },
      { id: 'kost_admin', label: 'Moderasi Kost', path: '/admin/kost', icon: Home, roles: ['super_admin'] },
      { id: 'kost_owner', label: 'Kost Saya', path: '/owner/kost', icon: Home, roles: ['pemilik_kost'] },
      { id: 'karyawan', label: 'Data Karyawan', path: '/admin/karyawan', icon: Users, roles: ['super_admin', 'hr'] },
      { id: 'tracking', label: 'Tracking Hunian', path: '/admin/tracking', icon: MapPin, roles: ['super_admin', 'hr'] },
      { id: 'pembayaran_admin', label: 'Pembayaran', path: '/admin/pembayaran', icon: CheckSquare, roles: ['super_admin'] },
      { id: 'pembayaran_owner', label: 'Pembayaran', path: '/owner/pembayaran', icon: CheckSquare, roles: ['pemilik_kost'] },
      { id: 'laporan', label: 'Laporan', path: '/admin/laporan', icon: BarChart3, roles: ['super_admin', 'hr'] },
    ];
    return allItems.filter(item => item.roles.includes(role));
  };

  const menuItems = getMenuItems();
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'A';
  const currentMenu = menuItems.find(m => location.pathname === m.path);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      
      {/* ─── Sidebar ─── */}
      <aside style={{
        width: sidebarOpen ? 260 : 80,
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 100,
        borderRight: '1px solid #f1f5f9',
        overflowX: 'hidden'
      }}>
        {/* Brand */}
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: brand.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 16px ${brand.color}33`,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="22" height="22">
              <path d="M3 12l2-2 7-7 7 7 2 2" />
              <path d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
            </svg>
          </div>
          {sidebarOpen && (
            <div>
              <p style={{ color: '#0f172a', fontWeight: 800, fontSize: 18, margin: 0, letterSpacing: '-0.5px' }}>{brand.title}</p>
              <p style={{ color: '#94a3b8', fontSize: 11, margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>{brand.sub}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {menuItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.id}
                to={item.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderRadius: 12, textDecoration: 'none',
                  fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
                  background: active ? brand.color : 'transparent',
                  color: active ? 'white' : '#64748b',
                  boxShadow: active ? `0 10px 15px -3px ${brand.color}44` : 'none',
                }}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: 'none', background: 'transparent', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>
            <LogOut size={20} />
            {sidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div style={{ marginLeft: sidebarOpen ? 260 : 80, flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        
        {/* Header */}
        <header style={{
          height: 80, background: 'white', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 40px', position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
              <Menu size={20} />
            </button>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>{currentMenu?.label || 'Beranda'}</h2>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, fontWeight: 600 }}>Portal / {currentMenu?.label || 'Dashboard'}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <button style={{ width: 44, height: 44, borderRadius: 14, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer', position: 'relative', background: 'white' }}>
              <Bell size={20} />
              <span style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, background: '#ef4444', border: '2px solid white', borderRadius: '50%' }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '4px', borderRadius: 16 }} onClick={() => setProfileOpen(!profileOpen)}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>{user?.name}</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: 0, textTransform: 'capitalize' }}>{role.replace('_', ' ')}</p>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: brand.color, fontSize: 18 }}>
                {initial}
              </div>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '40px', background: '#fcfdfe' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default AdminLayout;
