import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { 
  Brain, LayoutDashboard, ShieldAlert, Activity, Settings,
  Bell, User, LogOut, ChevronDown, CheckCircle, Info,
  ShieldCheck, AlertTriangle, X, Lock, Menu
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import ThreatFeeds from './pages/ThreatFeeds';
import Analytics from './pages/Analytics';
import SettingsPage from './pages/Settings';
import Login from './pages/Login';

const NOTIFICATIONS = [
  { id: 1, type: 'threat', text: 'Smishing payload intercepted on port SMPP/2775', time: '2m ago', read: false },
  { id: 2, type: 'info', text: 'Model MNB + SMOTE v1.0 loaded successfully', time: '8m ago', read: false },
  { id: 3, type: 'safe', text: 'System health check passed — all services nominal', time: '15m ago', read: true },
  { id: 4, type: 'threat', text: 'Phishing URL pattern detected in recent scan', time: '1h ago', read: true },
  { id: 5, type: 'info', text: 'Training dataset verified: 5,574 messages loaded', time: '2h ago', read: true },
];

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => { if (!ref.current || ref.current.contains(e.target)) return; handler(); };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scanHistory, setScanHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('scanHistory');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const statusRef = useRef(null);

  useClickOutside(notifRef, () => setShowNotifications(false));
  useClickOutside(profileRef, () => setShowProfile(false));
  useClickOutside(statusRef, () => setShowStatus(false));

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    try {
      localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
    } catch {
      // localStorage may be full or unavailable; fail silently
    }
  }, [scanHistory]);

  const addScanToHistory = (scan) => setScanHistory(prev => [scan, ...prev]);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard addScanToHistory={addScanToHistory} scanHistory={scanHistory} />;
      case 'feeds': return <ThreatFeeds scanHistory={scanHistory} setScanHistory={setScanHistory} />;
      case 'analytics': return <Analytics />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard addScanToHistory={addScanToHistory} scanHistory={scanHistory} />;
    }
  };

  return (
    <div className={`dashboard-container ${mobileMenuOpen ? 'mobile-nav-open' : ''}`}>
      <div className="background-nodes"></div>

      {/* Sidebar Overlay */}
      {mobileMenuOpen && <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-visible' : ''}`}>
        <div className="logo-container">
          <Brain className="logo-icon" size={26} />
          <span className="logo-text">Neural Threat Intelligence</span>
          {/* Close button for mobile layout */}
          <button className="mobile-close-sidebar" onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="nav-menu">
          {[
            { key: 'dashboard', Icon: LayoutDashboard, label: 'DASHBOARD' },
            { key: 'feeds', Icon: ShieldAlert, label: 'THREAT FEEDS' },
            { key: 'analytics', Icon: Activity, label: 'ANALYTICS' },
            { key: 'settings', Icon: Settings, label: 'SETTINGS' },
          ].map(({ key, Icon, label }) => (
            <button
              key={key}
              className={`nav-item ${activeTab === key ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(key);
                setMobileMenuOpen(false);
              }}
            >
              <Icon size={19} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className="nav-item exit-btn"
            onClick={() => {
              setIsAuthenticated(false);
              setMobileMenuOpen(false);
            }}
          >
            <LogOut size={19} /><span>EXIT</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Header */}
        <header className="top-header">
          <div className="header-left">
            <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={20} />
            </button>
            <span className="breadcrumb">{activeTab.replace('feeds','THREAT FEEDS').toUpperCase()}</span>
          </div>
          <div className="header-right">

            {/* Settings Icon */}
            <button className={`header-icon-btn ${activeTab === 'settings' ? 'active-icon' : ''}`} onClick={() => setActiveTab('settings')} title="Settings">
              <Settings size={18} />
            </button>

            {/* Notifications */}
            <div className="header-dropdown-wrap" ref={notifRef}>
              <button className="header-icon-btn notify" onClick={() => { setShowNotifications(v => !v); setShowProfile(false); setShowStatus(false); }} title="Notifications">
                <Bell size={18} />
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className="dropdown-panel notif-panel">
                  <div className="dropdown-header">
                    <span>Notifications</span>
                    <button className="dropdown-link" onClick={markAllRead}>Mark all read</button>
                  </div>
                  <div className="notif-list">
                    {notifications.map(n => (
                      <div key={n.id} className={`notif-item ${!n.read ? 'notif-unread' : ''}`}>
                        <div className={`notif-dot dot-${n.type}`}></div>
                        <div className="notif-body">
                          <span className="notif-text">{n.text}</span>
                          <span className="notif-time">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile */}
            <div className="header-dropdown-wrap" ref={profileRef}>
              <div className="user-profile" onClick={() => { setShowProfile(v => !v); setShowNotifications(false); setShowStatus(false); }}>
                <div className="avatar"><User size={18} /></div>
                <div className="user-info">
                  <span className="user-name">Admin</span>
                  <span className="user-role">System Administrator</span>
                </div>
                <ChevronDown size={14} className={`dropdown-icon ${showProfile ? 'rotated' : ''}`} />
              </div>
              {showProfile && (
                <div className="dropdown-panel profile-panel">
                  <div className="profile-header-card">
                    <div className="profile-avatar-lg"><User size={28} /></div>
                    <div>
                      <div className="profile-name">System Admin</div>
                      <div className="profile-email">admin@nti.local</div>
                    </div>
                  </div>
                  <div className="profile-menu">
                    <button className="profile-menu-item" onClick={() => { setActiveTab('settings'); setShowProfile(false); }}>
                      <Settings size={14} /> System Settings
                    </button>
                    <button className="profile-menu-item" onClick={() => { setActiveTab('analytics'); setShowProfile(false); }}>
                      <Activity size={14} /> View Analytics
                    </button>
                    <button className="profile-menu-item danger" onClick={() => { setIsAuthenticated(false); setShowProfile(false); }}>
                      <Lock size={14} /> Lock Session
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Secure / Status Button */}
            <div className="header-dropdown-wrap" ref={statusRef}>
              <button className="station-btn" onClick={() => { setShowStatus(v => !v); setShowNotifications(false); setShowProfile(false); }}>
                <ShieldCheck size={15} /> SECURE
              </button>
              {showStatus && (
                <div className="dropdown-panel status-panel">
                  <div className="dropdown-header">
                    <span>System Status</span>
                    <button className="icon-close" onClick={() => setShowStatus(false)}><X size={14} /></button>
                  </div>
                  <div className="status-list">
                    {[
                      { label: 'FastAPI Backend', status: 'ONLINE', color: 'green' },
                      { label: 'MNB + SMOTE Model', status: 'LOADED', color: 'green' },
                      { label: 'TF-IDF Vectorizer', status: 'ACTIVE', color: 'green' },
                      { label: 'React Frontend', status: 'RUNNING', color: 'green' },
                      { label: 'Threat Feed Monitor', status: 'ACTIVE', color: 'green' },
                      { label: 'Session Scan Log', status: `${scanHistory.length} entries`, color: 'cyan' },
                    ].map((s, i) => (
                      <div key={i} className="status-row">
                        <div className={`status-indicator ind-${s.color}`}></div>
                        <span className="status-name">{s.label}</span>
                        <span className={`status-val val-${s.color}`}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Dynamic page */}
        <div className="page-content-wrapper">
          {renderContent()}
        </div>

        <div className="system-status">
          System Status: <span className="status-green">SECURE</span>
        </div>
      </main>
    </div>
  );
}
