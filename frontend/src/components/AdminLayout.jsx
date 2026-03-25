import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Home, 
  CheckSquare, 
  BarChart3, 
  LogOut,
  Search,
  Bell,
  Plus
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'kost', label: 'Manajemen Kost', path: '/admin/kost', icon: <Home size={20} /> },
    { id: 'users', label: 'Manajemen User', path: '/admin/users', icon: <Users size={20} /> },
    { id: 'pembayaran', label: 'Pembayaran', path: '/admin/pembayaran', icon: <CheckSquare size={20} /> },
    { id: 'laporan', label: 'Laporan', path: '/admin/laporan', icon: <BarChart3 size={20} /> },
  ];


  return (
    <div className="admin-container">
      {/* Sidebar - CSS inlined as in Dashboard to keep it consistent */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 12l2-2 7-7 7 7 2 2"></path>
              <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"></path>
            </svg>
          </div>
          <h1>MyKost Admin</h1>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <Link 
              key={item.id}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout" onClick={logout}>
            <span className="nav-icon"><LogOut size={20} /></span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="header-search">
            <Search size={18} />
            <input type="text" placeholder="Cari data..." />
          </div>
          <div className="header-actions">
            <button className="btn-icon-notif"><Bell size={20} /></button>
            <div className="user-profile">
              <div className="avatar">{user?.name?.charAt(0) || 'A'}</div>
              <div className="user-info">
                <p className="name">{user?.name || 'Super Admin'}</p>
                <p className="role">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content-outlet">
          <Outlet />
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --admin-sidebar-bg: #1e293b;
          --admin-sidebar-hover: #334155;
          --admin-primary: #10b981;
          --admin-primary-hover: #059669;
          --admin-bg: #f8fafc;
          --admin-header-bg: rgba(255, 255, 255, 0.8);
          --text-main: #1e293b;
          --text-muted: #64748b;
        }

        .admin-container { 
          display: grid; 
          grid-template-columns: 280px 1fr; 
          min-height: 100vh; 
          background: var(--admin-bg);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .admin-sidebar { 
          background: var(--admin-sidebar-bg); 
          color: white; 
          display: flex; 
          flex-direction: column; 
          padding: 32px 0; 
          position: fixed; 
          width: 280px; 
          height: 100vh;
          box-shadow: 4px 0 24px rgba(0,0,0,0.05);
          z-index: 50;
        }

        .sidebar-brand { 
          padding: 0 32px 40px; 
          display: flex; 
          align-items: center; 
          gap: 14px; 
        }

        .brand-logo { 
          width: 40px; 
          height: 40px; 
          background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
          border-radius: 12px; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .sidebar-brand h1 { 
          font-size: 20px; 
          font-weight: 800; 
          margin: 0; 
          letter-spacing: -0.5px;
        }

        .sidebar-nav { 
          flex: 1; 
          padding: 0 16px; 
          display: flex; 
          flex-direction: column; 
          gap: 6px; 
        }

        .nav-item { 
          display: flex; 
          align-items: center; 
          gap: 14px; 
          padding: 14px 16px; 
          color: #94a3b8; 
          text-decoration: none; 
          border-radius: 12px; 
          font-weight: 600;
          font-size: 15px; 
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-item:hover { 
          background: var(--admin-sidebar-hover); 
          color: white; 
          transform: translateX(4px);
        }

        .nav-item.active { 
          background: var(--admin-primary); 
          color: white; 
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .sidebar-footer {
          padding: 0 16px;
          margin-top: auto;
        }

        .nav-item.logout { 
          width: 100%; 
          border: none; 
          background: transparent; 
          cursor: pointer; 
          color: #f87171; 
          text-align: left; 
          margin-top: 20px;
        }

        .nav-item.logout:hover {
          background: rgba(248, 113, 113, 0.1);
          color: #fca5a5;
        }
        
        .admin-main { 
          margin-left: 280px; 
          width: calc(100% - 280px);
        }

        .admin-header { 
          background: var(--admin-header-bg); 
          backdrop-filter: blur(12px);
          height: 80px; 
          border-bottom: 1px solid rgba(226, 232, 240, 0.8); 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          padding: 0 40px; 
          position: sticky; 
          top: 0;
          z-index: 40;
          transition: all 0.3s ease;
        }

        .header-search { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          background: #f1f5f9; 
          padding: 10px 20px; 
          border-radius: 14px; 
          width: 360px;
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }

        .header-search:focus-within {
          background: white;
          border-color: var(--admin-primary);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        .header-search input { 
          background: transparent; 
          border: none; 
          outline: none; 
          width: 100%;
          font-weight: 500;
          color: var(--text-main);
        }

        .header-actions { 
          display: flex; 
          align-items: center; 
          gap: 28px; 
        }

        .btn-icon-notif {
          position: relative;
          background: white;
          border: 1px solid #e2e8f0;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-icon-notif:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: var(--text-main);
        }

        .btn-icon-notif::after {
          content: '';
          position: absolute;
          top: 10px;
          right: 12px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid white;
        }

        .user-profile { 
          display: flex; 
          align-items: center; 
          gap: 14px; 
          padding-left: 28px;
          border-left: 1px solid #e2e8f0;
        }

        .avatar { 
          width: 44px; 
          height: 44px; 
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
          color: white; 
          border-radius: 14px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: 700;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .user-info p { margin: 0; }
        .user-info .name { font-size: 15px; font-weight: 700; color: var(--text-main); }
        .user-info .role { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

        .admin-content-outlet {
          padding: 40px;
        }

        @media (max-width: 1024px) {
          .admin-sidebar { width: 80px; }
          .admin-main { margin-left: 80px; width: calc(100% - 80px); }
          .sidebar-brand h1, .nav-label, .sidebar-footer .nav-label { display: none; }
          .sidebar-brand { padding: 0; justify-content: center; margin-bottom: 30px; }
          .nav-item { justify-content: center; padding: 14px; }
        }

        /* ===== SHARED MODAL STYLES ===== */
        .admin-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
        }
        .admin-modal-content {
          background: white; border-radius: 24px; width: 100%; max-width: 620px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          animation: modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalSlideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-header { padding: 24px 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .modal-header h2 { font-size: 20px; font-weight: 800; color: #1e293b; }
        .btn-close { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 8px; transition: all 0.2s; }
        .btn-close:hover { color: #ef4444; background: #fef2f2; }
        .admin-form { padding: 28px 32px 32px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-group { display: flex; flex-direction: column; }
        .form-group.full-width { grid-column: span 2; }
        .form-group label { font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .form-group input, .form-group select, .form-group textarea {
          width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0;
          font-size: 14px; font-weight: 500; color: #1e293b; outline: none;
          transition: all 0.2s; background: white; box-sizing: border-box;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          border-color: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        .form-group textarea { min-height: 96px; resize: none; }
        .modal-footer { margin-top: 28px; display: flex; gap: 12px; justify-content: flex-end; padding-top: 24px; border-top: 1px solid #f1f5f9; }
        .btn-cancel { padding: 12px 24px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; color: #475569; font-weight: 700; cursor: pointer; font-size: 14px; transition: all 0.2s; }
        .btn-cancel:hover { background: #f8fafc; }
        .btn-submit { padding: 12px 28px; border-radius: 12px; border: none; background: #10b981; color: white; font-weight: 700; cursor: pointer; font-size: 14px; transition: all 0.2s; }
        .btn-submit:hover { background: #059669; }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        /* ===== SHARED UTILITY ===== */
        .text-center { text-align: center; }
        .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
        .text-muted { color: #94a3b8; font-size: 14px; font-weight: 500; }
        .loading-spinner-box { display: flex; align-items: center; justify-content: center; gap: 10px; color: #64748b; font-weight: 600; font-size: 14px; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default AdminLayout;
